import React, { useState, useEffect } from 'react';
import { X, Barcode as BarcodeIcon, Sparkles, Check, PackagePlus, Calendar, AlertCircle } from 'lucide-react';
import { SembakoItem } from '../types';
import { CATEGORIES, PRESET_BARCODE_CATALOG } from '../data/initialData';
import { sound } from '../utils/audio';

interface AddOrEditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: SembakoItem, isNew: boolean) => void;
  onOpenBarcodeScanner: () => void;
  initialItem?: SembakoItem | null;
  initialBarcode?: string;
}

export const AddOrEditItemModal: React.FC<AddOrEditItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onOpenBarcodeScanner,
  initialItem,
  initialBarcode = '',
}) => {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [unitBase, setUnitBase] = useState('Pcs');
  const [unitConversion, setUnitConversion] = useState('');
  const [stock, setStock] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(5);
  const [buyPrice, setBuyPrice] = useState<number>(10000);
  const [sellPrice, setSellPrice] = useState<number>(12000);
  const [wholesalePrice, setWholesalePrice] = useState<number>(11500);
  const [minWholesaleQty, setMinWholesaleQty] = useState<number>(6);
  const [expiryDate, setExpiryDate] = useState('2027-03-30');
  const [supplier, setSupplier] = useState('CV Berkah Distribusi Pangan');

  useEffect(() => {
    if (initialItem) {
      setBarcode(initialItem.barcode);
      setName(initialItem.name);
      setCategory(initialItem.category);
      setUnitBase(initialItem.unitBase);
      setUnitConversion(initialItem.unitConversion);
      setStock(initialItem.stock);
      setMinStock(initialItem.minStock);
      setBuyPrice(initialItem.buyPrice);
      setSellPrice(initialItem.sellPrice);
      setWholesalePrice(initialItem.wholesalePrice);
      setMinWholesaleQty(initialItem.minWholesaleQty);
      setExpiryDate(initialItem.expiryDate);
      setSupplier(initialItem.supplier);
    } else {
      const code = initialBarcode || (Date.now().toString().slice(-8));
      setBarcode(code);
      
      // Auto check if barcode is in presets
      const matched = PRESET_BARCODE_CATALOG.find((p) => p.barcode === initialBarcode);
      if (matched) {
        setName(matched.name || '');
        setCategory(matched.category || CATEGORIES[1]);
        setUnitBase(matched.unitBase || 'Pcs');
        setUnitConversion(matched.unitConversion || '');
        setBuyPrice(matched.buyPrice || 10000);
        setSellPrice(matched.sellPrice || 12000);
        setWholesalePrice(matched.wholesalePrice || 11500);
        setMinStock(matched.minStock || 10);
        setSupplier(matched.supplier || 'Distributor Sembako Resmi');
      } else {
        setName('');
        setCategory(CATEGORIES[1]);
        setUnitBase('Pcs');
        setUnitConversion('');
        setStock(20);
        setMinStock(10);
        setBuyPrice(10000);
        setSellPrice(12500);
        setWholesalePrice(11800);
        setMinWholesaleQty(6);
        setExpiryDate('2027-06-30');
        setSupplier('CV Berkah Distribusi Pangan');
      }
    }
  }, [initialItem, initialBarcode, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: Partial<SembakoItem>) => {
    if (preset.barcode) setBarcode(preset.barcode);
    if (preset.name) setName(preset.name);
    if (preset.category) setCategory(preset.category);
    if (preset.unitBase) setUnitBase(preset.unitBase);
    if (preset.unitConversion) setUnitConversion(preset.unitConversion);
    if (preset.buyPrice) setBuyPrice(preset.buyPrice);
    if (preset.sellPrice) setSellPrice(preset.sellPrice);
    if (preset.wholesalePrice) setWholesalePrice(preset.wholesalePrice);
    if (preset.minStock) setMinStock(preset.minStock);
    if (preset.supplier) setSupplier(preset.supplier);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      sound.playError();
      alert('Mohon isi nama barang sembako.');
      return;
    }

    const itemData: SembakoItem = {
      id: initialItem ? initialItem.id : `item-${Date.now()}`,
      barcode: barcode.trim() || `899${Date.now().toString().slice(-10)}`,
      name: name.trim(),
      category,
      unitBase,
      unitConversion: unitConversion.trim() || `1 ${unitBase} standar`,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      buyPrice: Number(buyPrice) || 0,
      sellPrice: Number(sellPrice) || 0,
      wholesalePrice: Number(wholesalePrice) || 0,
      minWholesaleQty: Number(minWholesaleQty) || 1,
      expiryDate: expiryDate || '2027-12-31',
      supplier: supplier.trim() || 'Distributor Umum',
      updatedAt: new Date().toISOString(),
    };

    sound.playItemAdded();
    onSave(itemData, !initialItem);
    onClose();
  };

  const marginRupiah = sellPrice - buyPrice;
  const marginPercent = buyPrice > 0 ? ((marginRupiah / buyPrice) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-teal-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-800 rounded-xl">
              <PackagePlus className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {initialItem ? 'Edit Data Barang Sembako' : 'Tambah / Input Inventaris Sembako Baru'}
              </h2>
              <p className="text-xs text-teal-200">
                Lengkapi barcode, konversi satuan, harga modal, harga jual, dan tanggal kadaluwarsa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Barcode & Scan Barcode Action */}
          <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <BarcodeIcon className="w-4 h-4 text-teal-700" />
                Kode Barcode Barang
              </label>
              <button
                type="button"
                onClick={onOpenBarcodeScanner}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <BarcodeIcon className="w-3.5 h-3.5" />
                Scan via Kamera
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Contoh: 8992388110011"
                className="flex-1 px-3 py-2 bg-white rounded-lg border border-teal-300 text-sm font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => setBarcode(`899${Math.floor(1000000000 + Math.random() * 9000000000)}`)}
                className="px-3 py-2 bg-white hover:bg-gray-50 border border-teal-300 text-teal-800 rounded-lg text-xs font-medium"
                title="Buat barcode acak sistem"
              >
                Generate Barcode
              </button>
            </div>
            <p className="text-[11px] text-teal-700 mt-1">
              Gunakan kamera HP/laptop atau tembakkan barcode scanner gun untuk mengisi kolom ini seketika.
            </p>
          </div>

          {/* Preset Quick Fill helper */}
          {!initialItem && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-gray-500 font-medium whitespace-nowrap flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Auto-fill Preset:
              </span>
              {PRESET_BARCODE_CATALOG.slice(0, 5).map((preset) => (
                <button
                  key={preset.barcode}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-teal-50 hover:border-teal-400 text-[11px] text-gray-700 whitespace-nowrap transition-colors"
                >
                  {preset.name?.split(' ')[0]} {preset.name?.split(' ')[1]}
                </button>
              ))}
            </div>
          )}

          {/* Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nama Barang Sembako <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Beras Ramos Setra 5 Kg"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Sembako</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {CATEGORIES.filter((c) => c !== 'Semua').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Units & Conversions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Satuan Dasar (Unit Jual)</label>
              <select
                value={unitBase}
                onChange={(e) => setUnitBase(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Pcs">Pcs</option>
                <option value="Bungkus">Bungkus</option>
                <option value="Kg">Kg (Kilogram)</option>
                <option value="Liter">Liter</option>
                <option value="Botol">Botol</option>
                <option value="Kaleng">Kaleng</option>
                <option value="Karung">Karung</option>
                <option value="Renceng">Renceng</option>
                <option value="Dus">Dus / Karton</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Konversi Satuan Gudang (Grosir/Dus)
              </label>
              <input
                type="text"
                value={unitConversion}
                onChange={(e) => setUnitConversion(e.target.value)}
                placeholder="Contoh: 1 Dus = 40 Bungkus / 1 Karung = 25 Kg"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Stock & Minimum Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {initialItem ? 'Jumlah Stok Saat Ini' : 'Jumlah Stok Awal'} ({unitBase})
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Batas Minimum Stok Menipis (Alert)
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
          </div>

          {/* Pricing: Modal (HPP), Eceran, Grosir */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Harga Beli / HPP Modal (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={buyPrice}
                onChange={(e) => setBuyPrice(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Harga Jual Eceran (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={sellPrice}
                onChange={(e) => setSellPrice(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-bold text-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Harga Jual Grosir (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Margin indicator */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-emerald-900">
            <span>Estimasi Margin Keuntungan Eceran:</span>
            <span className="font-bold">
              Rp {marginRupiah.toLocaleString('id-ID')} / {unitBase} ({marginPercent}%)
            </span>
          </div>

          {/* Expiry Date & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                Tanggal Kadaluwarsa (Expired Date)
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Supplier / Distributor</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Contoh: PT Indomarco Adi Prima"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              {initialItem ? 'Simpan Perubahan' : 'Tambah ke Inventaris Sembako'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
