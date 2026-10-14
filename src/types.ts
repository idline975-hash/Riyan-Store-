export interface SembakoItem {
  id: string;
  barcode: string;
  name: string;
  category: string;
  unitBase: string; // Pcs, Kg, Liter, Bungkus, Botol
  unitConversion: string; // contoh: 1 Dus = 40 Bks, 1 Karung = 25 Kg
  stock: number;
  minStock: number;
  buyPrice: number; // HPP
  sellPrice: number; // Eceran
  wholesalePrice: number; // Grosir
  minWholesaleQty: number;
  expiryDate: string; // YYYY-MM-DD
  supplier: string;
  updatedAt: string;
}

export interface CartItem {
  item: SembakoItem;
  quantity: number;
  priceType: 'retail' | 'wholesale';
  discount: number; // in Rupiah
  subtotal: number;
}

export interface SaleTransaction {
  id: string;
  invoiceNo: string;
  date: string;
  items: {
    itemId: string;
    barcode: string;
    name: string;
    qty: number;
    unit: string;
    price: number;
    subtotal: number;
  }[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: 'tunai' | 'qris' | 'kasbon';
  customerName?: string;
  customerPhone?: string;
  cashPaid?: number;
  change?: number;
  cashier: string;
  status: 'selesai' | 'kasbon_tercatat';
  createdAt: string;
}

export interface KasbonRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  totalDebt: number;
  remainingDebt: number;
  status: 'belum_lunas' | 'lunas';
  notes?: string;
  payments: {
    id: string;
    date: string;
    amount: number;
    note: string;
  }[];
}

export interface SupplierOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  status: 'lunas' | 'hutang_tempo' | 'diterima';
  items: {
    barcode: string;
    name: string;
    qty: number;
    unit: string;
    buyPrice: number;
    subtotal: number;
  }[];
}

export interface StockOpnameLog {
  id: string;
  date: string;
  itemId: string;
  barcode: string;
  itemName: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  notes: string;
  officer: string;
}

export interface DamagedItemLog {
  id: string;
  date: string;
  itemId: string;
  barcode: string;
  itemName: string;
  qty: number;
  unit: string;
  reason: 'Kadaluwarsa' | 'Kemasan Bocor / Pecah' | 'Rusak / Basi' | 'Retur ke Supplier';
  status: 'Dimusnahkan' | 'Proses Retur' | 'Selesai';
  officer: string;
}

export type MainTabType =
  | 'pos'
  | 'riwayat'
  | 'kasbon'
  | 'inventaris'
  | 'supplier'
  | 'keuangan'
  | 'master_harga';

export type InventorySubTabType =
  | 'katalog'
  | 'kadaluwarsa'
  | 'opname'
  | 'rusak';
