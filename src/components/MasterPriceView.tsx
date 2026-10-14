import React, { useState } from 'react';
import { Tag, Search, Check, TrendingUp, DollarSign } from 'lucide-react';
import { SembakoItem } from '../types';
import { formatRupiah } from '../utils/cloudSync';
import { sound } from '../utils/audio';

interface MasterPriceViewProps {
  items: SembakoItem[];
  onUpdatePrices: (itemId: string, buyPrice: number, sellPrice: number, wholesalePrice: number, minWholesaleQty: number) => void;
}

export const MasterPriceView: React.FC<MasterPriceViewProps> = ({
  items,
  onUpdatePrices,
}) => {
  const [search, setSearch] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editBuyPrice, setEditBuyPrice] = useState(0);
  const [editSellPrice, setEditSellPrice] = useState(0);
  const [editWholesalePrice, setEditWholesalePrice] = useState(0);
  const [editMinQty, setEditMinQty] = useState(1);

  const startEdit = (item: SembakoItem) => {
    setEditingItemId(item.id);
    setEditBuyPrice(item.buyPrice);
    setEditSellPrice(item.sellPrice);
    setEditWholesalePrice(item.wholesalePrice);
    setEditMinQty(item.minWholesaleQty);
  };

  const saveEdit = (itemId: string) => {
    sound.playItemAdded();
    onUpdatePrices(itemId, editBuyPrice, editSellPrice, editWholesalePrice, editMinQty);
    setEditingItemId(null);
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.barcode.includes(search) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">
              Master Harga & Margin Keuntungan (HPP vs Eceran vs Grosir)
            </h3>
            <p className="text-xs text-gray-500">
              Kelola harga modal beli, patokan harga eceran warung, dan harga grosir per dus/karung
            </p>
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari barcode atau nama sembako..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">BARANG SEMBAKO</th>
                <th className="py-3 px-4">HARGA BELI (HPP)</th>
                <th className="py-3 px-4">HARGA ECERAN</th>
                <th className="py-3 px-4">MARGIN ECERAN</th>
                <th className="py-3 px-4">HARGA GROSIR</th>
                <th className="py-3 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => {
                const isEditing = editingItemId === item.id;
                const marginRp = item.sellPrice - item.buyPrice;
                const marginPercent = item.buyPrice > 0 ? ((marginRp / item.buyPrice) * 100).toFixed(1) : '0';

                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{item.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {item.barcode} • {item.unitBase} ({item.unitConversion})
                      </div>
                    </td>

                    {/* HPP */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="number"
                          step="500"
                          value={editBuyPrice}
                          onChange={(e) => setEditBuyPrice(parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md text-xs font-semibold"
                        />
                      ) : (
                        <span className="font-semibold text-gray-700">{formatRupiah(item.buyPrice)}</span>
                      )}
                    </td>

                    {/* Harga Ecer */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="number"
                          step="500"
                          value={editSellPrice}
                          onChange={(e) => setEditSellPrice(parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-teal-400 rounded-md text-xs font-bold text-emerald-700"
                        />
                      ) : (
                        <span className="font-bold text-emerald-700">{formatRupiah(item.sellPrice)}</span>
                      )}
                    </td>

                    {/* Margin */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        +{formatRupiah(marginRp)} ({marginPercent}%)
                      </span>
                    </td>

                    {/* Harga Grosir */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="500"
                            value={editWholesalePrice}
                            onChange={(e) => setEditWholesalePrice(parseInt(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-blue-400 rounded-md text-xs font-bold text-blue-700"
                          />
                          <span className="text-[10px] text-gray-500">Min:</span>
                          <input
                            type="number"
                            min="1"
                            value={editMinQty}
                            onChange={(e) => setEditMinQty(parseInt(e.target.value) || 1)}
                            className="w-12 px-1 py-1 border border-gray-300 rounded-md text-xs"
                          />
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold text-blue-700">{formatRupiah(item.wholesalePrice)}</span>
                          <span className="text-[10px] text-gray-500 block">
                            Min. Pembelian {item.minWholesaleQty} {item.unitBase}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => saveEdit(item.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Simpan
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Ubah Harga
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
