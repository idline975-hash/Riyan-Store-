import React from 'react';
import {
  ShoppingBag,
  Clock,
  CreditCard,
  Boxes,
  Truck,
  LineChart,
  Tag,
  X,
} from 'lucide-react';
import { MainTabType } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  lowStockCount: number;
  kasbonActiveCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  lowStockCount,
  kasbonActiveCount,
}) => {
  const menuItems: { id: MainTabType; label: string; icon: any }[] = [
    { id: 'pos', label: 'Kasir (POS)', icon: ShoppingBag },
    { id: 'history', label: 'Riwayat Transaksi', icon: Clock },
    { id: 'kasbon', label: `Kasbon (${kasbonActiveCount})`, icon: CreditCard },
    { id: 'inventory', label: `Stok (${lowStockCount})`, icon: Boxes },
    { id: 'supplier', label: 'Supplier', icon: Truck },
    { id: 'keuangan', label: 'Keuangan', icon: LineChart },
    { id: 'master_harga', label: 'Harga', icon: Tag },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="text-sm font-bold text-gray-900">Menu Utama</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-colors ${
                activeTab === item.id
                  ? 'bg-teal-800 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
