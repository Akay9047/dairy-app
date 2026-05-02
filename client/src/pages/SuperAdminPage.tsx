import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { superAdminApi, authApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { X, Eye, Settings, Key, Power, Trash2, Plus, LogOut, TrendingUp, Users, Droplets, IndianRupee, RefreshCw, KeyRound, ChevronDown, ChevronUp } from "lucide-react";

// ── Rate Update Modal (New System) ─────────────────────────────
function RateModal({ dairy, onClose }: { dairy: any; onClose: () => void }) {
  const qc = useQueryClient();
  const existing = dairy.rateConfig ?? {};
  const [form, setForm] = useState({
    pricingMode: existing.pricingMode ?? "fat_only",
    fatRate: existing.fatRate ?? 0.33,
    snfRate: existing.snfRate ?? 0.07,
    buffaloFixedRate: existing.buffaloFixedRate ?? 60,
    cowFixedRate: existing.cowFixedRate ?? 40,
    minRatePerLiter: existing.minRatePerLiter ?? 25,
    useMinRate: existing.useMinRate ?? false,
    autoCalcSnf: existing.autoCalcSnf ?? true,
  });

  const mutation = useMutation({
    mutationFn: (d: any) => superAdminApi.updateRates(dairy.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sa-dairies"] }); toast.success("Rate update ho gaya! ✅"); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.error ?? "Update nahi hua"),
  });

  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  // Live preview
  const previewFat = 6.0;
  const previewL = 10;
  const getRate = (milkType: string) => {
    if (form.pricingMode === "fixed") return milkType === "BUFFALO" ? form.buffaloFixedRate : form.cowFixedRate;
    const fatAmt = previewFat * form.fatRate;
    const snfAmt = form.pricingMode === "fat_snf" ? (0.21 * previewFat + 8.5) * form.snfRate : 0;
    let rate = fatAmt + snfAmt;
    if (form.useMinRate && rate < form.minRatePerLiter) rate = form.minRatePerLiter;
    return rate;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-bold text-gray-900">Rate Settings</h2>
            <p className="text-xs text-gray-500">{dairy.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Mode */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Pricing Mode</p>
            <div className="grid grid-cols-3 gap-2">
              {[["fat_only", "📊", "Fat Only"], ["fat_snf", "🧪", "Fat+SNF"], ["fixed", "💰", "Fixed"]].map(([val, icon, label]) => (
                <button key={val} onClick={() => f("pricingMode", val)}
                  className={`p-2.5 rounded-xl border-2 text-center transition-all ${form.pricingMode === val ? "border-brand-500 bg-brand-50" : "border-gray-200"}`}>
                  <div className="text-lg">{icon}</div>
                  <div className={`text-xs font-semibold mt-1 ${form.pricingMode === val ? "text-brand-700" : "text-gray-600"}`}>{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Fat rate */}
          {(form.pricingMode === "fat_only" || form.pricingMode === "fat_snf") && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fat Rate — ₹ per 1% per Liter</label>
                <input type="number" className="input-field" value={form.fatRate}
                  onChange={e => f("fatRate", parseFloat(e.target.value))} step="0.01" min="0.01" />
                <p className="text-xs text-brand-600 mt-1 font-mono">
                  Fat 5.5% → ₹{(5.5 * form.fatRate).toFixed(2)}/L &nbsp;|&nbsp; Fat 6.5% → ₹{(6.5 * form.fatRate).toFixed(2)}/L
                </p>
              </div>
              {form.pricingMode === "fat_snf" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SNF Rate — ₹ per 1% per Liter</label>
                  <input type="number" className="input-field" value={form.snfRate}
                    onChange={e => f("snfRate", parseFloat(e.target.value))} step="0.01" />
                </div>
              )}
            </div>
          )}

          {/* Fixed rate */}
          {form.pricingMode === "fixed" && (
            <div className="grid grid-cols-2 gap-3">
              {[["🐃 Buffalo ₹/L", "buffaloFixedRate"], ["🐄 Cow ₹/L", "cowFixedRate"]].map(([label, key]) => (
                <div key={key as string}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type="number" className="input-field" value={(form as any)[key as string]}
                    onChange={e => f(key as string, parseFloat(e.target.value))} step="1" />
                </div>
              ))}
            </div>
          )}

          {/* Min rate */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-700">Minimum Rate Guarantee</p>
              <p className="text-xs text-gray-400">Calculated rate se kam nahi milega</p>
            </div>
            <button onClick={() => f("useMinRate", !form.useMinRate)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.useMinRate ? "bg-brand-500" : "bg-gray-300"}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.useMinRate ? "left-6" : "left-1"}`} />
            </button>
          </div>
          {form.useMinRate && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min ₹/Liter</label>
              <input type="number" className="input-field" value={form.minRatePerLiter}
                onChange={e => f("minRatePerLiter", parseFloat(e.target.value))} step="1" />
            </div>
          )}

          {/* Live preview */}
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <p className="text-xs font-semibold text-gray-600 mb-2">Preview — Fat 6%, 10L</p>
            <div className="grid grid-cols-2 gap-2">
              {[["🐃 Buffalo", "BUFFALO"], ["🐄 Cow", "COW"]].map(([label, mt]) => (
                <div key={mt} className="bg-white rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-lg font-bold text-brand-600">₹{getRate(mt).toFixed(2)}/L</p>
                  <p className="text-xs text-gray-500">= ₹{(getRate(mt) * 10).toFixed(0)} total</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Ruko</button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? "Saving..." : "Rate Update Karein"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add/Edit Dairy Modal ────────────────────────────────────────
function DairyModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", ownerName: "", mobile: "", address: "", adminUsername: "", adminPassword: "" });
  const mutation = useMutation({
    mutationFn: (d: any) => superAdminApi.createDairy(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sa-dairies"] }); qc.invalidateQueries({ queryKey: ["sa-stats"] }); toast.success("Naya dairy add ho gaya! 🎉"); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.error ?? "Error"),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-gray-900">Naya Dairy Add Karein</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase">Dairy Details</p>
          {[["Dairy Name *", "name", "text"], ["Owner Name *", "ownerName", "text"], ["Mobile *", "mobile", "tel"], ["Address", "address", "text"]].map(([label, key, type]) => (
            <div key={key as string}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input type={type as string} className="input-field" value={(form as any)[key as string]}
                onChange={e => setForm(p => ({ ...p, [key as string]: e.target.value }))} />
            </div>
          ))}
          <p className="text-xs font-semibold text-gray-400 uppercase pt-2">Admin Login Details</p>
          {[["Username *", "adminUsername", "text"], ["Password *", "adminPassword", "password"]].map(([label, key, type]) => (
            <div key={key as string}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input type={type as string} className="input-field" value={(form as any)[key as string]}
                onChange={e => setForm(p => ({ ...p, [key as string]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-4 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Ruko</button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? "Creating..." : "Dairy Banao"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Change Password Modal ───────────────────────────────────────
function PasswordModal({ dairy, admin, onClose }: { dairy: any; admin: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [pw, setPw] = useState("");
  const mutation = useMutation({
    mutationFn: () => superAdminApi.changeAdminPassword(dairy.id, admin.id, pw),
    onSuccess: () => { toast.success("Password change ho gaya! ✅"); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.error ?? "Error"),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-bold text-gray-900">Password Change</h2>
            <p className="text-xs text-gray-500">{admin.username} — {dairy.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Naya Password</label>
            <input type="password" className="input-field" value={pw} onChange={e => setPw(e.target.value)}
              placeholder="Min 6 characters" minLength={6} />
          </div>
        </div>
        <div className="flex gap-2 p-4 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Ruko</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || pw.length < 6} className="btn-primary flex-1">
            {mutation.isPending ? "..." : "Change Karein"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SA Password Modal ───────────────────────────────────────────
function SAPasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState(""), [newPw, setNewPw] = useState(""), [confirm, setConfirm] = useState(""), [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirm) { toast.error("Passwords match nahi!"); return; }
    setLoading(true);
    try { await authApi.superChangePassword(current, newPw); toast.success("Password change ho gaya! ✅"); onClose(); }
    catch (err: any) { toast.error(err.response?.data?.error ?? "Error"); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-gray-900">Super Admin Password</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {[["Current Password", current, setCurrent], ["Naya Password", newPw, setNewPw], ["Confirm", confirm, setConfirm]].map(([label, val, setter]: any) => (
            <div key={label}><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input type="password" className="input-field" value={val} onChange={e => setter(e.target.value)} required /></div>
          ))}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Ruko</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? "..." : "Change"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Dairy Card ──────────────────────────────────────────────────
function DairyCard({ dairy, onRate, onPassword, onToggle, onDelete, onView }: any) {
  const [expanded, setExpanded] = useState(false);
  const admin = dairy.admins?.[0];
  const rc = dairy.rateConfig;
  const isActive = dairy.isActive;

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all ${isActive ? "border-gray-100" : "border-red-100 opacity-80"}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-base">{dairy.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {isActive ? "Active" : "Band"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{dairy.ownerName} · {dairy.mobile}</p>
          </div>
          <button onClick={() => setExpanded(v => !v)} className="p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="text-center bg-gray-50 rounded-lg py-2">
            <p className="text-lg font-bold text-gray-900">{dairy._count?.farmers ?? 0}</p>
            <p className="text-xs text-gray-400">Kisaan</p>
          </div>
          <div className="text-center bg-orange-50 rounded-lg py-2">
            <p className="text-lg font-bold text-brand-600">{dairy._count?.milkEntries ?? 0}</p>
            <p className="text-xs text-gray-400">Entries</p>
          </div>
          <div className="text-center bg-green-50 rounded-lg py-2">
            <p className="text-lg font-bold text-green-600">{dairy._count?.payments ?? 0}</p>
            <p className="text-xs text-gray-400">Payments</p>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-50 pt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Admin</span>
            <span className="font-mono font-medium text-gray-800">{admin?.username}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Rate Mode</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${rc?.pricingMode === "fat_only" ? "bg-blue-50 text-blue-700" :
                rc?.pricingMode === "fat_snf" ? "bg-purple-50 text-purple-700" :
                  "bg-green-50 text-green-700"
              }`}>
              {rc?.pricingMode === "fat_only" ? "📊 Fat Only" : rc?.pricingMode === "fat_snf" ? "🧪 Fat+SNF" : "💰 Fixed"}
            </span>
          </div>
          {rc?.pricingMode !== "fixed" && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Fat Rate</span>
              <span className="font-medium text-gray-800">₹{rc?.fatRate ?? "?"}/1%/L</span>
            </div>
          )}
          {rc?.pricingMode === "fixed" && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Fixed Rate</span>
              <span className="font-medium text-gray-800">🐃₹{rc?.buffaloFixedRate} · 🐄₹{rc?.cowFixedRate}</span>
            </div>
          )}
          {rc?.useMinRate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Min Rate</span>
              <span className="font-medium text-gray-800">₹{rc?.minRatePerLiter}/L</span>
            </div>
          )}
          <p className="text-xs text-gray-400">Added: {new Date(dairy.createdAt).toLocaleDateString("en-IN")}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 pb-4 flex gap-2 flex-wrap">
        <button onClick={() => onView(dairy)} title="View Report"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100">
          <Eye size={13} /> Report
        </button>
        <button onClick={() => onRate(dairy)} title="Rate Settings"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-brand-700 rounded-lg text-xs font-medium hover:bg-orange-100">
          <Settings size={13} /> Rate
        </button>
        {admin && (
          <button onClick={() => onPassword(dairy, admin)} title="Change Password"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100">
            <Key size={13} /> Password
          </button>
        )}
        <button onClick={() => onToggle(dairy)} title="Toggle Access"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${isActive ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
          <Power size={13} /> {isActive ? "Band Karo" : "Chalu Karo"}
        </button>
        <button onClick={() => onDelete(dairy)} title="Delete"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100">
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
}


// ── View Dairy Report Modal ─────────────────────────────────────
function ViewModal({ dairy, onClose }: { dairy: any; onClose: () => void }) {
  const { data: report, isLoading } = useQuery({
    queryKey: ["sa-dairy-report", dairy.id],
    queryFn: () => superAdminApi.getDairyReport(dairy.id, { period: "month" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-bold text-gray-900">{dairy.name}</h2>
            <p className="text-xs text-gray-500">{dairy.ownerName} · {dairy.mobile}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading report...</div>
          ) : report ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Kul Kisaan", value: String(report.farmers), color: "bg-blue-50 text-blue-700" },
                  { label: "Kul Entries", value: String(report.milk?.entries ?? 0), color: "bg-orange-50 text-orange-700" },
                  { label: "Kul Doodh", value: `${(report.milk?.liters ?? 0).toFixed(1)}L`, color: "bg-teal-50 text-teal-700" },
                  { label: "Kul Kamai", value: `₹${Math.round(report.balance?.earned ?? 0).toLocaleString("en-IN")}`, color: "bg-green-50 text-green-700" },
                  { label: "Paid", value: `₹${Math.round(report.balance?.paid ?? 0).toLocaleString("en-IN")}`, color: "bg-purple-50 text-purple-700" },
                  { label: "Baaki", value: `₹${Math.round(report.balance?.pending ?? 0).toLocaleString("en-IN")}`, color: report.balance?.pending > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700" },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`${color.split(" ")[0]} rounded-xl p-3`}>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-lg font-bold ${color.split(" ")[1]}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Rate Config */}
              {dairy.rateConfig && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Rate Settings</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Mode</span>
                      <span className="font-medium">{dairy.rateConfig.pricingMode === "fat_only" ? "📊 Fat Only" : dairy.rateConfig.pricingMode === "fat_snf" ? "🧪 Fat+SNF" : "💰 Fixed"}</span>
                    </div>
                    {dairy.rateConfig.pricingMode !== "fixed" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Fat Rate</span>
                        <span className="font-medium">₹{dairy.rateConfig.fatRate}/1%/L</span>
                      </div>
                    )}
                    {dairy.rateConfig.pricingMode === "fixed" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Fixed</span>
                        <span className="font-medium">🐃₹{dairy.rateConfig.buffaloFixedRate} · 🐄₹{dairy.rateConfig.cowFixedRate}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Entries */}
              {report.recentEntries?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Entries (Is Mahine)</p>
                  <div className="space-y-2">
                    {report.recentEntries.slice(0, 5).map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{e.farmer?.name} ({e.farmer?.code})</p>
                          <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString("en-IN")} · {e.liters}L · Fat {e.fatPercent}%</p>
                        </div>
                        <p className="text-sm font-bold text-brand-600">₹{Math.round(e.totalAmount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin info */}
              {dairy.admins?.[0] && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Admin Details</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Username</span>
                    <span className="font-mono font-medium">{dairy.admins[0].username}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium">{dairy.admins[0].name}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">Report load nahi hua</div>
          )}
        </div>

        <div className="p-4 border-t">
          <button onClick={onClose} className="btn-secondary w-full">Band Karein</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Super Admin Page ───────────────────────────────────────
export default function SuperAdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showAddDairy, setShowAddDairy] = useState(false);
  const [showSAPw, setShowSAPw] = useState(false);
  const [rateModal, setRateModal] = useState<any>(null);
  const [pwModal, setPwModal] = useState<{ dairy: any; admin: any } | null>(null);
  const [viewModal, setViewModal] = useState<any>(null);

  const { data: stats } = useQuery({ queryKey: ["sa-stats"], queryFn: superAdminApi.stats });
  const { data: dairies = [], isLoading } = useQuery({ queryKey: ["sa-dairies"], queryFn: superAdminApi.dairies });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => superAdminApi.toggleDairy(id),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["sa-dairies"] }); toast.success(data.message); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => superAdminApi.deleteDairy(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sa-dairies"] }); qc.invalidateQueries({ queryKey: ["sa-stats"] }); toast.success("Dairy band kar di gayi"); },
  });

  const handleLogout = () => { logout(); navigate("/super/login"); };

  const statCards = [
    { label: "Kul Dairies", value: stats?.totalDairies ?? 0, sub: `${stats?.activeDairies ?? 0} active`, icon: "🏠", color: "bg-blue-50 text-blue-700" },
    { label: "Kul Kisaan", value: stats?.totalFarmers ?? 0, icon: "👨‍🌾", color: "bg-green-50 text-green-700" },
    { label: "Aaj ka Doodh", value: `${(stats?.todayMilk ?? 0).toFixed(1)}L`, sub: `${stats?.todayEntries ?? 0} entries`, icon: "🥛", color: "bg-orange-50 text-orange-700" },
    { label: "Is Mahine", value: `₹${Math.round(stats?.monthAmount ?? 0).toLocaleString("en-IN")}`, sub: `${(stats?.monthMilk ?? 0).toFixed(1)}L`, icon: "💰", color: "bg-purple-50 text-purple-700" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-xl">🏆</div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Super Admin Panel</p>
              <p className="text-xs text-brand-600">Smart Dairy Solution</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => qc.invalidateQueries()} className="p-2 hover:bg-gray-100 rounded-xl" title="Refresh">
              <RefreshCw size={15} className="text-gray-500" />
            </button>
            <button onClick={() => setShowSAPw(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-medium text-gray-700">
              <KeyRound size={13} /> Password
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-medium text-red-600">
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map(({ label, value, sub, icon, color }) => (
            <div key={label} className={`${color.split(" ")[0]} rounded-2xl p-4 border border-gray-100`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">{label}</span>
                <span className="text-xl">{icon}</span>
              </div>
              <p className={`text-2xl font-bold ${color.split(" ")[1]}`}>{value}</p>
              {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Dairies */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Registered Dairies ({dairies.length})
            </h2>
            <button onClick={() => setShowAddDairy(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors">
              <Plus size={16} /> Naya Dairy
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : dairies.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">🏠</p>
              <p>Koi dairy nahi hai. Pehla dairy banao!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dairies.map((dairy: any) => (
                <DairyCard key={dairy.id} dairy={dairy}
                  onRate={(d: any) => setRateModal(d)}
                  onPassword={(d: any, a: any) => setPwModal({ dairy: d, admin: a })}
                  onToggle={(d: any) => {
                    if (confirm(`${d.name} ko ${d.isActive ? "band" : "chalu"} karna chahte ho?`)) toggleMutation.mutate(d.id);
                  }}
                  onDelete={(d: any) => {
                    if (confirm(`${d.name} delete karna chahte ho? Data safe rahega.`)) deleteMutation.mutate(d.id);
                  }}
                  onView={(d: any) => setViewModal(d)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddDairy && <DairyModal onClose={() => setShowAddDairy(false)} />}
      {showSAPw && <SAPasswordModal onClose={() => setShowSAPw(false)} />}
      {rateModal && <RateModal dairy={rateModal} onClose={() => setRateModal(null)} />}
      {pwModal && <PasswordModal dairy={pwModal.dairy} admin={pwModal.admin} onClose={() => setPwModal(null)} />}
      {viewModal && <ViewModal dairy={viewModal} onClose={() => setViewModal(null)} />}
    </div>
  );
}