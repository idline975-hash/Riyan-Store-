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

interface PosCashierViewProps {
  items: SembakoItem[];
  cart: CartItem[];
  onAddToCart: (item: SembakoItem, qty?: number) => void;
  onUpdateCartQty: (itemId: string, newQty: number) => void;
  onToggleCartPriceType: (itemId: string) => void;
  onRemoveFromCart: (itemId: string) => void;
  onClearCart: () => void;
  onCompleteTransaction: (transaction: SaleTransaction, newKasbon?: KasbonRecord) => void;
  onOpenBarcodeScanModal: () => void;
  cashierName: string;
}

export const PosCashierView: React.FC<PosCashierViewProps> = ({
  items,
  cart,
  onAddToCart,
  onUpdateCartQty,
  onToggleCartPriceType,
  onRemoveFromCart,
  onClearCart,
  onCompleteTransaction,
  onOpenBarcodeScanModal,
  cashierName,
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

    const matched = items.find((i) => i.barcode === code || i.id === code);
    if (matched) {
      if (matched.stock <= 0) {
        sound.playError();
        alert(`Perhatian: Stok barang "${matched.name}" habis di gudang!`);
        return;
      }
      onAddToCart(matched, 1);
      sound.playScanSuccess();
      setBarcodeInput('');
    } else {
      sound.playError();
      alert(`Barang dengan barcode "${code}" tidak ditemukan dalam inventaris. Cek katalog atau scan di menu Inventaris untuk mendaftarkan barang baru.`);
    }
  };

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

    const now = new Date();
    const invoiceNo = `INV/${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`;

    const transaction: SaleTransaction = {
      id: `TRX-${Date.now()}`,
      invoiceNo,
      date: `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      items: cart.map((c) => ({
        itemId: c.item.id,
        barcode: c.item.barcode,
        name: c.item.name,
        qty: c.quantity,
        unit: c.item.unitBase,
        price: c.priceType === 'wholesale' ? c.item.wholesalePrice : c.item.sellPrice,
        subtotal: c.subtotal,
      })),
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* LEFT COLUMN: Barcode Scanner & Product Catalog (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Prominent Barcode Scanner Action Bar */}
        <div className="bg-white rounded-2xl p-4 border-2 border-teal-600/30 shadow-xs">
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
                placeholder="Scan barcode dengan scanner gun atau ketik kode..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-teal-50/20"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
            >
              + Masuk
            </button>
          </form>

          {/* Quick Barcode Simulation Buttons */}
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 scrollbar-none">
            <span className="text-gray-400 font-medium whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Scan Cepat:
            </span>
            {items.slice(0, 5).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onAddToCart(item, 1);
                  sound.playScanSuccess();
                }}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-teal-50 hover:text-teal-800 text-gray-700 border border-gray-200 text-xs font-medium whitespace-nowrap transition-colors"
              >
                + {item.name.split(' ')[0]} {item.name.split(' ')[1] || ''}
              </button>
            ))}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
              {catalogList.map((item) => {
                const isOutOfStock = item.stock <= 0;
                const isLowStock = item.stock <= item.minStock;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!isOutOfStock) {
                        onAddToCart(item, 1);
                        sound.playScanSuccess();
                      } else {
                        sound.playError();
                      }
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none ${
                      isOutOfStock
                        ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-teal-500 hover:shadow-xs hover:bg-teal-50/20'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-mono text-gray-400 truncate">
                        {item.barcode}
                      </div>
                      <div className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 mt-0.5 leading-snug">
                        {item.name}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-emerald-700">
                          {formatRupiah(item.sellPrice)}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Stok: <span className={isLowStock ? 'font-bold text-amber-600' : ''}>{item.stock} {item.unitBase}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center hover:bg-teal-900 disabled:bg-gray-300 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Cart & Checkout Panel (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
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
              cart.map((cartItem) => {
                const { item, quantity, priceType, subtotal } = cartItem;
                const unitPrice = priceType === 'wholesale' ? item.wholesalePrice : item.sellPrice;

                return (
                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                          {item.name}
                        </div>
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
                            {formatRupiah(unitPrice)} / {item.unitBase}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-xs sm:text-sm text-gray-900">
                          {formatRupiah(subtotal)}
                        </div>
                      </div>
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                        <button
                          type="button"
                          onClick={() => onUpdateCartQty(item.id, quantity - 1)}
                          className="w-6 h-6 rounded-md bg-white text-gray-700 flex items-center justify-center hover:bg-gray-200 shadow-2xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-gray-800">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (quantity + 1 > item.stock) {
                              sound.playError();
                              alert(`Stok hanya tersisa ${item.stock} ${item.unitBase}`);
                              return;
                            }
                            onUpdateCartQty(item.id, quantity + 1);
                          }}
                          className="w-6 h-6 rounded-md bg-white text-gray-700 flex items-center justify-center hover:bg-gray-200 shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(item.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
    </div>
  );
};
