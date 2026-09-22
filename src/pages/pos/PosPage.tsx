import React, { useState, useMemo, useEffect } from 'react';
import { Product, Customer, CartItem, PaymentMethod, Order } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { salesService } from '../../services/salesService';
import { smsService } from '../../services/smsService';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { InvoiceModal } from '../../components/invoice/InvoiceModal';
import { MedicineSubstituteModal } from '../../components/pharmacy/MedicineSubstituteModal';
import { NearExpiryReportModal } from '../../components/pharmacy/NearExpiryReportModal';
import { QuickStockInwardModal } from '../../components/products/QuickStockInwardModal';
import { CameraBarcodeScannerModal } from '../../components/pos/CameraBarcodeScannerModal';
import { DayEndCashClosingModal } from '../../components/pos/DayEndCashClosingModal';
import { offlineSyncService } from '../../services/offlineSyncService';
import { getExpiryStatus, findMedicineSubstitutes, getPharmacyUnitInfo } from '../../utils/pharmacyHelper';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  CheckCircle2,
  CreditCard,
  ShoppingBag,
  Sparkles,
  Pill,
  AlertTriangle,
  MapPin,
  Layers,
  Calendar,
  FileText,
  Stethoscope,
  PackagePlus,
  Camera,
  Coins,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

