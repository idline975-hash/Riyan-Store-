import React from 'react';
import { LineChart, DollarSign, TrendingUp, Archive, CreditCard, ShoppingBag, Award } from 'lucide-react';
import { SaleTransaction, SembakoItem, KasbonRecord } from '../types';
import { formatRupiah } from '../utils/cloudSync';

interface FinanceSummaryViewProps {
  transactions: SaleTransaction[];
  items: SembakoItem[];
  kasbonList: KasbonRecord[];
}

export const FinanceSummaryView: React.FC<FinanceSummaryViewProps> = ({
  transactions,
  items,
  kasbonList,
}) => {
  // Total Revenue
  const totalRevenue = transactions.reduce((acc, t) => acc + t.finalAmount, 0);

  // Estimate HPP from transactions
  let totalHppCost = 0;
  transactions.forEach((tx) => {
    tx.items.forEach((line) => {
      const match = items.find((i) => i.id === line.itemId || i.barcode === line.barcode);
      const buyPrice = match ? match.buyPrice : line.price * 0.85;
      totalHppCost += buyPrice * line.qty;
    });
  });

  const grossProfit = totalRevenue - totalHppCost;
  const marginPercent = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Total Inventory Asset Value
  const totalAssetValue = items.reduce((acc, item) => acc + item.stock * item.buyPrice, 0);

  // Outstanding Customer Debt
  const totalCustomerDebt = kasbonList
    .filter((k) => k.status === 'belum_lunas')
    .reduce((acc, k) => acc + k.remainingDebt, 0);

  // Best selling products calculation
  const salesByItem: { [name: string]: { qty: number; total: number; unit: string } } = {};
  transactions.forEach((tx) => {
    tx.items.forEach((line) => {
      if (!salesByItem[line.name]) {
        salesByItem[line.name] = { qty: 0, total: 0, unit: line.unit };
      }
      salesByItem[line.name].qty += line.qty;
      salesByItem[line.name].total += line.subtotal;
    });
  });

  const topSelling = Object.entries(salesByItem)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase">Total Pendapatan / Omset</div>
          <div className="text-2xl font-bold text-teal-900 mt-1">{formatRupiah(totalRevenue)}</div>
          <div className="text-xs text-gray-500 mt-1">{transactions.length} Transaksi Penjualan</div>
        </div>

        {/* Laba Kotor */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase">Laba Kotor (Gross Profit)</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{formatRupiah(grossProfit)}</div>
          <div className="text-xs text-emerald-600 mt-1">Margin Keuntungan ~{marginPercent}%</div>
        </div>

        {/* Nilai Aset Stok Gudang */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase">Nilai Aset Stok Sembako</div>
          <div className="text-2xl font-bold text-blue-800 mt-1">{formatRupiah(totalAssetValue)}</div>
          <div className="text-xs text-gray-500 mt-1">{items.length} Jenis Barang Sembako</div>
        </div>

        {/* Piutang Kasbon */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs">
          <div className="text-[11px] font-bold text-rose-700 uppercase">Piutang Kasbon Pelanggan</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{formatRupiah(totalCustomerDebt)}</div>
          <div className="text-xs text-rose-600 mt-1">Uang beredar di pelanggan</div>
        </div>
      </div>

      {/* Top 5 Sembako & Payment Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-900 text-sm">Produk Sembako Paling Laris</h3>
          </div>

          <div className="space-y-3">
            {topSelling.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">Belum ada transaksi penjualan tercatat.</p>
            ) : (
              topSelling.map(([name, data], idx) => (
                <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-gray-900">{name}</div>
                      <div className="text-[11px] text-gray-500">
                        Terjual: <span className="font-semibold text-gray-800">{data.qty} {data.unit}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs sm:text-sm text-emerald-800">
                      {formatRupiah(data.total)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Financial Flow Summary */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <LineChart className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-gray-900 text-sm">Ringkasan Arus Kas & Saldo</h3>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between p-2.5 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Penjualan Kotor:</span>
              <span className="font-bold text-gray-900">{formatRupiah(totalRevenue)}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Estimasi Beban Pokok Penjualan (HPP):</span>
              <span className="font-bold text-rose-700">-{formatRupiah(totalHppCost)}</span>
            </div>
            <div className="flex justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200 font-bold text-emerald-900">
              <span>Keuntungan Bersih Toko (Laba Bersih):</span>
              <span className="text-base">{formatRupiah(grossProfit)}</span>
            </div>
          </div>

          <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 text-xs text-teal-900 leading-relaxed">
            <div className="font-bold mb-1">Status Sinkronisasi Cloud:</div>
            Semua perhitungan omset, laba kotor, dan pengurangan stok terintegrasi otomatis secara realtime dengan database Riyan Store.
          </div>
        </div>
      </div>
    </div>
  );
};
