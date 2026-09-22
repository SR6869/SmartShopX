import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DataStore } from '../../services/dataStorage';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { facebookPixelService } from '../../services/facebookPixelService';
import { smsService } from '../../services/smsService';
import { OnlinePaymentModal, PaymentGatewayType } from '../../components/common/OnlinePaymentModal';
import { AiCustomerAssistant } from '../../components/ai/AiCustomerAssistant';
import { ShoppingBag, ArrowLeft, CheckCircle2, Phone, MapPin, Truck, CreditCard, ShieldCheck } from 'lucide-react';

export const PublicStoreView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { shop: authShop } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Resolve shop by route slug or fallback to active context
  const shop = React.useMemo(() => {
    if (slug) {
      const match = DataStore.getBusinesses().find((b) => b.storeSlug === slug || b.id === slug);
      if (match) return DataStore.getShop(match.id);
    }
    return authShop;
  }, [slug, authShop]);

  // Tenant-scoped product catalog
  const products = React.useMemo(() => {
    return DataStore.getProducts(shop.id).filter((p) => p.onlineStoreVisible && p.isActive);
  }, [shop.id]);

  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryArea, setDeliveryArea] = useState<'inside' | 'outside'>('inside');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'bKash' | 'Nagad' | 'SSLCommerz'>('COD');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [completedTrxId, setCompletedTrxId] = useState<string>('');
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string>('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Initialize Pixel & Track PageView
  useEffect(() => {
    facebookPixelService.initializePixel();
    facebookPixelService.trackEvent('PageView', {
      contentName: `${shop.name || 'SmartShopX'} - অনলাইন স্টোর`,
    });
  }, [shop.name]);

  const deliveryCharge = deliveryArea === 'inside' ? 60 : 120;
  const itemsSubtotal = cart.reduce(
    (sum, item) => sum + (item.product.sellingPrice - item.product.discount) * item.quantity,
    0
  );
  const totalAmount = itemsSubtotal + (cart.length > 0 ? deliveryCharge : 0);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    // Track Facebook AddToCart Event
    facebookPixelService.trackEvent('AddToCart', {
      contentName: product.name,
      contentId: product.id,
      value: product.sellingPrice - product.discount,
      currency: 'BDT',
    });

    showToast(`${product.name} কার্টে যোগ করা হয়েছে`, 'success');
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('আপনার কার্ট খালি!', 'warning');
      return;
    }
    if (!customerName || !customerPhone || !customerAddress) {
      showToast('সকল তথ্য পূরণ করুন', 'warning');
      return;
    }

    const orderNumber = `SX-WEB-${Date.now().toString().slice(-4)}`;
    setCurrentOrderNumber(orderNumber);

    if (paymentMethod !== 'COD') {
      // Open online payment gateway modal
      setIsPaymentModalOpen(true);
      return;
    }

    // Direct Cash on Delivery
    const newOrder: any = {
      id: `order_${Date.now()}`,
      orderNumber,
      customerId: `cust_${Date.now()}`,
      customerName,
      customerMobile: customerPhone,
      customerAddress,
      channel: 'Online Store' as const,
      orderSource: 'Online Store' as const,
      orderStatus: 'Pending' as const,
      paymentStatus: 'Pending' as const,
      paymentMethod: 'Cash' as const,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice - item.product.discount,
        total: (item.product.sellingPrice - item.product.discount) * item.quantity,
      })),
      subtotal: itemsSubtotal,
      deliveryCharge,
      discount: 0,
      totalAmount,
      paidAmount: 0,
      dueAmount: totalAmount,
      createdAt: new Date().toISOString(),
    };

    const existingOrders = DataStore.getOrders(shop.id);
    DataStore.setOrders([newOrder, ...existingOrders], shop.id);

    // Track Facebook Purchase Event (Browser + CAPI Deduplicated)
    facebookPixelService.trackEvent('Purchase', {
      orderId: orderNumber,
      value: totalAmount,
      currency: 'BDT',
      customerMobile: customerPhone,
      numItems: cart.length,
      contentName: `অনলাইন অর্ডার (ক্যাশ অন ডেলিভারি): ${orderNumber}`,
    });

    // Send automated order confirmation SMS
    smsService.triggerOrderSms(newOrder, 'CONFIRM');

    setCompletedTrxId('');
    setOrderSuccess(true);
    setCart([]);
  };

  const handleOnlinePaymentSuccess = (trxId: string, gateway: PaymentGatewayType) => {
    setIsPaymentModalOpen(false);
    setCompletedTrxId(trxId);

    const newOrder: any = {
      id: `order_${Date.now()}`,
      orderNumber: currentOrderNumber || `SX-WEB-${Date.now().toString().slice(-4)}`,
      customerId: `cust_${Date.now()}`,
      customerName,
      customerMobile: customerPhone,
      customerAddress,
      channel: 'Online Store' as const,
      orderSource: 'Online Store' as const,
      orderStatus: 'Confirmed' as const,
      paymentStatus: 'Paid' as const,
      paymentMethod: (gateway === 'bKash' ? 'bKash' : gateway === 'Nagad' ? 'Nagad' : 'Other') as any,
      transactionId: trxId,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice - item.product.discount,
        total: (item.product.sellingPrice - item.product.discount) * item.quantity,
      })),
      subtotal: itemsSubtotal,
      deliveryCharge,
      discount: 0,
      totalAmount,
      paidAmount: totalAmount,
      dueAmount: 0,
      stockAdjusted: true,
      createdAt: new Date().toISOString(),
    };

    // Synchronize inventory stock for prepaid confirmed order
    const currentProducts = DataStore.getProducts(shop.id);
    let hasModifiedProducts = false;
    for (const item of newOrder.items || []) {
      const prodIdx = currentProducts.findIndex((p) => p.id === item.productId);
      if (prodIdx !== -1) {
        const prevStock = currentProducts[prodIdx].stock;
        const deductedStock = Math.max(0, prevStock - item.quantity);
        currentProducts[prodIdx] = {
          ...currentProducts[prodIdx],
          stock: deductedStock,
        };
        hasModifiedProducts = true;
        const existingLogs = DataStore.getStockLogs(shop.id);
        DataStore.setStockLogs([
          {
            id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            productId: item.productId,
            productName: item.productName,
            type: 'Stock Out',
            quantity: item.quantity,
            previousStock: prevStock,
            newStock: deductedStock,
            reason: `অনলাইন নিশ্চিত অর্ডার (${newOrder.orderNumber})`,
            createdAt: new Date().toISOString(),
          },
          ...existingLogs,
        ], shop.id);
      }
    }
    if (hasModifiedProducts) {
      DataStore.setProducts(currentProducts, shop.id);
    }

    // Save order
    const existingOrders = DataStore.getOrders(shop.id);
    DataStore.setOrders([newOrder, ...existingOrders], shop.id);

    // Save Payment Transaction
    const existingPayments = DataStore.getPayments(shop.id);
    DataStore.setPayments([
      {
        id: `pay_${Date.now()}`,
        transactionId: trxId,
        orderId: newOrder.id,
        customerOrSupplierName: customerName,
        type: 'Customer Payment',
        amount: totalAmount,
        method: newOrder.paymentMethod,
        status: 'Paid',
        date: new Date().toISOString().split('T')[0],
        notes: `অনলাইন স্টোর পেমেন্ট: ${newOrder.orderNumber} (গেটওয়ে: ${gateway})`,
      },
      ...existingPayments,
    ], shop.id);

    // Track Facebook Purchase Event with full value
    facebookPixelService.trackEvent('Purchase', {
      orderId: newOrder.orderNumber,
      value: totalAmount,
      currency: 'BDT',
      customerMobile: customerPhone,
      numItems: cart.length,
      contentName: `অনলাইন প্রিপেইড অর্ডার: ${newOrder.orderNumber}`,
    });

    // Send automated confirmation SMS
    smsService.triggerOrderSms(newOrder, 'CONFIRM');

    setOrderSuccess(true);
    setCart([]);
    showToast('পেমেন্ট ও অর্ডার সফলভাবে সম্পন্ন হয়েছে!', 'success');
  };

  if (shop.subscriptionStatus === 'Suspended' || shop.isSuspended) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{shop.name}</h2>
          <p className="text-sm text-slate-600">
            এই অনলাইন স্টোরটির সেবা সেন্ট্রাল অ্যাডমিন দ্বারা সাময়িকভাবে স্থগিত (Suspended) রাখা হয়েছে।
          </p>
          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            মূল ড্যাশবোর্ডে ফিরুন
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Banner Notice */}
      <div className="bg-emerald-700 text-white text-xs py-2 px-4 text-center font-medium">
        🎉 ক্যাশ অন ডেলিভারিতে সারাদেশে দ্রুত হোম ডেলিভারি সুবিধা!
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
              SX
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 leading-tight">{shop.name}</h1>
              <p className="text-xs text-slate-500">{shop.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>মার্চেন্ট প্যানেলে ফেরত</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {orderSuccess ? (
          <div className="bg-white rounded-3xl p-8 max-w-md mx-auto text-center border border-emerald-200 shadow-xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                অর্ডার নং: {currentOrderNumber}
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">অর্ডার সফলভাবে সম্পন্ন হয়েছে!</h2>
            </div>

            {completedTrxId ? (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-left text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>অনলাইন পেমেন্ট নিশ্চিত হয়েছে</span>
                </div>
                <p className="text-slate-600">
                  লেনদেন ট্রানজেকশন আইডি: <span className="font-mono font-bold text-slate-900">{completedTrxId}</span>
                </p>
                <p className="text-slate-500 text-[11px]">
                  পেমেন্ট সফল হওয়ার নোটিফিকেশন এসএমএস আপনার মোবাইলে পাঠানো হয়েছে।
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                আপনার ক্যাশ অন ডেলিভারি অর্ডারটি নিবন্ধিত হয়েছে। পার্সেল হাতে পেয়ে মূল্য পরিশোধ করবেন।
              </p>
            )}

            <Button onClick={() => setOrderSuccess(false)} variant="primary" size="md" className="w-full">
              আরো কেনাকাটা করুন
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Products List */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-base font-bold text-slate-900">উপলব্ধ পণ্যসমূহ ({products.length})</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((p) => {
                  const finalPrice = p.sellingPrice - p.discount;
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-col justify-between shadow-xs hover:border-emerald-300 transition-all"
                    >
                      <div>
                        <div className="aspect-video w-full rounded-xl bg-slate-100 overflow-hidden mb-2.5">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <h3 className="font-bold text-xs text-slate-900 line-clamp-1">{p.name}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{p.category}</p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-black text-slate-900 text-sm">
                            {formatCurrency(finalPrice)}
                          </span>
                          {p.discount > 0 && (
                            <span className="text-[10px] text-slate-400 line-through ml-1.5 font-mono">
                              {formatCurrency(p.sellingPrice)}
                            </span>
                          )}
                        </div>

                        <Button onClick={() => addToCart(p)} variant="primary" size="sm">
                          কার্টে যোগ
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cart & Checkout */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <span>অর্ডার চেকআউট (কার্ট: {cart.length} টি)</span>
              </h2>

              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  আপনার কার্ট বর্তমানে খালি। বাম পাশের তালিকা থেকে পণ্য নির্বাচন করুন।
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {cart.map((it, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 truncate max-w-[150px]">
                          {it.product.name}
                        </span>
                        <span className="font-mono font-bold text-slate-700">
                          {it.quantity} × {formatCurrency(it.product.sellingPrice - it.product.discount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Checkout Form */}
                  <form onSubmit={handleCheckout} className="space-y-3 pt-3 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        আপনার পূর্ণ নাম *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="যেমন: তানভীর আহমেদ"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        মোবাইল নম্বর *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        সম্পূর্ণ ডেলিভারি ঠিকানা *
                      </label>
                      <textarea
                        rows={2}
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="বাসা/রোড/থানা ও জেলা..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ডেলিভারি এরিয়া
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDeliveryArea('inside')}
                          className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                            deliveryArea === 'inside'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          ঢাকার ভেতরে (৳৬০)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryArea('outside')}
                          className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                            deliveryArea === 'outside'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          ঢাকার বাইরে (৳১২০)
                        </button>
                      </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>পেমেন্ট পদ্ধতি নির্বাচন করুন</span>
                        <span className="text-[10px] text-emerald-600 font-bold">নিরাপদ পেমেন্ট</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('COD')}
                          className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                            paymentMethod === 'COD'
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-900">ক্যাশ অন ডেলিভারি</p>
                          <p className="text-[10px] text-slate-500">পণ্য হাতে পেয়ে টাকা দিন</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('bKash')}
                          className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                            paymentMethod === 'bKash'
                              ? 'border-[#D12053] bg-pink-50/50 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-[#D12053]">বিকাশ অনলাইন</p>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-100 text-[#D12053]">ইনস্ট্যান্ট</span>
                          </div>
                          <p className="text-[10px] text-slate-500">bKash গেটওয়ে পেমেন্ট</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('Nagad')}
                          className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                            paymentMethod === 'Nagad'
                              ? 'border-[#F7941D] bg-orange-50/50 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-[#F7941D]">নগদ অনলাইন</p>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-[#F7941D]">সরাসরি</span>
                          </div>
                          <p className="text-[10px] text-slate-500">Nagad গেটওয়ে পেমেন্ট</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('SSLCommerz')}
                          className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                            paymentMethod === 'SSLCommerz'
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-indigo-900">কার্ড / ইন্টারনেট</p>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">ভিসা/মাস্টার</span>
                          </div>
                          <p className="text-[10px] text-slate-500">SSLCommerz গেটওয়ে</p>
                        </button>
                      </div>
                    </div>

                    {/* Cost summary */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-medium">
                      <div className="flex justify-between text-slate-600">
                        <span>পণ্যের মোট মূল্য:</span>
                        <span className="font-mono">{formatCurrency(itemsSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>ডেলিভারি চার্জ:</span>
                        <span className="font-mono">{formatCurrency(deliveryCharge)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                        <span>সর্বমোট প্রদেয় বিল:</span>
                        <span className="font-mono text-emerald-700">{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>

                    <Button type="submit" variant="primary" size="md" className="w-full shadow-emerald-900/40">
                      {paymentMethod === 'COD' && 'ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করুন'}
                      {paymentMethod === 'bKash' && `বিকাশে ${formatCurrency(totalAmount)} পেমেন্ট ও অর্ডার`}
                      {paymentMethod === 'Nagad' && `নগদে ${formatCurrency(totalAmount)} পেমেন্ট ও অর্ডার`}
                      {paymentMethod === 'SSLCommerz' && `কার্ডে ${formatCurrency(totalAmount)} অনলাইনে পেমেন্ট`}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Online Payment Modal */}
      <OnlinePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handleOnlinePaymentSuccess}
        amount={totalAmount}
        orderNumber={currentOrderNumber || `SX-WEB-${Date.now().toString().slice(-4)}`}
        customerMobile={customerPhone}
        customerName={customerName}
        gateway={paymentMethod === 'bKash' ? 'bKash' : paymentMethod === 'Nagad' ? 'Nagad' : 'SSLCommerz'}
      />

      {/* AI Customer Shopping Assistant (Section 10) */}
      <AiCustomerAssistant
        products={products}
        storeName={shop.name}
        onAddToCart={addToCart}
        orderContext={{
          orderNumber: currentOrderNumber,
          orderStatus: 'Confirmed',
          totalAmount,
        }}
      />
    </div>
  );
};
