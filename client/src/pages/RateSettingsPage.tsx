import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rateSettingsApi } from "../lib/api";
import toast from "react-hot-toast";
import { Save, Info, AlertCircle } from "lucide-react";

interface RateConfig {
    rateType: string;
    useSnf: boolean;
    fatRatePerKg: number; snfRatePerKg: number;
    minRatePerLiter: number; useMinRate: boolean;
    buffaloFatRate: number; cowFatRate: number;
    buffaloSnfRate: number; cowSnfRate: number;
    buffaloFixedRate: number; cowFixedRate: number;
}

const DEFAULT: RateConfig = {
    rateType: "fat", useSnf: false,
    fatRatePerKg: 800, snfRatePerKg: 533,
    minRatePerLiter: 40, useMinRate: true,
    buffaloFatRate: 800, cowFatRate: 600,
    buffaloSnfRate: 533, cowSnfRate: 400,
    buffaloFixedRate: 60, cowFixedRate: 40,
};

function calcPreview(fat: number, liters: number, milkType: "BUFFALO" | "COW", form: RateConfig) {
    if (form.rateType === "fixed") {
        const rate = milkType === "BUFFALO" ? form.buffaloFixedRate : form.cowFixedRate;
        return { rate, total: rate * liters, fatAmt: 0, snfAmt: 0, snf: 0 };
    }
    const snf = milkType === "BUFFALO" ? 0.21 * fat + 8.5 : 0.21 * fat + 7.8;
    const fatRate = milkType === "BUFFALO" ? form.buffaloFatRate : form.cowFatRate;
    const snfRate = milkType === "BUFFALO" ? form.buffaloSnfRate : form.cowSnfRate;
    const fatKg = (fat / 100) * liters;
    const snfKg = (snf / 100) * liters;
    const fatAmt = fatKg * fatRate;
    const snfAmt = form.useSnf ? snfKg * snfRate : 0;
    let rate = (fatAmt + snfAmt) / liters;
    if (form.useMinRate && rate < form.minRatePerLiter) rate = form.minRatePerLiter;
    return { rate, total: rate * liters, fatAmt, snfAmt, snf };
}

