import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CloudCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Database,
  Radio,
  Clock,
} from 'lucide-react';
import { OfflineAction } from '../utils/offlineSyncQueue';

interface OfflineSyncStatusBarProps {
  isOnline: boolean;
  offlineQueue: OfflineAction[];
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  onManualFlush: () => void;
}

export const OfflineSyncStatusBar: React.FC<OfflineSyncStatusBarProps> = ({
  isOnline,
  offlineQueue,
  isSyncing,
  lastSyncedAt,
  onManualFlush,
}) => {
  const [showQueueDetails, setShowQueueDetails] = useState(false);
  const pendingCount = offlineQueue.length;

  if (isOnline && pendingCount === 0) {
    // Return subtle status indicator that can be shown or expanded
    return null;
  }

  return (
    <>
      <div
        className={`w-full px-4 py-2 border-b text-xs flex items-center justify-between gap-3 transition-colors ${
          !isOnline
            ? 'bg-amber-500 text-slate-950 font-medium border-amber-600 shadow-sm'
            : isSyncing
            ? 'bg-teal-600 text-white font-medium border-teal-700 animate-pulse'
            : 'bg-emerald-600 text-white font-medium border-emerald-700'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {!isOnline ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping inline-block" />
              <div className="flex items-center gap-1.5 font-bold">
                <WifiOff className="w-4 h-4 text-slate-950" />
                <span>Mode Offline Aktif</span>
              </div>
              <span className="text-slate-900 text-[11px]">
                | Kasir &amp; stok tetap beroperasi normal.
                {pendingCount > 0 ? (
                  <strong className="ml-1 underline cursor-pointer" onClick={() => setShowQueueDetails(true)}>
                    {pendingCount} transaksi tersimpan lokal (akan otomatis disinkronkan saat online).
                  </strong>
                ) : (
                  ' Data disimpan di cache IndexedDB perangkat.'
                )}
              </span>
            </>
          ) : isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span className="font-bold">Sinkronisasi Data Dua Arah Berjalan...</span>
              <span className="text-teal-100 text-[11px]">
                Memproses {pendingCount} antrean offline ke cloud database.
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span className="font-bold">Koneksi Daring Dipulihkan</span>
              <span className="text-emerald-100 text-[11px]">
                {pendingCount} antrean data offline siap disinkronkan.
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => setShowQueueDetails(true)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold border transition ${
                !isOnline
                  ? 'bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 border-slate-950/30'
                  : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
              }`}
            >
              Lihat Antrean ({pendingCount})
            </button>
          )}

          {isOnline && pendingCount > 0 && (
            <button
              type="button"
              disabled={isSyncing}
              onClick={onManualFlush}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white text-teal-800 hover:bg-teal-50 font-bold rounded shadow-sm text-[11px] transition"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              Sinkronkan Sekarang
            </button>
          )}
        </div>
      </div>

      {/* Offline Queue Modal */}
      {showQueueDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Antrean Background Sync Offline</h3>
                  <p className="text-[10px] text-slate-500">
                    {pendingCount} transaksi/perubahan menunggu koneksi online
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQueueDetails(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-3 flex-1 overflow-y-auto space-y-2">
              {offlineQueue.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Tidak ada antrean data offline. Semua data telah sinkron!
                </div>
              ) : (
                offlineQueue.map((item, idx) => (
                  <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-500 text-white inline-flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        {item.type}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1">{item.description}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowQueueDetails(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>

              {isOnline && pendingCount > 0 && (
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={() => {
                    onManualFlush();
                    setShowQueueDetails(false);
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sinkronkan Sekarang
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
