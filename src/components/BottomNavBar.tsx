import React, { useState } from 'react';
import {
  Home,
  Package,
  Store,
  Receipt,
  Settings,
  X,
  CreditCard,
  Truck,
  LineChart,
  Tag,
  Barcode,
  Menu,
  ChevronRight,
} from 'lucide-react';
import { MainTabType } from '../types';

interface BottomNavBarProps {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  lowStockCount: number;
  kasbonActiveCount: number;
  onOpenBarcodeScanModal?: () => void;
  onOpenSidebar?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  lowStockCount,
  kasbonActiveCount,
  onOpenBarcodeScanModal,
  onOpenSidebar,
}) => {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Tab mapping checks
  const isDashActive = activeTab === 'keuangan';
  const isProdukActive = activeTab === 'inventaris';
  const isKasirActive = activeTab === 'pos';
  const isTransaksiActive = activeTab === 'riwayat';
  const isSettingsActive = ['kasbon', 'supplier', 'master_harga'].includes(activeTab);

  return (
    <>
      {/* Backdrop for Drawer */}
      {showSettingsDrawer && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in"
          onClick={() => setShowSettingsDrawer(false)}
        />
      )}

      {/* Settings & Extra Menu Bottom Sheet Drawer */}
      {showSettingsDrawer && (
        <div className="fixed bottom-20 left-0 right-0 w-full z-50 px-3 pb-2 md:hidden animate-in slide-in-from-bottom-5">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Pengaturan & Menu Manajemen</h4>
                <p className="text-[11px] text-gray-500">Pilih menu untuk mengelola toko Anda</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsDrawer(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Kasbon / Hutang */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('kasbon');
                  setShowSettingsDrawer(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-colors ${
                  activeTab === 'kasbon'
                    ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                    : 'bg-gray-50/70 border-gray-200/80 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Catatan Kasbon & Piutang</div>
                    <div className="text-[10px] text-gray-500">Buku utang-piutang pelanggan</div>
                  </div>
                </div>
                {kasbonActiveCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                    {kasbonActiveCount} Aktif
                  </span>
                )}
              </button>

              {/* Penerimaan Supplier */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('supplier');
                  setShowSettingsDrawer(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-colors ${
                  activeTab === 'supplier'
                    ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                    : 'bg-gray-50/70 border-gray-200/80 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Supplier & Faktur Masuk</div>
                    <div className="text-[10px] text-gray-500">Penerimaan sembako dari distributor</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              {/* Master Harga */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('master_harga');
                  setShowSettingsDrawer(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-colors ${
                  activeTab === 'master_harga'
                    ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                    : 'bg-gray-50/70 border-gray-200/80 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Master Harga & Grosir</div>
                    <div className="text-[10px] text-gray-500">Kelola harga beli (HPP), eceran, & grosir</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              {/* Barcode Scanner */}
              {onOpenBarcodeScanModal && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsDrawer(false);
                    onOpenBarcodeScanModal();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-600 text-white">
                      <Barcode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Buka Kamera Scan Barcode</div>
                      <div className="text-[10px] text-emerald-700">Pindai barcode kemasan barang</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Custom Bottom Navigation Bar for Mobile (HP) */}
      <nav
        role="navigation"
        aria-label="Navigasi Bawah HP"
        className="fixed bottom-0 left-0 right-0 w-full z-40 bg-white border-t border-gray-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-end justify-items-center pt-2 pb-2 px-1">
          {/* 1. DASHBOARD / RINGKASAN */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('keuangan');
              setShowSettingsDrawer(false);
            }}
            className="flex flex-col items-center justify-center w-full cursor-pointer group"
          >
            <div
              className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
                isDashActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Home className="w-6 h-6 stroke-[2]" />
            </div>
            <span
              className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
                isDashActive
                  ? 'text-blue-600 font-bold'
                  : 'text-gray-400 font-medium'
              }`}
            >
              Dash
            </span>
          </button>

          {/* 2. PRODUK / STOK */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('inventaris');
              setShowSettingsDrawer(false);
            }}
            className="flex flex-col items-center justify-center w-full cursor-pointer relative group"
          >
            <div
              className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center relative ${
                isProdukActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Package className="w-6 h-6 stroke-[2]" />
              {lowStockCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                  {lowStockCount > 9 ? '9+' : lowStockCount}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
                isProdukActive
                  ? 'text-blue-600 font-bold'
                  : 'text-gray-400 font-medium'
              }`}
            >
              Produk
            </span>
          </button>

          {/* 3. CENTER FLOATING BUTTON: KASIR */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('pos');
              setShowSettingsDrawer(false);
            }}
            className="flex flex-col items-center justify-center w-full -mt-6 cursor-pointer z-10"
          >
            <div className="w-16 h-16 rounded-full bg-blue-500 text-white shadow-[0_8px_20px_rgba(59,130,246,0.4)] ring-4 ring-white flex items-center justify-center transition-transform active:scale-95 hover:bg-blue-600">
              <Store className="w-8 h-8 text-white stroke-[2]" />
            </div>
            <span
              className={`text-xs mt-1 tracking-tight transition-colors ${
                isKasirActive
                  ? 'text-blue-600 font-bold'
                  : 'text-blue-600 font-bold'
              }`}
            >
              Kasir
            </span>
          </button>

          {/* 4. TRANSAKSI / RIWAYAT */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('riwayat');
              setShowSettingsDrawer(false);
            }}
            className="flex flex-col items-center justify-center w-full cursor-pointer group"
          >
            <div
              className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
                isTransaksiActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Receipt className="w-6 h-6 stroke-[2]" />
            </div>
            <span
              className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
                isTransaksiActive
                  ? 'text-blue-600 font-bold'
                  : 'text-gray-400 font-medium'
              }`}
            >
              Transaksi
            </span>
          </button>

          {/* 5. PENGATURAN / MORE MENU */}
          <button
            type="button"
            onClick={() => {
              setShowSettingsDrawer((prev) => !prev);
            }}
            className="flex flex-col items-center justify-center w-full cursor-pointer relative group"
          >
            <div
              className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center relative ${
                isSettingsActive || showSettingsDrawer
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Settings className="w-6 h-6 stroke-[2]" />
              {kasbonActiveCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                  {kasbonActiveCount > 9 ? '9+' : kasbonActiveCount}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
                isSettingsActive || showSettingsDrawer
                  ? 'text-blue-600 font-bold'
                  : 'text-gray-400 font-medium'
              }`}
            >
              Pengaturan
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
