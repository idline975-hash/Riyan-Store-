import React, { useState, useRef, useEffect } from 'react';
import {
  Barcode as BarcodeIcon,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  DollarSign,
  CreditCard,
  QrCode,
  User,
  Phone,
  Calendar,
  Sparkles,
  Receipt,
  RotateCcw,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SembakoItem, CartItem, SaleTransaction, KasbonRecord } from '../types';
import { formatRupiah } from '../utils/cloudSync';
import { sound } from '../utils/audio';
import { CATEGORIES, PRESET_BARCODE_CATALOG } from '../data/initialData';
import { formatMultiUnitStock, getUnitMultiplier, getUnitPrice } from '../utils/multiUnit';
import { parseSmartCustomerInput } from '../utils/smartTransactionParser';

interface PosCashierViewProps {
  items: SembakoItem[];
  cart: CartItem[];
  onAddToCart: (item: SembakoItem, qty?: number, selectedUnit?: string) => void;
  onUpdateCartQty: (itemId: string, newQty: number, selectedUnit?: string) => void;
  onUpdateCartUnit?: (itemId: string, newUnit: string) => void;
  onToggleCartPriceType: (itemId: string) => void;
  onRemoveFromCart: (itemId: string, selectedUnit?: string) => void;
  onClearCart: () => void;
  onCompleteTransaction: (transaction: SaleTransaction, newKasbon?: KasbonRecord) => void;
  onOpenBarcodeScanModal: () => void;
  cashierName: string;
  isDesktopMode?: boolean;
}

