import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { offlineDB } from "./offlineDB";
import { farmersApi, milkApi, paymentsApi, dashboardApi, rateSettingsApi } from "./api";
import toast from "react-hot-toast";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Internet aa gayi! Sync ho raha hai...", { duration: 3000 });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast("Offline mode. Cached data use ho raha hai.", { icon: "📴", duration: 4000 });
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

  const loadFromCache = useCallback(async () => {
    try {
      const [farmers, milkEntries, payments, stats] = await Promise.all([
        offlineDB.getFarmers(),
        offlineDB.getMilkEntries(),
        offlineDB.getPayments(),
        offlineDB.getDashboardStats(),
      ]);
      if (farmers?.length) qc.setQueryData(["farmers"], farmers);
      if (milkEntries?.length) qc.setQueryData(["milk"], { entries: milkEntries, total: milkEntries.length });
      if (payments?.length) qc.setQueryData(["payments"], payments);
      if (stats) qc.setQueryData(["dashboard-stats"], stats);
    } catch {}
  }, [qc]);

  const syncData = useCallback(async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    try {
      const [farmers, milkData, payments, stats] = await Promise.allSettled([
        farmersApi.list(),
        milkApi.list({ limit: 200 } as any),
        paymentsApi.list(),
        dashboardApi.stats(),
      ]);
      if (farmers.status === "fulfilled") {
        await offlineDB.saveFarmers(farmers.value);
        qc.setQueryData(["farmers"], farmers.value);
      }
      if (milkData.status === "fulfilled") {
        await offlineDB.saveMilkEntries((milkData.value as any).entries ?? []);
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
      try {
        const rc = await rateSettingsApi.get();
        await offlineDB.saveRateConfig(rc);
      } catch {}
      setLastSync(new Date());
    } catch {} finally {
      setIsSyncing(false);
    }
  }, [isOnline, qc]);

  useEffect(() => {
    if (isOnline) syncData();
    else loadFromCache();
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(syncData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isOnline, syncData]);

  return { isOnline, isSyncing, lastSync, syncNow: syncData };
}