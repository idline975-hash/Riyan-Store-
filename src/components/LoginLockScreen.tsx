import React, { useState } from 'react';
import {
  Store,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  MapPin,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface LoginLockScreenProps {
  onLogin: (userName: string) => void;
}

export const LoginLockScreen: React.FC<LoginLockScreenProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'owner' | 'cashier'>('owner');

  const defaultPin = '1234';

  const handleUnlock = (enteredPin?: string) => {
    const pinToVerify = enteredPin !== undefined ? enteredPin : pin;
    
    // Accept either defaultPin or allow empty/direct click for ease of use in POS,
    // but if PIN was typed and doesn't match defaultPin, show helpful notice with quick bypass
    if (pinToVerify && pinToVerify !== defaultPin && pinToVerify.length > 0) {
      sound.playError();
      setErrorMsg(`PIN salah. Gunakan PIN default: ${defaultPin} atau klik "Buka Sesi Cepat"`);
      return;
    }

    sound.playSuccess();
    const userName = selectedRole === 'owner' ? 'Pemilik Toko (Riyan)' : 'Kasir Riyan Store';
    onLogin(userName);
  };

  const handleKeypadPress = (val: string) => {
    setErrorMsg(null);
    if (pin.length < 6) {
      const next = pin + val;
      setPin(next);
      if (next.length === 4) {
        // Auto-check on 4 digits
        if (next === defaultPin) {
          setTimeout(() => handleUnlock(next), 150);
        }
      }
    }
  };

  const handleKeypadBackspace = () => {
    setErrorMsg(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setErrorMsg(null);
    setPin('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Decorative background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1.5 text-teal-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Sistem Manajemen Toko Sembako</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
          <Lock className="w-3 h-3 text-amber-400" />
          <span className="text-gray-300 text-[11px]">Sesi Terkunci</span>
        </div>
      </div>

      {/* Main Lock Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-md">
          {/* Brand Icon & Name */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-16 h-16 bg-teal-800 text-teal-200 rounded-2xl mx-auto flex items-center justify-center shadow-lg border border-teal-700/50">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">RIYAN STORE</h1>
              <div className="flex items-center justify-center gap-1 text-xs text-teal-400 mt-1 font-medium">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Kp. Barani RT 011 RW 04 Desa Sangiang, Pamarayan</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Masuk atau buka sesi untuk mengelola stok, kasir POS & keuangan
              </p>
            </div>
          </div>

          {/* User / Role Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-2xl border border-slate-700 mb-5">
            <button
              type="button"
              onClick={() => setSelectedRole('owner')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRole === 'owner'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Pemilik Toko (Riyan)
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('cashier')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRole === 'cashier'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Kasir Toko
            </button>
          </div>

          {/* Quick 1-Click Login Button */}
          <button
            type="button"
            onClick={() => handleUnlock(defaultPin)}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer mb-4 active:scale-[0.99]"
          >
            <Unlock className="w-4 h-4" />
            <span>Buka Sesi Sebagai {selectedRole === 'owner' ? 'Riyan (Pemilik)' : 'Kasir'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-700 w-full"></div>
            <span className="bg-slate-800 px-3 text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              atau masukkan PIN
            </span>
          </div>

          {/* PIN Input Form */}
          <div className="space-y-3">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setErrorMsg(null);
                  setPin(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUnlock();
                  }
                }}
                placeholder="Masukkan PIN (Default: 1234)"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-center font-mono text-sm tracking-widest text-white placeholder:text-gray-500 placeholder:tracking-normal placeholder:text-xs focus:outline-hidden focus:border-teal-500"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer p-1"
                title={showPin ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-1.5 p-2 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            {/* Numeric Keypad for fast touchscreen POS operation */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 active:bg-slate-600 font-mono text-base font-bold text-gray-100 transition-colors cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeypadClear}
                className="py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-xs font-semibold text-gray-400 transition-colors cursor-pointer"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 active:bg-slate-600 font-mono text-base font-bold text-gray-100 transition-colors cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-xs font-semibold text-gray-400 transition-colors cursor-pointer"
              >
                ←
              </button>
            </div>

            {/* Submit PIN Button */}
            {pin.length > 0 && (
              <button
                type="button"
                onClick={() => handleUnlock()}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Buka Sesi dengan PIN Ini</span>
              </button>
            )}
          </div>
        </div>

        {/* Security / Help Note */}
        <div className="text-center mt-4 text-[11px] text-gray-400">
          <span>PIN Bawaan Pabrik: </span>
          <span className="font-mono font-bold text-teal-400 bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-700">
            1234
          </span>
          <span className="block mt-1 text-gray-500">
            Data transaksi, stok sembako, dan kasbon aman tersimpan di perangkat.
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center text-xs text-gray-500 pt-2 border-t border-slate-800">
        RIYAN STORE © 2026 — Desa Sangiang, Pamarayan
      </div>
    </div>
  );
};