export const PosPage: React.FC = () => {
  const { shop } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>(() => DataStore.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => DataStore.getCustomers());

  // Listen to product updates across tabs / components
  useEffect(() => {
    const handleProductsUpdated = () => {
      setProducts(DataStore.getProducts());
    };
    window.addEventListener('smartshopx_products_updated', handleProductsUpdated);
    return () => {
      window.removeEventListener('smartshopx_products_updated', handleProductsUpdated);
    };
  }, []);

  // Quick Stock Inward from POS
  const [isPosQuickStockOpen, setIsPosQuickStockOpen] = useState(false);
  const [posQuickStockProduct, setPosQuickStockProduct] = useState<Product | null>(null);

  const handleOpenPosQuickStock = (p: Product) => {
    setPosQuickStockProduct(p);
    setIsPosQuickStockOpen(true);
  };

  const handleSavePosQuickStock = (
    productId: string,
    addedStock: number,
    details?: { batchNumber?: string; expiryDate?: string; purchasePrice?: number }
  ) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          stock: (Number(p.stock) || 0) + addedStock,
          batchNumber: details?.batchNumber !== undefined ? details.batchNumber : p.batchNumber,
          expiryDate: details?.expiryDate !== undefined ? details.expiryDate : p.expiryDate,
          purchasePrice: details?.purchasePrice !== undefined ? details.purchasePrice : p.purchasePrice,
        };
      }
      return p;
    });

    setProducts(updated);
    DataStore.setProducts(updated);

    const refreshedTarget = updated.find((p) => p.id === productId);
    showToast(
      `"${refreshedTarget?.name || 'পণ্য'}" এ ${addedStock} টি নতুন স্টক যোগ করা হয়েছে! এখন কার্টে যোগ করা যাবে।`,
      'success'
    );

    if (refreshedTarget) {
      addToCart(refreshedTarget, 'Pcs');
    }
  };

  // POS State
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(() => {
    return customers.find((c) => c.id === 'cust_5') || customers[0];
  });
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [doctorRef, setDoctorRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Pharmacy Modals
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);
  const [activeSubstituteProduct, setActiveSubstituteProduct] = useState<Product | null>(null);
  const [substitutesList, setSubstitutesList] = useState<Product[]>([]);
  const [isNearExpiryModalOpen, setIsNearExpiryModalOpen] = useState(false);

  // Completed Invoice State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(36);

  // Camera Barcode Scanner & Day-End Cash Closing Modals
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isDayEndClosingOpen, setIsDayEndClosingOpen] = useState(false);

  // Offline Mode & Auto-Sync State
  const [isOnline, setIsOnline] = useState<boolean>(() => offlineSyncService.isOnline());
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(() =>
    offlineSyncService.getPendingCount()
  );
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  // Listen to network status & offline queue changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSyncOfflineSales();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('ইন্টারনেট সংযোগ বিচ্ছিন্ন! স্মার্ট অফলাইন মোড চালু হয়েছে — সকল বিক্রয় লোকালি সংরক্ষিত থাকবে।', 'warning');
    };
    const handleQueueUpdate = () => {
      setPendingOfflineCount(offlineSyncService.getPendingCount());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('smartshopx_offline_queue_updated', handleQueueUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('smartshopx_offline_queue_updated', handleQueueUpdate);
    };
  }, []);

  const handleSyncOfflineSales = async () => {
    const count = offlineSyncService.getPendingCount();
    if (count === 0) return;
    setIsSyncingOffline(true);
    try {
      const res = await offlineSyncService.syncAllPending();
      setPendingOfflineCount(offlineSyncService.getPendingCount());
      if (res.synced > 0) {
        showToast(`${res.synced} টি অফলাইন বিক্রয় সফলভাবে ক্লাউডে সিঙ্ক হয়েছে!`, 'success');
      }
    } catch {
      showToast('অফলাইন বিক্রয় সিঙ্ক করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSyncingOffline(false);
    }
  };

  // Near Expiry Count
  const nearExpiryCount = useMemo(() => {
    return products.filter((p) => {
      if (!p.expiryDate) return false;
      const status = getExpiryStatus(p.expiryDate, 90);
      return status.isNearExpiry || status.isExpired;
    }).length;
  }, [products]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products (Supports trade name, sku, barcode, generic name, brand, rack location)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          (p.genericName && p.genericName.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
          (p.rackLocation && p.rackLocation.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, displayLimit);
  }, [filteredProducts, displayLimit]);

  // Barcode scanner simulator handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeQuery.trim()) return;
    const found = products.find(
      (p) => p.barcode === barcodeQuery.trim() || p.sku.toLowerCase() === barcodeQuery.trim().toLowerCase()
    );
    if (found) {
      addToCart(found);
      setBarcodeQuery('');
      showToast(`${found.name} কার্টে যোগ হয়েছে`, 'success');
    } else {
      showToast('বারকোড অনুযায়ী কোনো পণ্য পাওয়া যায়নি', 'warning');
    }
  };

  // Add to cart with unit support (Pcs, Strip, Box)
  const addToCart = (product: Product, unit: 'Pcs' | 'Strip' | 'Box' = 'Pcs') => {
    if (product.stock <= 0) {
      // Suggest substitutes if out of stock!
      const subs = findMedicineSubstitutes(product, products);
      if (subs.length > 0) {
        setActiveSubstituteProduct(product);
        setSubstitutesList(subs);
        setIsSubstituteModalOpen(true);
        showToast('ওষুধটি স্টক আউট! বিকল্প ওষুধ দেখুন', 'warning');
        return;
      }
      showToast('পণ্যটি স্টক আউট! বিক্রি সম্ভব নয়', 'error');
      return;
    }

    const unitInfo = getPharmacyUnitInfo(product, unit);

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && (item.selectedUnit || 'Pcs') === unit
      );
      if (existing) {
        const nextQty = existing.quantity + 1;
        const totalPcsNeeded = nextQty * unitInfo.multiplier;
        if (totalPcsNeeded > product.stock) {
          showToast(`স্টকে সর্বোচ্চ ${product.stock} টি পিস রয়েছে`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id && (item.selectedUnit || 'Pcs') === unit
            ? {
                ...item,
                quantity: nextQty,
                total: nextQty * item.unitPrice,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: unitInfo.unitPrice,
          discount: product.discount,
          total: unitInfo.unitPrice,
          selectedUnit: unit,
          unitMultiplier: unitInfo.multiplier,
        },
      ];
    });
  };

  // Switch Unit for item already in cart
  const changeItemUnit = (productId: string, newUnit: 'Pcs' | 'Strip' | 'Box') => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const unitInfo = getPharmacyUnitInfo(item.product, newUnit);
          return {
            ...item,
            selectedUnit: newUnit,
            unitMultiplier: unitInfo.multiplier,
            unitPrice: unitInfo.unitPrice,
            total: item.quantity * unitInfo.unitPrice,
          };
        }
        return item;
      })
    );
  };

  const updateQuantity = (productId: string, delta: number, unit?: string) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && (!unit || item.selectedUnit === unit)) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const multiplier = item.unitMultiplier || 1;
            if (newQty * multiplier > item.product.stock) {
              showToast(`স্টকে সর্বোচ্চ ${item.product.stock} টি পিস রয়েছে`, 'warning');
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string, unit?: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.product.id === productId && (!unit || item.selectedUnit === unit)))
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setPaidAmount(0);
    setDoctorRef('');
    setNotes('');
  };

  // Open substitute modal
  const handleOpenSubstitute = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const subs = findMedicineSubstitutes(product, products);
    setActiveSubstituteProduct(product);
    setSubstitutesList(subs);
    setIsSubstituteModalOpen(true);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const due = useMemo(() => {
    return Math.max(0, total - paidAmount);
  }, [total, paidAmount]);

  const setFullPaid = () => {
    setPaidAmount(total);
  };

  // Quick add customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustMobile.trim()) {
      showToast('গ্রাহকের নাম ও মোবাইল নম্বর আবশ্যক', 'warning');
      return;
    }
    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      name: newCustName.trim(),
      mobile: newCustMobile.trim(),
      address: newCustAddress.trim(),
      totalPurchase: 0,
      totalPaid: 0,
      totalDue: 0,
      ordersCount: 0,
      riskLevel: 'Low',
      deliverySuccessRate: 100,
      ordersDelivered: 0,
      ordersCancelled: 0,
      ordersReturned: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newCust, ...customers];
    setCustomers(updated);
    DataStore.setCustomers(updated);
    setSelectedCustomer(newCust);
    setIsNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustMobile('');
    setNewCustAddress('');
    showToast('নতুন গ্রাহক সফলভাবে যুক্ত করা হয়েছে', 'success');
  };

  // Complete Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      showToast('কার্টে কোনো পণ্য যোগ করা হয়নি', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      const combinedNotes = [
        doctorRef.trim() ? `প্রেসক্রিপশন/ডাক্তার: ${doctorRef.trim()}` : null,
        notes.trim() || null,
      ]
        .filter(Boolean)
        .join(' | ');

      const salePayload = {
        customer: selectedCustomer,
        items: cart,
        subtotal,
        discount: discountAmount,
        total,
        paidAmount: paidAmount > 0 ? paidAmount : total,
        dueAmount: paidAmount > 0 ? Math.max(0, total - paidAmount) : 0,
        paymentMethod,
        notes: combinedNotes || undefined,
      };

      // Check if network is offline
      const currentlyOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (!currentlyOnline) {
        const queued = offlineSyncService.enqueueSale(salePayload);
        const offlineOrder: Order = {
          id: queued.id,
          orderNumber: `OFF-${Date.now().toString().slice(-6)}`,
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerMobile: selectedCustomer.mobile,
          customerAddress: selectedCustomer.address,
          items: cart.map((it) => ({
            productId: it.product.id,
            productName: it.product.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.total,
            selectedUnit: it.selectedUnit,
          })),
          subtotal,
          discount: discountAmount,
          deliveryCharge: 0,
          totalAmount: total,
          paidAmount: paidAmount > 0 ? paidAmount : total,
          dueAmount: paidAmount > 0 ? Math.max(0, total - paidAmount) : 0,
          paymentMethod,
          paymentStatus:
            (paidAmount > 0 ? Math.max(0, total - paidAmount) : 0) <= 0 ? 'Paid' : 'Partially Paid',
          orderStatus: 'Delivered',
          channel: 'POS',
          notes: 'অফলাইনে সংরক্ষিত মেমো',
          createdAt: new Date().toISOString(),
        };

        setCompletedOrder(offlineOrder);
        setIsInvoiceModalOpen(true);
        clearCart();
        setPendingOfflineCount(offlineSyncService.getPendingCount());
        showToast(
          'ইন্টারনেট সংযোগ নেই — বিক্রয় অফলাইনে নিরাপদে সংরক্ষিত হয়েছে ও মেমো প্রস্তুত! ইন্টারনেট পাওয়া মাত্রই স্বয়ংক্রিয় সিঙ্ক হবে।',
          'info'
        );
        return;
      }

      const order = await salesService.completePosSale(salePayload);

      setCompletedOrder(order);
      setIsInvoiceModalOpen(true);
      clearCart();

      // Trigger background sync for any previous pending items
      if (offlineSyncService.getPendingCount() > 0) {
        offlineSyncService.syncAllPending().then(() => {
          setPendingOfflineCount(offlineSyncService.getPendingCount());
        });
      }

      // Trigger automatic SMS receipt if enabled in SMS settings
      try {
        smsService.triggerOrderSms(order, 'POS_SALE');
      } catch (err) {
        console.error('POS SMS Trigger error:', err);
      }

      showToast('বিক্রয় সফল হয়েছে এবং ক্যাশ মেমো প্রস্তুত!', 'success');
    } catch {
      showToast('বিক্রয় সম্পন্ন করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* POS Top Control Toolbar: Offline/Online Sync, Camera Barcode, Day-End Closing */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Quick Shop & Online/Offline Status Indicator */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{shop.name}</span>
            <span className="text-slate-300">|</span>
          </div>

          {/* Online/Offline Badge */}
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>অনলাইন (সিঙ্কড)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                <span>অফলাইন মোড (লোকাল সেভ)</span>
              </>
            )}
          </div>

          {/* Pending Offline Sales Sync CTA */}
          {pendingOfflineCount > 0 && (
            <button
              type="button"
              onClick={handleSyncOfflineSales}
              disabled={isSyncingOffline || !isOnline}
              className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isSyncingOffline ? 'animate-spin' : ''}`} />
              <span>পেন্ডিং অফলাইন বিক্রয়: {pendingOfflineCount} টি</span>
              <span className="underline ml-1">সিঙ্ক করুন</span>
            </button>
          )}
        </div>

        {/* Right: Camera Barcode & Day-End Cash Closing Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            variant="outline"
            size="sm"
            leftIcon={<Camera className="w-4 h-4 text-emerald-600" />}
            className="bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
          >
            ক্যামেরা স্ক্যানার
          </Button>

          <Button
            type="button"
            onClick={() => setIsDayEndClosingOpen(true)}
            variant="outline"
            size="sm"
            leftIcon={<Coins className="w-4 h-4 text-amber-600" />}
            className="bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 font-bold"
          >
            ক্যাশ ড্রয়ার ক্লোজিং
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* LEFT SECTION: Search, Category Tabs, Product Catalog */}
        <div className="flex-1 w-full space-y-4">
          {/* Search & Barcode Bar with Near-Expiry Alert Button */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ওষুধের নাম, জেনেরিক নাম (যেমন Paracetamol), র‌্যাক বা বারকোড খুঁজুন..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Barcode Search Box with Direct Camera Button */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-52">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={barcodeQuery}
                  onChange={(e) => setBarcodeQuery(e.target.value)}
                  placeholder="বারকোড স্ক্যান/টাইপ"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </form>

              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-colors cursor-pointer shrink-0"
                title="ক্যামেরা বারকোড স্ক্যানার"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Pharmacy Near-Expiry Quick Access */}
            {nearExpiryCount > 0 && (
              <button
                type="button"
                onClick={() => setIsNearExpiryModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>মেয়াদোত্তীর্ণ অ্যালার্ট</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-mono">
                  {nearExpiryCount}
                </span>
              </button>
            )}
          </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'সব ক্যাটাগরি' : cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {visibleProducts.map((p) => {
            const isOutOfStock = p.stock <= 0;
            const finalPrice = p.sellingPrice - p.discount;
            const exp = getExpiryStatus(p.expiryDate);
            const hasPharmacyDetails = Boolean(p.genericName || p.rackLocation || p.piecesPerStrip);

            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addToCart(p, 'Pcs')}
                className={`group bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all cursor-pointer select-none ${
                  isOutOfStock
                    ? 'border-slate-200 bg-slate-50/50'
                    : 'border-slate-200 hover:border-emerald-500 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        {p.category === 'Pharmacy & Medicine' ? (
                          <Pill className="w-8 h-8 text-emerald-300" />
                        ) : (
                          <ShoppingBag className="w-8 h-8" />
                        )}
                      </div>
                    )}

                    {/* Stock badge */}
                    <span
                      className={`absolute bottom-1.5 left-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                        p.stock === 0
                          ? 'bg-rose-600 text-white'
                          : p.stock <= p.minStock
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-900/80 text-white backdrop-blur-xs'
                      }`}
                    >
                      স্টক: {p.stock}
                    </span>

                    {/* Rx badge */}
                    {p.requiresPrescription && (
                      <span className="absolute top-1.5 right-1.5 text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded shadow-xs">
                        Rx প্রেসক্রিপশন
                      </span>
                    )}
                  </div>

                  {/* Product Title */}
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight">
                    {p.name}
                  </h4>

                  {/* Generic Name */}
                  {p.genericName && (
                    <p className="text-[11px] text-emerald-700 font-semibold truncate mt-0.5" title={p.genericName}>
                      {p.genericName}
                    </p>
                  )}

                  {/* Rack Location & SKU */}
                  <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 font-mono mt-1">
                    <span className="truncate">{p.sku}</span>
                    {p.rackLocation && (
                      <span className="flex items-center gap-0.5 text-blue-700 font-bold bg-blue-50 px-1 py-0.5 rounded shrink-0">
                        <MapPin className="w-2.5 h-2.5" />
                        {p.rackLocation}
                      </span>
                    )}
                  </div>

                  {/* Expiry Alert Badge */}
                  {exp.isNearExpiry && (
                    <div className="mt-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md border block text-center truncate ${exp.badgeClass}`}>
                        {exp.formattedText}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100">
                  {/* Substitute Finder Button */}
                  {p.genericName && (
                    <button
                      type="button"
                      onClick={(e) => handleOpenSubstitute(e, p)}
                      className="w-full mb-2 py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Layers className="w-3 h-3 text-emerald-600" />
                      <span>বিকল্প ওষুধ (Substitute)</span>
                    </button>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-emerald-700 font-mono">
                        {formatCurrency(finalPrice)}
                      </span>
                      {p.discount > 0 && (
                        <span className="text-[10px] text-slate-400 line-through block font-mono">
                          {formatCurrency(p.sellingPrice)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Unit Quick Add (if medicine has strips) */}
                      {p.piecesPerStrip && !isOutOfStock && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p, 'Strip');
                          }}
                          className="px-1.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer transition-colors"
                          title="১ পাতা কার্টে যোগ করুন"
                        >
                          +১ পাতা
                        </button>
                      )}

                      {isOutOfStock ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPosQuickStock(p);
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                          title="দোকানে মাল আসলে স্টক ইনওয়ার্ড করে বিক্রি চালু করুন"
                        >
                          <PackagePlus className="w-3 h-3 text-emerald-600" />
                          <span>+স্টক</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p, 'Pcs');
                          }}
                          className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length > visibleProducts.length && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 36)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              আরও পণ্য দেখুন (+{Math.min(36, filteredProducts.length - visibleProducts.length)} টি) — মোট {filteredProducts.length} টি
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SECTION: Cart, Customer Selection, Units, Complete Sale */}
      <div className="w-full lg:w-96 bg-white rounded-3xl border border-slate-200 shadow-md p-5 flex flex-col shrink-0 sticky top-20">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>বিক্রয় কার্ট (Cart)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">
                {cart.length}
              </span>
            </h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>খালি করুন</span>
            </button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="py-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-700">ক্রেতা নির্বাচন</span>
            <button
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>নতুন কাস্টমার</span>
            </button>
          </div>

          <select
            value={selectedCustomer.id}
            onChange={(e) => {
              const c = customers.find((item) => item.id === e.target.value);
              if (c) setSelectedCustomer(c);
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.mobile}) {c.totalDue > 0 ? `[বকেয়া: ৳${c.totalDue}]` : ''}
              </option>
            ))}
          </select>

          {/* Credit Limit & Risk Alert */}
          {selectedCustomer && (selectedCustomer.isCreditLocked || (selectedCustomer.creditLimit && selectedCustomer.creditLimit > 0 && selectedCustomer.totalDue >= selectedCustomer.creditLimit)) && (
            <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {selectedCustomer.isCreditLocked ? 'বাকি বিক্রয় নিষিদ্ধ (Locked)' : 'বকেয়া সীমা অতিক্রান্ত!'}
                </span>
                <span>
                  পূর্বের বকেয়া: ৳{selectedCustomer.totalDue.toLocaleString('bn-BD')} | সীমা: ৳{(selectedCustomer.creditLimit || 0).toLocaleString('bn-BD')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Optional Doctor / Rx Reference Input */}
        <div className="py-2.5 border-b border-slate-100">
          <div className="flex items-center gap-1 text-slate-600 text-xs font-semibold mb-1">
            <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
            <span>ডাক্তার / প্রেসক্রিপশন নং (ঐচ্ছিক)</span>
          </div>
          <input
            type="text"
            value={doctorRef}
            onChange={(e) => setDoctorRef(e.target.value)}
            placeholder="যেমন: Dr. Rafiq, Rx #412"
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Cart Item List with Pharmacy Unit Conversion */}
        <div className="flex-1 overflow-y-auto max-h-56 divide-y divide-slate-100 py-1">
          {cart.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>কার্টে কোনো আইটেম নেই</p>
              <p className="text-[11px] text-slate-400 mt-0.5">বামপাশের ওষুধ বা পণ্য তালিকায় ক্লিক করে যোগ করুন</p>
            </div>
          ) : (
            cart.map((item) => {
              const hasMultiUnits = Boolean(item.product.piecesPerStrip);
              const currentUnit = item.selectedUnit || 'Pcs';

              return (
                <div key={`${item.product.id}-${currentUnit}`} className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.product.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span>
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                        </span>
                        {item.product.rackLocation && (
                          <span className="text-blue-700 bg-blue-50 px-1 rounded font-bold">
                            {item.product.rackLocation}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1, item.selectedUnit)}
                          className="px-1.5 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1, item.selectedUnit)}
                          className="px-1.5 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="w-16 text-right font-mono font-bold text-xs text-slate-900">
                        {formatCurrency(item.total)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedUnit)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Unit conversion buttons: [পিস] [পাতা] [বক্স] */}
                  {hasMultiUnits && (
                    <div className="flex items-center gap-1 pl-1">
                      <span className="text-[10px] text-slate-400">বিক্রয় ইউনিট:</span>
                      {(['Pcs', 'Strip', 'Box'] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => changeItemUnit(item.product.id, u)}
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold cursor-pointer transition-all ${
                            currentUnit === u
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {u === 'Pcs' ? 'পিস' : u === 'Strip' ? 'পাতা' : 'বক্স'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Calculation Summary */}
        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>সাবটোটাল</span>
            <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
          </div>

          {/* Discount input */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600">ডিসকাউন্ট (৳)</span>
            <input
              type="number"
              min={0}
              value={discountAmount === 0 ? '' : discountAmount}
              onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
              className="w-24 px-2 py-1 text-right font-mono rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-100">
            <span>সর্বমোট</span>
            <span className="font-mono text-emerald-700">{formatCurrency(total)}</span>
          </div>

          {/* Paid Amount Input */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">পরিশোধ (Paid)</span>
              <button
                type="button"
                onClick={setFullPaid}
                className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium hover:bg-emerald-100 cursor-pointer"
              >
                পুরো পরিশোধ
              </button>
            </div>
            <input
              type="number"
              min={0}
              value={paidAmount === 0 ? '' : paidAmount}
              onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
              className="w-24 px-2 py-1 text-right font-mono rounded-lg border border-slate-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Auto Due display */}
          <div
            className={`flex justify-between font-semibold p-2 rounded-xl text-xs ${
              due > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            <span>{due > 0 ? 'বকেয়া / বাকি' : 'সম্পূর্ণ পেইড'}</span>
            <span className="font-mono">{formatCurrency(due)}</span>
          </div>

          {/* Payment Method Selector */}
          <div className="pt-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              পেমেন্ট মাধ্যম
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank', 'Other'] as PaymentMethod[]).map(
                (method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {method === 'Cash'
                      ? 'নগদ ক্যাশ'
                      : method === 'bKash'
                      ? 'বিকাশ'
                      : method === 'Nagad'
                      ? 'নগদ পে'
                      : method}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Complete Sale Action */}
        <div className="pt-4">
          <Button
            onClick={handleCompleteSale}
            variant="primary"
            size="lg"
            disabled={cart.length === 0}
            isLoading={isProcessing}
            className="w-full shadow-md"
            leftIcon={<CheckCircle2 className="w-5 h-5" />}
          >
            বিক্রয় সম্পন্ন ও মেমো তৈরি
          </Button>
        </div>
      </div>

      {/* New Customer Modal */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="নতুন গ্রাহক যুক্ত করুন"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              গ্রাহকের নাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="যেমন: মো: আরিফুল ইসলাম"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              মোবাইল নম্বর <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={newCustMobile}
              onChange={(e) => setNewCustMobile(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ঠিকানা (ঐচ্ছিক)</label>
            <textarea
              value={newCustAddress}
              onChange={(e) => setNewCustAddress(e.target.value)}
              rows={2}
              placeholder="গ্রাহকের পূর্ণ ঠিকানা লিখুন"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewCustomerModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pharmacy Substitute Finder Modal */}
      <MedicineSubstituteModal
        isOpen={isSubstituteModalOpen}
        onClose={() => setIsSubstituteModalOpen(false)}
        product={activeSubstituteProduct}
        substitutes={substitutesList}
        onSelectSubstitute={(sub) => {
          addToCart(sub, 'Pcs');
          showToast(`${sub.name} কার্টে যোগ করা হয়েছে`, 'success');
        }}
      />

      {/* Pharmacy Near Expiry Report Modal */}
      <NearExpiryReportModal
        isOpen={isNearExpiryModalOpen}
        onClose={() => setIsNearExpiryModalOpen(false)}
        products={products}
      />

      {/* POS Invoice Print / Share Modal */}
      {completedOrder && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          order={completedOrder}
          shop={shop}
          onNewSale={() => {
            setIsInvoiceModalOpen(false);
          }}
        />
      )}

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        products={products}
        onProductScanned={(p) => {
          addToCart(p);
          showToast(`${p.name} কার্টে যোগ হয়েছে!`, 'success');
        }}
      />

      {/* Day-End Cash Closing Modal */}
      <DayEndCashClosingModal
        isOpen={isDayEndClosingOpen}
        onClose={() => setIsDayEndClosingOpen(false)}
      />

      {/* Quick Stock Inward Modal */}
      <QuickStockInwardModal
        isOpen={isPosQuickStockOpen}
        onClose={() => {
          setIsPosQuickStockOpen(false);
          setPosQuickStockProduct(null);
        }}
        product={posQuickStockProduct}
        onSaveStock={handleSavePosQuickStock}
      />
    </div>
    </div>
  );
};

export default PosPage;
