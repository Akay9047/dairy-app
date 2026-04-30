import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const WHATSAPP = "919887863751";
  const WA_MSG = encodeURIComponent("Hello! I want to get access to Smart Dairy Solution. Please help me activate my account.");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { toast.error("Username aur password daalen"); return; }
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate("/dashboard");
      toast.success("Welcome! 🐄");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Username ya password galat hai");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 380, overflow: "hidden", border: "0.5px solid #e5e7eb" }}>

        {/* Logo */}
        <div style={{ padding: "28px 28px 20px", textAlign: "center", borderBottom: "0.5px solid #f3f4f6" }}>
          <div style={{ width: 60, height: 60, background: "#ea580c", borderRadius: "50%", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🐄</div>
          <h1 style={{ fontSize: 19, fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>Smart Dairy Solution</h1>
          <p style={{ fontSize: 11, color: "#ea580c", fontWeight: 600, margin: "0 0 1px" }}>Aapki Apni Digital Dairy</p>
          <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>Rajasthan Dairy Management</p>
        </div>

        {/* Form */}
        <div style={{ padding: "20px 28px 24px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 4 }}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Apna username daalen" autoComplete="username"
                style={{ width: "100%", padding: "10px 12px", border: "0.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "#ea580c"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 4 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password"
                  style={{ width: "100%", padding: "10px 36px 10px 12px", border: "0.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#ea580c"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "11px", background: loading ? "#f97316" : "#ea580c", color: "white", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
            <div style={{ flex: 1, height: "0.5px", background: "#f3f4f6" }} />
            <span style={{ fontSize: 11, color: "#d1d5db" }}>ya</span>
            <div style={{ flex: 1, height: "0.5px", background: "#f3f4f6" }} />
          </div>

          {/* Register + WhatsApp */}
          <div style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: "0 0 3px" }}>Naya account chahiye?</p>
            <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 10px", lineHeight: 1.5 }}>
              Free mein register karein — payment ke baad 24 ghante mein activate ho jayega.
            </p>
            <Link to="/register"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#ea580c", color: "white", padding: "9px 14px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              📝 Free Register Karein
            </Link>
            <a href={`https://wa.me/${WHATSAPP}?text=${WA_MSG}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#16a34a", color: "white", padding: "9px 14px", borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 500 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp: +91 98878 63751
            </a>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center" }}>
        <Link to="/super/login" style={{ fontSize: 11, color: "#9ca3af", textDecoration: "none" }}>Admin Panel</Link>
        <span style={{ color: "#e5e7eb" }}>·</span>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>Smart Dairy © 2025</span>
      </div>
    </div>
  );
}