import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Droplets, BarChart3, CreditCard, LogOut, X, AlertCircle, Globe, KeyRound, Settings, FileText } from "lucide-react";
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
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.5)" }}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 20, width: "100%", maxWidth: 360, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Password Change</span>
          <button onClick={onClose} style={{ padding: 4, borderRadius: 8, border: "none", background: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {[["Current Password", current, setCurrent], ["Naya Password", newPw, setNewPw], ["Confirm Password", confirm, setConfirm]].map(([label, val, setter]: any) => (
            <div key={label as string}>
              <label style={{ display: "block", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</label>
              <input type="password" className="input-field" value={val} onChange={e => setter(e.target.value)} required />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>{loading ? "..." : "Change"}</button>
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

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, background: "#ea580c", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🐄</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: 13, margin: 0, color: "var(--color-text-primary)" }}>Smart Dairy</p>
            <p style={{ fontSize: 11, color: "#ea580c", margin: 0, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin?.dairyName ?? "Digital Dairy"}</p>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "8px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {allNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
              borderRadius: 10, fontSize: 13, fontWeight: 500, textDecoration: "none", transition: "all 0.15s",
              background: isActive ? "#ea580c" : "transparent",
              color: isActive ? "white" : "var(--color-text-secondary)",
            })}>
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: "8px", borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowLangMenu(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "var(--color-text-secondary)" }}>
            <Globe size={15} /><span>{langLabels[lang]}</span><span style={{ marginLeft: "auto", fontSize: 10 }}>▾</span>
          </button>
          {showLangMenu && (
            <div style={{ position: "absolute", bottom: "100%", left: 0, right: 0, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, overflow: "hidden", zIndex: 20 }}>
              {(["hinglish", "hindi", "english"] as Language[]).map(l => (
                <button key={l} onClick={async () => { setLang(l); setShowLangMenu(false); try { await authApi.updateLanguage(l); } catch { } }}
                  style={{ width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: lang === l ? "#fff7ed" : "transparent", color: lang === l ? "#ea580c" : "var(--color-text-primary)", cursor: "pointer", fontSize: 13, fontWeight: lang === l ? 600 : 400 }}>
                  {langLabels[l]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--color-background-secondary)", borderRadius: 10 }}>
          <div style={{ width: 30, height: 30, background: "#ea580c", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{admin?.name?.[0]}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin?.name}</p>
            <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0 }}>Admin</p>
          </div>
        </div>

        <button onClick={() => setShowPwModal(true)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "var(--color-text-secondary)" }}>
          <KeyRound size={15} /> Password Change
        </button>
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
          <LogOut size={15} />{t("logout")}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100dvh", background: "var(--color-background-tertiary)" }}>
      {/* Desktop Sidebar */}
      <aside style={{ display: "none", width: 220, background: "var(--color-background-primary)", borderRight: "0.5px solid var(--color-border-tertiary)", flexDirection: "column", flexShrink: 0 }}
        className="md-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setSidebarOpen(false)} />
          <aside style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 240, background: "var(--color-background-primary)", boxShadow: "4px 0 24px rgba(0,0,0,0.15)" }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Mobile Header — Style A */}
        <header style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 }}>
          {/* Left — Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "#ea580c", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🐄</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.2, color: "var(--color-text-primary)" }}>Smart Dairy</p>
              <p style={{ fontSize: 11, color: "#ea580c", margin: 0, fontWeight: 500 }}>{admin?.dairyName ?? "Digital Dairy"}</p>
            </div>
          </div>

          {/* Right — actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <OfflineIndicator />
            <button onClick={() => setSidebarOpen(true)}
              style={{ width: 36, height: 36, background: "var(--color-background-secondary)", borderRadius: 10, border: "0.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <rect y="0" width="16" height="2" rx="1" fill="currentColor" />
                <rect y="5" width="12" height="2" rx="1" fill="currentColor" />
                <rect y="10" width="14" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>
          <Outlet />
        </main>

        {/* Bottom Navigation — Style A */}
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--color-background-primary)", borderTop: "0.5px solid var(--color-border-tertiary)", zIndex: 40, paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div style={{ display: "flex", height: 60 }}>
            {bottomNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, textDecoration: "none" }}>
                {({ isActive }) => (
                  <>
                    <div style={{ width: 40, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? "#fff7ed" : "transparent", transition: "all 0.15s" }}>
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? "#ea580c" : "var(--color-text-tertiary)"} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, color: isActive ? "#ea580c" : "var(--color-text-tertiary)" }}>{label}</span>
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