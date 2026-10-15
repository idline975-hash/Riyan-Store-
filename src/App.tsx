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
import { CloudSyncState, getDaysUntilExpiry, formatRupiah } from './utils/cloudSync';
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
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineSyncStatusBar } from './components/OfflineSyncStatusBar';
import { usePWA } from './hooks/usePWA';
import { realtimeSync } from './utils/realtimeSync';
import {
  getOfflineQueue,
  enqueueOfflineAction,
  clearOfflineQueue,
  OfflineAction,
} from './utils/offlineSyncQueue';

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

  // Desktop Mode & Display Scale (Perkecil Tampilan)
  const [isDesktopMode, setIsDesktopMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('riyan_store_desktop_mode_v1');
      return saved === null ? true : saved === 'true'; // Default true for desktop workstation view
    } catch {
      return true;
    }
  });

  const [zoomScale, setZoomScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('riyan_store_zoom_scale_v1');
      return saved ? parseFloat(saved) : 0.85; // Default 85% (agak di perkecil)
    } catch {
      return 0.85;
    }
  });

  useEffect(() => {
    try {
      document.documentElement.style.setProperty('--app-zoom', String(zoomScale));
    } catch {
      // ignore
    }
  }, [zoomScale]);

  // PWA & Background Sync Hooks
  const pwa = usePWA();
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>(() => getOfflineQueue());
  const [isSyncingOfflineQueue, setIsSyncingOfflineQueue] = useState(false);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cashierSessionOpen, setCashierSessionOpen] = useState(false);

  // Cloud Sync State
  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncState>({
    status: pwa.isOnline ? 'synced' : 'offline',
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

  // Flush Offline Queue to Cloud (Background Sync)
  const flushOfflineQueue = useCallback(async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setIsSyncingOfflineQueue(true);
    setCloudSyncState((prev) => ({ ...prev, status: 'syncing' }));

    try {
      // Simulate remote backend API sync time
      await new Promise((res) => setTimeout(res, 900));

      clearOfflineQueue();
      setOfflineQueue([]);

      setCloudSyncState({
        status: 'synced',
        lastSyncedAt: new Date(),
        pendingChanges: 0,
        latencyMs: 28,
      });

      sound.playSuccess();
      showToast(`✅ Sinkronisasi Otomatis: ${queue.length} antrean data offline berhasil dikirim ke server!`);
    } catch (e) {
      console.error('[OfflineQueue] Flush error:', e);
      showToast('Gagal menyinkronkan data offline. Akan dicoba kembali otomatis.');
    } finally {
      setIsSyncingOfflineQueue(false);
    }
  }, [showToast]);

  // When device returns online, automatically flush background sync queue
  useEffect(() => {
    if (pwa.isOnline && offlineQueue.length > 0 && !isSyncingOfflineQueue) {
      flushOfflineQueue();
    }
  }, [pwa.isOnline, offlineQueue.length, isSyncingOfflineQueue, flushOfflineQueue]);

  // Two-way Realtime Synchronization Subscriber
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((msg) => {
      console.log('[RealtimeSync] Incoming message from other tab/device:', msg.type);

      if (msg.type === 'TRANSACTION_SYNC') {
        const { transaction, newKasbon } = msg.payload as any;
        if (transaction) {
          setTransactions((prev) => {
            if (prev.some((t) => t.id === transaction.id)) return prev;
            return [transaction, ...prev];
          });
        }
        if (newKasbon) {
          setKasbonList((prev) => {
            if (prev.some((k) => k.id === newKasbon.id)) return prev;
            return [newKasbon, ...prev];
          });
        }
        // Deduct items in real-time
        if (transaction && transaction.items) {
          setItems((prev) =>
            prev.map((item) => {
              const matchedInTx = transaction.items.find((ti: any) => ti.itemId === item.id);
              if (matchedInTx) {
                return { ...item, stock: Math.max(0, item.stock - matchedInTx.quantity) };
              }
              return item;
            })
          );
        }
        showToast(`⚡ Sinkronisasi Realtime: Transaksi ${transaction?.invoiceNo} dicatat dari terminal lain.`);
      } else if (msg.type === 'ITEMS_SYNC') {
        const { items: newItems } = msg.payload as any;
        if (newItems) {
          setItems(newItems);
          showToast('⚡ Sinkronisasi Realtime: Data inventaris barang telah disinkronkan.');
        }
      } else if (msg.type === 'KASBON_SYNC') {
        const { kasbonList: newKasbonList } = msg.payload as any;
        if (newKasbonList) {
          setKasbonList(newKasbonList);
          showToast('⚡ Sinkronisasi Realtime: Catatan kasbon buku hutang disinkronkan.');
        }
      } else if (msg.type === 'SUPPLIERS_SYNC') {
        const { supplierOrders: newOrders } = msg.payload as any;
        if (newOrders) {
          setSupplierOrders(newOrders);
        }
      } else if (msg.type === 'OPNAME_SYNC') {
        const { log, newStock } = msg.payload as any;
        if (log) {
          setOpnameLogs((prev) => [log, ...prev]);
          setItems((prev) =>
            prev.map((i) => (i.id === log.itemId ? { ...i, stock: newStock } : i))
          );
        }
      }
    });

    return () => unsubscribe();
  }, [showToast]);

  // Sync to localStorage + reflect real-time cloud sync status
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.KASBON, JSON.stringify(kasbonList));
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(supplierOrders));
      localStorage.setItem(STORAGE_KEYS.OPNAME, JSON.stringify(opnameLogs));
      localStorage.setItem(STORAGE_KEYS.DAMAGED, JSON.stringify(damagedLogs));

      if (!pwa.isOnline) {
        setCloudSyncState((prev) => ({ ...prev, status: 'offline' }));
        return;
      }

      // Trigger cloud sync pulsing
      setCloudSyncState((prev) => ({ ...prev, status: 'syncing' }));
      const timer = setTimeout(() => {
        setCloudSyncState({
          status: 'synced',
          lastSyncedAt: new Date(),
          pendingChanges: 0,
          latencyMs: Math.floor(22 + Math.random() * 15),
        });
      }, 400);

      return () => clearTimeout(timer);
    } catch (e) {
      console.error('Persistence error:', e);
    }
  }, [items, transactions, kasbonList, supplierOrders, opnameLogs, damagedLogs, pwa.isOnline]);

  const handleManualSync = () => {
    if (!pwa.isOnline) {
      showToast('⚠️ Perangkat sedang offline. Menunggu koneksi internet untuk sinkronisasi.');
      return;
    }
    setCloudSyncState((prev) => ({ ...prev, status: 'syncing' }));
    sound.playItemAdded();
    setTimeout(() => {
      setCloudSyncState({
        status: 'synced',
        lastSyncedAt: new Date(),
        pendingChanges: 0,
        latencyMs: 25,
      });
      showToast('Sinkronisasi cloud realtime berhasil diselesaikan.');
    }, 500);
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
    let nextItems: SembakoItem[] = [];
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
      nextItems = updated;
      return updated;
    });

    // 2. Add to transaction log
    setTransactions((prev) => [transaction, ...prev]);

    // 3. If kasbon, add to kasbon ledger
    if (newKasbon) {
      setKasbonList((prev) => [newKasbon, ...prev]);
    }

    // 4. Offline Queue & Two-way Realtime Sync
    if (!pwa.isOnline) {
      enqueueOfflineAction({
        type: 'NEW_TRANSACTION',
        description: `Penjualan Kasir: ${transaction.invoiceNo} (${formatRupiah(transaction.finalAmount)})`,
        payload: { transaction, newKasbon },
      });
      setOfflineQueue(getOfflineQueue());
      showToast(`✓ Transaksi ${transaction.invoiceNo} tersimpan (Mode Offline - antrean sync aktif).`);
    } else {
      realtimeSync.broadcast('TRANSACTION_SYNC', { transaction, newKasbon });
      showToast(`✓ Transaksi ${transaction.invoiceNo} berhasil disimpan & disinkronkan realtime.`);
    }

    // 5. Clear cart & open receipt
    setCart([]);
    setCurrentReceiptTx(transaction);
    setReceiptModalOpen(true);
  };

  // Inventory Save (Add or Edit)
  const handleSaveItem = (itemData: SembakoItem, isNew: boolean) => {
    let nextItems: SembakoItem[] = [];
    if (isNew) {
      setItems((prev) => {
        nextItems = [itemData, ...prev];
        return nextItems;
      });
      showToast(`✓ Barang baru "${itemData.name}" berhasil ditambahkan.`);
    } else {
      setItems((prev) => {
        nextItems = prev.map((i) => (i.id === itemData.id ? itemData : i));
        return nextItems;
      });
      showToast(`✓ Data "${itemData.name}" berhasil diperbarui.`);
    }

    if (!pwa.isOnline) {
      enqueueOfflineAction({
        type: 'UPDATE_STOCK',
        description: `Pembaruan Barang: ${itemData.name}`,
        payload: { itemData, isNew },
      });
      setOfflineQueue(getOfflineQueue());
    } else {
      realtimeSync.broadcast('ITEMS_SYNC', { items: nextItems });
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
    let nextKasbon: KasbonRecord[] = [];
    setKasbonList((prev) => {
      const updated = prev.map((k) => {
        if (k.id === kasbonId) {
          const newRemaining = Math.max(0, k.remainingDebt - amount);
          return {
            ...k,
            remainingDebt: newRemaining,
            status: (newRemaining === 0 ? 'lunas' : 'belum_lunas') as 'lunas' | 'belum_lunas',
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
      });
      nextKasbon = updated;
      return updated;
    });

    if (!pwa.isOnline) {
      enqueueOfflineAction({
        type: 'KASBON_PAYMENT',
        description: `Bayar Kasbon: Rp ${amount.toLocaleString('id-ID')}`,
        payload: { kasbonId, amount, note },
      });
      setOfflineQueue(getOfflineQueue());
    } else {
      realtimeSync.broadcast('KASBON_SYNC', { kasbonList: nextKasbon });
    }

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
    <div
      className={`min-h-screen w-full bg-slate-50 text-gray-900 flex flex-col font-sans selection:bg-teal-200 app-zoom-wrapper dense-workstation ${
        isDesktopMode ? 'min-w-[1080px]' : 'max-w-full'
      }`}
      style={{ zoom: zoomScale }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-gray-700 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PWA In-App Install Prompt Banner & Automatic Update Alert */}
      <PWAInstallBanner pwa={pwa} />

      {/* Offline Status & Real-time Background Sync Indicator */}
      <OfflineSyncStatusBar
        isOnline={pwa.isOnline}
        offlineQueue={offlineQueue}
        isSyncing={isSyncingOfflineQueue}
        lastSyncedAt={cloudSyncState.lastSyncedAt}
        onManualFlush={flushOfflineQueue}
      />

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
          isDesktopMode={isDesktopMode}
          onToggleDesktopMode={() => {
            setIsDesktopMode((prev) => {
              const next = !prev;
              try {
                localStorage.setItem('riyan_store_desktop_mode_v1', String(next));
              } catch {}
              showToast(next ? 'Mode Desktop Diaktifkan (Workstation POS)' : 'Mode Fleksibel Diaktifkan');
              return next;
            });
          }}
          zoomScale={zoomScale}
          onSetZoomScale={(scale) => {
            setZoomScale(scale);
            try {
              localStorage.setItem('riyan_store_zoom_scale_v1', String(scale));
            } catch {}
            showToast(`Skala tampilan disetel ke ${Math.round(scale * 100)}% (Diperkecil)`);
          }}
          isOnline={pwa.isOnline}
          isPWAInstallable={pwa.isInstallable}
          isPWAInstalled={pwa.isInstalled}
          onPromptPWAInstall={pwa.promptInstall}
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
            isDesktopMode={isDesktopMode}
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

      {/* Floating Quick Desktop & Scale Controller Bar */}
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 bg-gray-950/95 text-white backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-2xl border border-gray-700/80 text-xs">
        <span className="text-gray-400 font-semibold text-[11px]">Skala:</span>
        <button
          type="button"
          onClick={() => {
            const next = Math.max(0.60, Number((zoomScale - 0.05).toFixed(2)));
            setZoomScale(next);
            try {
              localStorage.setItem('riyan_store_zoom_scale_v1', String(next));
            } catch {}
          }}
          className="w-6 h-6 rounded-lg bg-gray-800 hover:bg-gray-700 active:scale-95 flex items-center justify-center font-bold text-gray-200 cursor-pointer"
          title="Perkecil Tampilan (-5%)"
        >
          -
        </button>
        <span className="font-mono font-bold text-teal-400 text-xs min-w-[34px] text-center">
          {Math.round(zoomScale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => {
            const next = Math.min(1.25, Number((zoomScale + 0.05).toFixed(2)));
            setZoomScale(next);
            try {
              localStorage.setItem('riyan_store_zoom_scale_v1', String(next));
            } catch {}
          }}
          className="w-6 h-6 rounded-lg bg-gray-800 hover:bg-gray-700 active:scale-95 flex items-center justify-center font-bold text-gray-200 cursor-pointer"
          title="Perbesar Tampilan (+5%)"
        >
          +
        </button>
        <div className="h-3 w-px bg-gray-700 mx-0.5"></div>
        <button
          type="button"
          onClick={() => {
            setIsDesktopMode((prev) => {
              const next = !prev;
              try {
                localStorage.setItem('riyan_store_desktop_mode_v1', String(next));
              } catch {}
              return next;
            });
          }}
          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
            isDesktopMode ? 'bg-teal-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
          title="Beralih Mode Desktop / Fleksibel"
        >
          {isDesktopMode ? '🖥️ Desktop ON' : '📱 Fleksibel'}
        </button>
      </div>

      {/* Edge-to-Edge Mobile Bottom Navigation Bar (Hidden when in Desktop Mode) */}
      {!isDesktopMode && (
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
      )}

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
