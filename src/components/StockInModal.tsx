import React, { useState } from 'react';
import { X, ArrowDownCircle, Check, Calendar } from 'lucide-react';
import { SembakoItem } from '../types';
import { formatRupiah } from '../utils/cloudSync';
import { sound } from '../utils/audio';

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SembakoItem | null;
  onConfirmRestock: (itemId: string, addQty: number, newBuyPrice?: number, newExpiry?: string) => void;
}

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirmRestock,
}) => {
  const [addQty, setAddQty] = useState<number>(10);
  const [buyPrice, setBuyPrice] = useState<number>(item?.buyPrice || 10000);
  const [expiryDate, setExpiryDate] = useState<string>(item?.expiryDate || '2027-06-30');

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addQty <= 0) return;
    sound.playItemAdded();
    onConfirmRestock(item.id, addQty, buyPrice, expiryDate);
    onClose();
  };

  const totalCost = addQty * buyPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-teal-900 text-white">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-teal-300" />
            <h3 className="font-bold text-sm">Penerimaan Barang Masuk (Restock)</h3>
          </div>
          <button type="button" onClick={onClose} className="text-teal-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-teal-50/70 p-3 rounded-xl border border-teal-200">
            <div className="text-xs text-teal-700 font-mono">Barcode: {item.barcode}</div>
            <div className="font-bold text-gray-900 text-base">{item.name}</div>
            <div className="text-xs text-gray-600 mt-0.5">
              Stok Saat Ini: <span className="font-bold text-teal-800">{item.stock} {item.unitBase}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Jumlah Barang Masuk ({item.unitBase}) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={addQty}
              onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base font-bold text-teal-900 focus:ring-2 focus:ring-teal-500"
            />
            <div className="text-[11px] text-gray-500 mt-1">
              Stok setelah masuk: <span className="font-bold text-emerald-700">{item.stock + addQty} {item.unitBase}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Harga Modal Beli / HPP Baru (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={buyPrice}
              onChange={(e) => setBuyPrice(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold focus:ring-2 focus:ring-teal-500"
            />
            <div className="text-[11px] text-gray-500 mt-1">
              Total Nilai Pembelian: <span className="font-bold text-gray-800">{formatRupiah(totalCost)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              Tanggal Kadaluwarsa Batch Baru
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <Check className="w-4 h-4" />
              Simpan Stok Masuk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
