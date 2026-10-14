import React, { useState } from 'react';
import { Clock, Search, Receipt, DollarSign, Calendar, Eye, Filter } from 'lucide-react';
import { SaleTransaction } from '../types';
import { formatRupiah } from '../utils/cloudSync';

interface TodayHistoryViewProps {
  transactions: SaleTransaction[];
  onViewReceipt: (tx: SaleTransaction) => void;
}

export const TodayHistoryView: React.FC<TodayHistoryViewProps> = ({
  transactions,
  onViewReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('semua');

  const filtered = transactions.filter((tx) => {
    const matchesPay = paymentFilter === 'semua' || tx.paymentMethod === paymentFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      tx.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPay && matchesSearch;
  });

  const totalOmset = transactions.reduce((acc, t) => acc + t.finalAmount, 0);
  const totalCash = transactions.filter((t) => t.paymentMethod === 'tunai').reduce((a, b) => a + b.finalAmount, 0);
  const totalQris = transactions.filter((t) => t.paymentMethod === 'qris').reduce((a, b) => a + b.finalAmount, 0);
  const totalKasbon = transactions.filter((t) => t.paymentMethod === 'kasbon').reduce((a, b) => a + b.finalAmount, 0);

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase">Total Omset Hari Ini</div>
          <div className="text-xl font-bold text-teal-900 mt-1">{formatRupiah(totalOmset)}</div>
          <div className="text-xs text-gray-400 mt-0.5">{transactions.length} Transaksi Selesai</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase">Tunai (Cash di Laci)</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{formatRupiah(totalCash)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Uang tunai fisik kasir</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase">QRIS Masuk Rekening</div>
          <div className="text-xl font-bold text-blue-700 mt-1">{formatRupiah(totalQris)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Langsung ke rekening toko</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase">Kasbon Tercatat</div>
          <div className="text-xl font-bold text-rose-600 mt-1">{formatRupiah(totalKasbon)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Piutang pelanggan baru</div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari invoice, pelanggan, atau barang..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium">Metode:</span>
            {['semua', 'tunai', 'qris', 'kasbon'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentFilter(m)}
                className={`px-3 py-1 rounded-lg uppercase text-[10px] font-bold transition-colors ${
                  paymentFilter === m
                    ? 'bg-teal-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">INVOICE & WAKTU</th>
                <th className="py-3 px-4">BARANG DIBELI</th>
                <th className="py-3 px-4">METODE BAYAR</th>
                <th className="py-3 px-4">TOTAL BELANJA</th>
                <th className="py-3 px-4">KASIR / PELANGGAN</th>
                <th className="py-3 px-4 text-center">STRUK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    Belum ada riwayat transaksi yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-gray-900">{tx.invoiceNo}</div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {tx.date}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800 line-clamp-1">
                        {tx.items.map((i) => `${i.name} (${i.qty})`).join(', ')}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {tx.items.length} jenis item
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          tx.paymentMethod === 'tunai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.paymentMethod === 'qris'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{formatRupiah(tx.finalAmount)}</div>
                      {tx.discountAmount > 0 && (
                        <div className="text-[10px] text-rose-600">
                          Diskon: -{formatRupiah(tx.discountAmount)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-800 font-medium">
                        {tx.customerName || 'Pelanggan Umum'}
                      </div>
                      <div className="text-[11px] text-gray-400">Kasir: {tx.cashier}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(tx)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Struk</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
