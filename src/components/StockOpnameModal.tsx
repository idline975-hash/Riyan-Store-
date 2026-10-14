import React, { useState } from 'react';
import { X, ClipboardCheck, AlertTriangle, Check } from 'lucide-react';
import { SembakoItem, StockOpnameLog } from '../types';

interface StockOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SembakoItem | null;
  onSaveOpname: (log: StockOpnameLog, newStock: number) => void;
}

export const StockOpnameModal: React.FC<StockOpnameModalProps> = ({
  isOpen,
  onClose,
  item,
  onSaveOpname,
}) => {
  const [physicalCount, setPhysicalCount] = useState<number>(item?.stock || 0);
  const [notes, setNotes] = useState('');

  if (!isOpen || !item) return null;

  const diff = physicalCount - item.stock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const log: StockOpnameLog = {
      id: `op-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      itemId: item.id,
      barcode: item.barcode,
      itemName: item.name,
      systemStock: item.stock,
      physicalStock: physicalCount,
      difference: diff,
      notes: notes.trim() || (diff === 0 ? 'Fisik cocok dengan sistem' : 'Penyesuaian stok fisik gudang'),
      officer: 'Pemilik Toko (Riyan)',
    };
    onSaveOpname(log, physicalCount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-teal-900 text-white">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-teal-300" />
            <h3 className="font-bold text-sm">Stock Opname / Penyesuaian Fisik</h3>
          </div>
          <button type="button" onClick={onClose} className="text-teal-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="text-xs text-gray-500 font-mono">Barcode: {item.barcode}</div>
            <div className="font-bold text-gray-900 text-base">{item.name}</div>
            <div className="text-xs text-gray-600 mt-0.5">
              Satuan: {item.unitBase} ({item.unitConversion})
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <div className="text-xs text-gray-500">Stok Sistem Saat Ini</div>
              <div className="text-xl font-bold text-gray-800">
                {item.stock} <span className="text-xs font-normal">{item.unitBase}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Selisih Fisik</div>
              <div
                className={`text-xl font-bold ${
                  diff === 0 ? 'text-gray-600' : diff > 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {diff > 0 ? `+${diff}` : diff} <span className="text-xs font-normal">{item.unitBase}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Hasil Hitung Fisik Sebenarnya ({item.unitBase}) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              value={physicalCount}
              onChange={(e) => setPhysicalCount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base font-bold focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan / Alasan Selisih</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: 1 pcs bocor, barang terselip di rak belakang, dll."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-teal-500"
            ></textarea>
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
              Perbarui Stok Fisik
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
