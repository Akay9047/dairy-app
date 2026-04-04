import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const WHATSAPP_NUMBER = "919887863751";
  const WHATSAPP_MSG = encodeURIComponent(
    "Hello! I want to manage my dairy digitally with Smart Dairy Solution. Please help me get started with an account."
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
      toast.success("Welcome! Dairy mein aapka swagat hai 🐄");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Username ya password galat hai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px" }}>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ width: "80px", height: "80px", background: "#ea580c", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: "36px" }}>
          🐄
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1c1917", margin: "0 0 4px" }}>
          Smart Dairy Solution
        </h1>
        <p style={{ fontSize: "13px", color: "#ea580c", fontWeight: "600", margin: "0 0 2px", letterSpacing: "0.5px" }}>
          YOUR OWN DIGITAL DAIRY
        </p>
        <p style={{ fontSize: "12px", color: "#78716c", margin: 0 }}>
          Rajasthan Dairy Management System
        </p>
      </div>

      {/* Card */}
      <div style={{ background: "white", borderRadius: "20px", padding: "28px 24px", width: "100%", maxWidth: "360px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1c1917", marginBottom: "20px", textAlign: "center" }}>
          Sign In to Your Account
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#44403c", marginBottom: "6px" }}>Username</label>
            <input type="text" className="input-field" placeholder="Enter your username"
              value={username} onChange={e => setUsername(e.target.value)} required style={{ fontSize: "15px" }} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#44403c", marginBottom: "6px" }}>Password</label>
            <input type="password" className="input-field" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required style={{ fontSize: "15px" }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "13px", background: loading ? "#d97706" : "#ea580c", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "20px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "#e7e5e4" }} />
          <span style={{ fontSize: "12px", color: "#a8a29e" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "#e7e5e4" }} />
        </div>

        {/* New Account CTA */}
        <div style={{ background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: "16px", padding: "18px 16px", textAlign: "center" }}>
          
          <div style={{ fontSize: "22px", marginBottom: "8px" }}>🚀</div>
          
          <p style={{ fontSize: "14px", fontWeight: "700", color: "#9a3412", margin: "0 0 6px" }}>
            Ready to Go Digital?
          </p>

          <p style={{ fontSize: "12px", color: "#57534e", margin: "0 0 4px", lineHeight: "1.6" }}>
            Join <strong>100+ dairy owners</strong> across Rajasthan who have already digitized their dairy operations.
          </p>

          <p style={{ fontSize: "12px", color: "#78716c", margin: "0 0 14px", lineHeight: "1.6" }}>
            Get your account in <strong>less than 24 hours</strong> — just contact us, complete the payment, and start managing your dairy smarter.
          </p>

          {/* Features */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "14px", textAlign: "left" }}>
            {[
              "✅ Daily milk tracking",
              "✅ Auto receipts & PDF",
              "✅ Fat-based rate calc",
              "✅ WhatsApp reports",
              "✅ Farmer management",
              "✅ Payment tracking",
            ].map(f => (
              <span key={f} style={{ fontSize: "11px", color: "#44403c", background: "white", borderRadius: "8px", padding: "5px 8px" }}>{f}</span>
            ))}
          </div>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#16a34a", color: "white", padding: "12px 16px", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Get Started — WhatsApp Us Now
          </a>

          <p style={{ fontSize: "11px", color: "#a8a29e", margin: 0, lineHeight: "1.5" }}>
            Account activated within 24 hours of payment confirmation
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "16px", textAlign: "center" }}>
        <Link to="/super/login" style={{ fontSize: "11px", color: "#a8a29e", textDecoration: "none" }}>
          Admin Panel
        </Link>
        <span style={{ fontSize: "11px", color: "#d6d3d1", margin: "0 8px" }}>·</span>
        <span style={{ fontSize: "11px", color: "#a8a29e" }}>Smart Dairy Solution © 2025</span>
      </div>
    </div>
  );
}