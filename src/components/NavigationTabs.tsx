import React, { useRef } from 'react';
import {
  ShoppingBag,
  Clock,
  CreditCard,
  Boxes,
  Truck,
  LineChart,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MainTabType } from '../types';

interface NavigationTabsProps {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  lowStockCount: number;
  kasbonActiveCount: number;
  expiringCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  lowStockCount,
  kasbonActiveCount,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const tabs: {
    id: MainTabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'pos',
      label: 'Kasir (POS)',
      icon: ShoppingBag,
    },
    {
      id: 'riwayat',
      label: 'Riwayat Hari Ini',
      icon: Clock,
    },
    {
      id: 'kasbon',
      label: 'Kasbon / Hutang Pelanggan',
      icon: CreditCard,
      badge: kasbonActiveCount > 0 ? kasbonActiveCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'inventaris',
      label: 'Stok & Inventaris Sembako',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'supplier',
      label: 'Penerimaan & Hutang Supplier',
      icon: Truck,
    },
    {
      id: 'keuangan',
      label: 'Ringkasan Keuangan',
      icon: LineChart,
    },
    {
      id: 'master_harga',
      label: 'Master Harga (HPP/Grosir)',
      icon: Tag,
    },
  ];

  return (
    <div className="w-full max-w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 relative flex items-center">
        {/* Scroll Left */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 md:hidden flex-shrink-0"
          title="Geser Kiri"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Tabs */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1 overflow-x-auto py-2 px-1 scrollbar-none no-scrollbar flex-1"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-200' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                      isActive ? 'bg-teal-600 text-white' : tab.badgeColor || 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scroll Right */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 md:hidden flex-shrink-0"
          title="Geser Kanan"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
