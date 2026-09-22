import { CompletePosSalePayload, salesService } from './salesService';
import { Order } from '../types';

export interface QueuedSale {
  id: string;
  payload: CompletePosSalePayload;
  queuedAt: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  error?: string;
}

const STORAGE_KEY = 'smartshopx_offline_sales_queue';

export const offlineSyncService = {
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  getQueue(): QueuedSale[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getPendingCount(): number {
    return this.getQueue().filter((q) => q.status === 'PENDING').length;
  },

  subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback();
    window.addEventListener('smartshopx_offline_queue_updated', handler);
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('smartshopx_offline_queue_updated', handler);
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  },

  saveQueue(queue: QueuedSale[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartshopx_offline_queue_updated'));
    }
  },

  enqueueSale(payload: CompletePosSalePayload): QueuedSale {
    const queue = this.getQueue();
    const item: QueuedSale = {
      id: `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      payload,
      queuedAt: new Date().toISOString(),
      status: 'PENDING',
    };
    queue.push(item);
    this.saveQueue(queue);
    return item;
  },

  async syncAllPending(): Promise<{ synced: number; failed: number; orders: Order[] }> {
    const queue = this.getQueue();
    const pending = queue.filter((q) => q.status === 'PENDING');
    if (pending.length === 0) {
      return { synced: 0, failed: 0, orders: [] };
    }

    let syncedCount = 0;
    let failedCount = 0;
    const syncedOrders: Order[] = [];

    for (const item of pending) {
      try {
        const order = await salesService.completePosSale({
          ...item.payload,
          notes: item.payload.notes
            ? `${item.payload.notes} [অফলাইনে সংরক্ষিত ও সিঙ্ককৃত]`
            : '[অফলাইনে সংরক্ষিত ও সিঙ্ককৃত]',
        });
        item.status = 'SYNCED';
        syncedCount++;
        syncedOrders.push(order);
      } catch (err: any) {
        item.status = 'FAILED';
        item.error = err?.message || 'সিঙ্ক ব্যর্থ হয়েছে';
        failedCount++;
      }
    }

    // Keep only recent synced items (last 20) and any failed/pending items
    const remaining = queue.filter(
      (q) => q.status !== 'SYNCED' || pending.slice(-20).some((p) => p.id === q.id)
    );
    this.saveQueue(remaining);

    return {
      synced: syncedCount,
      failed: failedCount,
      orders: syncedOrders,
    };
  },

  clearSynced() {
    const queue = this.getQueue().filter((q) => q.status === 'PENDING');
    this.saveQueue(queue);
  },
};
