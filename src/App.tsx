/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  SembakoItem,
  CartItem,
  SaleTransaction,
  KasbonRecord,
  SupplierOrder,
  StockOpnameLog,
  DamagedItemLog,
  MainTabType,
} from './types';
import {
  INITIAL_ITEMS,
  INITIAL_TRANSACTIONS,
  INITIAL_KASBON,
  INITIAL_SUPPLIERS,
  INITIAL_OPNAME,
  INITIAL_DAMAGED,
  PRESET_BARCODE_CATALOG,
} from './data/initialData';
import { CloudSyncState, getDaysUntilExpiry } from './utils/cloudSync';
import { sound } from './utils/audio';

import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { InventoryView } from './components/InventoryView';
import { PosCashierView } from './components/PosCashierView';
import { TodayHistoryView } from './components/TodayHistoryView';
import { KasbonView } from './components/KasbonView';
import { SupplierView } from './components/SupplierView';
import { FinanceSummaryView } from './components/FinanceSummaryView';
import { MasterPriceView } from './components/MasterPriceView';

import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { AddOrEditItemModal } from './components/AddOrEditItemModal';
import { StockInModal } from './components/StockInModal';
import { StockOpnameModal } from './components/StockOpnameModal';
import { ReceiptModal } from './components/ReceiptModal';
import { LoginLockScreen } from './components/LoginLockScreen';
import { BottomNavBar } from './components/BottomNavBar';

const STORAGE_KEYS = {
  ITEMS: 'riyan_store_items_v1',
  TRANSACTIONS: 'riyan_store_transactions_v1',
  KASBON: 'riyan_store_kasbon_v1',
  SUPPLIERS: 'riyan_store_suppliers_v1',
  OPNAME: 'riyan_store_opname_v1',
  DAMAGED: 'riyan_store_damaged_v1',
};

