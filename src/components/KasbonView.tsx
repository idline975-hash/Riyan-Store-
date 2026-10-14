import React, { useState } from 'react';
import { CreditCard, Search, Plus, CheckCircle2, AlertCircle, Phone, Calendar, ArrowRight, DollarSign } from 'lucide-react';
import { KasbonRecord } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/cloudSync';
import { sound } from '../utils/audio';

interface KasbonViewProps {
  kasbonList: KasbonRecord[];
  onPayKasbon: (kasbonId: string, amount: number, note: string) => void;
  onAddManualKasbon: (newKasbon: KasbonRecord) => void;
}

export const KasbonView: React.FC<KasbonViewProps> = ({
  kasbonList,
  onPayKasbon,
  onAddManualKasbon,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'belum_lunas' | 'lunas'>('belum_lunas');

  // Pay modal state
  const [selectedKasbon, setSelectedKasbon] = useState<KasbonRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNote, setPayNote] = useState('');

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState<number>(50000);
  const [newDueDate, setNewDueDate] = useState('2026-09-26');
  const [newNotes, setNewNotes] = useState('');

  const totalOutstanding = kasbonList
    .filter((k) => k.status === 'belum_lunas')
    .reduce((acc, k) => acc + k.remainingDebt, 0);

  const totalSettled = kasbonList
    .filter((k) => k.status === 'lunas')
    .reduce((acc, k) => acc + k.totalDebt, 0);

  const filtered = kasbonList.filter((k) => {
    const matchesStatus = statusFilter === 'semua' || k.status === statusFilter;
    const matchesSearch =
      !search.trim() ||
      k.customerName.toLowerCase().includes(search.toLowerCase()) ||
      k.customerPhone.includes(search) ||
      k.invoiceNo.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKasbon || payAmount <= 0) return;

    sound.playPaymentSuccess();
    onPayKasbon(selectedKasbon.id, payAmount, payNote.trim() || 'Pembayaran kasbon');
    setSelectedKasbon(null);
    setPayAmount(0);
    setPayNote('');
  };

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || newDebtAmount <= 0) return;

    const record: KasbonRecord = {
      id: `ksb-${Date.now()}`,
      customerName: newCustName.trim(),
      customerPhone: newCustPhone.trim() || '-',
      invoiceNo: `MANUAL/${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().slice(0, 10),
      dueDate: newDueDate,
      totalDebt: newDebtAmount,
      remainingDebt: newDebtAmount,
      status: 'belum_lunas',
      notes: newNotes.trim() || 'Pencatatan kasbon manual',
      payments: [],
    };

    sound.playItemAdded();
    onAddManualKasbon(record);
    setShowAddModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewDebtAmount(50000);
    setNewNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs">
          <div className="text-[11px] font-bold text-rose-700 uppercase">
            Total Kasbon Belum Lunas
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">
            {formatRupiah(totalOutstanding)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {kasbonList.filter((k) => k.status === 'belum_lunas').length} Pelanggan belum melunasi
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase">
            Total Kasbon Telah Lunas
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {formatRupiah(totalSettled)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {kasbonList.filter((k) => k.status === 'lunas').length} Transaksi kasbon selesai
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase">Pencatatan Manual</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Tambah catatan hutang tanpa lewat kasir
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="mt-2 py-2 px-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Kasbon Pelanggan</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pelanggan atau no WA..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium">Status:</span>
            {(['belum_lunas', 'lunas', 'semua'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                  statusFilter === st
                    ? 'bg-teal-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st === 'belum_lunas' ? 'Belum Lunas' : st === 'lunas' ? 'Lunas' : 'Semua'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">NAMA PELANGGAN</th>
                <th className="py-3 px-4">TANGGAL & JATUH TEMPO</th>
                <th className="py-3 px-4">TOTAL KASBON</th>
                <th className="py-3 px-4">SISA HUTANG</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-center">AKSI BAYAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    Tidak ada catatan kasbon yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((kasbon) => (
                  <tr key={kasbon.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{kasbon.customerName}</div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {kasbon.customerPhone}
                      </div>
                      {kasbon.notes && (
                        <div className="text-[11px] text-gray-500 italic mt-0.5">
                          "{kasbon.notes}"
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <div>Tercatat: {formatDateIndo(kasbon.date)}</div>
                      <div className="text-[11px] font-semibold text-rose-600 mt-0.5">
                        Tempo: {formatDateIndo(kasbon.dueDate)}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {formatRupiah(kasbon.totalDebt)}
                    </td>
                    <td className="py-3 px-4">
                      <div
                        className={`font-black text-sm ${
                          kasbon.remainingDebt > 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {formatRupiah(kasbon.remainingDebt)}
                      </div>
                      {kasbon.payments.length > 0 && (
                        <div className="text-[10px] text-gray-500">
                          Sudah dicicil {kasbon.payments.length}x
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          kasbon.status === 'lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {kasbon.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {kasbon.status === 'belum_lunas' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedKasbon(kasbon);
                            setPayAmount(kasbon.remainingDebt);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Bayar Kasbon
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Selesai ✓</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Debt Modal */}
      {selectedKasbon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-base text-gray-900">Pembayaran Kasbon / Hutang</h3>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
              <div className="font-bold text-gray-800">{selectedKasbon.customerName}</div>
              <div className="text-gray-500 mt-0.5">
                Sisa Hutang: <span className="font-bold text-rose-600">{formatRupiah(selectedKasbon.remainingDebt)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nominal Pembayaran (Rp)
                </label>
                <input
                  type="number"
                  min="1000"
                  max={selectedKasbon.remainingDebt}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base font-bold text-emerald-800"
                />
                <div className="flex gap-1 mt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPayAmount(selectedKasbon.remainingDebt)}
                    className="text-teal-700 font-bold hover:underline"
                  >
                    Bayar Lunas ({formatRupiah(selectedKasbon.remainingDebt)})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Pembayaran</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Misal: Titip uang lewat anak"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedKasbon(null)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Konfirmasi Bayar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Add Kasbon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-base text-gray-900">Catat Kasbon Pelanggan Baru</h3>

            <form onSubmit={handleCreateManual} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Pelanggan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Contoh: Pak Joko Bengkel"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nominal Hutang (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={newDebtAmount}
                  onChange={(e) => setNewDebtAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-bold text-rose-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Janji Bayar (Jatuh Tempo)</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan / Barang yang Diambil</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Misal: Beras 5kg + Minyak 1L"
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
                  className="flex-1 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Simpan Kasbon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
