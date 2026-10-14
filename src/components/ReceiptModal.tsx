import React from 'react';
import { X, Printer, CheckCircle2, Store } from 'lucide-react';
import { SaleTransaction } from '../types';
import { formatRupiah } from '../utils/cloudSync';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: SaleTransaction | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-teal-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Transaksi Berhasil</span>
          </div>
          <button type="button" onClick={onClose} className="text-teal-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Paper Area */}
        <div className="p-5 bg-white font-mono text-xs text-gray-800 space-y-3 receipt-paper">
          <div className="text-center border-b border-dashed border-gray-300 pb-3">
            <div className="font-bold text-base tracking-wider text-gray-900">RIYAN STORE</div>
            <div className="text-[10px] text-gray-500">Sistem Manajemen Sembako Terintegrasi</div>
            <div className="text-[10px] text-gray-600 font-medium">Kp. Barani RT 011 RW 04 Desa Sangiang, Pamarayan</div>
            <div className="text-[10px] text-gray-500">Telp/WA: 0812-3456-7890</div>
          </div>

          <div className="text-[11px] space-y-0.5 border-b border-dashed border-gray-300 pb-2">
            <div className="flex justify-between">
              <span>No. Invoice:</span>
              <span className="font-bold">{transaction.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal:</span>
              <span>{transaction.date}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{transaction.cashier}</span>
            </div>
            {transaction.customerName && (
              <div className="flex justify-between text-teal-800">
                <span>Pelanggan:</span>
                <span className="font-semibold">{transaction.customerName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Metode:</span>
              <span className="uppercase font-bold">{transaction.paymentMethod}</span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-1.5 border-b border-dashed border-gray-300 pb-2.5">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="font-bold text-gray-900">{item.name}</div>
                <div className="flex justify-between text-gray-600 text-[11px]">
                  <span>
                    {item.qty} x {formatRupiah(item.price)}
                  </span>
                  <span className="font-bold text-gray-800">{formatRupiah(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatRupiah(transaction.totalAmount)}</span>
            </div>
            {transaction.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Diskon:</span>
                <span>-{formatRupiah(transaction.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200">
              <span>TOTAL:</span>
              <span>{formatRupiah(transaction.finalAmount)}</span>
            </div>
            {transaction.paymentMethod === 'tunai' && (
              <>
                <div className="flex justify-between">
                  <span>Bayar Tunai:</span>
                  <span>{formatRupiah(transaction.cashPaid || transaction.finalAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(transaction.change || 0)}</span>
                </div>
              </>
            )}
            {transaction.paymentMethod === 'kasbon' && (
              <div className="bg-rose-50 text-rose-800 p-1.5 rounded-sm text-[10px] font-bold text-center">
                TERCATAT SEBAGAI KASBON / HUTANG
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-gray-500 pt-1">
            <p>Terima Kasih Telah Berbelanja</p>
            <p>di RIYAN STORE</p>
            <p className="mt-1 text-[9px]">Barang yang sudah dibeli dapat ditukar jika kemasan cacat</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2 px-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
