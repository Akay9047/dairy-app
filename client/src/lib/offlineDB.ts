/**
 * Smart Dairy - Offline Storage
 * IndexedDB se data cache karo aur offline dikhao
 */

const DB_NAME = "SmartDairyDB";
const DB_VERSION = 1;

const STORES = {
    farmers: "farmers",
    milkEntries: "milkEntries",
    payments: "payments",
    dashboard: "dashboard",
    rateConfig: "rateConfig",
};

let db: IDBDatabase | null = null;

export async function openDB(): Promise<IDBDatabase> {
    if (db) return db;
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => { db = req.result; resolve(db); };
        req.onupgradeneeded = (e) => {
            const d = (e.target as IDBOpenDBRequest).result;
            // Farmers store
            if (!d.objectStoreNames.contains(STORES.farmers)) {
                const s = d.createObjectStore(STORES.farmers, { keyPath: "id" });
                s.createIndex("dairyId", "dairyId");
            }
            // MilkEntries store
            if (!d.objectStoreNames.contains(STORES.milkEntries)) {
                const s = d.createObjectStore(STORES.milkEntries, { keyPath: "id" });
                s.createIndex("dairyId", "dairyId");
                s.createIndex("farmerId", "farmerId");
                s.createIndex("date", "date");
            }
            // Payments store
            if (!d.objectStoreNames.contains(STORES.payments)) {
                const s = d.createObjectStore(STORES.payments, { keyPath: "id" });
                s.createIndex("farmerId", "farmerId");
            }
            // Dashboard cache
            if (!d.objectStoreNames.contains(STORES.dashboard)) {
                d.createObjectStore(STORES.dashboard, { keyPath: "key" });
            }
            // Rate config
            if (!d.objectStoreNames.contains(STORES.rateConfig)) {
                d.createObjectStore(STORES.rateConfig, { keyPath: "key" });
            }
        };
    });
}

// Generic save
async function saveAll(storeName: string, items: any[]): Promise<void> {
    const d = await openDB();
    return new Promise((resolve, reject) => {
        const tx = d.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        items.forEach(item => store.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Generic get all
async function getAll(storeName: string): Promise<any[]> {
    const d = await openDB();
    return new Promise((resolve, reject) => {
        const tx = d.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result ?? []);
        req.onerror = () => reject(req.error);
    });
}

// Save/Get single key-value
async function saveKV(storeName: string, key: string, value: any): Promise<void> {
    const d = await openDB();
    return new Promise((resolve, reject) => {
        const tx = d.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put({ key, value, savedAt: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getKV(storeName: string, key: string): Promise<any | null> {
    const d = await openDB();
    return new Promise((resolve, reject) => {
        const tx = d.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result?.value ?? null);
        req.onerror = () => reject(req.error);
    });
}

// === Public API ===

export const offlineDB = {
    // Farmers
    saveFarmers: (farmers: any[]) => saveAll(STORES.farmers, farmers),
    getFarmers: () => getAll(STORES.farmers),

    // Milk entries
    saveMilkEntries: (entries: any[]) => saveAll(STORES.milkEntries, entries),
    getMilkEntries: () => getAll(STORES.milkEntries),

    // Payments
    savePayments: (payments: any[]) => saveAll(STORES.payments, payments),
    getPayments: () => getAll(STORES.payments),

    // Dashboard stats
    saveDashboardStats: (stats: any) => saveKV(STORES.dashboard, "stats", stats),
    getDashboardStats: () => getKV(STORES.dashboard, "stats"),

    // Rate config
    saveRateConfig: (config: any) => saveKV(STORES.rateConfig, "config", config),
    getRateConfig: () => getKV(STORES.rateConfig, "config"),

    // Clear all cached data
    clearAll: async () => {
        const d = await openDB();
        const storeNames = Object.values(STORES);
        return new Promise<void>((resolve, reject) => {
            const tx = d.transaction(storeNames, "readwrite");
            storeNames.forEach(s => tx.objectStore(s).clear());
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
};