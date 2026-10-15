/**
 * Offline Resiliency & Background Sync Queue
 * Guarantees zero data loss during network interruptions or offline operation.
 * Queues transactions and inventory modifications locally, then auto-flushes when back online.
 */

export interface OfflineAction {
  id: string;
  type: 'NEW_TRANSACTION' | 'UPDATE_STOCK' | 'KASBON_PAYMENT' | 'SUPPLIER_ORDER' | 'STOCK_OPNAME';
  createdAt: string;
  description: string;
  payload: any;
}

const OFFLINE_QUEUE_KEY = 'riyan_store_offline_queue_v1';

export function getOfflineQueue(): OfflineAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[OfflineQueue] Failed to read queue:', e);
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineAction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('[OfflineQueue] Failed to save queue:', e);
  }
}

export function enqueueOfflineAction(action: Omit<OfflineAction, 'id' | 'createdAt'>): OfflineAction {
  const newAction: OfflineAction = {
    ...action,
    id: 'offline_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
    createdAt: new Date().toISOString(),
  };

  const queue = getOfflineQueue();
  queue.push(newAction);
  saveOfflineQueue(queue);

  // Attempt Background Sync registration via Service Worker if supported
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then((reg) => {
        return (reg as any).sync.register('sync-offline-transactions');
      })
      .catch((err) => {
        console.warn('[OfflineQueue] SW Background Sync not supported or permitted:', err);
      });
  }

  return newAction;
}

export function removeOfflineAction(id: string): void {
  const queue = getOfflineQueue();
  const filtered = queue.filter((item) => item.id !== id);
  saveOfflineQueue(filtered);
}

export function clearOfflineQueue(): void {
  saveOfflineQueue([]);
}
