import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Droplets, BarChart3, CreditCard, LogOut, X, AlertCircle, Globe, KeyRound, Settings, Menu, FileText } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { authApi } from "../../lib/api";
import toast from "react-hot-toast";
import type { Language } from "../../lib/i18n";

function ChangeMyPasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirm) { toast.error("Passwords match nahi!"); return; }
    if (newPw.length < 6) { toast.error("Min 6 characters"); return; }
    setLoading(true);
    try { await authApi.changePassword(current, newPw); toast.success("Password change ho gaya! ✅"); onClose(); }
    catch (err: any) { toast.error(err.response?.data?.error ?? "Error"); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Password Change</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {[["Current Password", current, setCurrent], ["Naya Password", newPw, setNewPw], ["Confirm Password", confirm, setConfirm]].map(([label, val, setter]: any) => (
            <div key={label}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type="password" className="input-field" value={val} onChange={e => setter(e.target.value)} required /></div>
          ))}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? "..." : "Change"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Layout() {
  const { admin, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);

  const allNavItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { to: "/milk", icon: Droplets, label: t("milkEntry") },
    { to: "/farmers", icon: Users, label: t("farmers") },
    { to: "/dues", icon: AlertCircle, label: t("dues") },
    { to: "/payments", icon: CreditCard, label: t("payments") },
    { to: "/reports", icon: BarChart3, label: t("reports") },
    { to: "/farmer-report", icon: FileText, label: "Kisaan Report" },
    { to: "/rate-settings", icon: Settings, label: "Rate Settings" },
  ];

  // Bottom nav — 5 most used
  const bottomNavItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { to: "/milk", icon: Droplets, label: "Doodh" },
    { to: "/farmers", icon: Users, label: "Kisaan" },
    { to: "/dues", icon: AlertCircle, label: "Baaki" },
    { to: "/payments", icon: CreditCard, label: "Pay" },
  ];

  const handleLogout = () => { logout(); navigate("/login"); };
  const langLabels: Record<Language, string> = { hindi: "हिन्दी", english: "English", hinglish: "Hinglish" };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-orange-100 bg-gradient-to-br from-orange-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-brand-600 rounded-full flex items-center justify-center text-2xl shadow">🐄</div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Smart Dairy</p>
            <p className="text-xs text-brand-600 font-medium">{admin?.dairyName ?? "Digital Dairy"}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {allNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-brand-600 text-white shadow-sm" : "text-gray-600 hover:bg-orange-50 hover:text-brand-700"}`}>
            <Icon size={17} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-orange-100 space-y-1">
        <div className="relative">
          <button onClick={() => setShowLangMenu(v => !v)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl">
            <Globe size={15} /><span>{langLabels[lang]}</span><span className="ml-auto">▾</span>
          </button>
          {showLangMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border rounded-xl shadow-lg overflow-hidden z-20">
              {(["hinglish", "hindi", "english"] as Language[]).map(l => (
                <button key={l} onClick={async () => { setLang(l); setShowLangMenu(false); try { await authApi.updateLanguage(l); } catch {} }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 ${lang === l ? "text-brand-600 font-semibold bg-brand-50" : "text-gray-700"}`}>
                  {langLabels[l]}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm">{admin?.name?.[0]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{admin?.name}</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
        <button onClick={() => setShowPwModal(true)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl">
          <KeyRound size={15} /> Password Change
        </button>
        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl font-medium">
          <LogOut size={16} />{t("logout")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-orange-100 flex-col flex-shrink-0 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Top Header */}
        <header className="md:hidden bg-white border-b border-orange-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-lg shadow-sm">🐄</div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Smart Dairy</p>
              <p className="text-xs text-brand-600 leading-tight">{admin?.dairyName ?? "Digital Dairy"}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-all">
            <Menu size={22} className="text-gray-600" />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <div className="flex h-16 max-w-screen-sm mx-auto">
            {bottomNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${isActive ? "text-brand-600" : "text-gray-400"}`}>
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-brand-50 scale-110" : ""}`}>
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                    </div>
                    <span className={`text-xs font-medium ${isActive ? "text-brand-600" : "text-gray-400"}`}>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
      {showPwModal && <ChangeMyPasswordModal onClose={() => setShowPwModal(false)} />}
    </div>
  );
}