export default function App() {
  // Session login / lock state
  const [isSessionActive, setIsSessionActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('riyan_store_session_active_v1');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [currentUser, setCurrentUser] = useState<string>('Pemilik Toko (Riyan)');

  // Empty data by default - ready for real store data entry
  const [items, setItems] = useState<SembakoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [kasbonList, setKasbonList] = useState<KasbonRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.KASBON);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [opnameLogs, setOpnameLogs] = useState<StockOpnameLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OPNAME);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [damagedLogs, setDamagedLogs] = useState<DamagedItemLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAMAGED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Ensure any previous demo/mock cache is cleaned out
  useEffect(() => {
    try {
      localStorage.removeItem('alunk_store_items_v2');
      localStorage.removeItem('alunk_store_transactions_v2');
      localStorage.removeItem('alunk_store_kasbon_v2');
      localStorage.removeItem('alunk_store_suppliers_v2');
      localStorage.removeItem('alunk_store_opname_v2');
      localStorage.removeItem('alunk_store_damaged_v2');
    } catch {
      // ignore
    }
  }, []);

  // Active Tab: default to 'inventaris' to match the user's screenshot layout immediately
  const [activeTab, setActiveTab] = useState<MainTabType>('inventaris');

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cashierSessionOpen, setCashierSessionOpen] = useState(false);

  // Cloud Sync State
  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncState>({
    status: 'synced',
    lastSyncedAt: new Date(),
    pendingChanges: 0,
    latencyMs: 38,
  });

  // Modal States
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeModalMode, setBarcodeModalMode] = useState<'pos' | 'inventory'>('inventory');

  const [addOrEditModalOpen, setAddOrEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SembakoItem | null>(null);
  const [scannedBarcodeForNewItem, setScannedBarcodeForNewItem] = useState('');

  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [stockInTargetItem, setStockInTargetItem] = useState<SembakoItem | null>(null);

  const [stockOpnameModalOpen, setStockOpnameModalOpen] = useState(false);
  const [stockOpnameTargetItem, setStockOpnameTargetItem] = useState<SembakoItem | null>(null);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [currentReceiptTx, setCurrentReceiptTx] = useState<SaleTransaction | null>(null);

  // Toast / Floating message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // Sync to localStorage + simulate real-time cloud sync ping
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.KASBON, JSON.stringify(kasbonList));
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(supplierOrders));
      localStorage.setItem(STORAGE_KEYS.OPNAME, JSON.stringify(opnameLogs));
      localStorage.setItem(STORAGE_KEYS.DAMAGED, JSON.stringify(damagedLogs));

      // Trigger cloud sync pulsing
      setCloudSyncState((prev) => ({ ...prev, status: 'syncing' }));
      const timer = setTimeout(() => {
        setCloudSyncState({
          status: 'synced',
          lastSyncedAt: new Date(),
          pendingChanges: 0,
          latencyMs: Math.floor(25 + Math.random() * 20),
        });
      }, 500);

      return () => clearTimeout(timer);
    } catch (e) {
      console.error('Persistence error:', e);
    }
  }, [items, transactions, kasbonList, supplierOrders, opnameLogs, damagedLogs]);

  const handleManualSync = () => {
    setCloudSyncState((prev) => ({ ...prev, status: 'syncing' }));
    sound.playItemAdded();
    setTimeout(() => {
      setCloudSyncState({
        status: 'synced',
        lastSyncedAt: new Date(),
        pendingChanges: 0,
        latencyMs: 32,
      });
      showToast('Sinkronisasi cloud realtime berhasil diselesaikan.');
    }, 600);
  };

  // Barcode Handler (Handles both POS scanning and Inventory scanning)
  const handleBarcodeDetected = (barcode: string) => {
    const cleanCode = barcode.trim();
    if (!cleanCode) return;

    if (barcodeModalMode === 'pos') {
      // Selling item in POS
      const matched = items.find((i) => i.barcode === cleanCode);
      if (matched) {
        if (matched.stock <= 0) {
          sound.playError();
          showToast(`⚠️ Stok "${matched.name}" habis di gudang!`);
          return;
        }
        handleAddToCart(matched, 1);
        showToast(`✓ Ditambahkan ke Keranjang: ${matched.name}`);
      } else {
        sound.playError();
        showToast(`❌ Barcode ${cleanCode} tidak ditemukan di inventaris.`);
      }
    } else {
      // Inventory mode: rapid input / restock
      const matched = items.find((i) => i.barcode === cleanCode);
      if (matched) {
        // Item already exists: open restock / incoming goods modal
        setBarcodeModalOpen(false);
        setStockInTargetItem(matched);
        setStockInModalOpen(true);
        showToast(`Barang terdaftar: ${matched.name}. Siap restock.`);
      } else {
        // New item: open Add Item Modal with prefilled barcode & presets
        setBarcodeModalOpen(false);
        setEditingItem(null);
        setScannedBarcodeForNewItem(cleanCode);
        setAddOrEditModalOpen(true);
        showToast(`Barcode baru ${cleanCode} terdeteksi. Silakan lengkapi data barang.`);
      }
    }
  };

  // Cart operations
  const handleAddToCart = (item: SembakoItem, qtyToAdd = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((c) => c.item.id === item.id);
      if (existingIndex > -1) {
        const current = prev[existingIndex];
        const newQty = current.quantity + qtyToAdd;

        // Auto-apply wholesale if qty reaches threshold
        let newPriceType = current.priceType;
        if (item.minWholesaleQty > 1 && newQty >= item.minWholesaleQty) {
          newPriceType = 'wholesale';
        }

        const unitPrice = newPriceType === 'wholesale' ? item.wholesalePrice : item.sellPrice;
        const updated = [...prev];
        updated[existingIndex] = {
          ...current,
          quantity: newQty,
          priceType: newPriceType,
          subtotal: newQty * unitPrice - current.discount,
        };
        return updated;
      } else {
        const priceType = qtyToAdd >= item.minWholesaleQty && item.minWholesaleQty > 1 ? 'wholesale' : 'retail';
        const unitPrice = priceType === 'wholesale' ? item.wholesalePrice : item.sellPrice;
        return [
          ...prev,
          {
            item,
            quantity: qtyToAdd,
            priceType,
            discount: 0,
            subtotal: qtyToAdd * unitPrice,
          },
        ];
      }
    });
  };

  const handleUpdateCartQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((c) => {
        if (c.item.id === itemId) {
          const unitPrice = c.priceType === 'wholesale' ? c.item.wholesalePrice : c.item.sellPrice;
          return {
            ...c,
            quantity: newQty,
            subtotal: newQty * unitPrice - c.discount,
          };
        }
        return c;
      })
    );
  };

  const handleToggleCartPriceType = (itemId: string) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.item.id === itemId) {
          const nextType = c.priceType === 'retail' ? 'wholesale' : 'retail';
          const unitPrice = nextType === 'wholesale' ? c.item.wholesalePrice : c.item.sellPrice;
          return {
            ...c,
            priceType: nextType,
            subtotal: c.quantity * unitPrice - c.discount,
          };
        }
        return c;
      })
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Complete POS Sale Transaction
  const handleCompleteTransaction = (transaction: SaleTransaction, newKasbon?: KasbonRecord) => {
    // 1. Deduct inventory stock immediately
    setItems((prevItems) => {
      const updated = prevItems.map((item) => {
        const cartLine = transaction.items.find((line) => line.itemId === item.id);
        if (cartLine) {
          return {
            ...item,
            stock: Math.max(0, item.stock - cartLine.qty),
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      });
      return updated;
    });

    // 2. Add to transaction log
    setTransactions((prev) => [transaction, ...prev]);

    // 3. If kasbon, add to kasbon ledger
    if (newKasbon) {
      setKasbonList((prev) => [newKasbon, ...prev]);
    }

    // 4. Clear cart & open receipt
    setCart([]);
    setCurrentReceiptTx(transaction);
    setReceiptModalOpen(true);
    showToast(`✓ Transaksi ${transaction.invoiceNo} berhasil disimpan.`);
  };

  // Inventory Save (Add or Edit)
  const handleSaveItem = (itemData: SembakoItem, isNew: boolean) => {
    if (isNew) {
      setItems((prev) => [itemData, ...prev]);
      showToast(`✓ Barang baru "${itemData.name}" berhasil ditambahkan.`);
    } else {
      setItems((prev) => prev.map((i) => (i.id === itemData.id ? itemData : i)));
      showToast(`✓ Data "${itemData.name}" berhasil diperbarui.`);
    }
  };

  // Restock Incoming Goods
  const handleConfirmRestock = (itemId: string, addQty: number, newBuyPrice?: number, newExpiry?: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          return {
            ...i,
            stock: i.stock + addQty,
            buyPrice: newBuyPrice !== undefined ? newBuyPrice : i.buyPrice,
            expiryDate: newExpiry || i.expiryDate,
            updatedAt: new Date().toISOString(),
          };
        }
        return i;
      })
    );
    showToast(`✓ Stok berhasil ditambah (+${addQty}).`);
  };

  // Stock Opname
  const handleSaveOpname = (log: StockOpnameLog, newStock: number) => {
    setOpnameLogs((prev) => [log, ...prev]);
    setItems((prev) =>
      prev.map((i) => (i.id === log.itemId ? { ...i, stock: newStock, updatedAt: new Date().toISOString() } : i))
    );
    showToast(`✓ Stok opname dicatat. Stok fisik disesuaikan (${newStock}).`);
  };

  // Delete Item
  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    showToast('Barang telah dihapus dari inventaris.');
  };

  // Update Prices
  const handleUpdatePrices = (
    itemId: string,
    buyPrice: number,
    sellPrice: number,
    wholesalePrice: number,
    minWholesaleQty: number
  ) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          return {
            ...i,
            buyPrice,
            sellPrice,
            wholesalePrice,
            minWholesaleQty,
            updatedAt: new Date().toISOString(),
          };
        }
        return i;
      })
    );
    showToast('Master harga barang berhasil diperbarui.');
  };

  // Pay Kasbon
  const handlePayKasbon = (kasbonId: string, amount: number, note: string) => {
    setKasbonList((prev) =>
      prev.map((k) => {
        if (k.id === kasbonId) {
          const newRemaining = Math.max(0, k.remainingDebt - amount);
          return {
            ...k,
            remainingDebt: newRemaining,
            status: newRemaining === 0 ? 'lunas' : 'belum_lunas',
            payments: [
              ...k.payments,
              {
                id: `pay-${Date.now()}`,
                date: new Date().toISOString().replace('T', ' ').slice(0, 16),
                amount,
                note,
              },
            ],
          };
        }
        return k;
      })
    );
    showToast(`✓ Pembayaran kasbon sebesar Rp ${amount.toLocaleString('id-ID')} berhasil dicatat.`);
  };

  // Add Manual Kasbon
  const handleAddManualKasbon = (newKasbon: KasbonRecord) => {
    setKasbonList((prev) => [newKasbon, ...prev]);
    showToast('Kasbon pelanggan baru berhasil dicatat.');
  };

  // Add Supplier Order
  const handleAddSupplierOrder = (order: SupplierOrder) => {
    setSupplierOrders((prev) => [order, ...prev]);
    showToast('Faktur penerimaan supplier berhasil dicatat.');
  };

  const handleUpdateOrderStatus = (orderId: string, status: 'lunas' | 'hutang_tempo' | 'diterima') => {
    setSupplierOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    showToast('Status faktur supplier diperbarui.');
  };

  // Clear all inputted data
  const handleClearAllData = useCallback(() => {
    setItems([]);
    setTransactions([]);
    setKasbonList([]);
    setSupplierOrders([]);
    setOpnameLogs([]);
    setDamagedLogs([]);
    setCart([]);
    Object.values(STORAGE_KEYS).forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
    sound.playItemDeleted();
    showToast('Semua data toko telah dikosongkan.');
  }, [showToast]);

  // Load sample sembako data
  const handleLoadSampleData = useCallback(() => {
    setItems(INITIAL_ITEMS);
    setTransactions(INITIAL_TRANSACTIONS);
    setKasbonList(INITIAL_KASBON);
    setSupplierOrders(INITIAL_SUPPLIERS);
    setOpnameLogs(INITIAL_OPNAME);
    setDamagedLogs(INITIAL_DAMAGED);
    sound.playSuccess();
    showToast('Data contoh sembako berhasil dimuat.');
  }, [showToast]);

  // Handle logout and session lock
  const handleLogout = useCallback(() => {
    setIsSessionActive(false);
    try {
      localStorage.setItem('riyan_store_session_active_v1', 'false');
    } catch {
      // ignore
    }
    sound.playItemDeleted();
    showToast('Sesi Riyan Store telah keluar & terkunci.');
  }, [showToast]);

  // Handle unlock and login
  const handleLogin = useCallback((userName: string) => {
    setIsSessionActive(true);
    setCurrentUser(userName);
    try {
      localStorage.setItem('riyan_store_session_active_v1', 'true');
    } catch {
      // ignore
    }
    showToast(`Selamat datang kembali, ${userName}!`);
  }, [showToast]);

  // Counts for navigation badges
  const lowStockCount = items.filter((i) => i.stock <= i.minStock).length;
  const kasbonActiveCount = kasbonList.filter((k) => k.status === 'belum_lunas').length;
  const expiringCount = items.filter((i) => getDaysUntilExpiry(i.expiryDate) <= 30).length;

  // If user has logged out / locked session, show the Lock Screen
  if (!isSessionActive) {
    return (
      <div className="min-h-screen bg-slate-900 font-sans">
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-gray-700 animate-in fade-in slide-in-from-bottom-2">
            <span>{toastMessage}</span>
          </div>
        )}
        <LoginLockScreen onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full bg-slate-50 text-gray-900 flex flex-col font-sans selection:bg-teal-200 overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-gray-700 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Navigation Bar (Edge-to-Edge Sticky) */}
      <div className="sticky top-0 z-30 w-full max-w-full left-0 right-0 bg-white shadow-xs">
        <Header
          cashierSessionOpen={cashierSessionOpen}
          onToggleCashierSession={() => {
            setCashierSessionOpen((prev) => !prev);
            sound.playItemAdded();
            showToast(`Sesi kasir telah ${!cashierSessionOpen ? 'dibuka' : 'ditutup'}.`);
          }}
          cloudSyncState={cloudSyncState}
          onManualSync={handleManualSync}
          onClearAllData={handleClearAllData}
          onLoadSampleData={handleLoadSampleData}
          itemCount={items.length}
          onLogout={handleLogout}
        />

        <NavigationTabs
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'pos') {
              setBarcodeModalMode('pos');
            } else {
              setBarcodeModalMode('inventory');
            }
          }}
          lowStockCount={lowStockCount}
          kasbonActiveCount={kasbonActiveCount}
          expiringCount={expiringCount}
        />
      </div>

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 pb-24 md:pb-8">
        {/* Tab 1: KASIR (POS) */}
        {activeTab === 'pos' && (
          <PosCashierView
            items={items}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQty={handleUpdateCartQty}
            onToggleCartPriceType={handleToggleCartPriceType}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onCompleteTransaction={handleCompleteTransaction}
            onOpenBarcodeScanModal={() => {
              setBarcodeModalMode('pos');
              setBarcodeModalOpen(true);
            }}
            cashierName={currentUser}
          />
        )}

        {/* Tab 2: RIWAYAT HARI INI */}
        {activeTab === 'riwayat' && (
          <TodayHistoryView
            transactions={transactions}
            onViewReceipt={(tx) => {
              setCurrentReceiptTx(tx);
              setReceiptModalOpen(true);
            }}
          />
        )}

        {/* Tab 3: KASBON / HUTANG PELANGGAN */}
        {activeTab === 'kasbon' && (
          <KasbonView
            kasbonList={kasbonList}
            onPayKasbon={handlePayKasbon}
            onAddManualKasbon={handleAddManualKasbon}
          />
        )}

        {/* Tab 4: STOK & INVENTARIS SEMBAKO (Default View matching screenshot) */}
        {activeTab === 'inventaris' && (
          <InventoryView
            items={items}
            opnameLogs={opnameLogs}
            damagedLogs={damagedLogs}
            onOpenAddItem={() => {
              setEditingItem(null);
              setScannedBarcodeForNewItem('');
              setAddOrEditModalOpen(true);
            }}
            onOpenEditItem={(item) => {
              setEditingItem(item);
              setScannedBarcodeForNewItem(item.barcode);
              setAddOrEditModalOpen(true);
            }}
            onOpenRestock={(item) => {
              setStockInTargetItem(item);
              setStockInModalOpen(true);
            }}
            onOpenOpname={(item) => {
              setStockOpnameTargetItem(item);
              setStockOpnameModalOpen(true);
            }}
            onDeleteItem={handleDeleteItem}
            onOpenBarcodeScanModal={() => {
              setBarcodeModalMode('inventory');
              setBarcodeModalOpen(true);
            }}
          />
        )}

        {/* Tab 5: PENERIMAAN & HUTANG SUPPLIER */}
        {activeTab === 'supplier' && (
          <SupplierView
            supplierOrders={supplierOrders}
            onAddSupplierOrder={handleAddSupplierOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {/* Tab 6: RINGKASAN KEUANGAN */}
        {activeTab === 'keuangan' && (
          <FinanceSummaryView
            transactions={transactions}
            items={items}
            kasbonList={kasbonList}
          />
        )}

        {/* Tab 7: MASTER HARGA (HPP/GROSIR) */}
        {activeTab === 'master_harga' && (
          <MasterPriceView
            items={items}
            onUpdatePrices={handleUpdatePrices}
          />
        )}
      </main>

      {/* Footer Powered By */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-3 px-4 text-center pb-24 md:pb-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <div>
            <span className="font-semibold text-gray-800">RIYAN STORE</span> — Kp. Barani RT 011 RW 04 Desa Sangiang, Pamarayan | Sistem Manajemen Sembako Terintegrasi
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white rounded-full text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Cloud Realtime Active</span>
          </div>
        </div>
      </footer>

      {/* Fixed Edge-to-Edge Mobile Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'pos') {
            setBarcodeModalMode('pos');
          } else {
            setBarcodeModalMode('inventory');
          }
        }}
        lowStockCount={lowStockCount}
        kasbonActiveCount={kasbonActiveCount}
        onOpenBarcodeScanModal={() => {
          setBarcodeModalMode(activeTab === 'pos' ? 'pos' : 'inventory');
          setBarcodeModalOpen(true);
        }}
      />

      {/* Barcode Scanner Modal (Camera + Laser Gun + Simulated Sembako Barcodes) */}
      <BarcodeScannerModal
        isOpen={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        onBarcodeDetected={handleBarcodeDetected}
        mode={barcodeModalMode}
        title={
          barcodeModalMode === 'pos'
            ? 'Scan Barcode Penjualan (Kasir POS)'
            : 'Scan Barcode Inventaris / Restock Sembako'
        }
        subtitle={
          barcodeModalMode === 'pos'
            ? 'Arahkan kamera ke kemasan sembako untuk memasukkan ke keranjang kasir'
            : 'Pindai barcode untuk input cepat barang baru atau restock gudang'
        }
      />

      {/* Add / Edit Item Modal */}
      <AddOrEditItemModal
        isOpen={addOrEditModalOpen}
        onClose={() => {
          setAddOrEditModalOpen(false);
          setEditingItem(null);
          setScannedBarcodeForNewItem('');
        }}
        onSave={handleSaveItem}
        onOpenBarcodeScanner={() => {
          setBarcodeModalMode('inventory');
          setBarcodeModalOpen(true);
        }}
        initialItem={editingItem}
        initialBarcode={scannedBarcodeForNewItem}
      />

      {/* Stock In (Restock) Modal */}
      <StockInModal
        isOpen={stockInModalOpen}
        onClose={() => {
          setStockInModalOpen(false);
          setStockInTargetItem(null);
        }}
        item={stockInTargetItem}
        onConfirmRestock={handleConfirmRestock}
      />

      {/* Stock Opname Modal */}
      <StockOpnameModal
        isOpen={stockOpnameModalOpen}
        onClose={() => {
          setStockOpnameModalOpen(false);
          setStockOpnameTargetItem(null);
        }}
        item={stockOpnameTargetItem}
        onSaveOpname={handleSaveOpname}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setCurrentReceiptTx(null);
        }}
        transaction={currentReceiptTx}
      />
    </div>
  );
}
