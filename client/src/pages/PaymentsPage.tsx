import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi, farmersApi } from "../lib/api";
import toast from "react-hot-toast";
import { Plus, Trash2, X, IndianRupee } from "lucide-react";
import { format } from "date-fns";

interface Farmer {
  id: string;
  name: string;
  code: string;
  village: string;
}

interface Payment {
  id: string;
  amount: number;
  note?: string;
  paidAt: string;
  farmer: { name: string; code: string };
}

function PaymentModal({ farmers, onClose }: { farmers: Farmer[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    farmerId: "",
    amount: "",
    note: "",
    paidAt: format(new Date(), "yyyy-MM-dd"),
  });

  const mutation = useMutation({
    mutationFn: (data: { farmerId: string; amount: number; note?: string; paidAt: string }) =>
      paymentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Bhugtan save ho gaya!");
      onClose();
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error ?? "Save nahi hua");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      farmerId: form.farmerId,
      amount: parseFloat(form.amount),
      note: form.note || undefined,
      paidAt: new Date(form.paidAt).toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">Naya Bhugtan</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kisaan *</label>
            <select
              className="input-field"
              value={form.farmerId}
              onChange={(e) => setForm({ ...form, farmerId: e.target.value })}
              required
            >
              <option value="">-- Kisaan chunein --</option>
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              min="1"
              step="0.01"
              className="input-field"
              placeholder="500.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <input
              type="text"
              className="input-field"
              placeholder="November ka bhugtan"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              className="input-field"
              value={form.paidAt}
              onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Ruko</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? "Saving..." : "Save Karein"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [filterFarmer, setFilterFarmer] = useState("");

  const { data: farmers = [] } = useQuery({
    queryKey: ["farmers"],
    queryFn: () => farmersApi.list(),
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", filterFarmer],
    queryFn: () => paymentsApi.list({ farmerId: filterFarmer || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: paymentsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Bhugtan delete ho gaya");
    },
  });

  const totalAmount = payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bhugtan (Payments)</h1>
          <p className="text-sm text-gray-500">{payments.length} records</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Naya Bhugtan</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="flex gap-2">
        <select
          className="input-field"
          value={filterFarmer}
          onChange={(e) => setFilterFarmer(e.target.value)}
        >
          <option value="">Sab Kisaan</option>
          {farmers.map((f: Farmer) => (
            <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
          ))}
        </select>
      </div>

      {payments.length > 0 && (
        <div className="card bg-green-50 border-green-100">
          <div className="flex items-center gap-2">
            <IndianRupee size={18} className="text-green-600" />
            <span className="text-sm text-gray-600">Kul Bhugtan:</span>
            <span className="font-bold text-green-700 text-lg">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : payments.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-4xl mb-2">💰</div>
          <p className="text-gray-500">Koi bhugtan nahi mila</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((p: Payment) => (
            <div key={p.id} className="card flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{p.farmer.name}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {p.farmer.code}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {format(new Date(p.paidAt), "dd MMM yyyy")}
                  {p.note && ` · ${p.note}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-600 text-base">₹{p.amount.toFixed(2)}</span>
                <button
                  onClick={() => {
                    if (confirm("Delete karein?")) deleteMutation.mutate(p.id);
                  }}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <PaymentModal farmers={farmers} onClose={() => setModal(false)} />}
    </div>
  );
}
