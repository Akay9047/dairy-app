import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi, farmersApi } from "../lib/api";
import { useLanguage } from "../hooks/useLanguage";
import toast from "react-hot-toast";
import { IndianRupee, AlertCircle, CheckCircle, Plus, X } from "lucide-react";

interface DueRecord {
  farmerId: string;
  farmerName: string;
  farmerCode: string;
  village: string;
  mobile: string;
  totalEarned: number;
  totalPaid: number;
  pending: number;
}

function PayNowModal({ due, onClose }: { due: DueRecord; onClose: () => void }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState(due.pending.toFixed(2));
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: (data: { farmerId: string; amount: number; note?: string }) => paymentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dues"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Bhugtan save ho gaya! ✅");
      onClose();
    },
    onError: () => toast.error("Bhugtan save nahi hua"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">Bhugtan Karein</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-orange-50 rounded-xl p-3">
            <p className="font-semibold text-gray-900">{due.farmerName} <span className="text-xs text-gray-500">({due.farmerCode})</span></p>
            <p className="text-xs text-gray-500">{due.village} · {due.mobile}</p>
            <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
              <div><p className="text-gray-500">Kamaya</p><p className="font-semibold text-gray-800">₹{due.totalEarned.toFixed(0)}</p></div>
              <div><p className="text-gray-500">Diya</p><p className="font-semibold text-green-600">₹{due.totalPaid.toFixed(0)}</p></div>
              <div><p className="text-gray-500">Baaki</p><p className="font-bold text-red-600">₹{due.pending.toFixed(0)}</p></div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input type="number" className="input-field" value={amount}
              onChange={e => setAmount(e.target.value)} step="0.01" min="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <input type="text" className="input-field" placeholder="November ka bhugtan..."
              value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">Ruko</button>
            <button
              onClick={() => mutation.mutate({ farmerId: due.farmerId, amount: parseFloat(amount), note: note || undefined })}
              disabled={mutation.isPending || !amount || parseFloat(amount) <= 0}
              className="btn-primary flex-1">
              {mutation.isPending ? "Saving..." : "Pay Karein ✓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DuesPage() {
  const { t } = useLanguage();
  const [payModal, setPayModal] = useState<DueRecord | null>(null);
  const [showZero, setShowZero] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["dues"], queryFn: paymentsApi.dues });
  const { data: dailyData } = useQuery({
    queryKey: ["daily-summary"],
    queryFn: () => paymentsApi.dailySummary(),
  });

  const dues: DueRecord[] = data?.dues ?? [];
  const filtered = showZero ? dues : dues.filter(d => d.pending > 0.01);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t("dues")} — Baaki Hisaab</h1>
        <p className="text-sm text-gray-500">Har kisaan ka earned vs paid balance</p>
      </div>

      {/* Daily Summary */}
      {dailyData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Aaj Milk", value: `${(dailyData.milkCollected ?? 0).toFixed(1)}L`, color: "bg-teal-50 text-teal-700" },
            { label: "Aaj Kamai", value: `₹${(dailyData.milkAmount ?? 0).toFixed(0)}`, color: "bg-orange-50 text-orange-700" },
            { label: "Aaj Bhugtan", value: `₹${(dailyData.paymentsMade ?? 0).toFixed(0)}`, color: "bg-green-50 text-green-700" },
            { label: "Kul Baaki", value: `₹${(data?.totalPending ?? 0).toFixed(0)}`, color: "bg-red-50 text-red-700" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-3 ${color.split(" ")[0]}`}>
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-xl font-bold ${color.split(" ")[1]}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filtered.length} farmers mein baaki hai
        </p>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showZero} onChange={e => setShowZero(e.target.checked)}
            className="rounded" />
          Zero balance bhi dikhao
        </label>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10">
          <CheckCircle size={40} className="mx-auto text-green-400 mb-2" />
          <p className="font-semibold text-green-700">Sab cleared! Koi baaki nahi hai 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => (
            <div key={d.farmerId} className={`card ${d.pending > 0 ? "border-l-4 border-l-red-400" : "border-l-4 border-l-green-400"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{d.farmerName}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{d.farmerCode}</span>
                    <span className="text-xs text-gray-400">{d.village}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">📱 {d.mobile}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-gray-600">Kamaya: <b>₹{d.totalEarned.toFixed(0)}</b></span>
                    <span className="text-green-600">Diya: <b>₹{d.totalPaid.toFixed(0)}</b></span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Baaki</p>
                    <p className={`text-lg font-bold ${d.pending > 0 ? "text-red-600" : "text-green-600"}`}>
                      ₹{d.pending.toFixed(0)}
                    </p>
                  </div>
                  {d.pending > 0.01 && (
                    <button onClick={() => setPayModal(d)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors">
                      <Plus size={12} /> Pay
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {payModal && <PayNowModal due={payModal} onClose={() => setPayModal(null)} />}
    </div>
  );
}
