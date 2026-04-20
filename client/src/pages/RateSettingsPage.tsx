import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rateSettingsApi } from "../lib/api";
import { calcRates, DEFAULT_CONFIG, RateConfig } from "../lib/rateCalc";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

export default function RateSettingsPage() {
    const qc = useQueryClient();
    const [form, setForm] = useState<RateConfig>(DEFAULT_CONFIG);
    const [previewFat, setPreviewFat] = useState(6.0);
    const [previewLiters, setPreviewLiters] = useState(10);

    const { data: config, isLoading } = useQuery({
        queryKey: ["rate-settings"],
        queryFn: rateSettingsApi.get,
    });

    useEffect(() => {
        if (config) setForm({ ...DEFAULT_CONFIG, ...config });
    }, [config]);

    const mutation = useMutation({
        mutationFn: (data: RateConfig) => rateSettingsApi.update(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["rate-settings"] });
            qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
            toast.success("Rate settings save ho gayi! ✅");
        },
        onError: (err: any) => toast.error(err.response?.data?.error ?? "Save nahi hua"),
    });

    const f = (key: keyof RateConfig, val: any) => setForm(p => ({ ...p, [key]: val }));

    const bufCalc = calcRates(previewLiters, previewFat, "BUFFALO", form);
    const cowCalc = calcRates(previewLiters, previewFat, "COW", form);

    if (isLoading) return <div className="p-6 text-center text-gray-500">Loading...</div>;

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-2xl">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Rate Settings</h1>
                <p className="text-sm text-gray-500">Doodh ka rate system set karein</p>
            </div>

            {/* Mode Selection */}
            <div className="card">
                <h2 className="font-semibold text-gray-800 mb-3">Pricing Mode Chunein</h2>
                <div className="space-y-2">
                    {[
                        {
                            val: "fat_only",
                            icon: "📊",
                            label: "Fat Only",
                            desc: "Rate = Fat% × Fat Rate (sabse common, simple)",
                            example: "Fat 6% × ₹0.33 = ₹1.98/L"
                        },
                        {
                            val: "fat_snf",
                            icon: "🧪",
                            label: "Fat + SNF",
                            desc: "Rate = (Fat% × Fat Rate) + (SNF% × SNF Rate)",
                            example: "Fat 6%×₹0.33 + SNF 9%×₹0.07 = ₹1.98+₹0.63 = ₹2.61/L"
                        },
                        {
                            val: "fixed",
                            icon: "💰",
                            label: "Fixed Rate",
                            desc: "Buffalo aur Cow ke liye alag fixed ₹/liter",
                            example: "Buffalo ₹60/L, Cow ₹40/L"
                        },
                    ].map(opt => (
                        <button key={opt.val} onClick={() => f("pricingMode", opt.val)}
                            className={`w-full p-3 rounded-xl border-2 text-left transition-all ${form.pricingMode === opt.val ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                            <div className="flex items-start gap-3">
                                <span className="text-2xl mt-0.5">{opt.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className={`font-semibold text-sm ${form.pricingMode === opt.val ? "text-brand-700" : "text-gray-800"}`}>{opt.label}</p>
                                        {form.pricingMode === opt.val && <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full">Active</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                                    <p className="text-xs text-brand-600 font-mono mt-1">{opt.example}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Fat Rate Settings */}
            {(form.pricingMode === "fat_only" || form.pricingMode === "fat_snf") && (
                <div className="card">
                    <h2 className="font-semibold text-gray-800 mb-4">Rate Configuration</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fat Rate (₹ per 1% per liter)
                            </label>
                            <input type="number" className="input-field" value={form.fatRate}
                                onChange={e => f("fatRate", parseFloat(e.target.value))} step="0.01" min="0.01" />
                            <p className="text-xs text-gray-400 mt-1">
                                Example: Fat 6% × ₹{form.fatRate} = ₹{(6 * form.fatRate).toFixed(2)}/L
                            </p>
                        </div>

                        {form.pricingMode === "fat_snf" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SNF Rate (₹ per 1% per liter)
                                </label>
                                <input type="number" className="input-field" value={form.snfRate}
                                    onChange={e => f("snfRate", parseFloat(e.target.value))} step="0.01" min="0.01" />
                                <p className="text-xs text-gray-400 mt-1">
                                    Example: SNF 9% × ₹{form.snfRate} = ₹{(9 * form.snfRate).toFixed(2)}/L
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Fixed Rate Settings */}
            {form.pricingMode === "fixed" && (
                <div className="card">
                    <h2 className="font-semibold text-gray-800 mb-4">Fixed Rate per Liter</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🐃</span>
                                <label className="text-sm font-medium text-gray-700">Buffalo ₹/L</label>
                            </div>
                            <input type="number" className="input-field" value={form.buffaloFixedRate}
                                onChange={e => f("buffaloFixedRate", parseFloat(e.target.value))} step="1" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🐄</span>
                                <label className="text-sm font-medium text-gray-700">Cow ₹/L</label>
                            </div>
                            <input type="number" className="input-field" value={form.cowFixedRate}
                                onChange={e => f("cowFixedRate", parseFloat(e.target.value))} step="1" />
                        </div>
                    </div>
                </div>
            )}

            {/* SNF Auto Calc */}
            {form.pricingMode === "fat_snf" && (
                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="font-semibold text-gray-800">SNF Auto Calculate</h2>
                            <p className="text-xs text-gray-500 mt-0.5">SNF = (CLR÷4) + (0.25×FAT) + 0.44</p>
                        </div>
                        <button onClick={() => f("autoCalcSnf", !form.autoCalcSnf)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${form.autoCalcSnf ? "bg-brand-500" : "bg-gray-300"}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.autoCalcSnf ? "left-7" : "left-1"}`} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-400">
                        {form.autoCalcSnf ? "✅ SNF auto calculate hoga (CLR se ya Fat formula se)" : "❌ SNF manually enter karna hoga entry ke time"}
                    </p>
                </div>
            )}

            {/* Min Rate */}
            <div className="card">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="font-semibold text-gray-800">Minimum Rate Guarantee</h2>
                        <p className="text-xs text-gray-500">Calculated rate se kam nahi denge</p>
                    </div>
                    <button onClick={() => f("useMinRate", !form.useMinRate)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${form.useMinRate ? "bg-brand-500" : "bg-gray-300"}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.useMinRate ? "left-7" : "left-1"}`} />
                    </button>
                </div>
                {form.useMinRate && (
                    <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum ₹/Liter</label>
                        <input type="number" className="input-field" value={form.minRatePerLiter}
                            onChange={e => f("minRatePerLiter", parseFloat(e.target.value))} step="1" />
                    </div>
                )}
            </div>

            {/* Live Calculator */}
            <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
                <h2 className="font-semibold text-gray-800 mb-3">🧮 Live Calculator</h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Fat %</label>
                        <input type="number" value={previewFat} step="0.1" min="1" max="15"
                            onChange={e => setPreviewFat(parseFloat(e.target.value))}
                            className="input-field text-center font-semibold" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Liters</label>
                        <input type="number" value={previewLiters} step="1" min="1"
                            onChange={e => setPreviewLiters(parseInt(e.target.value))}
                            className="input-field text-center font-semibold" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {[["🐃 Buffalo", bufCalc], ["🐄 Cow", cowCalc]].map(([label, calc]: any) => (
                        <div key={label as string} className="bg-white rounded-xl p-3 border border-orange-100">
                            <p className="text-xs font-semibold text-gray-600 mb-2">{label}</p>
                            <p className="text-2xl font-bold text-brand-600">₹{calc.ratePerLiter}</p>
                            <p className="text-sm text-gray-500">per liter</p>
                            <div className="border-t border-gray-100 mt-2 pt-2">
                                <p className="text-sm font-semibold text-gray-800">Total: ₹{calc.totalAmount}</p>
                                {form.pricingMode !== "fixed" && (
                                    <p className="text-xs text-gray-400 mt-0.5 font-mono break-all">{calc.formula}</p>
                                )}
                                {form.pricingMode === "fat_snf" && (
                                    <p className="text-xs text-blue-500 mt-0.5">SNF: {calc.snfPercent}%</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base font-semibold rounded-xl">
                <Save size={18} />
                {mutation.isPending ? "Saving..." : "Save Rate Settings"}
            </button>
        </div>
    );
}