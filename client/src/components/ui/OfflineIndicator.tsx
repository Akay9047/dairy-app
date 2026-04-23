import { useOfflineSync } from "../../lib/useOfflineSync";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { format } from "date-fns";

export default function OfflineIndicator() {
    const { isOnline, isSyncing, lastSync, syncNow } = useOfflineSync();

    return (
        <div className="flex items-center gap-2">
            {/* Online/Offline status */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${isOnline ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}>
                {isOnline
                    ? <Wifi size={12} />
                    : <WifiOff size={12} />
                }
                <span>{isOnline ? "Online" : "Offline"}</span>
            </div>

            {/* Sync button — only when online */}
            {isOnline && (
                <button
                    onClick={syncNow}
                    disabled={isSyncing}
                    title={lastSync ? `Last sync: ${format(lastSync, "hh:mm a")}` : "Sync data"}
                    className={`p-1.5 rounded-lg transition-all ${isSyncing ? "text-brand-400 animate-spin" : "text-gray-400 hover:text-brand-600 hover:bg-brand-50"
                        }`}>
                    <RefreshCw size={14} />
                </button>
            )}
        </div>
    );
}