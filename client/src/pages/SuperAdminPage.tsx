import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { superAdminApi, authApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, X, Power, Settings, LogOut, Users, Droplets, KeyRound, Trash2, Eye, BarChart3, ChevronLeft, IndianRupee } from "lucide-react";
import { format } from "date-fns";

interface RateConfig {
  fatRatePerKg: number; snfRatePerKg: number;
  minRatePerLiter: number; useMinRate: boolean; milkType: string;
}
interface Dairy {
  id: string; name: string; ownerName: string; mobile: string;
  address?: string; isActive: boolean; createdAt: string;
  admins: { id: string; username: string; name: string }[];
  rateConfig: RateConfig | null;
  _count: { farmers: number; milkEntries: number; payments: number };
}

// ── Modals ──────────────────────────────────────────────────────

function CreateDairyModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", ownerName: "", mobile: "", address: "",
    adminUsername: "", adminPassword: "",
    fatRatePerKg: 800, snfRatePerKg: 533, minRatePerLiter: 40, milkType: "mixed",
  });
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const mutation = useMutation({
    mutationFn: () => superAdminApi.createDairy(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sa-dairies"] }); toast.success("Dairy create ho gayi! 🎉"); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.error ?? "Error"),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Naya Dairy Banao</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase">Dairy Info</p>
          {[["name","Dairy Name *","Ramesh Dairy"],["ownerName","Owner Name *","Ramesh Kumar"],["mobile","Mobile *","9876543210"],["address","Address","Sikar, Rajasthan"]].map(([k,l,p]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
              <input className="input-field" placeholder={p} value={(form as any)[k]} onChange={e => f(k, e.target.value)} />
            </div>
          ))}
          <p className="text-xs font-semibold text-gray-500 uppercase pt-1">Admin Login</p>
          {[["adminUsername","Username *","ramesh_dairy"],["adminPassword","Password *","dairy@1234"]].map(([k,l,p]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
              <input className="input-field" placeholder={p} value={(form as any)[k]} onChange={e => f(k, e.target.value)} />
            </div>
          ))}
          <p className="text-xs font-semibold text-gray-500 uppercase pt-1">Rate Config (Rajasthan)</p>
          <div className="grid grid-cols-3 gap-2">
            {[["fatRatePerKg","Fat ₹/kg"],["snfRatePerKg","SNF ₹/kg"],["minRatePerLiter","Min ₹/L"]].map(([k,l]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{l}</label>
                <input type="number" step="1" className="input-field text-sm" value={(form as any)[k]} onChange={e => f(k, parseFloat(e.target.value))} />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Milk Type</label>
            <select className="input-field" value={form.milkType} onChange={e => f("milkType", e.target.value)}>
              <option value="mixed">Mixed (Buffalo + Cow)</option>
              <option value="buffalo">Sirf Buffalo</option>
              <option value="cow">Sirf Cow</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">Ruko</button>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? "Creating..." : "Create Karein"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RatesModal({ dairy, onClose }: { dairy: Dairy; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    fatRatePerKg: dairy.rateConfig?.fatRatePerKg ?? 800,
    snfRatePerKg: dairy.rateConfig?.snfRatePerKg ?? 533,
    minRatePerLiter: dairy.rateConfig?.minRatePerLiter ?? 40,
    useMinRate: dairy.rateConfig?.useMinRate ?? true,
    milkType: dairy.rateConfig?.milkType ?? "mixed",
  });
  const mutation = useMutation({
    mutationFn: () => superAdminApi.updateRates(dairy.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sa-dairies"] }); toast.success("Rates update ho gaye!"); onClose(); },
    onError: () => toast.error("Update nahi hua"),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Rate Update — {dairy.name}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          {[["fatRatePerKg","Fat Rate ₹/kg"],["snfRatePerKg","SNF Rate ₹/kg"],["minRatePerLiter","Minimum Rate ₹/Liter"]].map(([k,l]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
              <input type="number" step="1" className="input-field" value={(form as any)[k]}
                onChange={e => setForm(p => ({ ...p, [k]: parseFloat(e.target.value) }))} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Milk Type</label>
            <select className="input-field" value={form.milkType} onChange={e => setForm(p => ({ ...p, milkType: e.target.value }))}>
              <option value="mixed">Mixed</option>
              <option value="buffalo">Buffalo</option>
              <option value="cow">Cow</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.useMinRate} onChange={e => setForm(p => ({ ...p, useMinRate: e.target.checked }))} />
            Minimum rate guarantee use karein
          </label>
          <div className="bg-orange-50 rounded-lg p-2 text-xs text-gray-600">
            <p>Formula: Rate/L = (Fat/100×L×₹{form.fatRatePerKg} + SNF/100×L×₹{form.snfRatePerKg}) / L</p>
            <p>Min guarantee: ₹{form.minRatePerLiter}/L</p>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">Ruko</button>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? "Saving..." : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordModal({ dairy, admin, onClose }: { dairy: Dairy; admin: { id: string; username: string; name: string }; onClose: () => void }) {
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirm) { toast.error("Passwords match nahi!"); return; }
    if (newPw.length < 6) { toast.error("6 characters minimum"); return; }
    setLoading(true);
    try {
      await superAdminApi.changeAdminPassword(dairy.id, admin.id, newPw);
      toast.success(`${admin.username} ka password change ho gaya! ✅`);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Error");
    } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Password Change</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="bg-orange-50 rounded-lg p-3 text-sm">
            <p className="font-medium">{admin.name} <span className="text-xs text-gray-500">(@{admin.username})</span></p>
            <p className="text-xs text-gray-500">{dairy.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Naya Password *</label>
            <input type="password" className="input-field" placeholder="Min 6 characters" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm *</label>
            <input type="password" className="input-field" placeholder="Dobara likhein" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Ruko</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? "Saving..." : "Change"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Dairy Detail View ────────────────────────────────────────────

function DairyDetail({ dairyId, onBack }: { dairyId: string; onBack: () => void }) {
  const [period, setPeriod] = useState("month");
  const { data: dairy } = useQuery({ queryKey: ["sa-dairy", dairyId], queryFn: () => superAdminApi.getDairy(dairyId) });
  const { data: report } = useQuery({ queryKey: ["sa-dairy-report", dairyId, period], queryFn: () => superAdminApi.getDairyReport(dairyId, { period }) });

  if (!dairy) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{dairy.name}</h1>
          <p className="text-sm text-gray-500">{dairy.ownerName} · {dairy.mobile}</p>
        </div>
        <span className={`ml-auto text-xs px-2 py-1 rounded-full font-medium ${dairy.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {dairy.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {[["week","Is Hafta"],["month","Is Mahine"],["custom","Custom"]].map(([v,l]) => (
          <button key={v} onClick={() => setPeriod(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === v ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {l}
          </button>
        ))}
      </div>

      {report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Kul Kisaan", value: report.farmers, color: "bg-blue-50 text-blue-700" },
              { label: "Doodh", value: `${(report.milk.liters ?? 0).toFixed(1)}L`, color: "bg-teal-50 text-teal-700" },
              { label: "Kamai", value: `₹${(report.milk.amount ?? 0).toFixed(0)}`, color: "bg-orange-50 text-orange-700" },
              { label: "Baaki", value: `₹${(report.balance.pending ?? 0).toFixed(0)}`, color: "bg-red-50 text-red-700" },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl p-3 ${color.split(" ")[0]}`}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-xl font-bold ${color.split(" ")[1]}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Entries", value: report.milk.entries },
              { label: "Avg Fat", value: `${(report.milk.avgFat ?? 0).toFixed(1)}%` },
              { label: "Avg Rate", value: `₹${(report.milk.avgRate ?? 0).toFixed(1)}/L` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Recent entries */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Recent Entries</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {report.recentEntries?.slice(0, 10).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{e.farmer.name} <span className="text-xs text-gray-400">({e.farmer.code})</span></p>
                    <p className="text-xs text-gray-500">{format(new Date(e.date), "dd MMM, hh:mm a")} · {e.liters}L · Fat {e.fatPercent}%</p>
                  </div>
                  <p className="text-sm font-semibold text-brand-600">₹{e.totalAmount.toFixed(0)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Farmers list */}
      {dairy.farmers?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Registered Farmers ({dairy.farmers.length})</h3>
          <div className="grid grid-cols-2 gap-2">
            {dairy.farmers.map((f: any) => (
              <div key={f.id} className="text-sm p-2 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">{f.name}</p>
                <p className="text-xs text-gray-500">{f.code} · {f.village}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main SuperAdmin Page ─────────────────────────────────────────


function SAChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirm) { toast.error("Passwords match nahi!"); return; }
    if (newPw.length < 6) { toast.error("Min 6 characters chahiye"); return; }
    setLoading(true);
    try {
      await authApi.superChangePassword(current, newPw);
      toast.success("Password change ho gaya! ✅ Dobara login karein.");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Password change nahi hua");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">Apna Password Change Karein</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
            <input type="password" className="input-field" placeholder="Purana password"
              value={current} onChange={e => setCurrent(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Naya Password *</label>
            <input type="password" className="input-field" placeholder="Min 6 characters"
              value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
            <input type="password" className="input-field" placeholder="Dobara likhein"
              value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Ruko</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Saving..." : "Change Karein"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuperAdminPage() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [ratesModal, setRatesModal] = useState<Dairy | null>(null);
  const [pwModal, setPwModal] = useState<{ dairy: Dairy; admin: { id: string; username: string; name: string } } | null>(null);
  const [selectedDairyId, setSelectedDairyId] = useState<string | null>(null);
  const [showSAPwModal, setShowSAPwModal] = useState(false);

  const { data: stats } = useQuery({ queryKey: ["sa-stats"], queryFn: superAdminApi.stats, refetchInterval: 30000 });
  const { data: dairies = [], isLoading } = useQuery({ queryKey: ["sa-dairies"], queryFn: superAdminApi.dairies });

  const toggleMutation = useMutation({
    mutationFn: superAdminApi.toggleDairy,
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["sa-dairies"] }); toast.success(data.message); },
    onError: () => toast.error("Toggle nahi hua"),
  });

  const deleteMutation = useMutation({
    mutationFn: superAdminApi.deleteDairy,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sa-dairies"] }); toast.success("Dairy band kar di gayi"); },
    onError: () => toast.error("Delete nahi hua"),
  });

  const handleLogout = () => { logout(); navigate("/super/login"); };

  if (selectedDairyId) {
    return <DairyDetail dairyId={selectedDairyId} onBack={() => setSelectedDairyId(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">Super Admin Panel</p>
            <p className="text-xs text-gray-500">Welcome, {admin?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSAPwModal(true)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg">
            <KeyRound size={14} /> Password
          </button>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-5">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Kul Dairies", value: stats.totalDairies, sub: `${stats.activeDairies} active`, icon: "🏠" },
              { label: "Kul Kisaan", value: stats.totalFarmers, icon: "👨‍🌾" },
              { label: "Aaj Doodh", value: `${(stats.todayMilk ?? 0).toFixed(1)}L`, sub: `${stats.todayEntries} entries`, icon: "🥛" },
              { label: "Is Mahine", value: `₹${(stats.monthAmount ?? 0).toFixed(0)}`, sub: `${(stats.monthMilk ?? 0).toFixed(0)}L`, icon: "💰" },
            ].map(({ label, value, sub, icon }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                <div className="text-xl mb-1">{icon}</div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-bold text-gray-900 text-lg">{value}</p>
                {sub && <p className="text-xs text-gray-400">{sub}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Dairies */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-lg">Registered Dairies ({dairies.length})</h2>
          <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Naya Dairy
          </button>
        </div>

        {isLoading ? <div className="text-center py-10 text-gray-500">Loading...</div>
          : dairies.length === 0 ? (
            <div className="bg-white rounded-xl border p-10 text-center">
              <div className="text-4xl mb-2">🏠</div>
              <p className="text-gray-500 mb-3">Koi dairy nahi hai abhi</p>
              <button onClick={() => setCreateModal(true)} className="btn-primary">Pehli Dairy Banao</button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {dairies.map((d: Dairy) => (
                <div key={d.id} className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${!d.isActive ? "opacity-60 border-red-200 bg-red-50/30" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{d.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {d.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{d.ownerName} · {d.mobile}</p>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button onClick={() => setSelectedDairyId(d.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500" title="Details dekhein">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => setRatesModal(d)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" title="Rates">
                        <Settings size={14} />
                      </button>
                      {d.admins[0] && (
                        <button onClick={() => setPwModal({ dairy: d, admin: d.admins[0] })} className="p-1.5 hover:bg-yellow-50 rounded-lg text-yellow-600" title="Password change">
                          <KeyRound size={14} />
                        </button>
                      )}
                      <button onClick={() => { if (confirm(`${d.name} — access ${d.isActive ? "band" : "chalu"} karein?`)) toggleMutation.mutate(d.id); }}
                        className={`p-1.5 rounded-lg ${d.isActive ? "hover:bg-red-50 text-red-500" : "hover:bg-green-50 text-green-500"}`} title="Toggle">
                        <Power size={14} />
                      </button>
                      <button onClick={() => { if (confirm(`"${d.name}" permanently band karein? Data safe rahega.`)) deleteMutation.mutate(d.id); }}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-400" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-4 text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1"><Users size={11} /> {d._count.farmers} farmers</span>
                    <span className="flex items-center gap-1"><Droplets size={11} /> {d._count.milkEntries} entries</span>
                    <span className="flex items-center gap-1"><IndianRupee size={11} /> {d._count.payments} payments</span>
                  </div>

                  {/* Admin info */}
                  {d.admins[0] && (
                    <div className="bg-gray-50 rounded-lg px-2 py-1.5 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Admin: <span className="font-mono font-medium text-gray-700">{d.admins[0].username}</span></span>
                      {d.rateConfig && (
                        <span className="text-xs text-gray-400">Fat:₹{d.rateConfig.fatRatePerKg}/kg · Min:₹{d.rateConfig.minRatePerLiter}/L</span>
                      )}
                    </div>
                  )}

                  {/* Created date */}
                  <p className="text-xs text-gray-400 mt-1">Added: {format(new Date(d.createdAt), "dd MMM yyyy")}</p>
                </div>
              ))}
            </div>
          )}
      </div>

      {createModal && <CreateDairyModal onClose={() => setCreateModal(false)} />}
      {ratesModal && <RatesModal dairy={ratesModal} onClose={() => setRatesModal(null)} />}
      {pwModal && <ChangePasswordModal dairy={pwModal.dairy} admin={pwModal.admin} onClose={() => setPwModal(null)} />}
      {showSAPwModal && <SAChangePasswordModal onClose={() => setShowSAPwModal(false)} />}
    </div>
  );
}