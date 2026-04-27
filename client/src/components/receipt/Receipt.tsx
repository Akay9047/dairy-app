import { X, Printer, Download, MessageCircle, Phone } from "lucide-react";
import { format } from "date-fns";
import { notifyApi } from "../../lib/api";
import toast from "react-hot-toast";

interface ReceiptEntry {
  id: string; date: string; shift: "MORNING" | "EVENING";
  milkType?: string; liters: number; fatPercent: number;
  snfPercent?: number; fatAmount?: number; snfAmount?: number;
  ratePerLiter: number; totalAmount: number;
  farmer: { name: string; mobile: string; code: string; village: string };
}

const n = (v: number | undefined, d = 2) => (v ?? 0).toFixed(d);

export default function Receipt({ entry, onClose }: { entry: ReceiptEntry; onClose: () => void }) {
  const milkLabel = entry.milkType === "BUFFALO" ? "Buffalo" : entry.milkType === "COW" ? "Cow (Gaay)" : "Mixed";

  // ── Thermal PDF Download ──────────────────────────
  const handleDownloadPdf = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const W = 80; // 80mm thermal width
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [W, 200] });
      let y = 0;

      // Header
      doc.setFillColor(234, 88, 12);
      doc.rect(0, 0, W, 16, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9); doc.setFont("helvetica", "bold");
      doc.text("SMART DAIRY SOLUTION", W / 2, 7, { align: "center" });
      doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
      doc.text("Aapki Apni Digital Dairy — Rajasthan", W / 2, 11, { align: "center" });
      doc.text("DOODH RASID / RECEIPT", W / 2, 14.5, { align: "center" });
      doc.setTextColor(0);
      y = 19;

      const dash = () => {
        doc.setDrawColor(180); doc.setLineDashPattern([1, 1], 0);
        doc.line(3, y, W - 3, y); doc.setLineDashPattern([], 0); y += 3;
      };
      const row = (lbl: string, val: string, bold = false) => {
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal"); doc.setTextColor(100);
        doc.text(lbl, 4, y);
        doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setTextColor(0);
        doc.text(val, W - 4, y, { align: "right" });
        y += 4;
      };

      dash();
      row("Date", format(new Date(entry.date), "dd/MM/yyyy"));
      row("Time", format(new Date(entry.date), "hh:mm a"));
      row("Shift", entry.shift === "MORNING" ? "Subah (Morning)" : "Shaam (Evening)");
      row("Milk", milkLabel);
      dash();
      row("Kisaan", entry.farmer.name);
      row("Code", entry.farmer.code);
      row("Mobile", entry.farmer.mobile);
      row("Gaon", entry.farmer.village);
      dash();
      row("Doodh", `${n(entry.liters, 1)} Liter`);
      row("Fat %", `${n(entry.fatPercent, 1)} %`);
      if (entry.snfPercent && entry.snfPercent > 0) row("SNF %", `${n(entry.snfPercent, 2)} %`);
      if (entry.fatAmount && entry.fatAmount > 0) row("Fat Amount", `Rs ${n(entry.fatAmount)}`);
      if (entry.snfAmount && entry.snfAmount > 0) row("SNF Amount", `Rs ${n(entry.snfAmount)}`);
      row("Rate/Liter", `Rs ${n(entry.ratePerLiter)}`);
      dash();

      // Total
      doc.setFillColor(255, 247, 237);
      doc.roundedRect(4, y - 1, W - 8, 13, 1.5, 1.5, "F");
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(120);
      doc.text("Kul Rakam (Total)", W / 2, y + 4, { align: "center" });
      doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(234, 88, 12);
      doc.text(`Rs ${n(entry.totalAmount)}`, W / 2, y + 11, { align: "center" });
      doc.setTextColor(0); y += 17;

      dash();
      doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(140);
      doc.text("Aapke vishwas ka shukriya!", W / 2, y, { align: "center" }); y += 4;
      doc.text("Smart Dairy Solution", W / 2, y, { align: "center" });

      // Save with proper size
      const finalDoc = new jsPDF({ orientation: "portrait", unit: "mm", format: [W, y + 8] });
      // Copy by saving directly
      doc.save(`rasid-${entry.farmer.code}-${format(new Date(entry.date), "ddMMyyyy-HHmm")}.pdf`);
      toast.success("PDF download ho gaya! 🖨️");
    } catch {
      toast.error("PDF nahi bana");
    }
  };

  const handlePrint = () => window.print();

  const handleWhatsApp = async () => {
    try {
      const r = await notifyApi.whatsapp(entry.id);
      if (r.whatsappUrl) { window.open(r.whatsappUrl, "_blank"); toast.success("WhatsApp khul raha hai!"); }
      else toast.success("Message bhej diya!");
    } catch (e: any) { toast.error(e.response?.data?.error ?? "Error"); }
  };

  const handleSms = async () => {
    try {
      const r = await notifyApi.sms(entry.id);
      toast(r.previewMessage ?? "SMS bhej diya!", { icon: "📱", duration: 5000 });
    } catch (e: any) { toast.error(e.response?.data?.error ?? "Error"); }
  };

  return (
    <>
      <style>{`
        @media print {
          * { visibility: hidden !important; }
          .thermal-receipt, .thermal-receipt * { visibility: visible !important; }
          .thermal-receipt {
            position: fixed !important; top:0 !important; left:0 !important;
            width: 80mm !important; max-width: 80mm !important;
            font-family: 'Courier New', monospace !important;
            font-size: 10px !important;
            background: white !important;
            padding: 3mm !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
          @page { margin: 0; size: 80mm auto; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
        <div className="bg-white w-full sm:w-80 sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh]">

          {/* Header */}
          <div className="no-print flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
            <h2 className="font-bold text-gray-900">Doodh Rasid</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
          </div>

          {/* Thermal Receipt */}
          <div className="thermal-receipt overflow-y-auto flex-1" style={{ fontFamily: "'Courier New',monospace", fontSize: 11 }}>
            {/* Orange header */}
            <div style={{ background: "#ea580c", color: "white", textAlign: "center", padding: "8px 4px" }}>
              <div style={{ fontWeight: "bold", fontSize: 13 }}>🐄 SMART DAIRY SOLUTION</div>
              <div style={{ fontSize: 9, opacity: 0.9 }}>Aapki Apni Digital Dairy</div>
              <div style={{ fontSize: 9, opacity: 0.75 }}>Rajasthan — DOODH RASID</div>
            </div>

            <div style={{ padding: "6px 8px", fontSize: 11 }}>
              {/* Date/Shift */}
              <div style={{ borderBottom: "1px dashed #ccc", paddingBottom: 4, marginBottom: 4 }}>
                {[
                  ["Date", format(new Date(entry.date), "dd/MM/yyyy")],
                  ["Time", format(new Date(entry.date), "hh:mm a")],
                  ["Shift", entry.shift === "MORNING" ? "☀️ Subah" : "🌙 Shaam"],
                  ["Milk", milkLabel],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ color: "#666" }}>{l}</span>
                    <span style={{ fontWeight: "bold" }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Farmer */}
              <div style={{ borderBottom: "1px dashed #ccc", paddingBottom: 4, marginBottom: 4 }}>
                {[
                  ["Kisaan", entry.farmer.name],
                  ["Code", entry.farmer.code],
                  ["Mobile", entry.farmer.mobile],
                  ["Gaon", entry.farmer.village],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ color: "#666" }}>{l}</span>
                    <span style={{ fontWeight: "bold" }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Milk Details */}
              <div style={{ borderBottom: "1px dashed #ccc", paddingBottom: 4, marginBottom: 4 }}>
                {[
                  ["Doodh", `${n(entry.liters, 1)} L`],
                  ["Fat %", `${n(entry.fatPercent, 1)} %`],
                  ...(entry.snfPercent && entry.snfPercent > 0 ? [["SNF %", `${n(entry.snfPercent, 2)} %`]] : []),
                  ...(entry.fatAmount && entry.fatAmount > 0 ? [["Fat Amt", `₹${n(entry.fatAmount)}`]] : []),
                  ...(entry.snfAmount && entry.snfAmount > 0 ? [["SNF Amt", `₹${n(entry.snfAmount)}`]] : []),
                  ["Rate/L", `₹${n(entry.ratePerLiter)}`],
                ].map(([l, v]) => (
                  <div key={l as string} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ color: "#666" }}>{l}</span>
                    <span style={{ fontWeight: "bold" }}>{v as string}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 6, padding: "6px 8px", textAlign: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 10, color: "#888" }}>Kul Rakam (Total)</div>
                <div style={{ fontSize: 22, fontWeight: "bold", color: "#ea580c" }}>₹{n(entry.totalAmount)}</div>
              </div>

              <div style={{ textAlign: "center", color: "#aaa", fontSize: 10 }}>
                <div>🙏 Aapke vishwas ka shukriya!</div>
                <div>Smart Dairy Solution</div>
                <div>━━━━━━━━━━━━━━━━━━</div>
                <div style={{ fontSize: 9 }}>{format(new Date(entry.date), "dd/MM/yyyy hh:mm a")}</div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="no-print p-3 border-t grid grid-cols-2 gap-2 flex-shrink-0">
            <button onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
              <Printer size={15} /> Print (80mm)
            </button>
            <button onClick={handleDownloadPdf}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700">
              <Download size={15} /> PDF (80mm)
            </button>
            <button onClick={handleWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
              <MessageCircle size={15} /> WhatsApp
            </button>
            <button onClick={handleSms}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              <Phone size={15} /> SMS
            </button>
          </div>
        </div>
      </div>
    </>
  );
}