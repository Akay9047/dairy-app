import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1=form, 2=success
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        ownerName: "",
        mobile: "",
        dairyName: "",
        village: "",
        adminUsername: "",
        password: "",
        confirmPassword: "",
    });

    const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) { toast.error("Passwords match nahi!"); return; }
        if (form.password.length < 6) { toast.error("Password kam se kam 6 characters ka hona chahiye"); return; }
        if (!/^[6-9]\d{9}$/.test(form.mobile)) { toast.error("Valid 10 digit mobile number daalen"); return; }

        setLoading(true);
        try {
            await api.post("/auth/register", {
                ownerName: form.ownerName,
                mobile: form.mobile,
                dairyName: form.dairyName,
                village: form.village,
                adminUsername: form.adminUsername,
                password: form.password,
            });
            setStep(2);
        } catch (err: any) {
            toast.error(err.response?.data?.error ?? "Registration nahi hua. Dobara try karein.");
        } finally {
            setLoading(false);
        }
    };

    if (step === 2) return (
        <div style={{ minHeight: "100dvh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 380, padding: "32px 28px", textAlign: "center", border: "0.5px solid #e5e7eb" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Registration Ho Gayi!</h2>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 20 }}>
                    Aapki dairy <b style={{ color: "#ea580c" }}>{form.dairyName}</b> ka account review mein hai.
                    Payment complete hone ke baad <b>24 ghante</b> mein activate ho jayega.
                </p>
                <div style={{ background: "#f0fdf4", border: "0.5px solid #bbf7d0", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#15803d", marginBottom: 6 }}>Payment ke liye contact karein:</p>
                    <a href="https://wa.me/919887863751?text=Maine Smart Dairy Solution pe register kar liya hai. Payment karna chahta hoon."
                        target="_blank" rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#16a34a", color: "white", padding: "10px 16px", borderRadius: 9, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp pe Payment Karein
                    </a>
                </div>
                <Link to="/login" style={{ fontSize: 13, color: "#ea580c", fontWeight: 500, textDecoration: "none" }}>
                    ← Login page pe jaao
                </Link>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: "100dvh", background: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 420, border: "0.5px solid #e5e7eb", overflow: "hidden" }}>

                {/* Header */}
                <div style={{ padding: "24px 28px 20px", textAlign: "center", borderBottom: "0.5px solid #f3f4f6" }}>
                    <div style={{ width: 52, height: 52, background: "#ea580c", borderRadius: "50%", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🐄</div>
                    <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>Naya Account Banayein</h1>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Smart Dairy Solution — Free Registration</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: "20px 28px 24px" }}>

                    <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Dairy Details</p>

                    {[
                        { label: "Dairy Ka Naam *", key: "dairyName", placeholder: "e.g. Sharma Dairy", type: "text" },
                        { label: "Owner Ka Naam *", key: "ownerName", placeholder: "Aapka poora naam", type: "text" },
                        { label: "Mobile Number *", key: "mobile", placeholder: "10 digit mobile", type: "tel" },
                        { label: "Village / Shahar *", key: "village", placeholder: "Gaon ya shahar ka naam", type: "text" },
                    ].map(({ label, key, placeholder, type }) => (
                        <div key={key} style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 4 }}>{label}</label>
                            <input type={type} placeholder={placeholder} required
                                value={(form as any)[key]} onChange={e => f(key, e.target.value)}
                                style={{ width: "100%", padding: "9px 12px", border: "0.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, color: "#111827", outline: "none", boxSizing: "border-box", background: "white" }}
                                onFocus={e => e.target.style.borderColor = "#ea580c"}
                                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                            />
                        </div>
                    ))}

                    <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, margin: "16px 0 12px" }}>Login Details</p>

                    {[
                        { label: "Username *", key: "adminUsername", placeholder: "Login ke liye username", type: "text" },
                        { label: "Password *", key: "password", placeholder: "Min 6 characters", type: "password" },
                        { label: "Confirm Password *", key: "confirmPassword", placeholder: "Password dobara likhein", type: "password" },
                    ].map(({ label, key, placeholder, type }) => (
                        <div key={key} style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 4 }}>{label}</label>
                            <input type={type} placeholder={placeholder} required
                                value={(form as any)[key]} onChange={e => f(key, e.target.value)}
                                style={{ width: "100%", padding: "9px 12px", border: "0.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, color: "#111827", outline: "none", boxSizing: "border-box", background: "white" }}
                                onFocus={e => e.target.style.borderColor = "#ea580c"}
                                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                            />
                        </div>
                    ))}

                    <div style={{ background: "#fff7ed", border: "0.5px solid #fed7aa", borderRadius: 9, padding: "10px 12px", marginBottom: 16 }}>
                        <p style={{ fontSize: 11, color: "#9a3412", margin: 0, lineHeight: 1.5 }}>
                            ⚠️ Registration free hai. Account payment ke baad activate hoga. Super admin se WhatsApp pe contact karein.
                        </p>
                    </div>

                    <button type="submit" disabled={loading}
                        style={{ width: "100%", padding: "12px", background: loading ? "#f97316" : "#ea580c", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                        {loading ? "Registering..." : "Register Karein →"}
                    </button>

                    <p style={{ textAlign: "center", fontSize: 12, color: "#6b7280", marginTop: 14 }}>
                        Pehle se account hai?{" "}
                        <Link to="/login" style={{ color: "#ea580c", fontWeight: 600, textDecoration: "none" }}>Login Karein</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}