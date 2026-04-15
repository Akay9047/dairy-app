import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Droplets, BarChart3, CreditCard, LogOut, X, AlertCircle, Globe, KeyRound, Settings, Menu } from "lucide-react";
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
    if (newPw.length < 6) { toast.error("Min 6 characters chahiye"); return; }
    setLoading(true);
    try { await authApi.changePassword(current, newPw); toast.success("Password change ho gaya! ✅"); onClose(); }
    catch (err: any) { toast.error(err.response?.data?.error ?? "Password change nahi hua"); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Password Change</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {[["Current Password", current, setCurrent], ["Naya Password", newPw, setNewPw], ["Confirm Password", confirm, setConfirm]].map(([label, val, setter]: any) => (
            <div key={label as string}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type="password" className="input-field" value={val} onChange={e => setter(e.target.value)} required minLength={label === "Current Password" ? 1 : 6} />
            </div>
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

export default function Layout() {
  const { admin, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);

  const allNavItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { to: "/farmers", icon: Users, label: t("farmers") },
    { to: "/milk", icon: Droplets, label: t("milkEntry") },
    { to: "/dues", icon: AlertCircle, label: t("dues") },
    { to: "/reports", icon: BarChart3, label: t("reports") },
    { to: "/payments", icon: CreditCard, label: t("payments") },
    { to: "/rate-settings", icon: Settings, label: "Rate Settings" },
  ];

  const bottomNavItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { to: "/milk", icon: Droplets, label: "Doodh" },
    { to: "/farmers", icon: Users, label: "Kisaan" },
    { to: "/dues", icon: AlertCircle, label: "Baaki" },
    { to: "/payments", icon: CreditCard, label: "Bhugtan" },
  ];

  const handleLogout = () => { logout(); navigate("/login"); };
  const handleLangChange = async (l: Language) => { setLang(l); setShowLangMenu(false); try { await authApi.updateLanguage(l); } catch { } };
  const langLabels: Record<Language, string> = { hindi: "हिन्दी", english: "English", hinglish: "Hinglish" };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-orange-100">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🐄</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">{t("appName")}</p>
            <p className="text-xs text-brand-600">{admin?.dairyName ?? t("appTagline")}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {allNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-brand-600 text-white" : "text-gray-700 hover:bg-orange-50 hover:text-brand-700"}`}>
            <Icon size={18} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-orange-100 space-y-1">
        <div className="relative">
          <button onClick={() => setShowLangMenu(v => !v)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
            <Globe size={15} /><span>{langLabels[lang]}</span><span className="ml-auto text-xs">▾</span>
          </button>
          {showLangMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
              {(["hinglish", "hindi", "english"] as Language[]).map(l => (
                <button key={l} onClick={() => handleLangChange(l)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${lang === l ? "text-brand-600 font-medium bg-brand-50" : "text-gray-700"}`}>
                  {langLabels[l]}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm">{admin?.name?.[0]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{admin?.name}</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
        <button onClick={() => setShowPwModal(true)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
          <KeyRound size={15} /> Password Change
        </button>
        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
          <LogOut size={16} />{t("logout")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="hidden md:flex w-56 bg-white border-r border-orange-100 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-white shadow-xl"><SidebarContent /></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden bg-white border-b border-orange-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐄</span>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Smart Dairy</p>
              <p className="text-xs text-brand-600 leading-tight">{admin?.dairyName ?? "Digital Dairy"}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu size={22} />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-inset-bottom">
          <div className="flex h-16">
            {bottomNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `flex-1 flex flex-col items-center justify-center text-xs font-medium transition-colors ${isActive ? "text-brand-600" : "text-gray-400"}`}>
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-xl mb-0.5 ${isActive ? "bg-brand-50" : ""}`}>
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                    </div>
                    <span>{label}</span>
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