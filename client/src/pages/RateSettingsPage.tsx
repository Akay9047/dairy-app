import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rateSettingsApi } from "../lib/api";
import { calcRates, DEFAULT_CONFIG, RateConfig } from "../lib/rateCalc";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

export default function RateSettingsPage() {
    const qc = useQueryClient();
    const [form, setForm] = useState<RateConfig>(DEFAULT_CONFIG);
    const [fat, setFat] = useState(6.0);
    const [liters, setLiters] = useState(10);

    const { data: config, isLoading } = useQuery({
        queryKey: ["rate-settings"],
        queryFn: rateSettingsApi.get,
    });

    useEffect(() => {
        if (config) setForm({ ...DEFAULT_CONFIG, ...config });
    }, [config]);

    const mutation = useMutation({
        mutationFn: (d: RateConfig) => rateSettingsApi.update(d),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["rate-settings"] });
            qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
            toast.success("Rate settings save ho gayi! ✅");
        },
        onError: (err: any) => toast.error(err.response?.data?.error ?? "Save nahi hua"),
    });

    const f = (key: keyof RateConfig, val: any) => setForm(p => ({ ...p, [key]: val }));

    const bufCalc = calcRates(liters, fat, "BUFFALO", form);
    const cowCalc = calcRates(liters, fat, "COW", form);

    if (isLoading) return <div className="p-6 text-center text-gray-400">Loading...</div>;

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-2xl">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Rate Settings</h1>
                <p className="text-sm text-gray-500">Doodh pricing system configure karein</p>
            </div>

            {/* === MODE SELECT === */}
            <div className="card">
                <p className="text-sm font-semibold text-gray-700 mb-3">Pricing Mode</p>
                <div className="space-y-2">
                    {[
                        { val: "fat_only", icon: "📊", label: "Fat Only (Recommended)", desc: `Rate = Fat% × ₹${form.fatRate}  |  Fat 6% → ₹${(6 * form.fatRate).toFixed(2)}/L, Fat 7% → ₹${(7 * form.fatRate).toFixed(2)}/L` },
                        { val: "fat_snf", icon: "🧪", label: "Fat + SNF", desc: `Rate = (Fat%×₹${form.fatRate}) + (SNF%×₹${form.snfRate})` },
                        { val: "fixed", icon: "💰", label: "Fixed Rate", desc: `Buffalo ₹${form.buffaloFixedRate}/L, Cow ₹${form.cowFixedRate}/L` },
                    ].map(m => (
                        <button key={m.val} onClick={() => f("pricingMode", m.val)}
                            className={`w-full p-3 rounded-xl border-2 text-left transition-all ${form.pricingMode === m.val ? "border-brand-500 bg-brand-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{m.icon}</span>
                                <div>
                                    <p className={`text-sm font-semibold ${form.pricingMode === m.val ? "text-brand-700" : "text-gray-700"}`}>
                                        {m.label} {form.pricingMode === m.val && <span className="text-xs bg-brand-600 text-white px-1.5 py-0.5 rounded-full ml-1">Active</span>}
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono">{m.desc}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* === FAT RATE (fat_only and fat_snf) === */}
            {(form.pricingMode === "fat_only" || form.pricingMode === "fat_snf") && (
                <div className="card space-y-4">
                    <p className="text-sm font-semibold text-gray-700">Fat Rate</p>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">₹ per 1% fat per liter</label>
                        <input type="number" className="input-field" value={form.fatRate}
                            onChange={e => f("fatRate", parseFloat(e.target.value))} step="0.01" min="0.01" />
                        <p className="text-xs text-brand-600 mt-1 font-mono">
                            Fat 5.5% → ₹{(5.5 * form.fatRate).toFixed(2)}/L &nbsp;|&nbsp;
                            Fat 6.0% → ₹{(6.0 * form.fatRate).toFixed(2)}/L &nbsp;|&nbsp;
                            Fat 7.0% → ₹{(7.0 * form.fatRate).toFixed(2)}/L
                        </p>
                    </div>

                    {/* SNF section — only show when fat_snf mode */}
                    {form.pricingMode === "fat_snf" && (
                        <>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">SNF Rate — ₹ per 1% SNF per liter</label>
                                <input type="number" className="input-field" value={form.snfRate}
                                    onChange={e => f("snfRate", parseFloat(e.target.value))} step="0.01" min="0.01" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <div>
                                    <p className="text-sm font-medium text-blue-800">SNF Auto Calculate</p>
                                    <p className="text-xs text-blue-600">Formula: SNF = (CLR÷4) + (0.25×FAT) + 0.44</p>
                                </div>
                                <button onClick={() => f("autoCalcSnf", !form.autoCalcSnf)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${form.autoCalcSnf ? "bg-blue-500" : "bg-gray-300"}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.autoCalcSnf ? "left-6" : "left-1"}`} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* === FIXED RATE === */}
            {form.pricingMode === "fixed" && (
                <div className="card">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Fixed Rate ₹/Liter</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="flex items-center gap-1 text-xs text-gray-500 mb-1"><span>🐃</span> Buffalo</label>
                            <input type="number" className="input-field" value={form.buffaloFixedRate}
                                onChange={e => f("buffaloFixedRate", parseFloat(e.target.value))} step="1" />
                        </div>
                        <div>
                            <label className="flex items-center gap-1 text-xs text-gray-500 mb-1"><span>🐄</span> Cow</label>
                            <input type="number" className="input-field" value={form.cowFixedRate}
                                onChange={e => f("cowFixedRate", parseFloat(e.target.value))} step="1" />
                        </div>
                    </div>
                </div>
            )}

            {/* === MIN RATE === */}
            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-gray-700">Minimum Rate Guarantee</p>
                        <p className="text-xs text-gray-400">Calculated rate se kam nahi milega</p>
                    </div>
                    <button onClick={() => f("useMinRate", !form.useMinRate)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${form.useMinRate ? "bg-brand-500" : "bg-gray-300"}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.useMinRate ? "left-6" : "left-1"}`} />
                    </button>
                </div>
                {form.useMinRate && (
                    <div className="mt-3">
                        <label className="block text-xs text-gray-500 mb-1">Min ₹/Liter</label>
                        <input type="number" className="input-field" value={form.minRatePerLiter}
                            onChange={e => f("minRatePerLiter", parseFloat(e.target.value))} step="1" />
                    </div>
                )}
            </div>

            {/* === LIVE CALCULATOR === */}
            <div className="card bg-amber-50 border-amber-100">
                <p className="text-sm font-semibold text-gray-700 mb-3">🧮 Live Calculator</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Fat %</label>
                        <input type="number" value={fat} step="0.1" min="1" max="15"
                            onChange={e => setFat(parseFloat(e.target.value) || 0)}
                            className="input-field text-center font-bold" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Liters</label>
                        <input type="number" value={liters} step="1" min="1"
                            onChange={e => setLiters(parseInt(e.target.value) || 1)}
                            className="input-field text-center font-bold" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {[["🐃 Buffalo", bufCalc], ["🐄 Cow", cowCalc]].map(([label, calc]: any) => (
                        <div key={label as string} className="bg-white rounded-xl p-3 border border-amber-100">
                            <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                            <p className="text-xl font-bold text-brand-600">₹{calc.ratePerLiter}/L</p>
                            <p className="text-sm font-semibold text-gray-800">₹{calc.totalAmount} total</p>
                            {form.pricingMode === "fat_snf" && (
                                <p className="text-xs text-blue-500 mt-1">SNF: {calc.snfPercent}%</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1 font-mono leading-tight break-all">{calc.formula}</p>
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