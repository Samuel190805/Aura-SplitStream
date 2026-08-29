export interface LocalMediaItem {
  id: string;
  name: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  type: "audio" | "video";
  format: string;
  size: number;
  lastModified: number;
  blob?: Blob;
  url?: string;
  thumbnailUrl?: string;
  addedAt: number;
}

const DB_NAME = "SplitStreamLocalLibrary";
const DB_VERSION = 1;
const STORE_NAME = "media_items";

class LocalLibraryDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("IndexedDB is only available in browser environment"));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
            store.createIndex("type", "type", { unique: false });
            store.createIndex("addedAt", "addedAt", { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return this.dbPromise;
  }

  async addItem(item: LocalMediaItem): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllItems(type?: "audio" | "video"): Promise<LocalMediaItem[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        let items: LocalMediaItem[] = req.result || [];
        if (type) {
          items = items.filter((i) => i.type === type);
        }
        items.sort((a, b) => b.addedAt - a.addedAt);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getItem(id: string): Promise<LocalMediaItem | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async removeItem(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearAll(type?: "audio" | "video"): Promise<void> {
    if (!type) {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } else {
      const items = await this.getAllItems(type);
      for (const item of items) {
        await this.removeItem(item.id);
      }
    }
  }
}

export const localLibrary = new LocalLibraryDB();
export default localLibrary;
