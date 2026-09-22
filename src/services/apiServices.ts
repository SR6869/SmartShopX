/**
 * SmartShopX Unified API Services Layer
 * Provides typed REST API endpoints communicating with the centralized SmartShopX Backend/API.
 * Features graceful local DataStore fallbacks for offline development & live client preview.
 */

import { apiClient } from './apiClient';
import { DataStore } from './dataStorage';
import {
  Product,
  Order,
  IncompleteOrder,
  Customer,
  Supplier,
  Purchase,
  Shop,
  PersonalTransaction,
  TelecomTransaction,
  MobileRepairTicket,
  DrivePackOffer,
  TelecomDailyClosing,
  ReturnExchangeRecord,
  StaffUser,
  SubscriptionPlan,
  SubscriptionStatus,
  CANONICAL_CATEGORIES,
  CanonicalCategory,
  CentralSubscriptionTier,
} from '../types';

export const authApi = {
  login: async (credentials: { mobile: string; password?: string; otp?: string }) => {
    try {
      return await apiClient.post<{ token: string; user: any; shop: Shop }>('/auth/login', credentials);
    } catch {
      const user = DataStore.getUser() || {
        id: 'usr_001',
        name: 'তানভীর আহমেদ',
        mobile: credentials.mobile,
        role: 'owner',
        shopId: 'shop_101',
      };
      const shop = DataStore.getShop();
      return { token: 'mock_jwt_token_client_' + Date.now(), user, shop };
    }
  },
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // offline fallback
    }
  },
  register: async (data: any) => {
    try {
      return await apiClient.post('/auth/register', data);
    } catch {
      return { success: true, message: 'OTP sent to mobile' };
    }
  },
  verifyOtp: async (mobile: string, otp: string) => {
    try {
      return await apiClient.post('/auth/verify-otp', { mobile, otp });
    } catch {
      return { success: true, verified: true };
    }
  },
};

export const businessApi = {
  getProfile: async (): Promise<Shop> => {
    try {
      return await apiClient.get<Shop>('/business/profile');
    } catch {
      return DataStore.getShop();
    }
  },
  updateProfile: async (data: Partial<Shop>): Promise<Shop> => {
    try {
      const res = await apiClient.put<Shop>('/business/profile', data);
      DataStore.setShop(res);
      return res;
    } catch {
      const current = DataStore.getShop();
      const updated = { ...current, ...data };
      DataStore.setShop(updated);
      return updated;
    }
  },
  setupBusiness: async (data: Partial<Shop>): Promise<Shop> => {
    try {
      return await apiClient.post<Shop>('/business/setup', data);
    } catch {
      const current = DataStore.getShop();
      const updated = { ...current, ...data };
      DataStore.setShop(updated);
      return updated;
    }
  },
};

export const categoryApi = {
  getAll: async (): Promise<CanonicalCategory[]> => {
    try {
      return await apiClient.get<CanonicalCategory[]>('/categories');
    } catch {
      return [...CANONICAL_CATEGORIES];
    }
  },
};

export const subscriptionApi = {
  getStatus: async () => {
    try {
      return await apiClient.get<any>('/subscription/status');
    } catch {
      const shop = DataStore.getShop();
      const planName = shop.subscriptionPlan || 'Standard';
      const canonicalTier: CentralSubscriptionTier =
        planName === 'Enterprise'
          ? 'ENTERPRISE'
          : planName === 'Standard'
          ? 'BUSINESS'
          : 'STARTER';

      return {
        plan: planName,
        tier: canonicalTier,
        status: shop.subscriptionStatus || 'Active',
        startDate: shop.subscriptionStart || '2026-01-01',
        expiryDate: shop.subscriptionExpiry || '2026-12-31',
        renewalDaysLeft: 295,
        quotaUsage: {
          productsCount: DataStore.getProducts().length,
          productsMax: planName === 'Enterprise' ? 999999 : planName === 'Standard' ? 2000 : 200,
          ordersThisMonth: DataStore.getOrders().length,
          ordersMax: planName === 'Enterprise' ? 999999 : planName === 'Standard' ? 10000 : 1000,
          staffCount: DataStore.getStaff().length,
          staffMax: planName === 'Enterprise' ? 999999 : planName === 'Standard' ? 5 : 1,
          storesCount: DataStore.getBusinesses().length,
          storesMax: planName === 'Enterprise' ? 10 : planName === 'Standard' ? 3 : 1,
        },
      };
    }
  },
  upgrade: async (plan: SubscriptionPlan | CentralSubscriptionTier) => {
    try {
      return await apiClient.post('/subscription/upgrade', { plan });
    } catch {
      const shop = DataStore.getShop();
      const mappedPlan: SubscriptionPlan =
        plan === 'ENTERPRISE' ? 'Enterprise' : plan === 'BUSINESS' ? 'Standard' : plan === 'STARTER' ? 'Basic' : (plan as SubscriptionPlan);

      const updated = {
        ...shop,
        subscriptionPlan: mappedPlan,
        subscriptionStatus: 'Active' as SubscriptionStatus,
        plan: mappedPlan,
      };
      DataStore.setShop(updated);
      return { success: true, plan: mappedPlan };
    }
  },
};

