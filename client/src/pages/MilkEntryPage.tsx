import { useState, useMemo } from "react";
import { calcRates, DEFAULT_CONFIG } from "../lib/rateCalc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { milkApi, farmersApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Receipt, X, Sun, Moon } from "lucide-react";
import { format } from "date-fns";
import ReceiptModal from "../components/receipt/Receipt";

interface Farmer { id: string; name: string; code: string; village: string; mobile: string; }
interface MilkEntry {
  id: string; date: string; shift: "MORNING" | "EVENING";
  milkType?: "BUFFALO" | "COW" | "MIXED";
  liters: number; fatPercent: number; snfPercent?: number;
  fatRate: number; snfRate?: number; ratePerLiter: number; totalAmount: number;
  farmer: Farmer;
}

function calcPreview(liters: number, fat: number, milkType: string = "MIXED", config: any) {
  const cfg = {
    rateType: (config?.rateType ?? "fat") as "fat" | "fixed",
    fatRatePerKg: config?.fatRatePerKg ?? DEFAULT_CONFIG.fatRatePerKg,
    snfRatePerKg: config?.snfRatePerKg ?? DEFAULT_CONFIG.snfRatePerKg,
    minRatePerLiter: config?.minRatePerLiter ?? DEFAULT_CONFIG.minRatePerLiter,
    useMinRate: config?.useMinRate ?? true,
    buffaloFatRate: config?.buffaloFatRate ?? DEFAULT_CONFIG.buffaloFatRate,
    cowFatRate: config?.cowFatRate ?? DEFAULT_CONFIG.cowFatRate,
    buffaloSnfRate: config?.buffaloSnfRate ?? DEFAULT_CONFIG.buffaloSnfRate,
    cowSnfRate: config?.cowSnfRate ?? DEFAULT_CONFIG.cowSnfRate,
    buffaloFixedRate: config?.buffaloFixedRate ?? DEFAULT_CONFIG.buffaloFixedRate,
    cowFixedRate: config?.cowFixedRate ?? DEFAULT_CONFIG.cowFixedRate,
  };
  return calcRates(liters, fat, milkType, cfg);
}

