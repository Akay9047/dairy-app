import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { farmersApi, reportsApi } from "../lib/api";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { Download, Printer, ChevronDown } from "lucide-react";

interface Farmer { id: string; name: string; code: string; village: string; mobile: string; }

interface Entry {
    id: string; date: string; shift: string; milkType: string;
    liters: number; fatPercent: number; snfPercent: number;
    ratePerLiter: number; totalAmount: number;
}

interface ReportData {
    farmer: Farmer;
    entries: Entry[];
    payments: { amount: number; paidAt: string; note?: string }[];
    totals: { liters: number; amount: number; paid: number; pending: number; entries: number };
}

const PRESETS = [
    { label: "Aaj", from: () => format(new Date(), "yyyy-MM-dd"), to: () => format(new Date(), "yyyy-MM-dd") },
    { label: "Kal", from: () => format(subDays(new Date(), 1), "yyyy-MM-dd"), to: () => format(subDays(new Date(), 1), "yyyy-MM-dd") },
    { label: "Is Hafta", from: () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"), to: () => format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd") },
    { label: "Pichla Hafta", from: () => format(startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }), "yyyy-MM-dd"), to: () => format(endOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }), "yyyy-MM-dd") },
    { label: "Is Mahine", from: () => format(startOfMonth(new Date()), "yyyy-MM-dd"), to: () => format(endOfMonth(new Date()), "yyyy-MM-dd") },
    { label: "Custom", from: () => "", to: () => "" },
];

