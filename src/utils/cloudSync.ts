export interface CloudSyncState {
  status: 'synced' | 'syncing' | 'offline';
  lastSyncedAt: Date | null;
  pendingChanges: number;
  latencyMs: number;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp');
}

export function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getDaysUntilExpiry(expiryDateStr: string): number {
  try {
    const target = new Date(expiryDateStr);
    const now = new Date('2026-09-19'); // local application date
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}
