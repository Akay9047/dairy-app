import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function InactivePage() {
    const { admin, logout } = useAuth();
    const navigate = useNavigate();

    const WA_MSG = encodeURIComponent(`Hello! Maine Smart Dairy Solution pe register kiya hai. Mera dairy naam ${admin?.dairyName ?? ""} hai. Account activate karna chahta hoon.`);

    return (
        <div style={{ minHeight: "100dvh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 380, padding: "32px 28px", textAlign: "center", border: "0.5px solid #e5e7eb" }}>

                <div style={{ fontSize: 52, marginBottom: 14 }}>⏳</div>

                <h2 style={{ fontSize: 19, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
                    Account Inactive Hai
                </h2>

                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 6 }}>
                    <b style={{ color: "#ea580c" }}>{admin?.dairyName ?? "Aapki Dairy"}</b> ka account abhi activate nahi hua hai.
                </p>

                <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20, lineHeight: 1.5 }}>
                    Payment complete karein — 24 ghante mein account activate ho jayega aur aap sab features use kar sakenge.
                </p>

                {/* Steps */}
                <div style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", marginBottom: 20, textAlign: "left" }}>
                    {[
                        { step: "1", text: "Neeche WhatsApp button dabaao", done: true },
                        { step: "2", text: "Payment karein (UPI / Cash)", done: false },
                        { step: "3", text: "Admin 24hr mein activate karega", done: false },
                        { step: "4", text: "Login karein — full access!", done: false },
                    ].map(({ step, text, done }) => (
                        <div key={step} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "#ea580c" : "#f3f4f6", color: done ? "white" : "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                {step}
                            </div>
                            <span style={{ fontSize: 12, color: done ? "#111827" : "#6b7280" }}>{text}</span>
                        </div>
                    ))}
                </div>

                {/* WhatsApp */}
                <a href={`https://wa.me/919887863751?text=${WA_MSG}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#16a34a", color: "white", padding: "12px 16px", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    Contact to Activate Your Account
                </a>

                <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 16 }}>
                    +91 98878 63751 · Smart Dairy Support
                </p>

                <button onClick={() => { logout(); navigate("/login"); }}
                    style={{ background: "none", border: "0.5px solid #e5e7eb", borderRadius: 8, padding: "8px 20px", fontSize: 12, color: "#6b7280", cursor: "pointer" }}>
                    Logout
                </button>
            </div>
        </div>
    );
}