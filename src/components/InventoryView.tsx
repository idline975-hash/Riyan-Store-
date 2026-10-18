import React, { useState, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  Calendar,
  Plus,
  Search,
  Barcode as BarcodeIcon,
  Filter,
  Edit2,
  Trash2,
  ArrowDownCircle,
  ClipboardCheck,
  AlertOctagon,
  Clock,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { SembakoItem, InventorySubTabType, StockOpnameLog, DamagedItemLog } from '../types';
import { formatRupiah, formatDateIndo, getDaysUntilExpiry } from '../utils/cloudSync';
import { CATEGORIES } from '../data/initialData';

interface InventoryViewProps {
  items: SembakoItem[];
  opnameLogs: StockOpnameLog[];
  damagedLogs: DamagedItemLog[];
  onOpenAddItem: () => void;
  onOpenEditItem: (item: SembakoItem) => void;
  onOpenRestock: (item: SembakoItem) => void;
  onOpenOpname: (item: SembakoItem) => void;
  onDeleteItem: (itemId: string) => void;
  onOpenBarcodeScanModal: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  items,
  opnameLogs,
  damagedLogs,
  onOpenAddItem,
  onOpenEditItem,
  onOpenRestock,
  onOpenOpname,
  onDeleteItem,
  onOpenBarcodeScanModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<InventorySubTabType>('katalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [itemToDelete, setItemToDelete] = useState<SembakoItem | null>(null);

  // Metrics
  const totalItemCount = items.length;
  
  const lowStockItems = useMemo(() => {
    return items.filter((item) => item.stock <= item.minStock);
  }, [items]);

  const expiringItems = useMemo(() => {
    return items.filter((item) => {
      const days = getDaysUntilExpiry(item.expiryDate);
      return days <= 30;
    });
  }, [items]);

  // Filtered Items for Catalog & Kadaluwarsa
  const filteredItems = useMemo(() => {
    let list = items;

    if (activeSubTab === 'kadaluwarsa') {
      list = expiringItems;
    }

    if (selectedCategory !== 'Semua') {
      list = list.filter((i) => i.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.barcode.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.supplier.toLowerCase().includes(q)
      );
    }

    return list;
  }, [items, activeSubTab, selectedCategory, searchQuery, expiringItems]);

  return (
    <div className="space-y-5">
      {/* 4 Metric / Action Cards matching the screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL JENIS BARANG */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              TOTAL JENIS BARANG
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {totalItemCount} <span className="text-sm font-semibold text-gray-600">Item</span>
            </div>
          </div>
        </div>

        {/* Card 2: STOK MENIPIS (≤ MIN) */}
        <div
          onClick={() => {
            setActiveSubTab('katalog');
            setSearchQuery('');
          }}
          className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4 cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              STOK MENIPIS (≤ MIN)
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-0.5">
              {lowStockItems.length} <span className="text-sm font-semibold text-amber-700">Item</span>
            </div>
          </div>
        </div>

        {/* Card 3: PERINGATAN KADALUWARSA (H-30) */}
        <div
          onClick={() => setActiveSubTab('kadaluwarsa')}
          className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4 cursor-pointer hover:border-rose-300 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              PERINGATAN KADALUWARSA (H-30)
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-0.5">
              {expiringItems.length} <span className="text-sm font-semibold text-rose-700">Item</span>
            </div>
          </div>
        </div>

        {/* Card 4: AKSI CEPAT */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              AKSI CEPAT
            </div>
          </div>
          <div className="text-xs text-gray-600 truncate mt-1">
            Petugas: <span className="font-semibold text-gray-900">Pemilik Toko (Riyan)</span>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onOpenAddItem}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Barang</span>
            </button>
            <button
              type="button"
              onClick={onOpenBarcodeScanModal}
              title="Scan barcode fisik untuk input atau restock kilat"
              className="inline-flex items-center justify-center p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors cursor-pointer"
            >
              <BarcodeIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('katalog')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'katalog'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Katalog Stok Sembako ({items.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('kadaluwarsa')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'kadaluwarsa'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Kadaluwarsa H-30 ({expiringItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('opname')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'opname'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Riwayat Stock Opname ({opnameLogs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rusak')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'rusak'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Barang Rusak / Retur ({damagedLogs.length})
        </button>
      </div>

      {/* Catalog & Kadaluwarsa View */}
      {(activeSubTab === 'katalog' || activeSubTab === 'kadaluwarsa') && (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
          {/* Search & Category Filter bar */}
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-gray-50/50">
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari barcode atau nama barang..."
                className="w-full pl-10 pr-10 py-2 bg-white rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 shadow-2xs"
              />
              <button
                type="button"
                onClick={onOpenBarcodeScanModal}
                title="Scan barcode via kamera untuk mencari langsung"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-teal-700"
              >
                <BarcodeIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-teal-800 text-white px-4 py-2 pr-8 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer shadow-xs hover:bg-teal-900 transition-colors focus:outline-hidden"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-white text-gray-900">
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Desktop & Tablet Workstation Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">BARANG SEMBAKO</th>
                  <th className="py-3 px-4">KATEGORI</th>
                  <th className="py-3 px-4">KONVERSI SATUAN</th>
                  <th className="py-3 px-4">SISA STOK</th>
                  <th className="py-3 px-4">KADALUWARSA</th>
                  <th className="py-3 px-4 text-center">AKSI GUDANG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <Boxes className="w-12 h-12 mx-auto text-gray-300 mb-2.5" />
                      {items.length === 0 ? (
                        <div className="max-w-md mx-auto space-y-2">
                          <p className="font-bold text-gray-700 text-sm">Inventaris Masih Kosong (0 Barang)</p>
                          <p className="text-xs text-gray-500">
                            Semua data telah dikosongkan. Mulai input data sembako toko Anda dengan memindai barcode atau menambah data secara manual.
                          </p>
                          <div className="flex justify-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={onOpenAddItem}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Tambah Barang Baru</span>
                            </button>
                            <button
                              type="button"
                              onClick={onOpenBarcodeScanModal}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <BarcodeIcon className="w-3.5 h-3.5 text-teal-700" />
                              <span>Scan Barcode Kemasan</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-gray-600">Tidak ada barang sembako yang cocok</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Coba sesuaikan kata kunci pencarian atau ganti filter kategori
                          </p>
                        </>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const daysLeft = getDaysUntilExpiry(item.expiryDate);
                    const isExpiring = daysLeft <= 30;
                    const isLowStock = item.stock <= item.minStock;

                    return (
                      <tr key={item.id} className="hover:bg-teal-50/20 transition-colors">
                        {/* BARANG SEMBAKO */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-sm">
                              {item.barcode}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              Modal: {formatRupiah(item.buyPrice)}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-700">
                              Jual: {formatRupiah(item.sellPrice)}
                            </span>
                          </div>
                        </td>

                        {/* KATEGORI */}
                        <td className="py-3.5 px-4">
                          <span className="inline-block bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium">
                            {item.category}
                          </span>
                        </td>

                        {/* KONVERSI SATUAN */}
                        <td className="py-3.5 px-4 text-gray-700">
                          <div className="font-medium">{item.unitConversion || `-`}</div>
                          <div className="text-[11px] text-gray-400">
                            Satuan Jual: {item.unitBase}
                          </div>
                        </td>

                        {/* SISA STOK */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-base font-bold ${
                                item.stock === 0
                                  ? 'text-rose-700'
                                  : isLowStock
                                  ? 'text-amber-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {item.stock} {item.unitBase}
                            </span>
                          </div>
                          {isLowStock && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-sm mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              Min: {item.minStock} {item.unitBase}
                            </span>
                          )}
                        </td>

                        {/* KADALUWARSA */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-gray-800">
                            {formatDateIndo(item.expiryDate)}
                          </div>
                          {isExpiring ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                                daysLeft <= 7
                                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {daysLeft < 0
                                ? 'Sudah Lewat'
                                : `${daysLeft} Hari Lagi`}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400">Aman</span>
                          )}
                        </td>

                        {/* AKSI GUDANG */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => onOpenRestock(item)}
                              title="Tambah Stok Masuk / Restock"
                              className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <ArrowDownCircle className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenOpname(item)}
                              title="Stock Opname / Sesuaikan Fisik"
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <ClipboardCheck className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenEditItem(item)}
                              title="Edit Data Barang"
                              className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemToDelete(item)}
                              title="Hapus Barang"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Card List (visible on small screens < md) */}
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredItems.length === 0 ? (
              <div className="py-10 text-center text-gray-400 px-4">
                <Boxes className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-gray-700 text-xs">Tidak ada barang yang cocok</p>
                {items.length === 0 && (
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onOpenAddItem}
                      className="px-3 py-1.5 bg-teal-800 text-white rounded-xl text-xs font-bold"
                    >
                      + Tambah Baru
                    </button>
                    <button
                      type="button"
                      onClick={onOpenBarcodeScanModal}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold"
                    >
                      Scan Barcode
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filteredItems.map((item) => {
                const daysLeft = getDaysUntilExpiry(item.expiryDate);
                const isExpiring = daysLeft <= 30;
                const isLowStock = item.stock <= item.minStock;

                return (
                  <div key={item.id} className="p-3.5 space-y-2.5 hover:bg-teal-50/20 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-sm">
                            {item.barcode}
                          </span>
                          <span className="bg-teal-50 text-teal-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mt-1 leading-snug">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Konversi: {item.unitConversion || `1 ${item.unitBase}`}
                        </p>
                      </div>

                      {/* Stock Badge */}
                      <div className="text-right flex-shrink-0">
                        <div
                          className={`text-base font-black ${
                            item.stock === 0
                              ? 'text-rose-600'
                              : isLowStock
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {item.stock} <span className="text-xs font-semibold text-gray-600">{item.unitBase}</span>
                        </div>
                        {isLowStock && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-sm">
                            Min: {item.minStock}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & Expiry Badges */}
                    <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Harga Jual:</span>
                        <span className="font-bold text-emerald-700 font-mono text-xs sm:text-sm">
                          {formatRupiah(item.sellPrice)}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-1.5">
                          (Modal: {formatRupiah(item.buyPrice)})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">Kadaluwarsa:</span>
                        <span
                          className={`text-[11px] font-semibold ${
                            isExpiring ? 'text-rose-600 font-bold' : 'text-gray-700'
                          }`}
                        >
                          {isExpiring && daysLeft <= 7
                            ? `H-${daysLeft} Kritis!`
                            : isExpiring
                            ? `H-${daysLeft}`
                            : formatDateIndo(item.expiryDate)}
                        </span>
                      </div>
                    </div>

                    {/* Quick Touch Action Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => onOpenRestock(item)}
                        className="py-1.5 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-teal-200"
                        title="Restock"
                      >
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                        <span>Restock</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenOpname(item)}
                        className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-blue-200"
                        title="Opname"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Opname</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenEditItem(item)}
                        className="py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-gray-200"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-rose-200"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Riwayat Stock Opname SubTab */}
      {activeSubTab === 'opname' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">
              Log Riwayat Stock Opname & Penyesuaian Fisik Gudang
            </h3>
            <span className="text-xs text-gray-500">
              Menjaga akurasi antara sistem dan fisik toko
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">TANGGAL & JAM</th>
                  <th className="py-3 px-4">BARANG</th>
                  <th className="py-3 px-4">STOK SISTEM</th>
                  <th className="py-3 px-4">STOK FISIK</th>
                  <th className="py-3 px-4">SELISIH</th>
                  <th className="py-3 px-4">KETERANGAN</th>
                  <th className="py-3 px-4">PETUGAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {opnameLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      Belum ada catatan stock opname.
                    </td>
                  </tr>
                ) : (
                  opnameLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">{log.date}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{log.itemName}</div>
                        <div className="text-[11px] font-mono text-gray-400">{log.barcode}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{log.systemStock}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{log.physicalStock}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-sm ${
                            log.difference === 0
                              ? 'bg-gray-100 text-gray-700'
                              : log.difference > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.difference > 0 ? `+${log.difference}` : log.difference}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{log.notes}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{log.officer}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Barang Rusak / Retur SubTab */}
      {activeSubTab === 'rusak' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">
              Daftar Barang Rusak, Bocor, Pecah, dan Retur Supplier
            </h3>
            <span className="text-xs text-gray-500">
              Pencatatan kerugian & penukaran barang ke supplier sembako
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">TANGGAL</th>
                  <th className="py-3 px-4">NAMA BARANG</th>
                  <th className="py-3 px-4">JUMLAH</th>
                  <th className="py-3 px-4">ALASAN KERUSAKAN</th>
                  <th className="py-3 px-4">STATUS PENANGANAN</th>
                  <th className="py-3 px-4">PETUGAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {damagedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Tidak ada catatan barang rusak atau retur.
                    </td>
                  </tr>
                ) : (
                  damagedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-gray-600 text-xs font-mono">{log.date}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{log.itemName}</td>
                      <td className="py-3 px-4 font-bold text-rose-600">
                        {log.qty} {log.unit}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-rose-200">
                          {log.reason}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md text-xs font-medium">
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{log.officer}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* In-app Modal Konfirmasi Hapus Barang */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 border border-rose-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Hapus Barang?</h3>
                <p className="text-xs text-gray-500 line-clamp-1">{itemToDelete.name}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus <span className="font-bold text-gray-900">"{itemToDelete.name}"</span> (Barcode: {itemToDelete.barcode}) dari katalog barang Riyan Store?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = itemToDelete.id;
                  setItemToDelete(null);
                  onDeleteItem(id);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
