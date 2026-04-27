import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { farmersApi, reportsApi } from "../lib/api";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import toast from "react-hot-toast";
import { Download, Printer, Search } from "lucide-react";

interface Farmer { id: string; name: string; code: string; village: string; mobile: string; }

const PRESETS = [
    { label: "Aaj", days: 0 },
    { label: "Kal", days: 1 },
    { label: "Is Hafta", days: -1 },
    { label: "Pichla Hafta", days: -2 },
    { label: "Is Mahine", days: -3 },
    { label: "Custom", days: -99 },
];

function getDateRange(preset: number): { from: string; to: string } {
    const today = new Date();
    if (preset === 0) return { from: format(today, "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
    if (preset === 1) return { from: format(subDays(today, 1), "yyyy-MM-dd"), to: format(subDays(today, 1), "yyyy-MM-dd") };
    if (preset === -1) return { from: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"), to: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd") };
    if (preset === -2) { const lw = subDays(today, 7); return { from: format(startOfWeek(lw, { weekStartsOn: 1 }), "yyyy-MM-dd"), to: format(endOfWeek(lw, { weekStartsOn: 1 }), "yyyy-MM-dd") }; }
    if (preset === -3) return { from: format(startOfMonth(today), "yyyy-MM-dd"), to: format(endOfMonth(today), "yyyy-MM-dd") };
    return { from: "", to: "" };
}

export default function FarmerReportPage() {
    const [selectedFarmer, setSelectedFarmer] = useState("");
    const [preset, setPreset] = useState(2); // Is Hafta
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [search, setSearch] = useState("");

    const { from, to } = preset === 5 ? { from: customFrom, to: customTo } : getDateRange(PRESETS[preset].days);

    const { data: farmers = [] } = useQuery({ queryKey: ["farmers"], queryFn: () => farmersApi.list() });

    const { data: report, isLoading } = useQuery({
        queryKey: ["farmer-report", selectedFarmer, from, to],
        queryFn: () => reportsApi.farmer(selectedFarmer, { from: `${from}T00:00:00`, to: `${to}T23:59:59` }),
        enabled: !!selectedFarmer && !!from && !!to,
    });

    const filteredFarmers = (farmers as Farmer[]).filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.code.toLowerCase().includes(search.toLowerCase())
    );

    // ── Thermal PDF ──────────────────────────────────
    const generateThermalPDF = async () => {
        if (!report) return;
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
            doc.text("KISAAN REPORT / FARMER REPORT", W / 2, 12, { align: "center" });
            doc.text(`${from} to ${to}`, W / 2, 16, { align: "center" });
            doc.setTextColor(0); y = 21;

            const dash = () => {
                doc.setDrawColor(180); doc.setLineDashPattern([1, 1], 0);
                doc.line(3, y, W - 3, y); doc.setLineDashPattern([], 0); y += 3;
            };
            const row = (lbl: string, val: string, bold = false) => {
                doc.setFontSize(7.5);
                doc.setFont("helvetica", "normal"); doc.setTextColor(100); doc.text(lbl, 4, y);
                doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setTextColor(0); doc.text(val, W - 4, y, { align: "right" });
                y += 4;
            };

            // Farmer info
            dash();
            row("Kisaan", report.farmer.name);
            row("Code", report.farmer.code);
            row("Mobile", report.farmer.mobile);
            row("Gaon", report.farmer.village);

            // Summary
            dash();
            row("Period", `${format(new Date(from), "dd/MM")} - ${format(new Date(to), "dd/MM/yy")}`);
            row("Kul Entries", String(report.totals.entries));
            row("Kul Doodh", `${report.totals.liters.toFixed(1)} L`);
            row("Kul Kamai", `Rs ${report.totals.amount.toFixed(0)}`, true);
            row("Paid", `Rs ${report.totals.paid.toFixed(0)}`);
            if (report.totals.pending > 0) row("BAAKI", `Rs ${report.totals.pending.toFixed(0)}`, true);

            // Entries
            if (report.entries.length > 0) {
                dash();
                doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(150);
                doc.text("ENTRY DETAILS", 4, y); y += 4;
                doc.setTextColor(0);

                // Table header
                doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
                doc.text("Date", 4, y); doc.text("L", 28, y); doc.text("Fat", 36, y);
                doc.text("Rate", 50, y); doc.text("Amt", W - 4, y, { align: "right" });
                y += 3;
                doc.setDrawColor(200); doc.line(3, y, W - 3, y); y += 2;

                doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
                for (const e of report.entries) {
                    if (y > 370) { doc.addPage(); y = 10; }
                    const shift = e.shift === "MORNING" ? "S" : "E";
                    doc.setTextColor(100);
                    doc.text(`${format(new Date(e.date), "dd/MM")} ${shift}`, 4, y);
                    doc.setTextColor(0);
                    doc.text(`${e.liters.toFixed(1)}`, 28, y);
                    doc.text(`${e.fatPercent.toFixed(1)}`, 36, y);
                    doc.text(`${e.ratePerLiter.toFixed(1)}`, 50, y);
                    doc.text(`Rs${Math.round(e.totalAmount)}`, W - 4, y, { align: "right" });
                    y += 4;
                }
            }

            // Payments
            if (report.payments?.length > 0) {
                dash();
                doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(150);
                doc.text("BHUGTAN (PAYMENTS)", 4, y); y += 4; doc.setTextColor(0);
                for (const p of report.payments) {
                    doc.setFontSize(7); doc.setFont("helvetica", "normal");
                    doc.text(format(new Date(p.paidAt), "dd/MM/yy"), 4, y);
                    doc.text(`Rs ${p.amount.toFixed(0)}`, W - 4, y, { align: "right" });
                    y += 4;
                }
            }

            // Total box
            y += 2; dash();
            doc.setFillColor(255, 247, 237);
            doc.roundedRect(4, y - 1, W - 8, 13, 1.5, 1.5, "F");
            doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(120);
            doc.text("Kul Kamai", W / 2, y + 4, { align: "center" });
            doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(234, 88, 12);
            doc.text(`Rs ${report.totals.amount.toFixed(0)}`, W / 2, y + 11, { align: "center" });
            doc.setTextColor(0); y += 17;

            if (report.totals.pending > 0) {
                doc.setFillColor(254, 226, 226);
                doc.roundedRect(4, y - 1, W - 8, 10, 1.5, 1.5, "F");
                doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(180, 0, 0);
                doc.text(`Baaki: Rs ${report.totals.pending.toFixed(0)}`, W / 2, y + 6, { align: "center" });
                doc.setTextColor(0); y += 14;
            }

            dash();
            doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(150);
            doc.text("Shukriya! Smart Dairy Solution", W / 2, y, { align: "center" }); y += 4;
            doc.text(format(new Date(), "dd/MM/yyyy hh:mm a"), W / 2, y, { align: "center" });

            // Save
            doc.save(`report-${report.farmer.code}-${from}-${to}.pdf`);
            toast.success("Thermal PDF download ho gaya! 🖨️");
        } catch (e) {
            console.error(e);
            toast.error("PDF nahi bana");
        }
    };

    const handlePrint = () => window.print();

    return (
        <>
            <style>{`
        @media print {
          * { visibility: hidden !important; }
          .thermal-report, .thermal-report * { visibility: visible !important; }
          .thermal-report {
            position: fixed !important; top:0 !important; left:0 !important;
            width: 80mm !important; font-size: 10px !important;
            font-family: 'Courier New', monospace !important;
            background: white !important; padding: 3mm !important;
          }
          .no-print { display: none !important; }
          @page { margin: 0; size: 80mm auto; }
        }
      `}</style>

            <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Kisaan Report</h1>
                    <p className="text-sm text-gray-400">Farmer-wise thermal receipt report</p>
                </div>

                {/* Farmer Select */}
                <div className="card space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Kisaan Chunein *</label>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                        <input className="input-field pl-8" placeholder="Naam ya code se search..."
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="input-field" value={selectedFarmer} onChange={e => setSelectedFarmer(e.target.value)}>
                        <option value="">-- Select karein --</option>
                        {filteredFarmers.map((f: Farmer) => (
                            <option key={f.id} value={f.id}>{f.name} ({f.code}) — {f.village}</option>
                        ))}
                    </select>
                </div>

                {/* Date Presets */}
                <div className="card space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Period</label>
                    <div className="flex flex-wrap gap-2">
                        {PRESETS.map((p, i) => (
                            <button key={i} onClick={() => setPreset(i)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${preset === i ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                    {preset === 5 && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">From</label>
                                <input type="date" className="input-field" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">To</label>
                                <input type="date" className="input-field" value={customTo} onChange={e => setCustomTo(e.target.value)} />
                            </div>
                        </div>
                    )}
                    {from && to && (
                        <p className="text-xs text-gray-400">
                            📅 {format(new Date(from), "dd MMM")} — {format(new Date(to), "dd MMM yyyy")}
                        </p>
                    )}
                </div>

                {/* Loading */}
                {selectedFarmer && isLoading && (
                    <div className="card text-center py-8 text-gray-400">Loading report...</div>
                )}

                {/* Report Preview */}
                {report && (
                    <>
                        {/* Summary */}
                        <div className="card">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center font-bold text-brand-700 text-lg">
                                    {report.farmer.name[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{report.farmer.name}</p>
                                    <p className="text-xs text-gray-400">{report.farmer.code} · {report.farmer.village} · {report.farmer.mobile}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { l: "Kul Entries", v: String(report.totals.entries), c: "bg-blue-50 text-blue-700" },
                                    { l: "Kul Doodh", v: `${report.totals.liters.toFixed(1)}L`, c: "bg-teal-50 text-teal-700" },
                                    { l: "Kul Kamai", v: `₹${report.totals.amount.toFixed(0)}`, c: "bg-orange-50 text-orange-700" },
                                    { l: "Baaki", v: `₹${report.totals.pending.toFixed(0)}`, c: report.totals.pending > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700" },
                                ].map(({ l, v, c }) => (
                                    <div key={l} className={`rounded-xl p-3 ${c.split(" ")[0]}`}>
                                        <p className="text-xs text-gray-500">{l}</p>
                                        <p className={`text-lg font-bold ${c.split(" ")[1]}`}>{v}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Thermal Print Preview */}
                        <div className="thermal-report bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div style={{ background: "#ea580c", color: "white", textAlign: "center", padding: "6px 4px", fontSize: 11 }}>
                                <div style={{ fontWeight: "bold" }}>🐄 SMART DAIRY SOLUTION</div>
                                <div style={{ fontSize: 9 }}>KISAAN REPORT</div>
                                <div style={{ fontSize: 8 }}>{from} to {to}</div>
                            </div>
                            <div style={{ padding: "6px 8px", fontFamily: "'Courier New',monospace", fontSize: 10 }}>
                                <div style={{ borderBottom: "1px dashed #ccc", paddingBottom: 4, marginBottom: 4 }}>
                                    {[["Kisaan", report.farmer.name], ["Code", report.farmer.code], ["Mobile", report.farmer.mobile]].map(([l, v]) => (
                                        <div key={l} style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#888" }}>{l}</span><span style={{ fontWeight: "bold" }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ borderBottom: "1px dashed #ccc", paddingBottom: 4, marginBottom: 4 }}>
                                    {[
                                        ["Entries", String(report.totals.entries)],
                                        ["Doodh", `${report.totals.liters.toFixed(1)}L`],
                                        ["Kamai", `₹${report.totals.amount.toFixed(0)}`],
                                        ["Paid", `₹${report.totals.paid.toFixed(0)}`],
                                        ...(report.totals.pending > 0 ? [["BAAKI", `₹${report.totals.pending.toFixed(0)}`]] : []),
                                    ].map(([l, v]) => (
                                        <div key={l} style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#888" }}>{l}</span>
                                            <span style={{ fontWeight: l === "BAAKI" || l === "Kamai" ? "bold" : "normal", color: l === "BAAKI" ? "#dc2626" : l === "Kamai" ? "#ea580c" : "inherit" }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                                {/* Entries list */}
                                <div style={{ fontSize: 9 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#888", marginBottom: 2 }}>
                                        <span>Date</span><span>L</span><span>Fat</span><span>Rate</span><span>Amt</span>
                                    </div>
                                    {report.entries.slice(0, 10).map((e: any) => (
                                        <div key={e.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                                            <span>{format(new Date(e.date), "dd/MM")}{e.shift === "MORNING" ? "S" : "E"}</span>
                                            <span>{e.liters.toFixed(1)}</span>
                                            <span>{e.fatPercent.toFixed(1)}</span>
                                            <span>{e.ratePerLiter.toFixed(1)}</span>
                                            <span style={{ fontWeight: "bold" }}>₹{Math.round(e.totalAmount)}</span>
                                        </div>
                                    ))}
                                    {report.entries.length > 10 && <div style={{ color: "#888", textAlign: "center" }}>...+{report.entries.length - 10} more entries in PDF</div>}
                                </div>
                                <div style={{ background: "#fff7ed", borderRadius: 4, padding: "4px 8px", textAlign: "center", marginTop: 6 }}>
                                    <div style={{ fontSize: 9, color: "#888" }}>Kul Kamai</div>
                                    <div style={{ fontSize: 16, fontWeight: "bold", color: "#ea580c" }}>₹{report.totals.amount.toFixed(0)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="no-print grid grid-cols-2 gap-3">
                            <button onClick={generateThermalPDF}
                                className="flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-colors">
                                <Download size={18} /> PDF (80mm)
                            </button>
                            <button onClick={handlePrint}
                                className="flex items-center justify-center gap-2 py-3 border-2 border-brand-600 text-brand-600 hover:bg-brand-50 rounded-xl font-semibold transition-colors">
                                <Printer size={18} /> Print (80mm)
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}