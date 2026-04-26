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

const n = (val: number | undefined, d = 2) => (val ?? 0).toFixed(d);

export default function Receipt({ entry, onClose }: { entry: ReceiptEntry; onClose: () => void }) {
  const milkLabel = entry.milkType === "BUFFALO" ? "Buffalo (Bhains)"
    : entry.milkType === "COW" ? "Cow (Gaay)" : "Mixed";

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    // 80mm thermal width = ~227px at 72dpi, use 80mm x 200mm
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 180] });
    const pw = 80;
    let y = 6;

    const center = (txt: string, size: number, bold = false) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.text(txt, pw / 2, y, { align: "center" });
      y += size * 0.45;
    };

    const row = (label: string, value: string, size = 8) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text(label, 4, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(value, pw - 4, y, { align: "right" });
      y += size * 0.42;
    };

    const dashes = () => {
      doc.setDrawColor(180);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(4, y, pw - 4, y);
      y += 3;
    };

    // Header
    doc.setFillColor(234, 88, 12);
    doc.rect(0, 0, pw, 16, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("SMART DAIRY SOLUTION", pw / 2, 7, { align: "center" });
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Aapki Apni Digital Dairy", pw / 2, 11, { align: "center" });
    doc.text("Rajasthan", pw / 2, 14.5, { align: "center" });
    doc.setTextColor(0);
    y = 20;

    dashes();
    row("Date", format(new Date(entry.date), "dd/MM/yyyy"));
    row("Time", format(new Date(entry.date), "hh:mm a"));
    row("Shift", entry.shift === "MORNING" ? "Subah" : "Shaam");
    row("Milk", milkLabel);
    dashes();
    row("Farmer", entry.farmer.name);
    row("Code", entry.farmer.code);
    row("Mobile", entry.farmer.mobile);
    row("Village", entry.farmer.village);
    dashes();
    row("Doodh", `${n(entry.liters)} L`);
    row("Fat %", `${n(entry.fatPercent, 1)} %`);
    if (entry.snfPercent && entry.snfPercent > 0) row("SNF %", `${n(entry.snfPercent)} %`);
    if (entry.fatAmount && entry.fatAmount > 0) row("Fat Amt", `Rs ${n(entry.fatAmount)}`);
    if (entry.snfAmount && entry.snfAmount > 0) row("SNF Amt", `Rs ${n(entry.snfAmount)}`);
    row("Rate/L", `Rs ${n(entry.ratePerLiter)}`);
    dashes();

    // Total — big
    doc.setLineDashPattern([], 0);
    doc.setFillColor(255, 247, 237);
    doc.rect(4, y - 1, pw - 8, 14, "F");
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100);
    doc.text("Kul Rakam (Total)", pw / 2, y + 4, { align: "center" });
    doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(234, 88, 12);
    doc.text(`Rs ${n(entry.totalAmount)}`, pw / 2, y + 11, { align: "center" });
    doc.setTextColor(0);
    y += 18;

    dashes();
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(120);
    doc.text("🙏 Aapke vishwas ka shukriya!", pw / 2, y, { align: "center" }); y += 4;
    doc.text("Smart Dairy Solution", pw / 2, y, { align: "center" });

    doc.save(`receipt-${entry.farmer.code}-${format(new Date(entry.date), "ddMMyyyyHHmm")}.pdf`);
    toast.success("PDF download ho gaya! ✅");
  };

  const handleWhatsApp = async () => {
    try {
      const result = await notifyApi.whatsapp(entry.id);
      if (result.whatsappUrl) { window.open(result.whatsappUrl, "_blank"); toast.success("WhatsApp khul raha hai! ✅"); }
      else toast.success("Message bhej diya! ✅");
    } catch (err: any) { toast.error(err.response?.data?.error ?? "Error"); }
  };

  const handleSms = async () => {
    try {
      const result = await notifyApi.sms(entry.id);
      toast(result.previewMessage ?? "SMS bhej diya!", { icon: "📱", duration: 5000 });
    } catch (err: any) { toast.error(err.response?.data?.error ?? "Error"); }
  };

  return (
    <>
      {/* Thermal print CSS — 80mm width */}
      <style>{`
        @media print {
          * { visibility: hidden !important; margin: 0 !important; padding: 0 !important; }
          .thermal-receipt, .thermal-receipt * { visibility: visible !important; }
          .thermal-receipt {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            font-size: 11px !important;
            font-family: 'Courier New', monospace !important;
            background: white !important;
            padding: 4mm !important;
          }
          .no-print { display: none !important; }
          @page { margin: 0; size: 80mm auto; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
        <div className="bg-white w-full sm:w-96 sm:rounded-2xl shadow-2xl max-h-[95vh] flex flex-col">

          {/* Modal Header */}
          <div className="no-print flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
            <h2 className="font-bold text-gray-900">Receipt / Rasid</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
          </div>

          {/* Thermal Receipt Preview */}
          <div className="thermal-receipt overflow-y-auto flex-1" style={{ fontFamily: "'Courier New', monospace" }}>
            {/* Orange Header */}
            <div className="bg-brand-600 text-white text-center py-3">
              <p className="font-bold text-sm tracking-wide">🐄 SMART DAIRY SOLUTION</p>
              <p className="text-xs opacity-90">Aapki Apni Digital Dairy</p>
              <p className="text-xs opacity-75">Rajasthan</p>
            </div>

            <div className="px-3 py-2 text-xs" style={{ fontFamily: "'Courier New', monospace" }}>
              {/* Date/Shift */}
              <div className="border-b border-dashed border-gray-300 pb-2 mb-2 space-y-0.5">
                {[
                  ["Date", format(new Date(entry.date), "dd/MM/yyyy")],
                  ["Time", format(new Date(entry.date), "hh:mm a")],
                  ["Shift", entry.shift === "MORNING" ? "☀️ Subah" : "🌙 Shaam"],
                  ["Milk", milkLabel],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-semibold">{v}</span>
                  </div>
                ))}
              </div>

              {/* Farmer */}
              <div className="border-b border-dashed border-gray-300 pb-2 mb-2 space-y-0.5">
                {[
                  ["Farmer", entry.farmer.name],
                  ["Code", entry.farmer.code],
                  ["Mobile", entry.farmer.mobile],
                  ["Village", entry.farmer.village],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-semibold text-right max-w-[55%] truncate">{v}</span>
                  </div>
                ))}
              </div>

              {/* Milk Details */}
              <div className="border-b border-dashed border-gray-300 pb-2 mb-2 space-y-0.5">
                {[
                  ["Doodh", `${n(entry.liters)} Liter`],
                  ["Fat %", `${n(entry.fatPercent, 1)} %`],
                  ...(entry.snfPercent && entry.snfPercent > 0 ? [["SNF %", `${n(entry.snfPercent)} %`]] : []),
                  ...(entry.fatAmount && entry.fatAmount > 0 ? [["Fat Amt", `₹${n(entry.fatAmount)}`]] : []),
                  ...(entry.snfAmount && entry.snfAmount > 0 ? [["SNF Amt", `₹${n(entry.snfAmount)}`]] : []),
                  ["Rate/Liter", `₹${n(entry.ratePerLiter)}`],
                ].map(([l, v]) => (
                  <div key={l as string} className="flex justify-between">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-semibold">{v}</span>
                  </div>
                ))}
              </div>

              {/* TOTAL */}
              <div className="bg-orange-50 rounded-lg p-2 text-center border border-orange-100 mb-2">
                <p className="text-xs text-gray-500 mb-0.5">Kul Rakam (Total)</p>
                <p className="text-2xl font-bold text-brand-600">₹{n(entry.totalAmount)}</p>
              </div>

              <div className="text-center text-gray-400 text-xs space-y-0.5 pb-1">
                <p>🙏 Aapke vishwas ka shukriya!</p>
                <p>Thank you for your trust!</p>
                <p className="text-gray-300">━━━━━━━━━━━━━━━━━━━━</p>
                <p>Smart Dairy Solution</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="no-print p-3 border-t grid grid-cols-2 gap-2 flex-shrink-0">
            <button onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <Printer size={15} /> Print
            </button>
            <button onClick={handleDownloadPdf}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
              <Download size={15} /> PDF
            </button>
            <button onClick={handleWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
              <MessageCircle size={15} /> WhatsApp
            </button>
            <button onClick={handleSms}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              <Phone size={15} /> SMS
            </button>
          </div>
        </div>
      </div>
    </>
  );
}