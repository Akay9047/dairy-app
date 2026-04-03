import { X, Printer, Download, MessageCircle, Phone } from "lucide-react";
import { format } from "date-fns";
import { notifyApi } from "../../lib/api";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

interface ReceiptEntry {
  id: string;
  date: string;
  shift: "MORNING" | "EVENING";
  liters: number;
  fatPercent: number;
  snfPercent?: number;
  fatKg?: number;
  snfKg?: number;
  fatAmount?: number;
  snfAmount?: number;
  // backward compat
  fatRate?: number;
  snfRate?: number;
  ratePerLiter: number;
  totalAmount: number;
  farmer: { name: string; mobile: string; code: string; village: string };
}

// Safe number formatter — never crashes on undefined
const n = (val: number | undefined, decimals = 2) =>
  (val ?? 0).toFixed(decimals);

export default function Receipt({ entry, onClose }: { entry: ReceiptEntry; onClose: () => void }) {
  // Support both old (fatRate) and new (fatAmount) field names
  const fatAmt = entry.fatAmount ?? entry.fatRate ?? 0;
  const snfAmt = entry.snfAmount ?? entry.snfRate ?? 0;

  const handlePrint = () => window.print();

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 155] });
    const x = 5; let y = 8; const lh = 5;
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("SMART DAIRY SOLUTION", 40, y, { align: "center" }); y += lh;
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("Aapki Apni Digital Dairy", 40, y, { align: "center" }); y += lh + 1;
    doc.line(x, y, 75, y); y += 3;

    const rows: [string, string][] = [
      ["Date", format(new Date(entry.date), "dd/MM/yyyy")],
      ["Time", format(new Date(entry.date), "hh:mm a")],
      ["Shift", entry.shift === "MORNING" ? "Subah" : "Shaam"],
      ["Farmer", entry.farmer.name],
      ["Code", entry.farmer.code],
      ["Mobile", entry.farmer.mobile],
      ["Village", entry.farmer.village],
      ["Doodh (L)", `${n(entry.liters)} L`],
      ["Fat %", `${n(entry.fatPercent, 1)}%`],
      ["SNF %", `${n(entry.snfPercent)}%`],
      ["Fat Kg", `${n(entry.fatKg, 4)} kg`],
      ["SNF Kg", `${n(entry.snfKg, 4)} kg`],
      ["Fat Amount", `Rs ${n(fatAmt)}`],
      ["SNF Amount", `Rs ${n(snfAmt)}`],
      ["Rate/Liter", `Rs ${n(entry.ratePerLiter)}`],
    ];

    doc.setFontSize(8);
    rows.forEach(([label, value]) => {
      doc.text(label, x, y);
      doc.text(value, 75 - x, y, { align: "right" });
      y += lh;
    });
    doc.line(x, y, 75, y); y += 3;
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("Kul Rakam (Total)", x, y);
    doc.text(`Rs ${n(entry.totalAmount)}`, 75 - x, y, { align: "right" }); y += lh + 2;
    doc.line(x, y, 75, y); y += 4;
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Aapke vishwas ka shukriya!", 40, y, { align: "center" }); y += lh;
    doc.text("Thank you for your trust!", 40, y, { align: "center" });
    doc.save(`receipt-${entry.farmer.code}-${format(new Date(entry.date), "ddMMyyyy")}.pdf`);
    toast.success("PDF download ho gaya!");
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
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "WhatsApp nahi gaya");
    }
  };

  const handleSms = async () => {
    try {
      const result = await notifyApi.sms(entry.id);
      if (result.configured === false) {
        toast(`SMS preview: ${result.previewMessage}`, { duration: 5000, icon: "📱" });
      } else {
        toast.success("SMS bhej diya! ✅");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "SMS nahi gaya");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm my-4">
        <div className="flex items-center justify-between p-3 border-b no-print">
          <h2 className="font-semibold text-gray-900">Receipt / Rasid</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        {/* Receipt Content */}
        <div className="p-4 font-mono text-xs">
          <div className="text-center mb-3">
            <p className="text-base font-bold">🐄 SMART DAIRY SOLUTION</p>
            <p className="text-gray-600">Aapki Apni Digital Dairy</p>
            <div className="border-t border-dashed border-gray-400 mt-2 pt-2" />
          </div>

          <table className="w-full text-xs">
            <tbody>
              {[
                ["Date", format(new Date(entry.date), "dd/MM/yyyy")],
                ["Time", format(new Date(entry.date), "hh:mm a")],
                ["Shift", entry.shift === "MORNING" ? "Subah ☀️" : "Shaam 🌙"],
                ["Farmer", entry.farmer.name],
                ["Code", entry.farmer.code],
                ["Mobile", entry.farmer.mobile],
                ["Village", entry.farmer.village],
              ].map(([l, v]) => (
                <tr key={l}>
                  <td className="py-0.5 text-gray-500 w-20">{l}</td>
                  <td className="py-0.5 text-right font-medium">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-gray-400 my-2" />

          <table className="w-full text-xs">
            <tbody>
              {[
                ["Doodh", `${n(entry.liters)} Liter`],
                ["Fat %", `${n(entry.fatPercent, 1)}%`],
                ["SNF %", `${n(entry.snfPercent)}%`],
                ["Fat Amount", `₹${n(fatAmt)}`],
                ["SNF Amount", `₹${n(snfAmt)}`],
                ["Rate/Liter", `₹${n(entry.ratePerLiter)}`],
              ].map(([l, v]) => (
                <tr key={l}>
                  <td className="py-0.5 text-gray-500">{l}</td>
                  <td className="py-0.5 text-right font-medium">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t-2 border-gray-800 my-2" />
          <div className="flex justify-between items-center font-bold text-sm">
            <span>Kul Rakam</span>
            <span className="text-brand-600 text-base">₹{n(entry.totalAmount)}</span>
          </div>
          <div className="border-t-2 border-gray-800 mt-2" />

          <div className="text-center mt-3 text-gray-500 text-xs">
            <p>🙏 Aapke vishwas ka shukriya!</p>
            <p>Thank you for your trust!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-t grid grid-cols-2 gap-2 no-print">
          <button onClick={handlePrint}
            className="btn-secondary text-sm flex items-center justify-center gap-1.5">
            <Printer size={14} /> Print
          </button>
          <button onClick={handleDownloadPdf}
            className="btn-primary text-sm flex items-center justify-center gap-1.5">
            <Download size={14} /> PDF
          </button>
          <button onClick={handleWhatsApp}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
            <MessageCircle size={14} /> WhatsApp
          </button>
          <button onClick={handleSms}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
            <Phone size={14} /> SMS
          </button>
        </div>
      </div>
    </div>
  );
}
