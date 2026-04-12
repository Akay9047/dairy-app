import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, superAdminApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { Save, Info } from "lucide-react";

interface RateConfig {
    rateType: string;
    fatRatePerKg: number; snfRatePerKg: number;
    minRatePerLiter: number; useMinRate: boolean;
    buffaloFatRate: number; cowFatRate: number;
    buffaloSnfRate: number; cowSnfRate: number;
    buffaloFixedRate: number; cowFixedRate: number;
}

export default function RateSettingsPage() {
    const { admin } = useAuth();
    const qc = useQueryClient();

    const { data: stats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: dashboardApi.stats });
    const rateConfig = stats?.rateConfig;

    const [form, setForm] = useState<RateConfig>({
        rateType: "fat",
        fatRatePerKg: 800, snfRatePerKg: 533,
        minRatePerLiter: 40, useMinRate: true,
        buffaloFatRate: 800, cowFatRate: 600,
        buffaloSnfRate: 533, cowSnfRate: 400,
        buffaloFixedRate: 60, cowFixedRate: 40,
        ...rateConfig,
    });

    const [initialized, setInitialized] = useState(false);
    if (rateConfig && !initialized) {
        setForm({ ...form, ...rateConfig });
        setInitialized(true);
    }

    const mutation = useMutation({
        mutationFn: (data: RateConfig) => {
            const dairyId = admin?.dairyId;
            if (!dairyId) throw new Error("Dairy ID nahi mila");
            return superAdminApi.updateRates(dairyId, data);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
            toast.success("Rate settings save ho gayi! ✅");
        },
        onError: (err: any) => toast.error(err.response?.data?.error ?? "Save nahi hua"),
    });

    const f = (key: keyof RateConfig, val: any) => setForm(p => ({ ...p, [key]: val }));

    // Live preview calculation
    const previewFat = 6.0;
    const previewLiters = 10;
    let previewRate = 0;
    if (form.rateType === "fixed") {
        previewRate = (form.buffaloFixedRate + form.cowFixedRate) / 2;
    } else {
        const snf = 0.21 * previewFat + 8.35;
        const fatAmt = (previewFat / 100) * previewLiters * form.buffaloFatRate;
        const snfAmt = (snf / 100) * previewLiters * form.buffaloSnfRate;
        previewRate = (fatAmt + snfAmt) / previewLiters;
        if (form.useMinRate && previewRate < form.minRatePerLiter) previewRate = form.minRatePerLiter;
    }

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-2xl">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Doodh Rate Settings</h1>
                <p className="text-sm text-gray-500">Buffalo aur Cow ke rates alag alag set karein</p>
            </div>

            {/* Rate Type */}
            <div className="card">
                <h2 className="font-semibold text-gray-800 mb-3">Rate Type Chunein</h2>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { val: "fat", label: "Fat Based", desc: "Fat % se rate calculate hoga (Rajasthan standard)", icon: "📊" },
                        { val: "fixed", label: "Fixed Rate", desc: "Ek fixed rate per liter (simple calculation)", icon: "💰" },
                    ].map(opt => (
                        <button key={opt.val} onClick={() => f("rateType", opt.val)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${form.rateType === opt.val ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"}`}>
                            <div className="text-xl mb-1">{opt.icon}</div>
                            <p className={`font-semibold text-sm ${form.rateType === opt.val ? "text-brand-700" : "text-gray-700"}`}>{opt.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {form.rateType === "fat" ? (
                <>
                    {/* Buffalo Fat Rates */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🐃</span>
                            <h2 className="font-semibold text-gray-800">Buffalo (Bhains) Rate</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fat Rate ₹/kg</label>
                                <input type="number" className="input-field" value={form.buffaloFatRate}
                                    onChange={e => f("buffaloFatRate", parseFloat(e.target.value))} step="10" />
                                <p className="text-xs text-gray-400 mt-1">Saras: ₹800/kg</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SNF Rate ₹/kg</label>
                                <input type="number" className="input-field" value={form.buffaloSnfRate}
                                    onChange={e => f("buffaloSnfRate", parseFloat(e.target.value))} step="10" />
                                <p className="text-xs text-gray-400 mt-1">Saras: ₹533/kg</p>
                            </div>
                        </div>
                    </div>

                    {/* Cow Fat Rates */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🐄</span>
                            <h2 className="font-semibold text-gray-800">Cow (Gaay) Rate</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fat Rate ₹/kg</label>
                                <input type="number" className="input-field" value={form.cowFatRate}
                                    onChange={e => f("cowFatRate", parseFloat(e.target.value))} step="10" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SNF Rate ₹/kg</label>
                                <input type="number" className="input-field" value={form.cowSnfRate}
                                    onChange={e => f("cowSnfRate", parseFloat(e.target.value))} step="10" />
                            </div>
                        </div>
                    </div>

                    {/* Min Rate */}
                    <div className="card">
                        <h2 className="font-semibold text-gray-800 mb-3">Minimum Rate Guarantee</h2>
                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                            <input type="checkbox" checked={form.useMinRate} onChange={e => f("useMinRate", e.target.checked)} className="rounded" />
                            <span className="text-sm text-gray-700">Minimum rate guarantee use karein</span>
                        </label>
                        {form.useMinRate && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rate ₹/Liter</label>
                                <input type="number" className="input-field" value={form.minRatePerLiter}
                                    onChange={e => f("minRatePerLiter", parseFloat(e.target.value))} step="1" />
                                <p className="text-xs text-gray-400 mt-1">Agar fat-based rate is se kam ho toh yeh rate apply hoga</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Fixed Rate */
                <div className="card">
                    <h2 className="font-semibold text-gray-800 mb-4">Fixed Rate per Liter</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🐃</span>
                                <label className="text-sm font-medium text-gray-700">Buffalo ₹/Liter</label>
                            </div>
                            <input type="number" className="input-field" value={form.buffaloFixedRate}
                                onChange={e => f("buffaloFixedRate", parseFloat(e.target.value))} step="1" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🐄</span>
                                <label className="text-sm font-medium text-gray-700">Cow ₹/Liter</label>
                            </div>
                            <input type="number" className="input-field" value={form.cowFixedRate}
                                onChange={e => f("cowFixedRate", parseFloat(e.target.value))} step="1" />
                        </div>
                    </div>
                </div>
            )}

            {/* Live Preview */}
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Info size={16} className="text-brand-600" />
                    <p className="text-sm font-semibold text-brand-700">Live Preview</p>
                </div>
                <p className="text-xs text-gray-500 mb-2">Example: Buffalo, 10L, Fat 6%</p>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rate per Liter</span>
                    <span className="font-bold text-brand-600 text-lg">₹{previewRate.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-600">Total (10L)</span>
                    <span className="font-bold text-brand-600">₹{(previewRate * 10).toFixed(2)}</span>
                </div>
            </div>

            <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                <Save size={16} />
                {mutation.isPending ? "Saving..." : "Rate Settings Save Karein"}
            </button>
        </div>
    );
}