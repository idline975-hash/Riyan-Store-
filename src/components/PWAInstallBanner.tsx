import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  X,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { PWAState } from '../hooks/usePWA';

interface PWAInstallBannerProps {
  pwa: PWAState;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ pwa }) => {
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // 1. Update Notification Toast (Automatic App Updates requirement)
  const renderUpdateToast = () => {
    if (!pwa.needRefresh) return null;

    return (
      <div className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-bounce">
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-4 rounded-xl shadow-2xl border border-teal-500/40 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0 text-teal-300">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold px-1.5 py-0.5 rounded bg-teal-500 text-slate-950">
                Pembaruan Sistem
              </span>
              <span className="text-xs text-teal-300 font-semibold">Versi Baru Siap</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Aset sistem terbaru telah diunduh di latar belakang. Muat ulang sekarang untuk menerapkan pembaruan tanpa kehilangan data kasir.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => pwa.updateApp()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Perbarui Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 2. In-App Install Prompt Banner (Android/Desktop/Chrome)
  const renderInstallBanner = () => {
    if (pwa.isInstalled || isBannerDismissed) return null;

    if (!pwa.isInstallable && !pwa.isIOS) return null;

    return (
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white px-4 py-3 border-b border-teal-500/30 flex items-center justify-between gap-3 flex-wrap relative z-40 transition shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                Pasang RIYAN STORE di Layar Utama (PWA)
              </span>
              <span className="text-[10px] bg-teal-500/30 text-teal-200 border border-teal-400/30 px-1.5 py-0.5 rounded-full font-semibold">
                Standalone App
              </span>
            </div>
            <p className="text-[11px] text-teal-200/80">
              Buka cepat tanpa browser, responsif instan, dan mendukung operasional kasir offline 100%.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pwa.isInstallable ? (
            <button
              type="button"
              onClick={async () => {
                await pwa.promptInstall();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-extrabold text-xs rounded-lg shadow-sm transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Pasang ke Home Screen
            </button>
          ) : pwa.isIOS ? (
            <button
              type="button"
              onClick={() => setShowIOSModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-lg shadow-sm transition"
            >
              <Share className="w-3.5 h-3.5" />
              Panduan Pasang di iPhone/iPad
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setIsBannerDismissed(true)}
            className="p-1.5 text-teal-300/70 hover:text-white rounded-lg hover:bg-white/10 transition"
            title="Tutup banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // 3. iOS Installation Guide Modal
  const renderIOSModal = () => {
    if (!showIOSModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Pasang di iPhone / iPad</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-3.5 text-xs text-slate-600">
            <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-semibold text-slate-800">Buka di Safari &amp; Ketuk Tombol Share</p>
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  Ketuk ikon Bagikan (<Share className="w-3.5 h-3.5 inline text-teal-600" />) pada bilah navigasi bawah Safari.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-semibold text-slate-800">Pilih "Tambah ke Layar Utama"</p>
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  Geser menu dan pilih opsi <PlusSquare className="w-3.5 h-3.5 inline text-teal-600" /> "Add to Home Screen".
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-semibold text-slate-800">Ketuk "Tambah" (Add)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ikon aplikasi Riyan Store akan langsung muncul di layar beranda iOS Anda seperti aplikasi App Store.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowIOSModal(false)}
            className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            Mengerti &amp; Tutup
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderUpdateToast()}
      {renderInstallBanner()}
      {renderIOSModal()}
    </>
  );
};
