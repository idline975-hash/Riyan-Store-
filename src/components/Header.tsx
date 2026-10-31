import React from 'react';
import { Store, MapPin } from 'lucide-react';

export interface HeaderProps {
  onOpenSidebar?: () => void;
  cashierSessionOpen?: boolean;
  onToggleCashierSession?: () => void;
  cloudSyncState?: any;
  onManualSync?: () => void;
  onClearAllData?: () => void;
  onLoadSampleData?: () => void;
  itemCount?: number;
  onLogout?: () => void;
  isDesktopMode?: boolean;
  onToggleDesktopMode?: () => void;
  zoomScale?: number;
  onSetZoomScale?: (scale: number) => void;
  isOnline?: boolean;
  isPWAInstallable?: boolean;
  isPWAInstalled?: boolean;
  onPromptPWAInstall?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="w-full max-w-full bg-white border-b border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Store Identity */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-teal-800 text-white rounded-2xl flex items-center justify-center shadow-xs flex-shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-tight">RIYAN STORE</h1>
            <div className="flex items-center gap-1 text-xs text-teal-800 font-medium mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <span>Kp. Barani RT 011 RW 04 Desa Sangiang, Pamarayan</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

