/**
 * Smart Dairy - Offline Sync Hook
 * Online hone pe data fetch karo aur cache karo
 * Offline hone pe cached data use karo
 */

import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { offlineDB } from "../lib/offlineDB";
import { farmersApi, milkApi, paymentsApi, dashboardApi, rateSettingsApi } from "./api";
import toast from "react-hot-toast";

export function useOnlineStatus() {
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
    const handleOnline = () => {
    setIsOnline(true);
    toast.success("Internet connection aa gayi! Data sync ho raha hai...", { duration: 3000 });
    };
    const handleOffline = () => {
    setIsOnline(false);
    toast("Internet nahi hai. Cached data use ho raha hai.", { icon: "📴", duration: 4000 });
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    };
}, []);

return isOnline;
}

export function useOfflineSync() {
const isOnline = useOnlineStatus();
const qc = useQueryClient();
const [isSyncing, setIsSyncing] = useState(false);
const [lastSync, setLastSync] = useState<Date | null>(null);

const syncData = useCallback(async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    try {
      // Fetch all data and cache it
    const [farmers, milkData, payments, stats] = await Promise.allSettled([
        farmersApi.list(),
        milkApi.list({ limit: 200 }),
        paymentsApi.list(),
        dashboardApi.stats(),
    ]);

    if (farmers.status === "fulfilled") {
        await offlineDB.saveFarmers(farmers.value);
        qc.setQueryData(["farmers"], farmers.value);
    }
    if (milkData.status === "fulfilled") {
        await offlineDB.saveMilkEntries(milkData.value.entries ?? []);
        qc.setQueryData(["milk"], milkData.value);
    }
    if (payments.status === "fulfilled") {
        await offlineDB.savePayments(payments.value);
        qc.setQueryData(["payments"], payments.value);
    }
    if (stats.status === "fulfilled") {
        await offlineDB.saveDashboardStats(stats.value);
        qc.setQueryData(["dashboard-stats"], stats.value);
    }

      // Rate config
    try {
        const rateConfig = await rateSettingsApi.get();
        await offlineDB.saveRateConfig(rateConfig);
    } catch {}

    setLastSync(new Date());
    } catch (err) {
    console.error("Sync failed:", err);
    } finally {
    setIsSyncing(false);
    }
}, [isOnline, qc]);

  // Sync on mount and when coming online
useEffect(() => {
    if (isOnline) {
    syncData();
    } else {
      // Load from cache
    loadFromCache();
    }
}, [isOnline]);

const loadFromCache = async () => {
    try {
    const [farmers, milkEntries, payments, stats, rateConfig] = await Promise.all([
        offlineDB.getFarmers(),
        offlineDB.getMilkEntries(),
        offlineDB.getPayments(),
        offlineDB.getDashboardStats(),
        offlineDB.getRateConfig(),
    ]);

    if (farmers?.length) qc.setQueryData(["farmers"], farmers);
    if (milkEntries?.length) qc.setQueryData(["milk"], { entries: milkEntries, total: milkEntries.length });
    if (payments?.length) qc.setQueryData(["payments"], payments);
    if (stats) qc.setQueryData(["dashboard-stats"], stats);
    } catch (err) {
    console.error("Cache load failed:", err);
    }
};

  // Re-sync every 5 minutes when online
useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(syncData, 5 * 60 * 1000);
    return () => clearInterval(interval);
}, [isOnline, syncData]);

return { isOnline, isSyncing, lastSync, syncNow: syncData };
}