import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi, farmersApi } from "../lib/api";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface Farmer {
  id: string;
  name: string;
  code: string;
  village: string;
}

type ReportTab = "monthly" | "farmer";

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("monthly");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedFarmer, setSelectedFarmer] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: farmers = [] } = useQuery({
    queryKey: ["farmers"],
    queryFn: () => farmersApi.list(),
  });

  const { data: monthlyData, isLoading: monthLoading } = useQuery({
    queryKey: ["report-monthly", month, year],
    queryFn: () => reportsApi.monthly({ month, year }),
    enabled: tab === "monthly",
  });

  const { data: farmerData, isLoading: farmerLoading } = useQuery({
    queryKey: ["report-farmer", selectedFarmer, from, to],
    queryFn: () => reportsApi.farmer(selectedFarmer, { from: from || undefined, to: to || undefined }),
    enabled: tab === "farmer" && !!selectedFarmer,
  });

  const handleExportCsv = async () => {
    try {
      const blob = await reportsApi.exportCsv({
        farmerId: tab === "farmer" ? selectedFarmer || undefined : undefined,
        from: from || undefined,
        to: to || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dairy-report-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV download ho gaya!");
    } catch {
      toast.error("Export nahi hua");
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Dairy ka hisaab kitaab</p>
        </div>
        <button
          onClick={handleExportCsv}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Download size={15} /> CSV Export
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {(["monthly", "farmer"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "monthly" ? "Monthly Summary" : "Farmer Report"}
          </button>
        ))}
      </div>

      {tab === "monthly" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <select
              className="input-field w-auto"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {months.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              className="input-field w-auto"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {monthLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : monthlyData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="card text-center">
                  <p className="text-xs text-gray-500">Kul Entries</p>
                  <p className="text-xl font-bold">{monthlyData.totalEntries}</p>
                </div>
                <div className="card text-center">
                  <p className="text-xs text-gray-500">Kul Doodh</p>
                  <p className="text-xl font-bold">{monthlyData.totals?.liters?.toFixed(1)}L</p>
                </div>
                <div className="card text-center">
                  <p className="text-xs text-gray-500">Kul Rakam</p>
                  <p className="text-xl font-bold text-brand-600">₹{monthlyData.totals?.amount?.toFixed(0)}</p>
                </div>
              </div>

              <div className="card overflow-x-auto">
                <h3 className="font-semibold text-gray-800 mb-3">Farmer-wise Summary</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="pb-2">Farmer</th>
                      <th className="pb-2 text-right">Entries</th>
                      <th className="pb-2 text-right">Liters</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.summary?.map((row: {
                      farmerCode: string;
                      farmerName: string;
                      village: string;
                      entries: number;
                      liters: number;
                      amount: number;
                    }) => (
                      <tr key={row.farmerCode} className="border-b border-gray-50">
                        <td className="py-2">
                          <p className="font-medium">{row.farmerName}</p>
                          <p className="text-xs text-gray-400">{row.farmerCode} · {row.village}</p>
                        </td>
                        <td className="py-2 text-right text-gray-600">{row.entries}</td>
                        <td className="py-2 text-right text-gray-600">{row.liters.toFixed(1)}L</td>
                        <td className="py-2 text-right font-semibold text-brand-600">₹{row.amount.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {tab === "farmer" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <select
              className="input-field"
              value={selectedFarmer}
              onChange={(e) => setSelectedFarmer(e.target.value)}
            >
              <option value="">-- Kisaan chunein --</option>
              {farmers.map((f: Farmer) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>
            <input
              type="date"
              className="input-field w-auto"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="From"
            />
            <input
              type="date"
              className="input-field w-auto"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="To"
            />
          </div>

          {!selectedFarmer && (
            <div className="card text-center py-8">
              <FileText size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">Pehle kisaan chunein</p>
            </div>
          )}

          {selectedFarmer && farmerLoading && (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          )}

          {farmerData && (
            <div className="space-y-3">
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold">
                    {farmerData.farmer.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{farmerData.farmer.name}</p>
                    <p className="text-xs text-gray-500">
                      {farmerData.farmer.code} · {farmerData.farmer.village} · {farmerData.farmer.mobile}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-teal-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Kul Doodh</p>
                    <p className="font-bold text-teal-700">{farmerData.totals.liters.toFixed(1)}L</p>
                  </div>
                  <div className="bg-brand-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Kul Rakam</p>
                    <p className="font-bold text-brand-600">₹{farmerData.totals.amount.toFixed(0)}</p>
                  </div>
                </div>
              </div>

              <div className="card overflow-x-auto">
                <h3 className="font-semibold text-gray-800 mb-3">Entry History</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Shift</th>
                      <th className="pb-2 text-right">Liters</th>
                      <th className="pb-2 text-right">Fat</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmerData.entries.map((e: {
                      id: string;
                      date: string;
                      shift: string;
                      liters: number;
                      fatPercent: number;
                      totalAmount: number;
                    }) => (
                      <tr key={e.id} className="border-b border-gray-50">
                        <td className="py-1.5">{format(new Date(e.date), "dd MMM")}</td>
                        <td className="py-1.5">
                          <span className={e.shift === "MORNING" ? "badge-morning" : "badge-evening"}>
                            {e.shift === "MORNING" ? "Subah" : "Shaam"}
                          </span>
                        </td>
                        <td className="py-1.5 text-right">{e.liters.toFixed(2)}L</td>
                        <td className="py-1.5 text-right">{e.fatPercent.toFixed(1)}%</td>
                        <td className="py-1.5 text-right font-medium text-brand-600">₹{e.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
