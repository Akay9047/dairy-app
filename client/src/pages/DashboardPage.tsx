import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, Droplets, IndianRupee, TrendingUp } from "lucide-react";
import { format } from "date-fns";

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.stats,
    refetchInterval: 60000,
  });

  const { data: chartData } = useQuery({
    queryKey: ["dashboard-chart"],
    queryFn: dashboardApi.chart,
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="text-3xl mb-2">🐄</div>
        <p>Dashboard load ho raha hai...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Aaj ka overview —{" "}
          {format(new Date(), "dd MMM yyyy")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Users size={20} className="text-blue-600" />}
          label="Kul Kisaan"
          value={String(stats?.totalFarmers ?? 0)}
          color="bg-blue-50"
        />
        <StatCard
          icon={<Droplets size={20} className="text-teal-600" />}
          label="Aaj ka Doodh"
          value={`${(stats?.todayMilk ?? 0).toFixed(1)}L`}
          sub={`${stats?.todayCount ?? 0} entries`}
          color="bg-teal-50"
        />
        <StatCard
          icon={<IndianRupee size={20} className="text-brand-600" />}
          label="Aaj ki Kamai"
          value={`₹${(stats?.todayAmount ?? 0).toFixed(0)}`}
          color="bg-orange-50"
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-purple-600" />}
          label="Is Mahine"
          value={`₹${(stats?.monthAmount ?? 0).toFixed(0)}`}
          sub={`${(stats?.monthMilk ?? 0).toFixed(1)}L`}
          color="bg-purple-50"
        />
      </div>

      {/* Chart */}
      {chartData && chartData.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Monthly Doodh Collection</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="milkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ed8c18" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ed8c18" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(1)}L`, "Doodh"]}
              />
              <Area
                type="monotone"
                dataKey="liters"
                stroke="#ed8c18"
                strokeWidth={2}
                fill="url(#milkGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Entries */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">Recent Entries</h2>
        {stats?.recentEntries?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Abhi koi entry nahi hai</p>
        ) : (
          <div className="space-y-2">
            {stats?.recentEntries?.map((entry: {
              id: string;
              shift: string;
              liters: number;
              fatPercent: number;
              totalAmount: number;
              date: string;
              farmer: { name: string; code: string; village: string };
            }) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🥛</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {entry.farmer.name}
                      <span className="text-xs text-gray-400 ml-1">({entry.farmer.code})</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.farmer.village} · {entry.liters}L · Fat {entry.fatPercent}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-600">
                    ₹{entry.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(entry.date), "dd MMM")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