export default function FarmerReportPage() {
    const [selectedFarmer, setSelectedFarmer] = useState("");
    const [preset, setPreset] = useState(2); // Is Hafta default
    const [from, setFrom] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
    const [to, setTo] = useState(format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));

    const { data: farmers = [] } = useQuery({ queryKey: ["farmers"], queryFn: () => farmersApi.list() });

    const { data: report, isLoading } = useQuery<ReportData>({
        queryKey: ["farmer-report", selectedFarmer, from, to],
        queryFn: () => reportsApi.farmer(selectedFarmer, {
            from: `${from}T00:00:00`, to: `${to}T23:59:59`
        }),
        enabled: !!selectedFarmer,
    });

    const handlePreset = (idx: number) => {
        setPreset(idx);
        if (idx < PRESETS.length - 1) {
            setFrom(PRESETS[idx].from());
            setTo(PRESETS[idx].to());
        }
    };

    const generatePDF = () => {
        if (!report) return;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
        const pw = doc.internal.pageSize.getWidth();
        let y = 10;

        const line = () => { doc.setDrawColor(180); doc.line(10, y, pw - 10, y); y += 4; };
        const text = (txt: string, x: number, size = 9, bold = false, align: "left" | "center" | "right" = "left") => {
            doc.setFontSize(size); doc.setFont("helvetica", bold ? "bold" : "normal");
            doc.text(txt, x, y, { align });
        };

        // Header
        doc.setFillColor(234, 88, 12);
        doc.rect(0, 0, pw, 22, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13); doc.setFont("helvetica", "bold");
        doc.text("SMART DAIRY SOLUTION", pw / 2, 9, { align: "center" });
        doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.text("Aapki Apni Digital Dairy", pw / 2, 15, { align: "center" });
        doc.text("Rajasthan Dairy Management", pw / 2, 20, { align: "center" });
        doc.setTextColor(0, 0, 0);
        y = 28;

        // Farmer Info
        doc.setFillColor(255, 247, 237);
        doc.roundedRect(10, y - 3, pw - 20, 28, 2, 2, "F");
        text("KISAAN REPORT", pw / 2, 10, true, "center"); y += 5;
        text(`Naam: ${report.farmer.name}`, 14, 9, true); y += 5;
        text(`Code: ${report.farmer.code}   Mobile: ${report.farmer.mobile}`, 14, 8); y += 5;
        text(`Gaon: ${report.farmer.village}`, 14, 8); y += 5;
        text(`Period: ${format(new Date(from), "dd MMM")} - ${format(new Date(to), "dd MMM yyyy")}`, 14, 8); y += 8;

        line();

        // Summary boxes
        const boxes = [
            ["Kul Doodh", `${report.totals.liters.toFixed(1)}L`],
            ["Kul Kamai", `Rs ${report.totals.amount.toFixed(0)}`],
            ["Paid", `Rs ${report.totals.paid.toFixed(0)}`],
            ["Baaki", `Rs ${report.totals.pending.toFixed(0)}`],
        ];
        const bw = (pw - 20) / 4;
        boxes.forEach(([label, val], i) => {
            const bx = 10 + i * bw;
            doc.setFillColor(i === 3 && report.totals.pending > 0 ? 254 : 240, i === 3 && report.totals.pending > 0 ? 226 : 253, i === 3 && report.totals.pending > 0 ? 226 : 237);
            doc.roundedRect(bx, y - 2, bw - 1, 14, 1, 1, "F");
            doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(100);
            doc.text(label, bx + bw / 2, y + 3, { align: "center" });
            doc.setFontSize(8); doc.setFont("helvetica", "bold");
            doc.setTextColor(i === 3 && report.totals.pending > 0 ? 180 : 0, 0, 0);
            doc.text(val, bx + bw / 2, y + 9, { align: "center" });
        });
        doc.setTextColor(0, 0, 0);
        y += 18;

        line();

        // Entries table header
        doc.setFillColor(234, 88, 12);
        doc.rect(10, y - 2, pw - 20, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7); doc.setFont("helvetica", "bold");
        const cols = [14, 38, 58, 74, 90, 110, pw - 10];
        const headers = ["Date", "Shift", "Type", "Liter", "Fat%", "Rate", "Amount"];
        headers.forEach((h, i) => doc.text(h, cols[i], y + 3, { align: i === 6 ? "right" : "left" }));
        doc.setTextColor(0, 0, 0);
        y += 9;

        // Entries
        report.entries.forEach((e, idx) => {
            if (y > 185) { doc.addPage(); y = 15; }
            if (idx % 2 === 0) { doc.setFillColor(250, 248, 245); doc.rect(10, y - 2, pw - 20, 7, "F"); }
            doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
            const vals = [
                format(new Date(e.date), "dd/MM"),
                e.shift === "MORNING" ? "Subah" : "Shaam",
                e.milkType === "BUFFALO" ? "Bhai" : e.milkType === "COW" ? "Gaay" : "Mix",
                e.liters.toFixed(1),
                e.fatPercent.toFixed(1),
                `Rs${e.ratePerLiter.toFixed(1)}`,
                `Rs${e.totalAmount.toFixed(0)}`,
            ];
            vals.forEach((v, i) => doc.text(v, cols[i], y + 3, { align: i === 6 ? "right" : "left" }));
            y += 7;
        });

        line();

        // Total row
        doc.setFillColor(234, 88, 12);
        doc.rect(10, y - 2, pw - 20, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8); doc.setFont("helvetica", "bold");
        doc.text(`Total: ${report.totals.entries} entries | ${report.totals.liters.toFixed(1)}L`, 14, y + 3);
        doc.text(`Rs ${report.totals.amount.toFixed(2)}`, pw - 10, y + 3, { align: "right" });
        doc.setTextColor(0, 0, 0);
        y += 12;

        // Payments section
        if (report.payments.length > 0) {
            doc.setFontSize(8); doc.setFont("helvetica", "bold");
            doc.text("BHUGTAN (Payments)", 14, y); y += 6;
            report.payments.forEach(p => {
                doc.setFontSize(7); doc.setFont("helvetica", "normal");
                doc.text(`${format(new Date(p.paidAt), "dd/MM/yyyy")} — Rs ${p.amount.toFixed(0)}${p.note ? ` (${p.note})` : ""}`, 14, y);
                y += 5;
            });
            y += 3;
        }

        // Pending
        if (report.totals.pending > 0) {
            doc.setFillColor(254, 226, 226);
            doc.roundedRect(10, y - 3, pw - 20, 10, 2, 2, "F");
            doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(180, 0, 0);
            doc.text(`Baaki Rakam: Rs ${report.totals.pending.toFixed(2)}`, pw / 2, y + 4, { align: "center" });
            doc.setTextColor(0, 0, 0);
            y += 14;
        }

        // Footer
        doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(120);
        doc.text("Smart Dairy Solution — Aapke vishwas ka shukriya!", pw / 2, y, { align: "center" });
        doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, pw / 2, y + 5, { align: "center" });

        doc.save(`report-${report.farmer.code}-${from}-to-${to}.pdf`);
        toast.success("PDF download ho gaya! ✅");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-2xl">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Kisaan Report</h1>
                <p className="text-sm text-gray-500">Farmer-wise detailed PDF report</p>
            </div>

            {/* Farmer select */}
            <div className="card">
                <label className="block text-sm font-medium text-gray-700 mb-2">Kisaan Chunein *</label>
                <select className="input-field" value={selectedFarmer} onChange={e => setSelectedFarmer(e.target.value)}>
                    <option value="">-- Kisaan select karein --</option>
                    {farmers.map((f: Farmer) => (
                        <option key={f.id} value={f.id}>{f.name} ({f.code}) — {f.village}</option>
                    ))}
                </select>
            </div>

            {/* Date presets */}
            <div className="card">
                <label className="block text-sm font-medium text-gray-700 mb-2">Period Chunein</label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {PRESETS.map((p, i) => (
                        <button key={i} onClick={() => handlePreset(i)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${preset === i ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                            {p.label}
                        </button>
                    ))}
                </div>
                {(preset === PRESETS.length - 1) && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">From</label>
                            <input type="date" className="input-field" value={from} onChange={e => setFrom(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">To</label>
                            <input type="date" className="input-field" value={to} onChange={e => setTo(e.target.value)} />
                        </div>
                    </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                    {from && to && `${format(new Date(from), "dd MMM")} — ${format(new Date(to), "dd MMM yyyy")}`}
                </p>
            </div>

            {/* Report Preview */}
            {selectedFarmer && isLoading && (
                <div className="card text-center py-8 text-gray-500">Report load ho rahi hai...</div>
            )}

            {report && (
                <>
                    {/* Summary */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center font-bold text-brand-700">
                                {report.farmer.name[0]}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{report.farmer.name}</p>
                                <p className="text-xs text-gray-500">{report.farmer.code} · {report.farmer.village} · {report.farmer.mobile}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Kul Entries", value: String(report.totals.entries), color: "bg-blue-50 text-blue-700" },
                                { label: "Kul Doodh", value: `${report.totals.liters.toFixed(1)}L`, color: "bg-teal-50 text-teal-700" },
                                { label: "Kul Kamai", value: `₹${report.totals.amount.toFixed(0)}`, color: "bg-orange-50 text-orange-700" },
                                { label: "Baaki", value: `₹${report.totals.pending.toFixed(0)}`, color: report.totals.pending > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700" },
                            ].map(({ label, value, color }) => (
                                <div key={label} className={`rounded-xl p-3 ${color.split(" ")[0]}`}>
                                    <p className="text-xs text-gray-500">{label}</p>
                                    <p className={`text-lg font-bold ${color.split(" ")[1]}`}>{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Entries preview */}
                    <div className="card">
                        <h3 className="font-semibold text-gray-800 mb-3">
                            Entries ({report.entries.length})
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {report.entries.map(e => (
                                <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            {format(new Date(e.date), "dd MMM, EEE")}
                                            <span className="text-xs text-gray-400 ml-1">
                                                {e.shift === "MORNING" ? "☀️" : "🌙"}
                                                {e.milkType === "BUFFALO" ? "🐃" : e.milkType === "COW" ? "🐄" : ""}
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-500">{e.liters}L · Fat {e.fatPercent}% · ₹{e.ratePerLiter}/L</p>
                                    </div>
                                    <p className="text-sm font-semibold text-brand-600">₹{e.totalAmount.toFixed(0)}</p>
                                </div>
                            ))}
                            {report.entries.length === 0 && (
                                <p className="text-center text-gray-400 py-4">Is period mein koi entry nahi</p>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={generatePDF}
                            className="flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-colors">
                            <Download size={18} /> PDF Download
                        </button>
                        <button onClick={handlePrint}
                            className="flex items-center justify-center gap-2 py-3 border-2 border-brand-600 text-brand-600 hover:bg-brand-50 rounded-xl font-semibold transition-colors">
                            <Printer size={18} /> Print
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}