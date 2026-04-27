import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, reportsApi } from "../lib/api";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { BarChart3, TrendingUp, Droplets, IndianRupee, Calendar, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: monthly, isLoading } = useQuery({
    queryKey: ["monthly-report", month, year],
    queryFn: () => reportsApi.monthly({ month, year }),
  });

  const { data: chart } = useQuery({
    queryKey: ["dashboard-chart"],
    queryFn: dashboardApi.chart,
  });

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    if (next <= new Date()) setCurrentDate(next);
  };

  const monthLabel = format(currentDate, "MMMM yyyy");
  const isCurrentMonth = month === new Date().getMonth() + 1 && year === new Date().getFullYear();


  const downloadMonthlyPDF = async () => {
    if (!monthly?.summary?.length) { toast.error("Koi data nahi is mahine mein"); return; }
    try {
      const { default: jsPDF } = await import("jspdf");
      const W = 80;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [W, 400] });
      let y = 0;

      // Header
      doc.setFillColor(234, 88, 12);
      doc.rect(0, 0, W, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9); doc.setFont("helvetica", "bold");
      doc.text("SMART DAIRY SOLUTION", W / 2, 7, { align: "center" });
      doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
      doc.text("MONTHLY REPORT", W / 2, 12, { align: "center" });
      doc.text(monthLabel.toUpperCase(), W / 2, 16, { align: "center" });
      doc.setTextColor(0); y = 21;

      const dash = () => {
        doc.setDrawColor(180); doc.setLineDashPattern([1, 1], 0);
        doc.line(3, y, W - 3, y); doc.setLineDashPattern([], 0); y += 3;
      };
      const row = (lbl: string, val: string, bold = false) => {
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal"); doc.setTextColor(100); doc.text(lbl, 4, y);
        doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setTextColor(0);
        doc.text(val, W - 4, y, { align: "right" }); y += 4;
      };

      // Summary
      dash();
      row("Mahina", monthLabel);
      row("Kul Doodh", `${(monthly.totals?.liters ?? 0).toFixed(1)} L`, true);
      row("Kul Kamai", `Rs ${Math.round(monthly.totals?.amount ?? 0).toLocaleString("en-IN")}`, true);
      row("Kul Entries", String(monthly.totalEntries));
      row("Active Kisaan", String(monthly.summary.length));

      // Farmer wise
      dash();
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(150);
      doc.text("KISAAN-WISE SUMMARY", 4, y); y += 4; doc.setTextColor(0);

      // Table header
      doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
      doc.text("Kisaan", 4, y); doc.text("Doodh", 38, y); doc.text("Kamai", W - 4, y, { align: "right" });
      y += 3;
      doc.setDrawColor(200); doc.line(3, y, W - 3, y); y += 2;

      doc.setFont("helvetica", "normal");
      for (const f of monthly.summary) {
        if (y > 370) { doc.addPage(); y = 10; }
        doc.setFontSize(6.5); doc.setTextColor(0);
        doc.text(`${f.farmerName} (${f.farmerCode})`, 4, y);
        doc.text(`${f.liters.toFixed(1)}L`, 38, y);
        doc.text(`Rs ${Math.round(f.amount)}`, W - 4, y, { align: "right" });
        y += 4;
      }

      // Total
      dash();
      doc.setFillColor(255, 247, 237);
      doc.roundedRect(4, y - 1, W - 8, 13, 1.5, 1.5, "F");
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(120);
      doc.text("Kul Kamai", W / 2, y + 4, { align: "center" });
      doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(234, 88, 12);
      doc.text(`Rs ${Math.round(monthly.totals?.amount ?? 0).toLocaleString("en-IN")}`, W / 2, y + 11, { align: "center" });
      doc.setTextColor(0); y += 17;

      dash();
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(150);
      doc.text("Smart Dairy Solution", W / 2, y, { align: "center" }); y += 4;
      doc.text(new Date().toLocaleDateString("en-IN"), W / 2, y, { align: "center" });

      doc.save(`monthly-report-${month}-${year}.pdf`);
      toast.success("Monthly PDF download ho gaya! 🖨️");
    } catch { toast.error("PDF nahi bana"); }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-400">Monthly milk collection summary</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadMonthlyPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors">
            <Download size={15} /> Monthly PDF
          </button>
          <button onClick={() => navigate("/farmer-report")}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
            <BarChart3 size={15} /> Kisaan Report
          </button>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div className="text-center">
            <p className="font-bold text-gray-900 text-lg">{monthLabel}</p>
            {isCurrentMonth && <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2 py-0.5 rounded-full">Current Month</span>}
          </div>
          <button onClick={nextMonth} disabled={isCurrentMonth}
            className={`p-2 rounded-xl transition-colors ${isCurrentMonth ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-100"}`}>
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p>Loading report...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Kul Doodh", value: `${(monthly?.totals?.liters ?? 0).toFixed(1)}L`, icon: Droplets, color: "text-blue-600 bg-blue-50" },
              { label: "Kul Kamai", value: `₹${Math.round(monthly?.totals?.amount ?? 0).toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-green-600 bg-green-50" },
              { label: "Kul Entries", value: String(monthly?.totalEntries ?? 0), icon: Calendar, color: "text-orange-600 bg-orange-50" },
              { label: "Active Kisaan", value: String(monthly?.summary?.length ?? 0), icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`${color.split(" ")[1]} rounded-2xl p-3 border border-gray-100`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{label}</span>
                  <Icon size={14} className={color.split(" ")[0]} />
                </div>
                <p className={`text-xl font-bold ${color.split(" ")[0]}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Trend Chart */}
          {chart && chart.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3">6 Mahine ka Trend</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [`${v.toFixed(1)}L`, "Doodh"]} />
                  <Line type="monotone" dataKey="liters" stroke="#ea580c" strokeWidth={2}
                    dot={{ r: 3, fill: "#ea580c", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Farmer-wise Table */}
          {monthly?.summary && monthly.summary.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-800">Kisaan-wise Summary — {monthLabel}</p>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Kisaan", "Gaon", "Entries", "Kul Doodh", "Kul Kamai", "Action"].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.summary.map((f: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900">{f.farmerName}</p>
                          <p className="text-xs text-gray-400">{f.farmerCode}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{f.village}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 font-medium">{f.entries}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-blue-600">{f.liters.toFixed(1)}L</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-brand-600">₹{Math.round(f.amount).toLocaleString("en-IN")}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => navigate(`/farmer-report?farmerId=${f.farmerId ?? ""}`)}
                            className="text-xs text-brand-600 hover:underline font-medium">
                            Report →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-orange-50 border-t border-orange-100">
                      <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-700">{monthly.totalEntries}</td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-600">{(monthly.totals?.liters ?? 0).toFixed(1)}L</td>
                      <td className="px-4 py-3 text-sm font-bold text-brand-600">₹{Math.round(monthly.totals?.amount ?? 0).toLocaleString("en-IN")}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {monthly.summary.map((f: any, idx: number) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{f.farmerName} <span className="text-xs text-gray-400">({f.farmerCode})</span></p>
                      <p className="text-xs text-gray-400">{f.village} · {f.entries} entries · {f.liters.toFixed(1)}L</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-600">₹{Math.round(f.amount).toLocaleString("en-IN")}</p>
                      <button onClick={() => navigate("/farmer-report")}
                        className="text-xs text-blue-500 font-medium">Report →</button>
                    </div>
                  </div>
                ))}
                {/* Mobile Total */}
                <div className="p-3 bg-orange-50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Total</p>
                    <p className="text-xs text-gray-500">{monthly.totalEntries} entries · {(monthly.totals?.liters ?? 0).toFixed(1)}L</p>
                  </div>
                  <p className="text-base font-bold text-brand-600">₹{Math.round(monthly.totals?.amount ?? 0).toLocaleString("en-IN")}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-gray-500 font-medium">{monthLabel} mein koi entry nahi</p>
              <button onClick={() => navigate("/milk")}
                className="mt-3 text-sm text-brand-600 font-medium hover:underline">
                Naya entry karo →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}