function MilkModal({ entry, farmers, onClose }: { entry?: MilkEntry; farmers: Farmer[]; onClose: () => void }) {
  const qc = useQueryClient();
  const { admin } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    farmerId: entry?.farmer.id ?? "",
    date: entry ? format(new Date(entry.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    time: entry ? format(new Date(entry.date), "HH:mm") : format(new Date(), "HH:mm"),
    shift: (entry?.shift ?? "MORNING") as "MORNING" | "EVENING",
    milkType: (entry?.milkType ?? "MIXED") as "BUFFALO" | "COW" | "MIXED",
    liters: entry?.liters.toString() ?? "",
    fatPercent: entry?.fatPercent.toString() ?? "",
  });

  const preview = useMemo(() => {
    const l = parseFloat(form.liters), f = parseFloat(form.fatPercent);
    if (isNaN(l) || isNaN(f) || l <= 0 || f < 0) return null;
    return calcPreview(l, f, form.milkType, admin?.rateConfig);
  }, [form.liters, form.fatPercent, form.milkType, admin?.rateConfig]);

  const mutation = useMutation({
    mutationFn: (d: any) => entry ? milkApi.update(entry.id, d) : milkApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["milk"] }); qc.invalidateQueries({ queryKey: ["dashboard-stats"] }); toast.success(entry ? "Entry update ho gayi!" : "Doodh entry save ho gayi! 🥛"); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.error ?? "Save nahi hua"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ farmerId: form.farmerId, date: new Date(`${form.date}T${form.time}`).toISOString(), shift: form.shift, liters: parseFloat(form.liters), fatPercent: parseFloat(form.fatPercent) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">{entry ? "Entry Edit Karein" : "Naya " + t("milkEntry")}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("farmers")} *</label>
            <select className="input-field" value={form.farmerId} onChange={e => setForm({ ...form, farmerId: e.target.value })} required>
              <option value="">-- Kisaan chunein --</option>
              {farmers.map(f => <option key={f.id} value={f.id}>{f.name} ({f.code}) - {f.village}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("date")} *</label>
              <input type="date" className="input-field" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
              <input type="time" className="input-field" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("shift")} *</label>
            <div className="flex gap-2">
              {(["MORNING", "EVENING"] as const).map(s => (
                <button type="button" key={s} onClick={() => setForm({ ...form, shift: s })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors ${form.shift === s ? (s === "MORNING" ? "bg-yellow-50 border-yellow-400 text-yellow-700" : "bg-indigo-50 border-indigo-400 text-indigo-700")
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  {s === "MORNING" ? <><Sun size={14} /> {t("morning")}</> : <><Moon size={14} /> {t("evening")}</>}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("liters")} *</label>
              <input type="number" step="0.1" min="0.1" className="input-field" placeholder="10.5"
                value={form.liters} onChange={e => setForm({ ...form, liters: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("fat")} *</label>
              <input type="number" step="0.1" min="0" max="15" className="input-field" placeholder="4.5"
                value={form.fatPercent} onChange={e => setForm({ ...form, fatPercent: e.target.value })} required />
            </div>
          </div>
          {/* Rate Config info */}
          {admin?.rateConfig && (
            <div className="text-xs text-gray-400 flex gap-3 bg-gray-50 rounded-lg px-3 py-2">
              <span>Min: ₹{admin.rateConfig.minRatePerLiter}/L</span>
              <span>Fat: ₹{admin.rateConfig.fatRatePerKg}/kg</span>
              <span>SNF: ₹{admin.rateConfig.snfRatePerKg}/kg</span>
            </div>
          )}
          {preview && (
            <div className="bg-brand-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-brand-700 mb-2">Auto Calculation:</p>
              <div className="grid grid-cols-2 gap-2 text-center text-xs mb-2">
                <div><p className="text-gray-500">SNF (auto)</p><p className="font-semibold">{preview.snfPercent}%</p></div>
                <div><p className="text-gray-500">Fat Amt</p><p className="font-semibold">₹{preview.fatAmount}</p></div>
                <div><p className="text-gray-500">SNF Amt</p><p className="font-semibold">₹{preview.snfAmount}</p></div>
                <div><p className="text-gray-500">Rate/Liter</p><p className="font-semibold">₹{preview.ratePerLiter}</p></div>
              </div>
              <div className="text-center border-t pt-2">
                <p className="text-xs text-gray-500">Kul Rakam</p>
                <p className="font-bold text-brand-600 text-xl">₹{preview.totalAmount}</p>
              </div>
            </div>
          )}
          {/* Buffalo / Cow toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Milk Type *</label>
            <div className="flex gap-2">
              {([["BUFFALO", "🐃 Buffalo"], ["COW", "🐄 Cow"], ["MIXED", "🐃🐄 Mixed"]] as const).map(([val, label]) => (
                <button type="button" key={val} onClick={() => setForm({ ...form, milkType: val })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${form.milkType === val ? "bg-brand-600 border-brand-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t("cancel")}</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? "Saving..." : entry ? "Update" : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MilkEntryPage() {
  const qc = useQueryClient();
  const { t } = useLanguage();
  const [modal, setModal] = useState<{ open: boolean; entry?: MilkEntry }>({ open: false });
  const [receipt, setReceipt] = useState<MilkEntry | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterShift, setFilterShift] = useState("");
  const [page, setPage] = useState(1);

  const { data: farmersData = [] } = useQuery({ queryKey: ["farmers"], queryFn: () => farmersApi.list() });
  const { data, isLoading } = useQuery({
    queryKey: ["milk", filterDate, filterShift, page],
    queryFn: () => milkApi.list({
      from: filterDate ? `${filterDate}T00:00:00` : undefined,
      to: filterDate ? `${filterDate}T23:59:59` : undefined,
      shift: filterShift || undefined, page, limit: 20,
    }),
  });

  const entries: MilkEntry[] = data?.entries ?? [];
  const total: number = data?.total ?? 0;

  const deleteMutation = useMutation({
    mutationFn: milkApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["milk"] }); qc.invalidateQueries({ queryKey: ["dashboard-stats"] }); toast.success("Entry delete ho gayi"); },
    onError: () => toast.error("Delete nahi hua"),
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("milkEntry")}</h1>
          <p className="text-sm text-gray-500">{total} total entries</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn-primary flex items-center gap-2">
          <Plus size={16} /><span className="hidden sm:inline">Nai Entry</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input type="date" className="input-field w-auto" value={filterDate}
          onChange={e => { setFilterDate(e.target.value); setPage(1); }} />
        <select className="input-field w-auto" value={filterShift}
          onChange={e => { setFilterShift(e.target.value); setPage(1); }}>
          <option value="">Dono Shift</option>
          <option value="MORNING">{t("morning")}</option>
          <option value="EVENING">{t("evening")}</option>
        </select>
        {(filterDate || filterShift) && (
          <button onClick={() => { setFilterDate(""); setFilterShift(""); setPage(1); }} className="btn-secondary text-sm">Clear</button>
        )}
      </div>

      {isLoading ? <div className="text-center py-8 text-gray-500">Loading...</div>
        : entries.length === 0 ? (
          <div className="card text-center py-10"><div className="text-4xl mb-2">🥛</div><p className="text-gray-500">{t("noData")}</p></div>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div key={entry.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{entry.farmer.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{entry.farmer.code}</span>
                      <span className={entry.shift === "MORNING" ? "badge-morning" : "badge-evening"}>
                        {entry.shift === "MORNING" ? `☀️ ${t("morning")}` : `🌙 ${t("evening")}`}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {entry.milkType === "BUFFALO" ? "🐃" : entry.milkType === "COW" ? "🐄" : "🐃🐄"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{format(new Date(entry.date), "dd MMM yyyy, hh:mm a")} · {entry.farmer.village}</p>
                    <div className="flex gap-3 mt-1.5 text-sm flex-wrap">
                      <span className="text-gray-700">🥛 <b>{entry.liters.toFixed(2)}L</b></span>
                      <span className="text-gray-700">Fat <b>{entry.fatPercent.toFixed(1)}%</b></span>
                      {entry.snfPercent && <span className="text-gray-700">SNF <b>{entry.snfPercent.toFixed(2)}%</b></span>}
                      <span className="text-gray-700">₹<b>{entry.ratePerLiter.toFixed(2)}</b>/L</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-bold text-brand-600 text-base">₹{entry.totalAmount.toFixed(2)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setReceipt(entry)} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600" title="Receipt"><Receipt size={14} /></button>
                      <button onClick={() => setModal({ open: true, entry })} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" title="Edit"><Pencil size={14} /></button>
                      <button onClick={() => { if (confirm("Delete karein?")) deleteMutation.mutate(entry.id); }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {total > 20 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm px-3">← Pehle</button>
          <span className="text-sm text-gray-500">Page {page} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="btn-secondary text-sm px-3">Aage →</button>
        </div>
      )}

      {modal.open && <MilkModal entry={modal.entry} farmers={farmersData} onClose={() => setModal({ open: false })} />}
      {receipt && <ReceiptModal entry={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}