export default function RateSettingsPage() {
    const qc = useQueryClient();
    const [form, setForm] = useState<RateConfig>(DEFAULT);
    const [previewFat, setPreviewFat] = useState(6.0);

    const { data: config, isLoading } = useQuery({
        queryKey: ["rate-settings"],
        queryFn: rateSettingsApi.get,
    });

    useEffect(() => {
        if (config) setForm({ ...DEFAULT, ...config });
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

    const bufPreview = calcPreview(previewFat, 10, "BUFFALO", form);
    const cowPreview = calcPreview(previewFat, 10, "COW", form);

    if (isLoading) return <div className="p-6 text-center text-gray-500">Loading...</div>;

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-2xl">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Doodh Rate Settings</h1>
                <p className="text-sm text-gray-500">Buffalo aur Cow ke rates set karein</p>
            </div>

            {/* Rate Type */}
            <div className="card">
                <h2 className="font-semibold text-gray-800 mb-3">Rate Type Chunein</h2>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { val: "fat", icon: "📊", label: "Fat Based", desc: "Fat% se rate calculate" },
                        { val: "fixed", icon: "💰", label: "Fixed Rate", desc: "Flat ₹/liter" },
                    ].map(opt => (
                        <button key={opt.val} onClick={() => f("rateType", opt.val)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${form.rateType === opt.val ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"}`}>
                            <div className="text-xl mb-1">{opt.icon}</div>
                            <p className={`font-semibold text-sm ${form.rateType === opt.val ? "text-brand-700" : "text-gray-700"}`}>{opt.label}</p>
                            <p className="text-xs text-gray-500">{opt.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {form.rateType === "fat" && (
                <>
                    {/* SNF Toggle — important */}
                    <div className={`card border-2 ${form.useSnf ? "border-blue-200 bg-blue-50" : "border-green-200 bg-green-50"}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertCircle size={16} className={form.useSnf ? "text-blue-600" : "text-green-600"} />
                                    <h2 className="font-semibold text-gray-800">SNF Option</h2>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">
                                    {form.useSnf
                                        ? "SNF ON — Rate = Fat Amount + SNF Amount (complex)"
                                        : "SNF OFF — Rate = Sirf Fat Amount (simple, recommended)"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {form.useSnf
                                        ? "⚠️ SNF on hone se fat 5.5 aur 5.7 mein rate thoda hi badhega"
                                        : "✅ Fat 5.5 aur 5.7 mein clearly alag rate aayega"}
                                </p>
                            </div>
                            <button onClick={() => f("useSnf", !form.useSnf)}
                                className={`ml-3 relative w-12 h-6 rounded-full transition-colors ${form.useSnf ? "bg-blue-500" : "bg-gray-300"}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.useSnf ? "left-7" : "left-1"}`} />
                            </button>
                        </div>
                    </div>

                    {/* Buffalo rates */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">🐃</span>
                            <h2 className="font-semibold text-gray-800">Buffalo (Bhains) Rate</h2>
                        </div>
                        <div className={`grid gap-3 ${form.useSnf ? "grid-cols-2" : "grid-cols-1"}`}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fat Rate ₹/kg</label>
                                <input type="number" className="input-field" value={form.buffaloFatRate}
                                    onChange={e => f("buffaloFatRate", parseFloat(e.target.value))} step="10" />
                                <p className="text-xs text-gray-400 mt-1">Example: Fat 6% × {form.buffaloFatRate} = ₹{(6 / 100 * 10 * form.buffaloFatRate / 10).toFixed(0)}/L</p>
                            </div>
                            {form.useSnf && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SNF Rate ₹/kg</label>
                                    <input type="number" className="input-field" value={form.buffaloSnfRate}
                                        onChange={e => f("buffaloSnfRate", parseFloat(e.target.value))} step="10" />
                                    <p className="text-xs text-gray-400 mt-1">Saras standard: ₹533</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cow rates */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">🐄</span>
                            <h2 className="font-semibold text-gray-800">Cow (Gaay) Rate</h2>
                        </div>
                        <div className={`grid gap-3 ${form.useSnf ? "grid-cols-2" : "grid-cols-1"}`}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fat Rate ₹/kg</label>
                                <input type="number" className="input-field" value={form.cowFatRate}
                                    onChange={e => f("cowFatRate", parseFloat(e.target.value))} step="10" />
                            </div>
                            {form.useSnf && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SNF Rate ₹/kg</label>
                                    <input type="number" className="input-field" value={form.cowSnfRate}
                                        onChange={e => f("cowSnfRate", parseFloat(e.target.value))} step="10" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Min Rate */}
                    <div className="card">
                        <h2 className="font-semibold text-gray-800 mb-3">Minimum Rate</h2>
                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                            <input type="checkbox" checked={form.useMinRate} onChange={e => f("useMinRate", e.target.checked)} className="w-4 h-4 rounded" />
                            <span className="text-sm text-gray-700">Minimum rate guarantee lagaein</span>
                        </label>
                        {form.useMinRate && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Min Rate ₹/Liter</label>
                                <input type="number" className="input-field" value={form.minRatePerLiter}
                                    onChange={e => f("minRatePerLiter", parseFloat(e.target.value))} step="1" />
                            </div>
                        )}
                    </div>
                </>
            )}

            {form.rateType === "fixed" && (
                <div className="card">
                    <h2 className="font-semibold text-gray-800 mb-4">Fixed Rate ₹/Liter</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {[["🐃", "Buffalo", "buffaloFixedRate"], ["🐄", "Cow", "cowFixedRate"]].map(([icon, name, key]) => (
                            <div key={key as string}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">{icon}</span>
                                    <label className="text-sm font-medium text-gray-700">{name}</label>
                                </div>
                                <input type="number" className="input-field" value={(form as any)[key as string]}
                                    onChange={e => f(key as keyof RateConfig, parseFloat(e.target.value))} step="1" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Live Preview */}
            <div className="card bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Info size={16} className="text-brand-600" />
                        <p className="text-sm font-semibold text-gray-700">Live Preview</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">Fat %</label>
                        <input type="number" value={previewFat} onChange={e => setPreviewFat(parseFloat(e.target.value))}
                            className="w-16 text-center border rounded-lg px-2 py-1 text-sm" step="0.1" min="1" max="15" />
                    </div>
                </div>
                <p className="text-xs text-gray-400 mb-3">10 liter ke liye calculation</p>
                <div className="grid grid-cols-2 gap-3">
                    {[["🐃 Buffalo", bufPreview], ["🐄 Cow", cowPreview]].map(([label, prev]: any) => (
                        <div key={label as string} className="bg-white rounded-xl p-3 border">
                            <p className="text-xs font-medium text-gray-600 mb-2">{label}</p>
                            <p className="text-lg font-bold text-brand-600">₹{prev.rate.toFixed(2)}/L</p>
                            <p className="text-sm font-semibold text-gray-800">Total: ₹{prev.total.toFixed(0)}</p>
                            {form.rateType === "fat" && (
                                <div className="mt-1 space-y-0.5">
                                    <p className="text-xs text-gray-500">Fat: ₹{prev.fatAmt.toFixed(2)}</p>
                                    {form.useSnf && <p className="text-xs text-gray-500">SNF: ₹{prev.snfAmt.toFixed(2)}</p>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base font-semibold rounded-xl">
                <Save size={18} />{mutation.isPending ? "Saving..." : "Rate Settings Save Karein"}
            </button>
        </div>
    );
}