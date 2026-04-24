import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { format } from "date-fns";
import { Users, Droplets, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function DashboardPage() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({ queryKey: ["dashboard-stats"], queryFn: dashboardApi.stats });
  const { data: chart } = useQuery({ queryKey: ["dashboard-chart"], queryFn: dashboardApi.chart });

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 40 }}>🐄</div>
      <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>Loading...</p>
    </div>
  );

  const cards = [
    { label: "Kul Kisaan", value: stats?.totalFarmers ?? 0, unit: "", icon: Users, color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", to: "/farmers" },
    { label: "Aaj ka Doodh", value: `${(stats?.todayMilk ?? 0).toFixed(1)}`, unit: "L", icon: Droplets, color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", sub: `${stats?.todayCount ?? 0} entries`, to: "/milk" },
    { label: "Aaj ki Kamai", value: `₹${Math.round(stats?.todayAmount ?? 0).toLocaleString("en-IN")}`, unit: "", icon: TrendingUp, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", to: "/payments" },
    { label: "Is Mahine", value: `₹${Math.round(stats?.monthAmount ?? 0).toLocaleString("en-IN")}`, unit: "", icon: TrendingUp, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", sub: `${(stats?.monthMilk ?? 0).toFixed(1)}L`, to: "/reports" },
  ];

  return (
    <div style={{ padding: "14px 14px 0" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "2px 0 0" }}>
          Aaj ka overview — {format(new Date(), "dd MMM yyyy")}
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {cards.map(({ label, value, unit, icon: Icon, color, bg, border, sub, to }) => (
          <button key={label} onClick={() => navigate(to)}
            style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: 14, padding: "12px", textAlign: "left", cursor: "pointer", transition: "transform 0.15s", width: "100%" }}
            onTouchStart={e => (e.currentTarget.style.transform = "scale(0.97)")}
            onTouchEnd={e => (e.currentTarget.style.transform = "scale(1)")}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: color, fontWeight: 500 }}>{label}</span>
              <div style={{ width: 28, height: 28, background: "white", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={14} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.1 }}>
              {value}<span style={{ fontSize: 14, fontWeight: 500, color }}>{unit}</span>
            </div>
            {sub && <p style={{ fontSize: 11, color, margin: "4px 0 0", fontWeight: 500 }}>{sub}</p>}
            <div style={{ marginTop: 8, height: 3, background: "rgba(255,255,255,0.6)", borderRadius: 2 }}>
              <div style={{ height: 3, background: color, borderRadius: 2, width: "40%", opacity: 0.6 }} />
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ background: "var(--color-background-primary)", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", padding: "12px", marginBottom: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.5 }}>Quick Actions</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Naya Entry", emoji: "🥛", to: "/milk", color: "#ea580c" },
            { label: "Kisaan List", emoji: "👨‍🌾", to: "/farmers", color: "#3b82f6" },
            { label: "Baaki Dekho", emoji: "💰", to: "/dues", color: "#dc2626" },
            { label: "Report", emoji: "📊", to: "/farmer-report", color: "#7c3aed" },
          ].map(({ label, emoji, to, color }) => (
            <button key={to} onClick={() => navigate(to)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--color-background-secondary)", borderRadius: 10, border: "0.5px solid var(--color-border-tertiary)", cursor: "pointer", textDecoration: "none" }}>
              <span style={{ fontSize: 18 }}>{emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>{label}</span>
              <ArrowRight size={12} color="var(--color-text-tertiary)" style={{ marginLeft: "auto" }} />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Entries */}
      {stats?.recentEntries?.length > 0 && (
        <div style={{ background: "var(--color-background-primary)", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", padding: "12px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Recent Entries</p>
            <button onClick={() => navigate("/milk")} style={{ fontSize: 11, color: "#ea580c", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>Sab dekho →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.recentEntries.slice(0, 4).map((e: any) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "var(--color-background-secondary)", borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, background: "#fff7ed", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                    {e.milkType === "BUFFALO" ? "🐃" : e.milkType === "COW" ? "🐄" : "🥛"}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0, color: "var(--color-text-primary)" }}>{e.farmer?.name}</p>
                    <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0 }}>
                      {e.liters}L · Fat {e.fatPercent}% · {e.shift === "MORNING" ? "☀️" : "🌙"}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "#ea580c" }}>₹{Math.round(e.totalAmount)}</p>
                  <p style={{ fontSize: 10, color: "var(--color-text-secondary)", margin: 0 }}>{format(new Date(e.date), "dd MMM")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      {chart && chart.length > 1 && (
        <div style={{ background: "var(--color-background-primary)", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", padding: "12px", marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 12px" }}>Monthly Collection (L)</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`${v.toFixed(1)}L`, "Doodh"]}
              />
              <Line type="monotone" dataKey="liters" stroke="#ea580c" strokeWidth={2} dot={{ r: 3, fill: "#ea580c" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}