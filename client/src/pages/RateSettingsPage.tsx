import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rateSettingsApi } from "../lib/api";
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

const DEFAULT: RateConfig = {
    rateType: "fat", fatRatePerKg: 800, snfRatePerKg: 533,
    minRatePerLiter: 40, useMinRate: true,
    buffaloFatRate: 800, cowFatRate: 600,
    buffaloSnfRate: 533, cowSnfRate: 400,
    buffaloFixedRate: 60, cowFixedRate: 40,
};

export default function RateSettingsPage() {
    const qc = useQueryClient();
    const [form, setForm] = useState<RateConfig>(DEFAULT);

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

    const previewRate = (() => {
        if (form.rateType === "fixed") return form.buffaloFixedRate;
        const snf = 0.21 * 6 + 8.5;
        const fatAmt = (6 / 100) * 10 * form.buffaloFatRate;
        const snfAmt = (snf / 100) * 10 * form.buffaloSnfRate;
        let rate = (fatAmt + snfAmt) / 10;
        if (form.useMinRate && rate < form.minRatePerLiter) rate = form.minRatePerLiter;
        return rate;
    })();

    if (isLoading) return <div className="p-6 text-center text-gray-500">Loading...</div>;

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-2xl">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Doodh Rate Settings</h1>
                <p className="text-sm text-gray-500">Buffalo aur Cow ke rates set karein</p>
            </div>

            <div className="card">
                <h2 className="font-semibold text-gray-800 mb-3">Rate Type</h2>
                <div className="grid grid-cols-2 gap-3">
                    {[["fat", "📊", "Fat Based", "Fat% se calculate"], ["fixed", "💰", "Fixed Rate", "Flat ₹/liter"]].map(([val, icon, label, desc]) => (
                        <button key={val} onClick={() => f("rateType", val)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${form.rateType === val ? "border-brand-500 bg-brand-50" : "border-gray-200"}`}>
                            <div className="text-xl mb-1">{icon}</div>
                            <p className={`font-semibold text-sm ${form.rateType === val ? "text-brand-700" : "text-gray-700"}`}>{label}</p>
                            <p className="text-xs text-gray-500">{desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {form.rateType === "fat" ? (
                <>
                    {[["🐃", "Buffalo", "buffaloFatRate", "buffaloSnfRate"], ["🐄", "Cow", "cowFatRate", "cowSnfRate"]].map(([icon, name, fatKey, snfKey]) => (
                        <div key={name} className="card">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{icon}</span>
                                <h2 className="font-semibold text-gray-800">{name} Rate</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fat ₹/kg</label>
                                    <input type="number" className="input-field" value={(form as any)[fatKey]}
                                        onChange={e => f(fatKey as keyof RateConfig, parseFloat(e.target.value))} step="10" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SNF ₹/kg</label>
                                    <input type="number" className="input-field" value={(form as any)[snfKey]}
                                        onChange={e => f(snfKey as keyof RateConfig, parseFloat(e.target.value))} step="10" />
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="card">
                        <h2 className="font-semibold text-gray-800 mb-3">Minimum Rate</h2>
                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                            <input type="checkbox" checked={form.useMinRate} onChange={e => f("useMinRate", e.target.checked)} />
                            <span className="text-sm text-gray-700">Minimum rate guarantee</span>
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
            ) : (
                <div className="card">
                    <h2 className="font-semibold text-gray-800 mb-4">Fixed Rate ₹/Liter</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {[["🐃", "Buffalo", "buffaloFixedRate"], ["🐄", "Cow", "cowFixedRate"]].map(([icon, name, key]) => (
                            <div key={name as string}>
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

            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Info size={16} className="text-brand-600" />
                    <p className="text-sm font-semibold text-brand-700">Live Preview — Buffalo, 10L, Fat 6%</p>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Rate/Liter</span>
                    <span className="font-bold text-brand-600 text-lg">₹{previewRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-sm text-gray-600">Total (10L)</span>
                    <span className="font-bold text-brand-600">₹{(previewRate * 10).toFixed(2)}</span>
                </div>
            </div>

            <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
                <Save size={16} />{mutation.isPending ? "Saving..." : "Save Karein"}
            </button>
        </div>
    );
}