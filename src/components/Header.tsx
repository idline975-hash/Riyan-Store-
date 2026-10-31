import React from 'react';
import {
  Store,
  MapPin,
  ShoppingBag,
  Clock,
  CreditCard,
  Boxes,
  Truck,
  LineChart,
  Tag,
  Menu,
  Wifi,
  User,
} from 'lucide-react';
import { MainTabType } from '../types';

export interface HeaderProps {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  onOpenSidebar: () => void;
  lowStockCount?: number;
  kasbonActiveCount?: number;
  isOnline?: boolean;
  cashierName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenSidebar,
  lowStockCount = 0,
  kasbonActiveCount = 0,
  isOnline = true,
  cashierName = 'Riyan',
}) => {
  const navTabs: { id: MainTabType; label: string; icon: any; badge?: number }[] = [
    { id: 'pos', label: 'Kasir POS', icon: ShoppingBag },
    { id: 'riwayat', label: 'Riwayat', icon: Clock },
    { id: 'kasbon', label: 'Kasbon', icon: CreditCard, badge: kasbonActiveCount },
    { id: 'inventaris', label: 'Stok Sembako', icon: Boxes, badge: lowStockCount },
    { id: 'supplier', label: 'Supplier', icon: Truck },
    { id: 'keuangan', label: 'Keuangan', icon: LineChart },
    { id: 'master_harga', label: 'Master Harga', icon: Tag },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3">
        {/* Left: Hamburger & Brand Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/80 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
            title="Buka Menu Manajemen Lengkap"
            aria-label="Buka Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
            <span className="hidden sm:inline">Menu</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-teal-800 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xs flex-shrink-0">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-gray-950 leading-tight">
                  RIYAN STORE
                </h1>
                <span className="hidden xl:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  POS & Inventaris
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-teal-900 font-semibold mt-0.5 truncate max-w-[220px] sm:max-w-xs md:max-w-none">
                <MapPin className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                <span className="truncate">Kp. Barani RT 011 RW 04 Sangiang, Pamarayan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Bar (Direct Access on PC / Laptop / Tablet) */}
        <nav
          aria-label="Navigasi Desktop"
          className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80"
        >
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                  isActive
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-700 hover:text-teal-900 hover:bg-white/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-200' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-amber-400 text-teal-950'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Status Indicator & Cashier Profile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Status Online Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
            title={isOnline ? 'Terhubung ke cloud realtime' : 'Mode Offline'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="hidden sm:inline">{isOnline ? 'Online Realtime' : 'Offline'}</span>
          </div>

          {/* Cashier Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800">
            <User className="w-3.5 h-3.5 text-slate-600" />
            <span className="truncate max-w-[100px]">{cashierName}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
