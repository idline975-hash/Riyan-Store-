import React, { useState, useEffect } from 'react';
import {
  Store,
  Cloud,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Trash2,
  Sparkles,
  AlertTriangle,
  MapPin,
  Monitor,
  ZoomIn,
  ZoomOut,
  Clock,
  Smartphone,
  Download,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { CloudSyncState } from '../utils/cloudSync';

interface HeaderProps {
  cashierSessionOpen: boolean;
  onToggleCashierSession: () => void;
  cloudSyncState: CloudSyncState;
  onManualSync: () => void;
  onClearAllData: () => void;
  onLoadSampleData: () => void;
  itemCount: number;
  onLogout: () => void;
  isDesktopMode: boolean;
  onToggleDesktopMode: () => void;
  zoomScale: number;
  onSetZoomScale: (scale: number) => void;
  isOnline?: boolean;
  isPWAInstallable?: boolean;
  isPWAInstalled?: boolean;
  onPromptPWAInstall?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cashierSessionOpen,
  onToggleCashierSession,
  cloudSyncState,
  onManualSync,
  onClearAllData,
  onLoadSampleData,
  itemCount,
  onLogout,
  isDesktopMode,
  onToggleDesktopMode,
  zoomScale,
  onSetZoomScale,
  isOnline = true,
  isPWAInstallable = false,
  isPWAInstalled = false,
  onPromptPWAInstall,
}) => {
  const [showSyncTooltip, setShowSyncTooltip] = useState(false);
  const [showConfirmClearModal, setShowConfirmClearModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Real-time digital clock
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full max-w-full bg-white border-b border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Store Identity */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-800 text-white rounded-2xl flex items-center justify-center shadow-xs flex-shrink-0">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-gray-900">RIYAN STORE</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                Pemilik (Admin)
              </span>

              {/* Cloud Realtime Status Badge */}
              <button
                type="button"
                onClick={onManualSync}
                onMouseEnter={() => setShowSyncTooltip(true)}
                onMouseLeave={() => setShowSyncTooltip(false)}
                className="relative inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Klik untuk sinkronisasi paksa ke Cloud"
              >
                <span className="relative flex h-2 w-2">
                  {cloudSyncState.status === 'syncing' ? (
                    <span className="animate-spin h-2 w-2 rounded-full border border-emerald-600 border-t-transparent"></span>
                  ) : (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </>
                  )}
                </span>
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {cloudSyncState.status === 'syncing'
                    ? 'Sinkronisasi...'
                    : 'Cloud Realtime'}
                </span>
                <RefreshCw
                  className={`w-3 h-3 text-emerald-600 ${
                    cloudSyncState.status === 'syncing' ? 'animate-spin' : ''
                  }`}
                />

                {/* Cloud Sync Tooltip */}
                {showSyncTooltip && (
                  <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-gray-900 text-white text-xs rounded-lg p-2.5 shadow-xl border border-gray-700">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Data Tersinkronisasi Cloud
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed">
                      Inventaris, mutasi stok, dan kasir terhubung cloud realtime. Latensi: ~
                      {cloudSyncState.latencyMs}ms.
                    </p>
                    <div className="mt-1.5 text-[10px] text-gray-400 border-t border-gray-800 pt-1 flex justify-between">
                      <span>Perubahan tertunda: {cloudSyncState.pendingChanges}</span>
                      <span className="text-emerald-300">Klik untuk re-sync</span>
                    </div>
                  </div>
                )}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-teal-900 mt-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <span>Kp. Barani RT 011 RW 04 Desa Sangiang, Pamarayan</span>
            </div>
            <p className="text-[11px] text-gray-500">Sistem Manajemen Sembako Terintegrasi</p>
          </div>
        </div>

        {/* Right Controls: Desktop Mode, Zoom Scale, Clock, Session, Data & Logout */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
          {/* Real-time Clock (Desktop POS aesthetic) */}
          {currentTime && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-semibold border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentTime} WIB</span>
            </div>
          )}

          {/* Desktop Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDesktopMode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              isDesktopMode
                ? 'bg-teal-900 text-white border-teal-700 shadow-xs'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
            title="Beralih ke Tampilan Desktop Layar Lebar POS Workstation"
          >
            <Monitor className={`w-3.5 h-3.5 ${isDesktopMode ? 'text-teal-300' : 'text-gray-500'}`} />
            <span>Mode Desktop: {isDesktopMode ? 'AKTIF' : 'OFF'}</span>
          </button>

          {/* Scale / Perkecil Tampilan Controller */}
          <div className="inline-flex items-center bg-gray-50 border border-gray-300 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => onSetZoomScale(Math.max(0.60, Number((zoomScale - 0.05).toFixed(2))))}
              className="px-2 py-1 text-gray-700 hover:bg-gray-200 rounded text-xs font-bold cursor-pointer transition-colors"
              title="Perkecil Tampilan (-5%)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="px-2 text-center">
              <span className="font-mono font-bold text-xs text-gray-800">
                {Math.round(zoomScale * 100)}%
              </span>
              <span className="hidden lg:inline text-[10px] text-teal-700 font-semibold ml-1">
                (Perkecil)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSetZoomScale(Math.min(1.25, Number((zoomScale + 0.05).toFixed(2))))}
              className="px-2 py-1 text-gray-700 hover:bg-gray-200 rounded text-xs font-bold cursor-pointer transition-colors"
              title="Perbesar Tampilan (+5%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {/* Quick Presets */}
            <div className="hidden xl:flex items-center gap-0.5 border-l border-gray-200 pl-1 ml-1">
              {[0.75, 0.85, 0.90, 1.0].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onSetZoomScale(preset)}
                  className={`px-1.5 py-0.5 text-[10px] rounded font-semibold transition-colors cursor-pointer ${
                    Math.abs(zoomScale - preset) < 0.02
                      ? 'bg-teal-700 text-white'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {Math.round(preset * 100)}%
                </button>
              ))}
            </div>
          </div>

          {/* Online / Offline Connectivity Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
            }`}
            title={isOnline ? 'Terhubung ke Jaringan (Realtime Cloud)' : 'Mode Offline — Data tersimpan di perangkat'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* PWA Install Button or PWA Standalone Badge */}
          {isPWAInstallable && onPromptPWAInstall ? (
            <button
              type="button"
              onClick={onPromptPWAInstall}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-xs transition-colors cursor-pointer active:scale-95"
              title="Pasang aplikasi langsung ke layar utama perangkat (PWA)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pasang PWA</span>
            </button>
          ) : isPWAInstalled ? (
            <div
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200"
              title="Aplikasi berjalan dalam mode PWA Standalone di layar utama"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-600" />
              <span>PWA Terpasang</span>
            </div>
          ) : null}

          {/* Sesi Kasir Status Button */}
          <button
            type="button"
            onClick={onToggleCashierSession}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              cashierSessionOpen
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                cashierSessionOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            ></span>
            <span>Sesi Kasir: {cashierSessionOpen ? 'Dibuka' : 'Ditutup'}</span>
          </button>

          {/* Kosongkan Semua Data Button */}
          {itemCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowConfirmClearModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Kosongkan seluruh data inventaris dan riwayat"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Data</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onLoadSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
              title="Isi contoh data sembako untuk demo"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Muat Data Contoh</span>
            </button>
          )}

          {/* User Profile */}
          <div className="text-right hidden lg:block border-l border-gray-200 pl-2">
            <div className="text-xs font-semibold text-gray-800">Pemilik Toko (Riyan)</div>
            <div className="text-[11px] text-gray-400">@RIYAN</div>
          </div>

          {/* Logout / Keluar Button */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 border border-gray-200 transition-colors cursor-pointer"
            title="Keluar atau kunci sesi manajemen toko"
          >
            <LogOut className="w-3.5 h-3.5 text-gray-500 group-hover:text-rose-600" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Modal Konfirmasi Keluar / Kunci Sesi */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Keluar dari Sesi Toko?</h3>
                <p className="text-xs text-gray-500">RIYAN STORE — Kp. Barani</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Sesi kasir dan manajemen toko Anda akan dikunci untuk keamanan. Anda dapat masuk kembali kapan saja dengan PIN Anda.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Kunci & Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Kosongkan Semua Data */}
      {showConfirmClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-rose-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Kosongkan Semua Data Toko?</h3>
                <p className="text-xs text-gray-500">Tindakan ini akan menghapus seluruh data yang sudah di-input.</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
              <div className="font-bold">Data yang akan dikosongkan meliputi:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700">
                <li>Seluruh katalog barang sembako & sisa stok</li>
                <li>Riwayat transaksi penjualan kasir hari ini</li>
                <li>Buku catatan kasbon & piutang pelanggan</li>
                <li>Faktur penerimaan barang & hutang supplier</li>
                <li>Riwayat stock opname dan barang rusak</li>
                <li>Keranjang belanja kasir</li>
              </ul>
            </div>

            <p className="text-xs text-gray-500">
              Setelah dikosongkan, Anda dapat langsung mulai menginput data barang sembako Anda yang sebenarnya secara bersih.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmClearModal(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmClearModal(false);
                  onClearAllData();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ya, Kosongkan Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