export const PosCashierView: React.FC<PosCashierViewProps> = ({
  items,
  cart,
  onAddToCart,
  onUpdateCartQty,
  onUpdateCartUnit,
  onToggleCartPriceType,
  onRemoveFromCart,
  onClearCart,
  onCompleteTransaction,
  onOpenBarcodeScanModal,
  cashierName,
  isDesktopMode = true,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris' | 'kasbon'>('tunai');
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [kasbonDueDate, setKasbonDueDate] = useState('2026-09-26');
  const [kasbonNotes, setKasbonNotes] = useState('');
  const [showQrisModal, setShowQrisModal] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cart calculations
  const totalRaw = cart.reduce((acc, c) => acc + c.subtotal, 0);
  const finalTotal = Math.max(0, totalRaw - discountAmount);
  const changeAmount = Math.max(0, cashPaid - finalTotal);

  // Auto focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Update cash paid default when total changes
  useEffect(() => {
    if (paymentMethod === 'tunai' && cashPaid < finalTotal) {
      setCashPaid(finalTotal);
    }
  }, [finalTotal, paymentMethod]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const parsed = parseSmartCustomerInput(code, items);
    if (!parsed.success) {
      sound.playError();
      alert(parsed.errorMessage || `Barang "${code}" tidak ditemukan dalam inventaris.`);
      return;
    }

    if (parsed.item && parsed.quantity && parsed.unit) {
      onAddToCart(parsed.item, parsed.quantity, parsed.unit);
      sound.playScanSuccess();
      setBarcodeInput('');
    }
  };

  const [showConfirmPaymentModal, setShowConfirmPaymentModal] = useState(false);

  const handleFinishPayment = () => {
    if (cart.length === 0) {
      sound.playError();
      alert('Keranjang belanja masih kosong.');
      return;
    }

    if (paymentMethod === 'tunai' && cashPaid < finalTotal) {
      sound.playError();
      alert(`Uang tunai yang dibayarkan kurang dari total belanja (${formatRupiah(finalTotal)}).`);
      return;
    }

    if (paymentMethod === 'kasbon' && !customerName.trim()) {
      sound.playError();
      alert('Mohon masukkan nama pelanggan untuk pencatatan kasbon / hutang.');
      return;
    }

    // Open confirmation dialog first
    setShowConfirmPaymentModal(true);
  };

  const handleExecutePayment = () => {
    setShowConfirmPaymentModal(false);
    const now = new Date();
    const invoiceNo = `INV/${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`;

    const transaction: SaleTransaction = {
      id: `TRX-${Date.now()}`,
      invoiceNo,
      date: `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      items: cart.map((c) => {
        const itemInStore = items.find((i) => i.id === c.item.id);
        const currentStock = itemInStore ? itemInStore.stock : c.item.stock;
        const unitUsed = c.selectedUnit || c.item.unitBase;
        const multiplier = getUnitMultiplier(unitUsed, c.item);
        const baseQtyDeducted = c.baseQtyDeducted || (c.quantity * multiplier);
        const newBaseStock = Math.max(0, Number((currentStock - baseQtyDeducted).toFixed(3)));
        const formattedRemainingStock = formatMultiUnitStock(newBaseStock, c.item);

        return {
          itemId: c.item.id,
          barcode: c.item.barcode,
          name: c.item.name,
          qty: c.quantity,
          unit: unitUsed,
          price: getUnitPrice(unitUsed, c.item, c.priceType),
          subtotal: c.subtotal,
          baseQtyDeducted,
          remainingStock: newBaseStock,
          formattedRemainingStock,
        };
      }),
      totalAmount: totalRaw,
      discountAmount,
      finalAmount: finalTotal,
      paymentMethod,
      cashPaid: paymentMethod === 'tunai' ? cashPaid : finalTotal,
      change: paymentMethod === 'tunai' ? changeAmount : 0,
      customerName: customerName.trim() || (paymentMethod === 'kasbon' ? 'Pelanggan Kasbon' : undefined),
      customerPhone: customerPhone.trim() || undefined,
      cashier: cashierName,
      status: paymentMethod === 'kasbon' ? 'kasbon_tercatat' : 'selesai',
      createdAt: now.toISOString(),
    };

    let newKasbon: KasbonRecord | undefined = undefined;
    if (paymentMethod === 'kasbon') {
      newKasbon = {
        id: `ksb-${Date.now()}`,
        customerName: customerName.trim() || 'Pelanggan Kasbon',
        customerPhone: customerPhone.trim() || '-',
        invoiceNo,
        date: now.toISOString().slice(0, 10),
        dueDate: kasbonDueDate || '2026-09-26',
        totalDebt: finalTotal,
        remainingDebt: finalTotal,
        status: 'belum_lunas',
        notes: kasbonNotes.trim() || 'Kasbon belanja kasir',
        payments: [],
      };
    }

    // Sound & celebration
    sound.playPaymentSuccess();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });

    onCompleteTransaction(transaction, newKasbon);

    // Reset payment inputs
    setDiscountAmount(0);
    setCustomerName('');
    setCustomerPhone('');
    setKasbonNotes('');
  };

  // Filter items for product grid
  const catalogList = items.filter((item) => {
    const matchesCat = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchesQuery =
      !searchFilter.trim() ||
      item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.barcode.includes(searchFilter);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 w-full max-w-full">
      {/* LEFT COLUMN: Barcode Scanner & Product Catalog (Full on Mobile, 7 cols on Desktop) */}
      <div className="w-full lg:col-span-7 space-y-3.5">
        {/* Prominent Barcode Scanner Action Bar */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border-2 border-teal-600/30 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
              <BarcodeIcon className="w-4 h-4 text-teal-700" />
              Scan Barcode Penjualan Cepat (POS)
            </span>
            <button
              type="button"
              onClick={onOpenBarcodeScanModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <BarcodeIcon className="w-4 h-4 text-teal-300" />
              Buka Kamera Scan
            </button>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <BarcodeIcon className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode atau ketik pesanan (contoh: 'gula 1/4 kg', 'minyak 0.5 liter', 'kopi 1 renceng', 'rokok 1 slop')..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-teal-50/20"
              />
            </div>
            <button
              type="submit"
              className="px-4 sm:px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer shrink-0"
            >
              + Masuk
            </button>
          </form>

          {/* Quick Smart Sembako Simulation Buttons */}
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 scrollbar-none">
            <span className="text-gray-400 font-medium whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Transaksi Cepat:
            </span>
            <button
              type="button"
              onClick={() => {
                const g = items.find((i) => i.name.toLowerCase().includes('gula'));
                if (g) {
                  onAddToCart(g, 0.25, 'Kg');
                  sound.playScanSuccess();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              + Gula 1/4 Kg
            </button>
            <button
              type="button"
              onClick={() => {
                const g = items.find((i) => i.name.toLowerCase().includes('gula'));
                if (g) {
                  onAddToCart(g, 0.5, 'Kg');
                  sound.playScanSuccess();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              + Gula 1/2 Kg
            </button>
            <button
              type="button"
              onClick={() => {
                const m = items.find((i) => i.name.toLowerCase().includes('minyak'));
                if (m) {
                  onAddToCart(m, 0.5, 'Liter');
                  sound.playScanSuccess();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              + Minyak 0.5 L
            </button>
            <button
              type="button"
              onClick={() => {
                const k = items.find((i) => i.name.toLowerCase().includes('kopi'));
                if (k) {
                  onAddToCart(k, 1, 'Renceng');
                  sound.playScanSuccess();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              + Kopi 1 Renceng
            </button>
            <button
              type="button"
              onClick={() => {
                const k = items.find((i) => i.name.toLowerCase().includes('kopi'));
                if (k) {
                  onAddToCart(k, 1, 'Dus');
                  sound.playScanSuccess();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              + Kopi 1 Dus
            </button>
            <button
              type="button"
              onClick={() => {
                const r = items.find((i) => i.name.toLowerCase().includes('rokok') || i.name.toLowerCase().includes('sampoerna'));
                if (r) {
                  onAddToCart(r, 1, 'Slop');
                  sound.playScanSuccess();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              + Rokok 1 Slop
            </button>
            <button
              type="button"
              onClick={() => {
                const r = items.find((i) => i.name.toLowerCase().includes('rokok') || i.name.toLowerCase().includes('sampoerna'));
                if (r) {
                  onAddToCart(r, 1, 'Dus');
                  sound.playScanSuccess();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              + Rokok 1 Dus
            </button>
          </div>
        </div>

        {/* Catalog Search & Category Filter */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Cari nama sembako..."
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Product Items Grid */}
          {catalogList.length === 0 ? (
            <div className="py-12 px-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="font-semibold text-gray-700 text-xs sm:text-sm">Belum Ada Barang di Kasir</p>
              <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto">
                Silakan tambahkan data barang sembako di tab Stok & Inventaris atau gunakan tombol Scan Barcode di atas.
              </p>
            </div>
          ) : (
            <div className={`grid ${isDesktopMode ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'} gap-2 max-h-[500px] overflow-y-auto pr-1`}>
              {catalogList.map((item, idx) => {
                const isOutOfStock = item.stock <= 0;
                const isLowStock = item.stock <= item.minStock;

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    onClick={() => {
                      if (!isOutOfStock) {
                        onAddToCart(item, 1);
                        sound.playScanSuccess();
                      } else {
                        sound.playError();
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none ${
                      isOutOfStock
                        ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-teal-500 hover:shadow-xs hover:bg-teal-50/20'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-mono text-gray-400 truncate">
                        {item.barcode}
                      </div>
                      <div className="font-bold text-gray-900 text-xs line-clamp-2 mt-0.5 leading-snug">
                        {item.name}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-1.5 border-t border-gray-100 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-emerald-700">
                            {formatRupiah(item.sellPrice)} <span className="text-[10px] font-normal text-gray-500">/{item.unitBase}</span>
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Stok: <span className={isLowStock ? 'font-bold text-amber-600' : 'font-medium'}>{formatMultiUnitStock(item.stock, item)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOutOfStock) {
                              onAddToCart(item, 1, item.unitBase);
                              sound.playScanSuccess();
                            }
                          }}
                          className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center hover:bg-teal-900 disabled:bg-gray-300 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Multi-Unit Quick Add & Hitung Eceran Buttons for Rokok (Bungkus, Slop, Dus) */}
                      {(item.unitBase === 'Bungkus' || item.multiUnit?.slopQty || item.name.toLowerCase().includes('rokok')) && !isOutOfStock && (
                        <div className="space-y-1 pt-1 border-t border-gray-100/80" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold px-0.5">
                            <span className="text-teal-900 font-bold">Hitung Eceran:</span>
                            <span className="text-[9px] text-gray-400">1 Slop = 10 Bks | 1 Dus = 40 Slop</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(item, 1, 'Bungkus');
                                sound.playScanSuccess();
                              }}
                              className="py-1 px-1 bg-gray-100 hover:bg-teal-50 text-gray-800 border border-gray-200 rounded text-[10px] font-bold text-center cursor-pointer transition-colors"
                              title="Beli Eceran 1 Bungkus (Rp 30.000)"
                            >
                              1 Bks
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(item, 1, 'Slop');
                                sound.playScanSuccess();
                              }}
                              className="py-1 px-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded text-[10px] font-bold text-center cursor-pointer transition-colors"
                              title="Beli 1 Slop = 10 Bungkus (Rp 300.000)"
                            >
                              1 Slop
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(item, 0.5, 'Dus');
                                sound.playScanSuccess();
                              }}
                              className="py-1 px-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded text-[10px] font-bold text-center cursor-pointer transition-colors"
                              title="Beli 1/2 Dus = 20 Slop (200 Bungkus - Rp 6.000.000)"
                            >
                              1/2 Dus
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(item, 1, 'Dus');
                                sound.playScanSuccess();
                              }}
                              className="py-1 px-1 bg-teal-800 text-white rounded text-[10px] font-bold text-center hover:bg-teal-900 cursor-pointer transition-colors"
                              title="Beli 1 Dus = 40 Slop (400 Bungkus - Rp 12.000.000)"
                            >
                              1 Dus
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Multi-Unit Quick Add & Hitung Eceran Buttons for Kopi (Pcs, Renceng, Dus) */}
                      {(item.unitBase === 'Pcs' || item.multiUnit?.rencengQty || item.name.toLowerCase().includes('kopi')) && !isOutOfStock && (
                        <div className="space-y-1 pt-1 border-t border-gray-100/80" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold px-0.5">
                            <span className="text-teal-900 font-bold">Hitung Eceran:</span>
                            <span className="text-[9px] text-gray-400">1 Rcg = 10 Pcs | 1 Dus = 4 Rcg</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(item, 1, 'Pcs');
                                sound.playScanSuccess();
                              }}
                              className="py-1 px-1 bg-gray-100 hover:bg-teal-50 text-gray-800 border border-gray-200 rounded text-[10px] font-bold text-center cursor-pointer transition-colors"
                              title="Beli Eceran 1 Pcs Saset (Rp 2.000)"
                            >
                              1 Pcs
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(item, 1, 'Renceng');
                                sound.playScanSuccess();
                              }}
                              className="py-1 px-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded text-[10px] font-bold text-center cursor-pointer transition-colors"
                              title="Beli Eceran 1 Renceng (10 Pcs - Rp 20.000)"
                            >
                              1 Rcg
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(item, 0.5, 'Dus');
                                sound.playScanSuccess();
                              }}
                              className="py-1 px-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded text-[10px] font-bold text-center cursor-pointer transition-colors"
                              title="Beli Eceran 1/2 Dus = 2 Renceng (20 Pcs - Rp 40.000)"
                            >
                              1/2 Dus
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(item, 1, 'Dus');
                                sound.playScanSuccess();
                              }}
                              className="py-1 px-1 bg-teal-800 text-white rounded text-[10px] font-bold text-center hover:bg-teal-900 cursor-pointer transition-colors"
                              title="Beli 1 Dus Penuh (4 Renceng = 40 Pcs - Rp 80.000)"
                            >
                              1 Dus
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Quick Fraction Eceran Buttons for Weight & Volume (Gula, Minyak Curah) */}
                      {(item.unitBase === 'Kg' || item.unitBase === 'Liter') && !isOutOfStock && (
                        <div className="space-y-1 pt-1 border-t border-gray-100/80" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold px-0.5">
                            <span className="text-teal-900 font-bold">Hitung Eceran:</span>
                            <span className="text-[9px] text-gray-400">Desimal ({item.unitBase})</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(item, 0.25, item.unitBase);
                                sound.playScanSuccess();
                              }}
                              className="py-1 px-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded text-[10px] font-bold text-center cursor-pointer transition-colors"
                              title={`Beli Eceran 1/4 ${item.unitBase} (0.25)`}
                            >
                              1/4 {item.unitBase}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(item, 0.5, item.unitBase);
                                sound.playScanSuccess();
                              }}
                              className="py-1 px-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded text-[10px] font-bold text-center cursor-pointer transition-colors"
                              title={`Beli Eceran 1/2 ${item.unitBase} (0.5)`}
                            >
                              1/2 {item.unitBase}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(item, 1, item.unitBase);
                                sound.playScanSuccess();
                              }}
                              className="py-1 px-1 bg-teal-800 text-white rounded text-[10px] font-bold text-center hover:bg-teal-900 cursor-pointer transition-colors"
                              title={`Beli 1 ${item.unitBase}`}
                            >
                              1 {item.unitBase}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Cart & Checkout Panel (Full on Mobile, 5 cols on Desktop) */}
      <div id="checkout-cart-panel" className="w-full lg:col-span-5 space-y-4 lg:sticky lg:top-28">
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs flex flex-col overflow-hidden">
          {/* Cart Header */}
          <div className="px-4 py-3 bg-teal-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-teal-300" />
              <h3 className="font-bold text-sm">Keranjang Penjualan</h3>
              <span className="bg-teal-700 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)} item
              </span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-xs text-teal-200 hover:text-rose-200 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Kosongkan
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-3 max-h-[300px] overflow-y-auto divide-y divide-gray-100">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <ShoppingCart className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="font-medium text-gray-600 text-sm">Keranjang masih kosong</p>
                <p className="text-xs text-gray-400 mt-1">
                  Scan barcode barang atau klik produk di katalog sebelah kiri
                </p>
              </div>
            ) : (
              cart.map((cartItem, idx) => {
                const { item, quantity, priceType, subtotal } = cartItem;
                const selectedUnit = cartItem.selectedUnit || item.unitBase;
                const unitPrice = getUnitPrice(selectedUnit, item, priceType);
                const isCigarette = item.unitBase === 'Bungkus' || !!item.multiUnit?.slopQty || item.name.toLowerCase().includes('rokok');
                const isKopi = item.unitBase === 'Pcs' || !!item.multiUnit?.rencengQty || item.name.toLowerCase().includes('kopi');
                const isMultiUnit = isCigarette || isKopi || !!item.multiUnit;
                const isWeightOrVolume = item.unitBase === 'Kg' || item.unitBase === 'Liter';

                return (
                  <div key={`${item.id}-${selectedUnit}-${idx}`} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                          {item.name}
                        </div>
                        {isCigarette ? (
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[11px] font-semibold text-gray-500">Satuan Beli:</span>
                            <select
                              value={selectedUnit}
                              onChange={(e) => {
                                const newUnit = e.target.value;
                                if (onUpdateCartUnit) {
                                  onUpdateCartUnit(item.id, newUnit);
                                } else {
                                  onUpdateCartQty(item.id, quantity, newUnit);
                                }
                              }}
                              className="text-xs font-bold text-teal-900 bg-teal-50 border border-teal-300 rounded px-1.5 py-0.5 cursor-pointer"
                            >
                              <option value="Bungkus">Bungkus ({formatRupiah(getUnitPrice('Bungkus', item, priceType))})</option>
                              <option value="Slop">Slop [10 Bks] ({formatRupiah(getUnitPrice('Slop', item, priceType))})</option>
                              <option value="Dus">Dus [400 Bks] ({formatRupiah(getUnitPrice('Dus', item, priceType))})</option>
                            </select>
                          </div>
                        ) : isKopi ? (
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[11px] font-semibold text-gray-500">Satuan Beli:</span>
                            <select
                              value={selectedUnit}
                              onChange={(e) => {
                                const newUnit = e.target.value;
                                if (onUpdateCartUnit) {
                                  onUpdateCartUnit(item.id, newUnit);
                                } else {
                                  onUpdateCartQty(item.id, quantity, newUnit);
                                }
                              }}
                              className="text-xs font-bold text-teal-900 bg-teal-50 border border-teal-300 rounded px-1.5 py-0.5 cursor-pointer"
                            >
                              <option value="Pcs">Pcs ({formatRupiah(getUnitPrice('Pcs', item, priceType))})</option>
                              <option value="Renceng">Renceng [10 Pcs] ({formatRupiah(getUnitPrice('Renceng', item, priceType))})</option>
                              <option value="Dus">Dus [40 Pcs] ({formatRupiah(getUnitPrice('Dus', item, priceType))})</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            {/* Price Type Toggle: Ecer vs Grosir */}
                            <button
                              type="button"
                              onClick={() => onToggleCartPriceType(item.id)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
                                priceType === 'wholesale'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                              }`}
                              title="Klik untuk ubah harga eceran / grosir"
                            >
                              {priceType === 'wholesale' ? 'Harga Grosir' : 'Harga Ecer'}
                            </button>
                            <span className="text-xs text-gray-500">
                              {formatRupiah(unitPrice)} / {selectedUnit}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-xs sm:text-sm text-gray-900">
                          {formatRupiah(subtotal)}
                        </div>
                      </div>
                    </div>

                    {/* Qty Controls */}
                    <div className="flex flex-col gap-1.5 mt-2 pt-1 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                            <button
                              type="button"
                              onClick={() => {
                                const isDus = selectedUnit === 'Dus';
                                const step = isWeightOrVolume || isDus ? 0.25 : 1;
                                onUpdateCartQty(item.id, Math.max(0.01, Number((quantity - step).toFixed(3))), selectedUnit);
                              }}
                              className="w-6 h-6 rounded-md bg-white text-gray-700 flex items-center justify-center hover:bg-gray-200 shadow-2xs font-bold cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              step="0.05"
                              min="0.01"
                              max={item.stock}
                              value={quantity}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val > 0) {
                                  const multiplier = getUnitMultiplier(selectedUnit, item);
                                  const baseQty = val * multiplier;
                                  if (baseQty > item.stock) {
                                    sound.playError();
                                    alert(`Stok hanya tersisa ${formatMultiUnitStock(item.stock, item)}`);
                                    return;
                                  }
                                  onUpdateCartQty(item.id, val, selectedUnit);
                                }
                              }}
                              className="w-14 text-center text-xs font-bold text-gray-900 bg-white border border-gray-300 rounded-md py-0.5 focus:ring-2 focus:ring-teal-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const isDus = selectedUnit === 'Dus';
                                const step = isWeightOrVolume || isDus ? 0.25 : 1;
                                const multiplier = getUnitMultiplier(selectedUnit, item);
                                const baseQty = (quantity + step) * multiplier;
                                if (baseQty > item.stock) {
                                  sound.playError();
                                  alert(`Stok hanya tersisa ${formatMultiUnitStock(item.stock, item)}`);
                                  return;
                                }
                                onUpdateCartQty(item.id, Number((quantity + step).toFixed(3)), selectedUnit);
                              }}
                              className="w-6 h-6 rounded-md bg-white text-gray-700 flex items-center justify-center hover:bg-gray-200 shadow-2xs font-bold cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-semibold text-gray-700">{selectedUnit}</span>
                            {/* Rokok annotations */}
                            {isCigarette && selectedUnit === 'Dus' && quantity === 0.25 && (
                              <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                                10 Slop (100 Bks)
                              </span>
                            )}
                            {isCigarette && selectedUnit === 'Dus' && quantity === 0.5 && (
                              <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                                20 Slop (200 Bks)
                              </span>
                            )}
                            {isCigarette && selectedUnit === 'Dus' && quantity === 0.75 && (
                              <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                                30 Slop (300 Bks)
                              </span>
                            )}
                            {isCigarette && selectedUnit === 'Dus' && quantity === 1 && (
                              <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                                40 Slop (400 Bks)
                              </span>
                            )}
                            {isCigarette && selectedUnit === 'Slop' && quantity === 0.5 && (
                              <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                                5 Bungkus
                              </span>
                            )}
                            {/* Kopi annotations */}
                            {isKopi && selectedUnit === 'Dus' && quantity === 0.25 && (
                              <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                                1 Renceng (10 Pcs)
                              </span>
                            )}
                            {isKopi && selectedUnit === 'Dus' && quantity === 0.5 && (
                              <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                                2 Renceng (20 Pcs)
                              </span>
                            )}
                            {isKopi && selectedUnit === 'Dus' && quantity === 0.75 && (
                              <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                                3 Renceng (30 Pcs)
                              </span>
                            )}
                            {isKopi && selectedUnit === 'Renceng' && quantity === 0.5 && (
                              <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                                5 Pcs
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveFromCart(item.id, selectedUnit)}
                          className="text-rose-500 hover:text-rose-700 p-1 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Hapus</span>
                        </button>
                      </div>

                      {/* Quick Fraction Weight / Multi-Unit Eceran Pills */}
                      {isCigarette ? (
                        <div className="flex items-center gap-1 text-[10px] flex-wrap pt-0.5">
                          <span className="text-gray-400 font-medium">Hitung Eceran:</span>
                          {selectedUnit === 'Dus' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 0.25, 'Dus')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 0.25 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 1/4 Dus = 10 Slop (100 Bungkus - Rp 3.000.000)"
                              >
                                1/4 (10 Slop)
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 0.5, 'Dus')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 0.5 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 1/2 Dus = 20 Slop (200 Bungkus - Rp 6.000.000)"
                              >
                                1/2 (20 Slop)
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 0.75, 'Dus')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 0.75 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 3/4 Dus = 30 Slop (300 Bungkus - Rp 9.000.000)"
                              >
                                3/4 (30 Slop)
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 1, 'Dus')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 1 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 1 Dus = 40 Slop (400 Bungkus - Rp 12.000.000)"
                              >
                                1 Dus (40 Slop)
                              </button>
                            </>
                          ) : selectedUnit === 'Slop' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 0.5, 'Slop')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 0.5 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 1/2 Slop = 5 Bungkus (Rp 150.000)"
                              >
                                1/2 (5 Bks)
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 1, 'Slop')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 1 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 1 Slop = 10 Bungkus (Rp 300.000)"
                              >
                                1 Slop (10 Bks)
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 2, 'Slop')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 2 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 2 Slop (Rp 600.000)"
                              >
                                2 Slop
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 5, 'Slop')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 5 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 5 Slop (Rp 1.500.000)"
                              >
                                5 Slop
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 1, 'Bungkus')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 1 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 1 Bungkus (Rp 30.000)"
                              >
                                1 Bks
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 2, 'Bungkus')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 2 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 2 Bungkus (Rp 60.000)"
                              >
                                2 Bks
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 5, 'Bungkus')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 5 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 5 Bungkus = 1/2 Slop (Rp 150.000)"
                              >
                                5 Bks
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 10, 'Bungkus')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 10 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 10 Bungkus = 1 Slop (Rp 300.000)"
                              >
                                10 Bks (1 Slop)
                              </button>
                            </>
                          )}
                        </div>
                      ) : isKopi ? (
                        <div className="flex items-center gap-1 text-[10px] flex-wrap pt-0.5">
                          <span className="text-gray-400 font-medium">Hitung Eceran:</span>
                          {selectedUnit === 'Dus' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 0.25, 'Dus')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 0.25 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 1/4 Dus = 1 Renceng (10 Pcs - Rp 20.000)"
                              >
                                1/4 (1 Renceng)
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 0.5, 'Dus')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 0.5 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 1/2 Dus = 2 Renceng (20 Pcs - Rp 40.000)"
                              >
                                1/2 (2 Renceng)
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 0.75, 'Dus')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 0.75 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 3/4 Dus = 3 Renceng (30 Pcs - Rp 60.000)"
                              >
                                3/4 (3 Renceng)
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 1, 'Dus')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 1 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 1 Dus = 4 Renceng (40 Pcs - Rp 80.000)"
                              >
                                1 Dus (4 Renceng)
                              </button>
                            </>
                          ) : selectedUnit === 'Renceng' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 0.5, 'Renceng')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 0.5 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 1/2 Renceng = 5 Pcs (Rp 10.000)"
                              >
                                1/2 (5 Pcs)
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 1, 'Renceng')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 1 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 1 Renceng = 10 Pcs (Rp 20.000)"
                              >
                                1 Renceng (10 Pcs)
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 2, 'Renceng')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 2 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 2 Renceng = 20 Pcs (Rp 40.000)"
                              >
                                2 Renceng
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 4, 'Renceng')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 4 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 4 Renceng = 1 Dus (Rp 80.000)"
                              >
                                4 Renceng (1 Dus)
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 1, 'Pcs')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 1 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 1 Pcs Saset (Rp 2.000)"
                              >
                                1 Pcs
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 2, 'Pcs')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 2 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 2 Pcs Saset (Rp 4.000)"
                              >
                                2 Pcs
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 5, 'Pcs')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 5 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 5 Pcs = 1/2 Renceng (Rp 10.000)"
                              >
                                5 Pcs (1/2 Renceng)
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 10, 'Pcs')}
                                className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                  quantity === 10 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                }`}
                                title="Beli 10 Pcs = 1 Renceng (Rp 20.000)"
                              >
                                10 Pcs (1 Renceng)
                              </button>
                            </>
                          )}
                        </div>
                      ) : isWeightOrVolume && (
                        <div className="flex items-center gap-1 text-[10px] flex-wrap pt-0.5">
                          <span className="text-gray-400 font-medium">Hitung Eceran:</span>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.id, 0.25, selectedUnit)}
                            className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                              quantity === 0.25 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                            }`}
                            title="Beli Eceran 1/4 (0.25)"
                          >
                            1/4 (0.25)
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.id, 0.5, selectedUnit)}
                            className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                              quantity === 0.5 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                            }`}
                            title="Beli Eceran 1/2 (0.50)"
                          >
                            1/2 (0.50)
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.id, 0.75, selectedUnit)}
                            className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                              quantity === 0.75 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                            }`}
                            title="Beli Eceran 3/4 (0.75)"
                          >
                            3/4 (0.75)
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.id, 1, selectedUnit)}
                            className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                              quantity === 1 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                            }`}
                            title="Beli 1"
                          >
                            1.0
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.id, 2, selectedUnit)}
                            className={`px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                              quantity === 2 ? 'bg-teal-800 text-white border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                            }`}
                            title="Beli 2"
                          >
                            2.0
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Payment & Checkout Section */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
            {/* Total Display */}
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-gray-600 uppercase">Total Tagihan</span>
              <span className="text-2xl font-black text-teal-900">
                {formatRupiah(finalTotal)}
              </span>
            </div>

            {/* Discount Input */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Diskon / Potongan:</span>
              <div className="flex items-center gap-1">
                <span className="text-gray-500 font-mono">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={discountAmount || ''}
                  placeholder="0"
                  onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 px-2 py-1 text-right rounded-md border border-gray-300 text-xs font-semibold bg-white"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1.5">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('tunai')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'tunai'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Tunai (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('qris');
                    setShowQrisModal(true);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'qris'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('kasbon')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'kasbon'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Kasbon (Hutang)</span>
                </button>
              </div>
            </div>

            {/* Tunai Calculations */}
            {paymentMethod === 'tunai' && (
              <div className="space-y-2 bg-white p-3 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700">Uang Diterima:</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={cashPaid || ''}
                    onChange={(e) => setCashPaid(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-32 px-2.5 py-1 text-right rounded-lg border border-gray-300 text-sm font-bold text-emerald-800"
                  />
                </div>

                {/* Fast Cash Buttons */}
                <div className="flex gap-1 overflow-x-auto text-[10px] pt-1">
                  <button
                    type="button"
                    onClick={() => setCashPaid(finalTotal)}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md font-semibold text-gray-700 whitespace-nowrap"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashPaid(Math.ceil(finalTotal / 50000) * 50000 || 50000)}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {formatRupiah(Math.ceil(finalTotal / 50000) * 50000 || 50000)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashPaid(Math.ceil(finalTotal / 100000) * 100000 || 100000)}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {formatRupiah(Math.ceil(finalTotal / 100000) * 100000 || 100000)}
                  </button>
                </div>

                {/* Kembalian */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                  <span className="font-bold text-gray-700">Kembalian:</span>
                  <span
                    className={`text-base font-black ${
                      changeAmount < 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {formatRupiah(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Kasbon / Debt Details */}
            {paymentMethod === 'kasbon' && (
              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 space-y-2 text-xs">
                <div className="text-[11px] font-bold text-rose-900 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  Pencatatan Hutang / Kasbon Pelanggan
                </div>
                <div>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Pelanggan (contoh: Bu Siti Blok B) *"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 text-xs bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="No. WhatsApp (opsional)"
                    className="px-2.5 py-1.5 rounded-lg border border-rose-300 text-xs bg-white"
                  />
                  <input
                    type="date"
                    value={kasbonDueDate}
                    onChange={(e) => setKasbonDueDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-rose-300 text-xs bg-white"
                    title="Janji Bayar (Jatuh Tempo)"
                  />
                </div>
                <input
                  type="text"
                  value={kasbonNotes}
                  onChange={(e) => setKasbonNotes(e.target.value)}
                  placeholder="Catatan kasbon (misal: bayar pas gajian)"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 text-xs bg-white"
                />
              </div>
            )}

            {/* Complete Transaction Button */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleFinishPayment}
              className="w-full py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Bayar & Simpan / Cetak Struk</span>
            </button>
          </div>
        </div>
      </div>

      {/* QRIS Modal */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full text-center space-y-3">
            <h3 className="font-bold text-base text-gray-900">Pembayaran QRIS RIYAN STORE</h3>
            <p className="text-xs text-gray-500">
              Silakan scan QRIS di bawah dengan GoPay, OVO, Dana, BCA, Mandiri, dll.
            </p>
            <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-teal-600 rounded-xl flex flex-col items-center justify-center p-3 relative">
              <QrCode className="w-36 h-36 text-gray-900" />
              <div className="absolute bottom-1 bg-teal-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {formatRupiah(finalTotal)}
              </div>
            </div>
            <div className="text-xs font-bold text-emerald-700">
              Total Tagihan: {formatRupiah(finalTotal)}
            </div>
            <button
              type="button"
              onClick={() => setShowQrisModal(false)}
              className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl"
            >
              Tutup & Konfirmasi Bayar
            </button>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showConfirmPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 p-6 space-y-4 text-center">
            <div className="w-14 h-14 bg-teal-100 text-teal-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8 text-teal-700" />
            </div>

            <div>
              <h3 className="text-lg font-black text-gray-900">Konfirmasi Pembayaran</h3>
              <p className="text-xs text-gray-500 mt-1">
                Apakah Anda yakin ingin menyelesaikan transaksi ini dan memotong stok barang secara otomatis?
              </p>
            </div>

            <div className="bg-teal-50/80 p-3 rounded-2xl border border-teal-200/80 text-left space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Total Item:</span>
                <span className="font-bold text-gray-900">{cart.reduce((a, b) => a + b.quantity, 0)} item</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Tagihan:</span>
                <span className="font-bold text-teal-900 text-sm">{formatRupiah(finalTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Metode:</span>
                <span className="font-bold uppercase text-teal-800">{paymentMethod}</span>
              </div>
              {paymentMethod === 'tunai' && (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Bayar Tunai:</span>
                    <span className="font-bold text-gray-900">{formatRupiah(cashPaid)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(changeAmount)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmPaymentModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecutePayment}
                className="flex-1 py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ya, Selesaikan</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
