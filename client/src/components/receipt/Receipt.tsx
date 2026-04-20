import { X, Printer, Download, MessageCircle, Phone } from "lucide-react";
import { format } from "date-fns";
import { notifyApi } from "../../lib/api";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

interface ReceiptEntry {
  id: string; date: string; shift: "MORNING" | "EVENING";
  milkType?: string; liters: number; fatPercent: number;
  snfPercent?: number; fatKg?: number; snfKg?: number;
  fatAmount?: number; snfAmount?: number; fatRate?: number; snfRate?: number;
  ratePerLiter: number; totalAmount: number;
  farmer: { name: string; mobile: string; code: string; village: string };
}

const n = (val: number | undefined, d = 2) => (val ?? 0).toFixed(d);

export default function Receipt({ entry, onClose }: { entry: ReceiptEntry; onClose: () => void }) {
  const fatAmt = entry.fatAmount ?? entry.fatRate ?? 0;
  const snfAmt = entry.snfAmount ?? entry.snfRate ?? 0;
  const milkIcon = entry.milkType === "BUFFALO" ? "🐃" : entry.milkType === "COW" ? "🐄" : "🐃🐄";

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 145] });
    const pw = 80;
    let y = 8;

    // Header
    doc.setFillColor(234, 88, 12);
    doc.rect(0, 0, pw, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("SMART DAIRY SOLUTION", pw / 2, 8, { align: "center" });
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Aapki Apni Digital Dairy", pw / 2, 13, { align: "center" });
    doc.text("Rajasthan Dairy Management", pw / 2, 18, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y = 25;

    // Dashed line
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(180); doc.line(5, y, pw - 5, y); y += 4;

    // Info rows
    const row = (label: string, value: string) => {
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(100);
      doc.text(label, 6, y);
      doc.setFont("helvetica", "bold"); doc.setTextColor(0);
      doc.text(value, pw - 6, y, { align: "right" });
      y += 5;
    };

    row("Date", format(new Date(entry.date), "dd/MM/yyyy"));
    row("Time", format(new Date(entry.date), "hh:mm a"));
    row("Shift", entry.shift === "MORNING" ? "Subah (Morning)" : "Shaam (Evening)");
    row("Milk Type", entry.milkType === "BUFFALO" ? "Buffalo (Bhains)" : entry.milkType === "COW" ? "Cow (Gaay)" : "Mixed");
    y += 1;
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(180); doc.line(5, y, pw - 5, y); y += 4;

    row("Farmer", entry.farmer.name);
    row("Code", entry.farmer.code);
    row("Mobile", entry.farmer.mobile);
    row("Village", entry.farmer.village);
    y += 1;
    doc.line(5, y, pw - 5, y); y += 4;

    row("Doodh (Liters)", `${n(entry.liters)} L`);
    row("Fat %", `${n(entry.fatPercent, 1)} %`);
    row("SNF %", `${n(entry.snfPercent)} %`);
    row("Fat Amount", `Rs ${n(fatAmt)}`);
    row("SNF Amount", `Rs ${n(snfAmt)}`);
    row("Rate / Liter", `Rs ${n(entry.ratePerLiter)}`);

    y += 1;
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(234, 88, 12); doc.setLineWidth(0.5);
    doc.line(5, y, pw - 5, y); y += 2;

    // Total
    doc.setFillColor(255, 247, 237);
    doc.rect(5, y, pw - 10, 12, "F");
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100);
    doc.text("Kul Rakam (Total)", 8, y + 5);
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(234, 88, 12);
    doc.text(`Rs ${n(entry.totalAmount)}`, pw - 8, y + 8, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y += 16;

    doc.setDrawColor(234, 88, 12);
    doc.line(5, y, pw - 5, y); y += 5;

    // Footer
    doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(120);
    doc.text("Aapke vishwas ka shukriya!", pw / 2, y, { align: "center" }); y += 4;
    doc.text("Thank you for your trust!", pw / 2, y, { align: "center" }); y += 5;
    doc.setFontSize(6); doc.setTextColor(160);
    doc.text("Smart Dairy Solution — dairy-app-rouge.vercel.app", pw / 2, y, { align: "center" });

    doc.save(`receipt-${entry.farmer.code}-${format(new Date(entry.date), "ddMMyyyy-HHmm")}.pdf`);
    toast.success("PDF download ho gaya! ✅");
  };

  const handleWhatsApp = async () => {
    try {
      const result = await notifyApi.whatsapp(entry.id);
      if (result.configured === false && result.whatsappUrl) {
        window.open(result.whatsappUrl, "_blank");
        toast.success("WhatsApp khul raha hai! ✅");
      } else {
        toast.success("WhatsApp message bhej diya! ✅");
      }
    } catch (err: any) { toast.error(err.response?.data?.error ?? "WhatsApp nahi gaya"); }
  };

  const handleSms = async () => {
    try {
      const result = await notifyApi.sms(entry.id);
      if (result.configured === false) {
        toast(`SMS: ${result.previewMessage}`, { duration: 5000, icon: "📱" });
      } else {
        toast.success("SMS bhej diya! ✅");
      }
    } catch (err: any) { toast.error(err.response?.data?.error ?? "SMS nahi gaya"); }
  };

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-receipt, .print-receipt * { visibility: visible !important; }
          .print-receipt { position: fixed !important; left: 0 !important; top: 0 !important; width: 80mm !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
        <div className="print-receipt bg-white w-full sm:w-80 sm:rounded-2xl shadow-xl max-h-screen overflow-y-auto">
          {/* Header bar */}
          <div className="no-print flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white z-10">
            <h2 className="font-semibold text-gray-900">Receipt / Rasid</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
          </div>

          {/* Receipt Content */}
          <div className="font-mono text-xs">
            {/* Orange header */}
            <div className="bg-brand-600 text-white text-center py-3 px-4">
              <p className="font-bold text-sm">🐄 SMART DAIRY SOLUTION</p>
              <p className="text-xs opacity-90">Aapki Apni Digital Dairy</p>
              <p className="text-xs opacity-75">Rajasthan Dairy Management</p>
            </div>

            <div className="p-4 space-y-0.5">
              {/* Date/Time/Shift */}
              <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
                {[
                  ["Date", format(new Date(entry.date), "dd/MM/yyyy")],
                  ["Time", format(new Date(entry.date), "hh:mm a")],
                  ["Shift", entry.shift === "MORNING" ? "☀️ Subah" : "🌙 Shaam"],
                  ["Milk", `${milkIcon} ${entry.milkType === "BUFFALO" ? "Buffalo" : entry.milkType === "COW" ? "Cow" : "Mixed"}`],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-0.5">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>

              {/* Farmer info */}
              <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
                {[
                  ["Farmer", entry.farmer.name],
                  ["Code", entry.farmer.code],
                  ["Mobile", entry.farmer.mobile],
                  ["Village", entry.farmer.village],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-0.5">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-medium text-right max-w-[60%]">{v}</span>
                  </div>
                ))}
              </div>

              {/* Milk details */}
              <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
                {[
                  ["Doodh", `${n(entry.liters)} Liter`],
                  ["Fat %", `${n(entry.fatPercent, 1)}%`],
                  ["SNF %", `${n(entry.snfPercent)}%`],
                  ["Fat Amount", `₹${n(fatAmt)}`],
                  ["SNF Amount", `₹${n(snfAmt)}`],
                  ["Rate/Liter", `₹${n(entry.ratePerLiter)}`],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-0.5">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Kul Rakam (Total)</p>
                <p className="text-2xl font-bold text-brand-600">₹{n(entry.totalAmount)}</p>
              </div>

              <div className="text-center pt-2 pb-1">
                <p className="text-gray-500">🙏 Aapke vishwas ka shukriya!</p>
                <p className="text-gray-400 text-xs">Thank you for your trust!</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="no-print p-3 border-t grid grid-cols-2 gap-2 sticky bottom-0 bg-white">
            <button onClick={() => window.print()}
              className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
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