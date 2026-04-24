import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Droplets, BarChart3, CreditCard, LogOut, X, AlertCircle, Globe, KeyRound, Settings, FileText, Menu } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { authApi } from "../../lib/api";
import toast from "react-hot-toast";
import type { Language } from "../../lib/i18n";
import OfflineIndicator from "./OfflineIndicator";

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
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-semibold text-sm">Password Change</span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {[["Current Password", current, setCurrent], ["Naya Password", newPw, setNewPw], ["Confirm Password", confirm, setConfirm]].map(([label, val, setter]: any) => (
            <div key={label}><label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input type="password" className="input-field" value={val} onChange={e => setter(e.target.value)} required /></div>
          ))}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 text-sm">{loading ? "..." : "Change"}</button>
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

  const bottomNavItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { to: "/milk", icon: Droplets, label: "Doodh" },
    { to: "/farmers", icon: Users, label: "Kisaan" },
    { to: "/dues", icon: AlertCircle, label: "Baaki" },
    { to: "/payments", icon: CreditCard, label: "Pay" },
  ];

  const handleLogout = () => { logout(); navigate("/login"); };
  const langLabels: Record<Language, string> = { hindi: "हिन्दी", english: "English", hinglish: "Hinglish" };

  const SidebarInner = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-xl flex-shrink-0">🐄</div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-gray-900 truncate">Smart Dairy</p>
          <p className="text-xs text-brand-600 font-medium truncate">{admin?.dairyName ?? "Digital Dairy"}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
        {allNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-orange-50 hover:text-brand-700"
              }`}>
            <Icon size={15} strokeWidth={1.8} />{label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-100 space-y-0.5">
        <div className="relative">
          <button onClick={() => setShowLangMenu(v => !v)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            <Globe size={14} /><span>{langLabels[lang]}</span><span className="ml-auto text-[10px]">▾</span>
          </button>
          {showLangMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-20">
              {(["hinglish", "hindi", "english"] as Language[]).map(l => (
                <button key={l} onClick={async () => { setLang(l); setShowLangMenu(false); try { await authApi.updateLanguage(l); } catch { } }}
                  className={`w-full text-left px-3 py-2 text-sm ${lang === l ? "bg-orange-50 text-brand-600 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                  {langLabels[l]}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
          <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{admin?.name?.[0]}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900 truncate">{admin?.name}</p>
            <p className="text-[10px] text-gray-500">Admin</p>
          </div>
        </div>
        <button onClick={() => setShowPwModal(true)} className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
          <KeyRound size={14} />Password Change
        </button>
        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 font-medium">
          <LogOut size={14} />{t("logout")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Desktop Sidebar (always visible on md+) ── */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 flex-col flex-shrink-0 h-screen">
        <SidebarInner />
      </aside>

      {/* ── Mobile Overlay Sidebar ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-white shadow-2xl">
            <SidebarInner />
          </aside>
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">

        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          {/* Left — branding */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-base flex-shrink-0">🐄</div>
            <div>
              <p className="font-bold text-sm text-gray-900 leading-tight">Smart Dairy</p>
              <p className="text-[11px] text-brand-600 font-medium leading-tight">{admin?.dairyName ?? "Digital Dairy"}</p>
            </div>
          </div>
          {/* Right — online indicator + hamburger */}
          <div className="flex items-center gap-2">
            <OfflineIndicator />
            <button onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
              <Menu size={16} className="text-gray-600" />
            </button>
          </div>
        </header>

        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-sm font-semibold text-gray-900">{admin?.dairyName ?? "Smart Dairy"}</p>
          </div>
          <OfflineIndicator />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
          <div className="flex h-16">
            {bottomNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? "text-brand-600" : "text-gray-400"
                  }`}>
                {({ isActive }) => (
                  <>
                    <div className={`w-10 h-7 rounded-lg flex items-center justify-center transition-all ${isActive ? "bg-orange-50" : ""}`}>
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                    </div>
                    <span className="text-[10px] font-medium">{label}</span>
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