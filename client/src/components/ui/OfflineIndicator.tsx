import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";

// Inline hook to avoid import issues
function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const qc = useQueryClient();

    useEffect(() => {
        const onOnline = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
        };
    }, []);

    const syncNow = useCallback(async () => {
        if (!isOnline) return;
        setIsSyncing(true);
        try {
            qc.invalidateQueries();
        } finally {
            setIsSyncing(false);
        }
    }, [isOnline, qc]);

    return { isOnline, isSyncing, syncNow };
}

export default function OfflineIndicator() {
    const { isOnline, isSyncing, syncNow } = useOfflineSync();

    return (
        <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${isOnline ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}>
                {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
                <span className="hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
            </div>
            {isOnline && (
                <button onClick={syncNow} disabled={isSyncing}
                    className={`p-1.5 rounded-lg transition-all ${isSyncing ? "text-brand-400" : "text-gray-400 hover:text-brand-600 hover:bg-brand-50"}`}>
                    <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
                </button>
            )}
        </div>
    );
}