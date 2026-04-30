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
  const WA_MSG = encodeURIComponent("Hello! I want to get access to Smart Dairy Solution. Please help me create an account.");

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
    <div style={{
      minHeight: "100dvh",
      background: "#f9fafb",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
    }}>

      {/* Card */}
      <div style={{
        background: "white",
        borderRadius: 20,
        width: "100%",
        maxWidth: 380,
        overflow: "hidden",
        border: "0.5px solid #e5e7eb",
      }}>

        {/* Logo Section */}
        <div style={{ padding: "32px 28px 24px", textAlign: "center", borderBottom: "0.5px solid #f3f4f6" }}>
          <div style={{
            width: 64, height: 64,
            background: "#ea580c",
            borderRadius: "50%",
            margin: "0 auto 14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30,
          }}>🐄</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 3px" }}>
            Smart Dairy Solution
          </h1>
          <p style={{ fontSize: 12, color: "#ea580c", fontWeight: 600, margin: "0 0 2px", letterSpacing: 0.3 }}>
            Aapki Apni Digital Dairy
          </p>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
            Rajasthan Dairy Management
          </p>
        </div>

        {/* Login Form */}
        <div style={{ padding: "24px 28px" }}>
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Apna username daalen"
                autoComplete="username"
                style={{
                  width: "100%", padding: "10px 14px",
                  border: "0.5px solid #e5e7eb", borderRadius: 10,
                  fontSize: 14, color: "#111827",
                  outline: "none", boxSizing: "border-box",
                  background: "white",
                }}
                onFocus={e => e.target.style.borderColor = "#ea580c"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: "100%", padding: "10px 40px 10px 14px",
                    border: "0.5px solid #e5e7eb", borderRadius: 10,
                    fontSize: 14, color: "#111827",
                    outline: "none", boxSizing: "border-box",
                    background: "white",
                  }}
                  onFocus={e => e.target.style.borderColor = "#ea580c"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: "12px",
                background: loading ? "#f97316" : "#ea580c",
                color: "white", border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
            <div style={{ flex: 1, height: "0.5px", background: "#f3f4f6" }} />
            <span style={{ fontSize: 11, color: "#d1d5db" }}>ya</span>
            <div style={{ flex: 1, height: "0.5px", background: "#f3f4f6" }} />
          </div>

          {/* WhatsApp CTA */}
          <div style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: "0 0 3px" }}>
              Naya account chahiye?
            </p>
            <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 10px", lineHeight: 1.5 }}>
              Account activate karne ke liye humse contact karein — payment ke baad 24 ghante mein access mil jayega.
            </p>
            <a href={`https://wa.me/${WHATSAPP}?text=${WA_MSG}`} target="_blank" rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                background: "#16a34a", color: "white",
                padding: "10px 14px", borderRadius: 9,
                textDecoration: "none", fontSize: 13, fontWeight: 600,
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Get Account — WhatsApp Now
            </a>
            <p style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", margin: "8px 0 0" }}>
              +91 98878 63751 · 24hr activation
            </p>
          </div>
        </div>
      </div>
      {/* Register Link */}
      <Link to="/register" style={{ display: "block", textAlign: "center", marginTop: 8, fontSize: 12, color: "#ea580c", fontWeight: 600, textDecoration: "none" }}>
        Khud Register Karein →
      </Link>

      {/* Footer */}
      <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <Link to="/super/login" style={{ fontSize: 11, color: "#9ca3af", textDecoration: "none" }}>
          Admin Panel
        </Link>
        <span style={{ color: "#e5e7eb", fontSize: 11 }}>·</span>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>Smart Dairy © 2025</span>
      </div>
    </div>
  );
}