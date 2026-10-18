import React, { useState } from 'react';
import { Truck, Search, Plus, Calendar, DollarSign, CheckCircle2, Clock } from 'lucide-react';
import { SupplierOrder } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/cloudSync';

interface SupplierViewProps {
  supplierOrders: SupplierOrder[];
  onAddSupplierOrder: (order: SupplierOrder) => void;
  onUpdateOrderStatus: (orderId: string, status: 'lunas' | 'hutang_tempo' | 'diterima') => void;
}

export const SupplierView: React.FC<SupplierViewProps> = ({
  supplierOrders,
  onAddSupplierOrder,
  onUpdateOrderStatus,
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [totalAmount, setTotalAmount] = useState(1500000);
  const [status, setStatus] = useState<'lunas' | 'hutang_tempo' | 'diterima'>('hutang_tempo');
  const [dueDate, setDueDate] = useState('2026-10-03');

  const filtered = supplierOrders.filter((o) =>
    o.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    o.poNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalHutangSupplier = supplierOrders
    .filter((o) => o.status === 'hutang_tempo')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;

    const newOrder: SupplierOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`,
      supplierName: supplierName.trim(),
      date: new Date().toISOString().slice(0, 10),
      dueDate,
      totalAmount,
      status,
      items: [
        {
          barcode: '8992388110011',
          name: 'Pasokan Sembako Masuk Gudang',
          qty: 1,
          unit: 'Lot',
          buyPrice: totalAmount,
          subtotal: totalAmount,
        },
      ],
    };

    onAddSupplierOrder(newOrder);
    setShowAddModal(false);
    setSupplierName('');
  };

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase">
            Total Penerimaan Sembako
          </div>
          <div className="text-xl font-bold text-teal-900 mt-1">
            {formatRupiah(supplierOrders.reduce((a, b) => a + b.totalAmount, 0))}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{supplierOrders.length} Surat Jalan / Faktur</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase">
            Hutang Tempo ke Supplier
          </div>
          <div className="text-xl font-bold text-amber-700 mt-1">
            {formatRupiah(totalHutangSupplier)}
          </div>
          <div className="text-xs text-amber-600 mt-0.5">Wajib dilunasi sesuai jatuh tempo</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase">Penerimaan Barang Baru</div>
            <div className="text-xs text-gray-500 mt-0.5">Catat faktur pasokan dari distributor</div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="mt-2 py-2 px-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Faktur Penerimaan Supplier</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama supplier atau no PO..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">NO. PO & FAKTUR</th>
                <th className="py-3 px-4">NAMA SUPPLIER / DISTRIBUTOR</th>
                <th className="py-3 px-4">TANGGAL MASUK</th>
                <th className="py-3 px-4">JATUH TEMPO</th>
                <th className="py-3 px-4">TOTAL TAGIHAN</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">{order.poNumber}</td>
                  <td className="py-3 px-4 font-semibold text-gray-800">{order.supplierName}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDateIndo(order.date)}</td>
                  <td className="py-3 px-4 text-rose-600 font-medium">{formatDateIndo(order.dueDate)}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{formatRupiah(order.totalAmount)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        order.status === 'lunas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'hutang_tempo'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.status === 'hutang_tempo' ? 'Hutang Tempo' : order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {order.status === 'hutang_tempo' && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'lunas')}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Set Lunas
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards */}
        <div className="block md:hidden divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              Belum ada faktur supplier.
            </div>
          ) : (
            filtered.map((order) => (
              <div key={order.id} className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{order.supplierName}</h4>
                    <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-sm">
                      {order.poNumber}
                    </span>
                  </div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      order.status === 'lunas'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'hutang_tempo'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {order.status === 'hutang_tempo' ? 'Hutang' : order.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl">
                  <div>
                    <div className="text-[10px] text-gray-400">Total Tagihan:</div>
                    <div className="font-bold text-gray-900 font-mono text-sm">{formatRupiah(order.totalAmount)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400">Jatuh Tempo:</div>
                    <div className="font-semibold text-rose-600 text-[11px]">{formatDateIndo(order.dueDate)}</div>
                  </div>
                </div>

                {order.status === 'hutang_tempo' && (
                  <button
                    type="button"
                    onClick={() => onUpdateOrderStatus(order.id, 'lunas')}
                    className="w-full py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Tandai Faktur Telah Lunas
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-base text-gray-900">Catat Penerimaan Barang Supplier</h3>
            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Supplier</label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Contoh: PT Indomarco Adi Prima"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Total Nilai Faktur (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status Pembayaran</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white"
                >
                  <option value="hutang_tempo">Hutang Tempo (Kredit)</option>
                  <option value="lunas">Lunas Tunai</option>
                  <option value="diterima">Diterima Konsinyasi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Jatuh Tempo Pembayaran</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-800 text-white text-xs font-bold rounded-xl"
                >
                  Simpan Faktur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