export const featureApi = {
  checkAccess: async (featureKey: string): Promise<boolean> => {
    const shop = DataStore.getShop();
    const plan = (shop.subscriptionPlan || 'Standard').toUpperCase();
    if (plan === 'ENTERPRISE') return true;
    if (plan === 'STANDARD' || plan === 'BUSINESS' || plan === 'PRO') {
      return featureKey !== 'advanced_ai_fraud_detector';
    }
    // Basic / Starter plan exclusions
    const basicExclusions = ['landing_page_builder', 'courier_automation', 'sms_marketing_bulk', 'custom_domain'];
    return !basicExclusions.includes(featureKey);
  },
};

export const productApi = {
  getAll: async (): Promise<Product[]> => {
    try {
      return await apiClient.get<Product[]>('/products');
    } catch {
      return DataStore.getProducts();
    }
  },
  create: async (data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    try {
      return await apiClient.post<Product>('/products', data);
    } catch {
      const products = DataStore.getProducts();
      const newProduct: Product = {
        ...data,
        id: `prod_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      DataStore.setProducts([newProduct, ...products]);
      return newProduct;
    }
  },
  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    try {
      return await apiClient.put<Product>(`/products/${id}`, data);
    } catch {
      const products = DataStore.getProducts();
      const updated = products.map((p) => (p.id === id ? { ...p, ...data } : p));
      DataStore.setProducts(updated);
      return updated.find((p) => p.id === id)!;
    }
  },
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch {
      const products = DataStore.getProducts().filter((p) => p.id !== id);
      DataStore.setProducts(products);
    }
  },
};

export const inventoryApi = {
  getStockLogs: async () => {
    try {
      return await apiClient.get<any[]>('/inventory/logs');
    } catch {
      return DataStore.getStockLogs();
    }
  },
  adjustStock: async (productId: string, quantity: number, type: 'IN' | 'OUT' | 'ADJUSTMENT', reason: string) => {
    try {
      return await apiClient.post('/inventory/adjust', { productId, quantity, type, reason });
    } catch {
      const products = DataStore.getProducts();
      const prod = products.find((p) => p.id === productId);
      if (prod) {
        const prevStock = prod.stock;
        let newStock = prevStock;
        if (type === 'IN') newStock += quantity;
        else if (type === 'OUT') newStock = Math.max(0, prevStock - quantity);
        else newStock = quantity;

        prod.stock = newStock;
        DataStore.setProducts(products);

        const movements = DataStore.getStockMovements();
        movements.unshift({
          id: `mov_${Date.now()}`,
          productId,
          productName: prod.name,
          type,
          quantity,
          previousStock: prevStock,
          newStock,
          reason,
          createdAt: new Date().toISOString(),
        });
        DataStore.setStockMovements(movements);
      }
      return { success: true };
    }
  },
};

export const salesApi = {
  createSale: async (saleData: any) => {
    try {
      return await apiClient.post('/sales', saleData);
    } catch {
      const orders = DataStore.getOrders();
      const newOrder: Order = {
        ...saleData,
        id: `ord_${Date.now()}`,
        orderNumber: `SX-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${orders.length + 1}`,
        createdAt: new Date().toISOString(),
      };
      DataStore.setOrders([newOrder, ...orders]);
      return newOrder;
    }
  },
  getAll: async (): Promise<Order[]> => {
    try {
      return await apiClient.get<Order[]>('/sales');
    } catch {
      return DataStore.getOrders();
    }
  },
};

export const purchaseApi = {
  getAll: async (): Promise<Purchase[]> => {
    try {
      return await apiClient.get<Purchase[]>('/purchases');
    } catch {
      return DataStore.getPurchases();
    }
  },
  create: async (data: any): Promise<Purchase> => {
    try {
      return await apiClient.post<Purchase>('/purchases', data);
    } catch {
      const purchases = DataStore.getPurchases();
      const newPurchase: Purchase = {
        ...data,
        id: `pur_${Date.now()}`,
        purchaseNumber: `PUR-${new Date().getFullYear()}-${purchases.length + 1}`,
      };
      DataStore.setPurchases([newPurchase, ...purchases]);
      return newPurchase;
    }
  },
};

export const customerApi = {
  getAll: async (): Promise<Customer[]> => {
    try {
      return await apiClient.get<Customer[]>('/customers');
    } catch {
      return DataStore.getCustomers();
    }
  },
  create: async (data: any): Promise<Customer> => {
    try {
      return await apiClient.post<Customer>('/customers', data);
    } catch {
      const customers = DataStore.getCustomers();
      const newCustomer: Customer = {
        ...data,
        id: `cust_${Date.now()}`,
        totalPurchase: 0,
        totalPaid: 0,
        totalDue: 0,
        ordersCount: 0,
        riskLevel: 'Low',
        deliverySuccessRate: 100,
        ordersDelivered: 0,
        ordersCancelled: 0,
        ordersReturned: 0,
        createdAt: new Date().toISOString(),
      };
      DataStore.setCustomers([newCustomer, ...customers]);
      return newCustomer;
    }
  },
};

export const supplierApi = {
  getAll: async (): Promise<Supplier[]> => {
    try {
      return await apiClient.get<Supplier[]>('/suppliers');
    } catch {
      return DataStore.getSuppliers();
    }
  },
};

export const paymentApi = {
  getAll: async () => {
    try {
      return await apiClient.get<any[]>('/payments');
    } catch {
      return DataStore.getPayments();
    }
  },
  recordPayment: async (paymentData: any) => {
    try {
      return await apiClient.post('/payments', paymentData);
    } catch {
      const payments = DataStore.getPayments();
      payments.unshift({
        id: `pay_${Date.now()}`,
        transactionId: `TXN-${Date.now()}`,
        status: 'Paid',
        ...paymentData,
        date: new Date().toISOString(),
      });
      DataStore.setPayments(payments);
      return { success: true };
    }
  },
};

export const invoiceApi = {
  getAll: async () => {
    const orders = DataStore.getOrders();
    const purchases = DataStore.getPurchases();
    return {
      salesInvoices: orders,
      purchaseInvoices: purchases,
    };
  },
};

export const orderApi = {
  getAll: async (): Promise<Order[]> => {
    try {
      return await apiClient.get<Order[]>('/orders');
    } catch {
      return DataStore.getOrders();
    }
  },
  getIncompleteOrders: async (): Promise<IncompleteOrder[]> => {
    try {
      return await apiClient.get<IncompleteOrder[]>('/orders/incomplete');
    } catch {
      return DataStore.getIncompleteOrders();
    }
  },
  updateStatus: async (orderId: string, status: any) => {
    try {
      return await apiClient.put(`/orders/${orderId}/status`, { status });
    } catch {
      const orders = DataStore.getOrders();
      const updated = orders.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o));
      DataStore.setOrders(updated);
      return { success: true };
    }
  },
};

export const onlineStoreApi = {
  getSettings: async () => {
    return DataStore.getShop();
  },
  updateSettings: async (settings: Partial<Shop>) => {
    const current = DataStore.getShop();
    const updated = { ...current, ...settings };
    DataStore.setShop(updated);
    return updated;
  },
};

export const landingPageApi = {
  getAll: async () => {
    return DataStore.getLandingPages();
  },
  save: async (landingPage: any) => {
    const pages = DataStore.getLandingPages();
    const index = pages.findIndex((p) => p.id === landingPage.id);
    if (index >= 0) {
      pages[index] = landingPage;
    } else {
      pages.unshift(landingPage);
    }
    DataStore.setLandingPages(pages);
    return landingPage;
  },
};

export const courierApi = {
  getAll: async () => {
    return DataStore.getCourierOrders();
  },
  bookCourier: async (orderId: string, provider: string) => {
    const trackingNumber = `${provider.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const orders = DataStore.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.courierName = provider;
      order.courierTrackingCode = trackingNumber;
      order.orderStatus = 'Courier Assigned';
      DataStore.setOrders(orders);
    }
    return { success: true, trackingNumber };
  },
};

export const notificationApi = {
  getSettings: async () => {
    return DataStore.getNotificationSettings();
  },
  updateSettings: async (settings: any) => {
    DataStore.setNotificationSettings(settings);
    return settings;
  },
};

export const reportApi = {
  getSummary: async (range: string = 'today') => {
    const orders = DataStore.getOrders();
    const purchases = DataStore.getPurchases();
    const expenses = DataStore.getExpenses();
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const customerDue = orders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);
    const supplierPayable = purchases.reduce((sum, p) => sum + (p.dueAmount || 0), 0);
    return {
      totalSales,
      totalPurchases,
      totalExpenses,
      customerDue,
      supplierPayable,
      grossProfit: totalSales - totalPurchases * 0.75,
      netProfit: totalSales - totalPurchases * 0.75 - totalExpenses,
      range,
    };
  },
};

export const staffApi = {
  getAll: async (): Promise<StaffUser[]> => {
    return [
      {
        id: 'stf_1',
        name: 'সাকিব আল হাসান',
        mobile: '01822334455',
        role: 'Manager',
        permissions: {
          canMakeSale: true,
          canViewProfit: true,
          canEditProduct: true,
          canDeleteOrder: false,
          canViewReports: true,
        },
        isActive: true,
        createdAt: '2026-01-15',
      },
      {
        id: 'stf_2',
        name: 'মাহমুদুল্লাহ রিয়াদ',
        mobile: '01933445566',
        role: 'Salesman',
        permissions: {
          canMakeSale: true,
          canViewProfit: false,
          canEditProduct: false,
          canDeleteOrder: false,
          canViewReports: false,
        },
        isActive: true,
        createdAt: '2026-02-01',
      },
    ];
  },
};

export const settingsApi = {
  getFacebookPixel: async () => DataStore.getFacebookSettings(),
  updateFacebookPixel: async (settings: any) => {
    DataStore.setFacebookSettings(settings);
    return settings;
  },
  getBlockedEntities: async () => DataStore.getBlockedEntities(),
  addBlockedEntity: async (entity: any) => {
    const list = DataStore.getBlockedEntities();
    const newItem = {
      ...entity,
      id: `blk_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    DataStore.setBlockedEntities([newItem, ...list]);
    return newItem;
  },
  removeBlockedEntity: async (id: string) => {
    const list = DataStore.getBlockedEntities().filter((i) => i.id !== id);
    DataStore.setBlockedEntities(list);
  },
};

export const telecomApi = {
  getTransactions: async (): Promise<TelecomTransaction[]> => {
    return DataStore.getTelecomTransactions();
  },
  recordTransaction: async (data: Omit<TelecomTransaction, 'id' | 'date'>): Promise<TelecomTransaction> => {
    const list = DataStore.getTelecomTransactions();
    const item: TelecomTransaction = {
      ...data,
      id: `tt_${Date.now()}`,
      date: new Date().toISOString(),
    };
    DataStore.setTelecomTransactions([item, ...list]);
    return item;
  },
  getBalances: async () => {
    return DataStore.getTelecomBalances();
  },
  updateBalance: async (id: string, balance: number) => {
    const balances = DataStore.getTelecomBalances();
    const updated = balances.map((b) => (b.id === id ? { ...b, balance, lastUpdated: new Date().toISOString().split('T')[0] } : b));
    DataStore.setTelecomBalances(updated);
    return updated;
  },

  // Device Servicing & Repair Job Sheet
  getRepairTickets: async (): Promise<MobileRepairTicket[]> => {
    return DataStore.getMobileRepairTickets();
  },
  createRepairTicket: async (
    data: Omit<MobileRepairTicket, 'id' | 'ticketNumber' | 'receivedDate'>
  ): Promise<MobileRepairTicket> => {
    const list = DataStore.getMobileRepairTickets();
    const dateStr = new Date().toISOString().slice(2, 7).replace('-', '');
    const ticketSeq = String(list.length + 1).padStart(2, '0');
    const newTicket: MobileRepairTicket = {
      ...data,
      id: `srv_${Date.now()}`,
      ticketNumber: `JOB-${dateStr}-${ticketSeq}`,
      receivedDate: new Date().toISOString().split('T')[0],
    };
    DataStore.setMobileRepairTickets([newTicket, ...list]);
    return newTicket;
  },
  updateRepairTicket: async (ticket: MobileRepairTicket): Promise<MobileRepairTicket> => {
    const list = DataStore.getMobileRepairTickets();
    const updated = list.map((t) => (t.id === ticket.id ? ticket : t));
    DataStore.setMobileRepairTickets(updated);
    return ticket;
  },
  deleteRepairTicket: async (id: string): Promise<void> => {
    const list = DataStore.getMobileRepairTickets();
    DataStore.setMobileRepairTickets(list.filter((t) => t.id !== id));
  },

  // Drive Packs & Cashback Offers
  getDrivePacks: async (): Promise<DrivePackOffer[]> => {
    return DataStore.getDrivePacks();
  },
  saveDrivePack: async (pack: DrivePackOffer): Promise<DrivePackOffer> => {
    const list = DataStore.getDrivePacks();
    const existingIndex = list.findIndex((p) => p.id === pack.id);
    let updated: DrivePackOffer[];
    if (existingIndex >= 0) {
      updated = list.map((p) => (p.id === pack.id ? pack : p));
    } else {
      updated = [pack, ...list];
    }
    DataStore.setDrivePacks(updated);
    return pack;
  },
  deleteDrivePack: async (id: string): Promise<void> => {
    const list = DataStore.getDrivePacks();
    DataStore.setDrivePacks(list.filter((p) => p.id !== id));
  },

  // Daily Closing & Reconciliation
  getDailyClosings: async (): Promise<TelecomDailyClosing[]> => {
    return DataStore.getTelecomClosings();
  },
  saveDailyClosing: async (
    data: Omit<TelecomDailyClosing, 'id' | 'createdAt'>
  ): Promise<TelecomDailyClosing> => {
    const list = DataStore.getTelecomClosings();
    const item: TelecomDailyClosing = {
      ...data,
      id: `tc_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    DataStore.setTelecomClosings([item, ...list]);
    return item;
  },
  deleteDailyClosing: async (id: string): Promise<void> => {
    const list = DataStore.getTelecomClosings();
    DataStore.setTelecomClosings(list.filter((c) => c.id !== id));
  },
};

export const returnsApi = {
  getAll: async (): Promise<ReturnExchangeRecord[]> => {
    return DataStore.getReturns();
  },
  create: async (data: Omit<ReturnExchangeRecord, 'id' | 'date' | 'returnNumber'>): Promise<ReturnExchangeRecord> => {
    const list = DataStore.getReturns();
    const item: ReturnExchangeRecord = {
      ...data,
      id: `ret_${Date.now()}`,
      returnNumber: `RET-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${list.length + 1}`,
      date: new Date().toISOString().split('T')[0],
    };
    DataStore.setReturns([item, ...list]);
    return item;
  },
};

export const personalApi = {
  getTransactions: async (): Promise<PersonalTransaction[]> => {
    return DataStore.getPersonalTransactions();
  },
  createTransaction: async (data: Omit<PersonalTransaction, 'id'>): Promise<PersonalTransaction> => {
    const list = DataStore.getPersonalTransactions();
    const item: PersonalTransaction = {
      ...data,
      id: `pt_${Date.now()}`,
    };
    DataStore.setPersonalTransactions([item, ...list]);
    return item;
  },
  deleteTransaction: async (id: string) => {
    const list = DataStore.getPersonalTransactions().filter((t) => t.id !== id);
    DataStore.setPersonalTransactions(list);
  },
};
