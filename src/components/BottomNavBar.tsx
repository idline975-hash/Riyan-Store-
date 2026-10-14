import React, { useState } from 'react';
import {
  ShoppingBag,
  Clock,
  CreditCard,
  Boxes,
  LayoutGrid,
  Truck,
  LineChart,
  Tag,
  Barcode,
  X,
  ChevronUp,
} from 'lucide-react';
import { MainTabType } from '../types';

interface BottomNavBarProps {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  lowStockCount: number;
  kasbonActiveCount: number;
  onOpenBarcodeScanModal?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  lowStockCount,
  kasbonActiveCount,
  onOpenBarcodeScanModal,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const isMoreTabActive = ['supplier', 'keuangan', 'master_harga'].includes(activeTab);

  const getMoreTabLabel = () => {
    switch (activeTab) {
      case 'supplier':
        return 'Supplier';
      case 'keuangan':
        return 'Keuangan';
      case 'master_harga':
        return 'Harga';
      default:
        return 'Menu';
    }
  };

  const getMoreTabIcon = () => {
    switch (activeTab) {
      case 'supplier':
        return Truck;
      case 'keuangan':
        return LineChart;
      case 'master_harga':
        return Tag;
      default:
        return LayoutGrid;
    }
  };

  const MoreIcon = getMoreTabIcon();

  return (
    <>
      {/* Backdrop for More Menu on Mobile */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setShowMoreMenu(false)}
        />
      )}

      {/* Popover / Bottom Sheet for Extra Tabs */}
      {showMoreMenu && (
        <div className="fixed bottom-16 left-0 right-0 w-full max-w-full z-45 px-3 pb-2 md:hidden animate-in slide-in-from-bottom-5">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Menu Manajemen Toko
              </span>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onSelectTab('supplier');
                  setShowMoreMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors ${
                  activeTab === 'supplier'
                    ? 'bg-teal-800 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Truck className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-bold">Penerimaan & Hutang Supplier</div>
                  <div className={`text-[11px] ${activeTab === 'supplier' ? 'text-teal-200' : 'text-gray-500'}`}>
                    Faktur masuk & jatuh tempo supplier
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('keuangan');
                  setShowMoreMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors ${
                  activeTab === 'keuangan'
                    ? 'bg-teal-800 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <LineChart className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-bold">Ringkasan Keuangan Toko</div>
                  <div className={`text-[11px] ${activeTab === 'keuangan' ? 'text-teal-200' : 'text-gray-500'}`}>
                    Omset, laba kotor, dan arus kas harian
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('master_harga');
                  setShowMoreMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors ${
                  activeTab === 'master_harga'
                    ? 'bg-teal-800 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Tag className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-bold">Master Harga (HPP & Grosir)</div>
                  <div className={`text-[11px] ${activeTab === 'master_harga' ? 'text-teal-200' : 'text-gray-500'}`}>
                    Pengaturan harga ecer, grosir, dan margin
                  </div>
                </div>
              </button>

              {onOpenBarcodeScanModal && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenBarcodeScanModal();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors mt-1"
                >
                  <Barcode className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <div className="flex-1">
                    <div className="font-bold">Buka Kamera Scan Barcode</div>
                    <div className="text-[11px] text-emerald-600">
                      Pindai kemasan barang langsung via kamera HP
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edge-to-Edge Fixed Mobile Bottom Navigation Bar */}
      <nav
        role="navigation"
        aria-label="Navigasi Bawah Ponsel"
        className="fixed bottom-0 left-0 right-0 w-full max-w-full z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] md:hidden pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="w-full max-w-full px-2 py-1.5 flex items-center justify-around">
          {/* Kasir POS */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('pos');
              setShowMoreMenu(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'pos'
                ? 'text-teal-800 font-bold'
                : 'text-gray-500 hover:text-gray-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${activeTab === 'pos' ? 'bg-teal-100 text-teal-800' : ''}`}>
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Kasir POS</span>
          </button>

          {/* Riwayat */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('riwayat');
              setShowMoreMenu(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'riwayat'
                ? 'text-teal-800 font-bold'
                : 'text-gray-500 hover:text-gray-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${activeTab === 'riwayat' ? 'bg-teal-100 text-teal-800' : ''}`}>
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Riwayat</span>
          </button>

          {/* Kasbon / Hutang */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('kasbon');
              setShowMoreMenu(false);
            }}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'kasbon'
                ? 'text-teal-800 font-bold'
                : 'text-gray-500 hover:text-gray-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors relative ${activeTab === 'kasbon' ? 'bg-teal-100 text-teal-800' : ''}`}>
              <CreditCard className="w-5 h-5" />
              {kasbonActiveCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {kasbonActiveCount > 9 ? '9+' : kasbonActiveCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Kasbon</span>
          </button>

          {/* Stok & Inventaris */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('inventaris');
              setShowMoreMenu(false);
            }}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'inventaris'
                ? 'text-teal-800 font-bold'
                : 'text-gray-500 hover:text-gray-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors relative ${activeTab === 'inventaris' ? 'bg-teal-100 text-teal-800' : ''}`}>
              <Boxes className="w-5 h-5" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {lowStockCount > 9 ? '9+' : lowStockCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Stok</span>
          </button>

          {/* Menu Lainnya */}
          <button
            type="button"
            onClick={() => setShowMoreMenu((prev) => !prev)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              isMoreTabActive || showMoreMenu
                ? 'text-teal-800 font-bold'
                : 'text-gray-500 hover:text-gray-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors relative ${isMoreTabActive || showMoreMenu ? 'bg-teal-100 text-teal-800' : ''}`}>
              <MoreIcon className="w-5 h-5" />
              {showMoreMenu && (
                <ChevronUp className="w-3 h-3 absolute -top-1 -right-1 text-teal-800" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{getMoreTabLabel()}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
