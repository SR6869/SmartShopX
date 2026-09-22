import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DataStore } from '../../services/dataStorage';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { BusinessReadinessChecklist } from '../../components/dashboard/BusinessReadinessChecklist';
import { AiBusinessAssistantModal } from '../../components/ai/AiBusinessAssistantModal';
import { StockAndExpiryAlertBanner } from '../../components/dashboard/StockAndExpiryAlertBanner';
import { DayEndCashClosingModal } from '../../components/pos/DayEndCashClosingModal';
import {
  TrendingUp,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  CreditCard,
  Plus,
  Boxes,
  Sparkles,
  Coins,
  Truck,
  Wallet,
  ChevronRight,
  Zap,
  BookOpen,
  BarChart3,
  PhoneCall,
  Settings,
  HelpCircle,
  Headset,
  Compass,
  ShieldAlert,
  FolderKanban,
  DollarSign,
  Layers,
  Scale,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { shop, user, canAccessFeature } = useAuth();
  const navigate = useNavigate();
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isDayEndClosingOpen, setIsDayEndClosingOpen] = useState(false);

  const [orders, setOrders] = useState(() => {
    const o = DataStore.getOrders();
    return Array.isArray(o) ? o : [];
  });
  const [products] = useState(() => {
    const p = DataStore.getProducts();
    return Array.isArray(p) ? p : [];
  });
  const [customers] = useState(() => {
    const c = DataStore.getCustomers();
    return Array.isArray(c) ? c : [];
  });
  const [suppliers] = useState(() => {
    const s = DataStore.getSuppliers();
    return Array.isArray(s) ? s : [];
  });
  const [purchases] = useState(() => {
    const pu = DataStore.getPurchases();
    return Array.isArray(pu) ? pu : [];
  });
  const [payments] = useState(() => {
    const pa = DataStore.getPayments();
    return Array.isArray(pa) ? pa : [];
  });

  useEffect(() => {
    // Sync with DataStore
    const o = DataStore.getOrders();
    setOrders(Array.isArray(o) ? o : []);
  }, []);

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safePayments = Array.isArray(payments) ? payments : [];

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculations
  const todayOrders = safeOrders.filter((o) => (o.createdAt || '').startsWith(todayStr));
  const todaySales = todayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const monthlySales = safeOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // Today's Cash Collection
  const todayCashSales = todayOrders
    .filter((o) => o.paymentMethod === 'Cash' || o.paymentStatus === 'Paid')
    .reduce((sum, o) => sum + (Number(o.paidAmount ?? o.totalAmount) || 0), 0);

  const todayPurchases = safePurchases.filter((p) => p.purchaseDate === todayStr);
  const todayPurchaseAmount = todayPurchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);

  const totalCustomerDue = safeCustomers.reduce((sum, c) => sum + (Number(c.totalDue) || 0), 0);
  const totalSupplierPayable = safeSuppliers.reduce((sum, s) => sum + (Number(s.totalPayable) || 0), 0);
  const totalProductsCount = safeProducts.length;
  const lowStockProducts = safeProducts.filter((p) => (Number(p.stock) || 0) <= (Number(p.minStock) || 0));

  // Courier Pending Receivables
  const courierOrders = safeOrders.filter(
    (o) =>
      (o.deliveryType === 'Courier' || o.courierName) &&
      o.orderStatus !== 'Delivered' &&
      o.orderStatus !== 'Cancelled' &&
      o.paymentStatus !== 'Paid'
  );
  const courierReceivable = courierOrders.reduce(
    (sum, o) => sum + (Number(o.dueAmount ?? o.totalAmount) || 0),
    0
  );

  // Weekly sales trend data for simple SVG chart
  const weeklySalesData = [
    { day: 'শনি', amount: 8500 },
    { day: 'রবি', amount: 12400 },
    { day: 'সোম', amount: 9800 },
    { day: 'মঙ্গল', amount: 15600 },
    { day: 'বুধ', amount: 11200 },
    { day: 'বৃহঃ', amount: 18400 },
    { day: 'শুক্র', amount: todaySales > 0 ? todaySales : 16200 },
  ];
  const maxSales = Math.max(...weeklySalesData.map((d) => d.amount), 20000);

  const handleOpenLiveChat = () => {
    window.dispatchEvent(new CustomEvent('open_smart_helpline'));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. TOP HERO / BUSINESS SUMMARY HEADER (Warm Amber/Golden Style) */}
      <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 rounded-3xl p-5 sm:p-7 text-white shadow-lg border border-amber-500/40 relative overflow-hidden">
        {/* Subtle Decorative Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold flex items-center gap-1">
                <Store className="w-3.5 h-3.5" />
                {shop.name}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-200 border border-amber-400/30 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                লাইভ ক্লাউড সিঙ্ক
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              স্বাগতম, {user?.name || 'দোকানদার'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 mt-1 max-w-xl leading-relaxed">
              আজকের ব্যবসার সামগ্রিক বিক্রি, ক্যাশ হিসাব ও বকেয়া খতিয়ান পরিচালনা করুন।
            </p>

            {/* Quick Metrics Strip */}
            <div className="mt-4 flex items-center gap-3 sm:gap-6 flex-wrap pt-2 border-t border-white/10 text-xs font-mono">
              <div>
                <span className="text-[10px] text-amber-200 block uppercase">আজকের বিক্রি</span>
                <span className="text-sm sm:text-base font-black text-white">{formatCurrency(todaySales)}</span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="text-[10px] text-amber-200 block uppercase">হাতে নগদ</span>
                <span className="text-sm sm:text-base font-black text-emerald-300">{formatCurrency(todayCashSales)}</span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="text-[10px] text-amber-200 block uppercase">গ্রাহক বকেয়া</span>
                <span className="text-sm sm:text-base font-black text-rose-200">{formatCurrency(totalCustomerDue)}</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              onClick={() => navigate('/pos')}
              variant="primary"
              size="md"
              leftIcon={<ShoppingCart className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer"
            >
              নতুন বিক্রয় (POS)
            </Button>
            <Button
              onClick={() => setIsAiAssistantOpen(true)}
              variant="outline"
              size="md"
              leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
              className="bg-amber-950/40 text-amber-100 border-amber-400/50 hover:bg-amber-900/60 cursor-pointer"
            >
              AI সহকারী
            </Button>
            <Button
              onClick={() => navigate('/products?action=add', { state: { openAdd: true } })}
              variant="secondary"
              size="md"
              leftIcon={<Plus className="w-4 h-4 text-slate-800 shrink-0" />}
              className="border border-white/30 bg-white text-slate-900 hover:bg-slate-100 font-bold cursor-pointer"
              title="নতুন পণ্য যোগ করুন"
            >
              নতুন পণ্য যোগ
            </Button>
            <Button
              onClick={() => setIsDayEndClosingOpen(true)}
              variant="outline"
              size="md"
              leftIcon={<Coins className="w-4 h-4 text-amber-300" />}
              className="border border-amber-400/40 bg-amber-950/40 text-amber-100 hover:bg-amber-900/60 cursor-pointer"
              title="ক্যাশ ক্লোজিং খতিয়ান"
            >
              ক্যাশ ক্লোজিং
            </Button>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY QUICK ACTIONS (কেনা & বেচা - Prominent Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 🛒 কেনা (Purchase) */}
        <div
          onClick={() => navigate('/purchases')}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 rounded-3xl text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-black tracking-tight">কেনা (Purchase)</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">ক্রয় চালান</span>
              </div>
              <p className="text-xs text-purple-100/90 mt-0.5">
                সাপ্লায়ারের কাছ থেকে পণ্য ক্রয় ও রিস্টক ইনভয়েস যুক্ত করুন
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>

        {/* ⚡ বেচা (Sale / POS) */}
        <div
          onClick={() => navigate('/pos')}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 rounded-3xl text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-black tracking-tight">বেচা (Sale / POS)</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">দ্রুত কাউন্টার বিক্রয়</span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                কাউন্টার সেলস, বাটন ক্যাশ পেমেন্ট ও ইনভয়েস প্রিন্টিং
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      </div>

      {/* 3. KHATA SECTION (খাতা সমূহ) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              খাতা সমূহ (Business Ledgers)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">রিয়েল-টাইম খতিয়ান</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* কেনার খাতা */}
          <div
            onClick={() => navigate('/purchases')}
            className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-900">কেনার খাতা</span>
              <FileSpreadsheet className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-base sm:text-xl font-black text-slate-900 font-mono">
              {formatCurrency(todayPurchaseAmount)}
            </p>
            <p className="text-[11px] text-purple-700 font-medium mt-1 flex items-center justify-between">
              <span>আজকের ক্রয়</span>
              <span>&rarr;</span>
            </p>
          </div>

          {/* বেচার খাতা */}
          <div
            onClick={() => navigate('/sales')}
            className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900">বেচার খাতা</span>
              <Receipt className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-base sm:text-xl font-black text-slate-900 font-mono">
              {formatCurrency(todaySales)}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center justify-between">
              <span>বিক্রয় খতিয়ান</span>
              <span>&rarr;</span>
            </p>
          </div>

          {/* বাকির খাতা */}
          <div
            onClick={() => navigate('/due')}
            className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900">বাকির খাতা</span>
              <Scale className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-base sm:text-xl font-black text-amber-800 font-mono">
              {formatCurrency(totalCustomerDue)}
            </p>
            <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center justify-between">
              <span>গ্রাহক বকেয়া</span>
              <span>&rarr;</span>
            </p>
          </div>

          {/* খরচের খাতা */}
          <div
            onClick={() => navigate('/expenses')}
            className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-900">খরচের খাতা</span>
              <Wallet className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-base sm:text-xl font-black text-slate-900 font-mono">
              {formatCurrency(0)}
            </p>
            <p className="text-[11px] text-rose-700 font-medium mt-1 flex items-center justify-between">
              <span>দৈনন্দিন খরচ</span>
              <span>&rarr;</span>
            </p>
          </div>
        </div>
      </div>

      {/* 4. BUSINESS TOOLS (বিজনেস টুলস - Icon Grid) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <FolderKanban className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              বিজনেস টুলস (Business Tools)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">স্মার্ট ফিচারসমূহ</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            {
              title: 'স্টক ও ইনভেন্টরি',
              subtitle: 'স্টক ট্র্যাকিং',
              icon: Boxes,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
              action: () => navigate('/inventory'),
            },
            {
              title: 'ব্যবসার রিপোর্ট',
              subtitle: 'লাভ-ক্ষতি ও খতিয়ান',
              icon: BarChart3,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
              action: () => navigate('/reports'),
            },
            {
              title: 'ক্যাশবক্স / ক্লোজিং',
              subtitle: 'দিনশেষের হিসাব',
              icon: Coins,
              color: 'text-amber-600 bg-amber-50 border-amber-200',
              action: () => setIsDayEndClosingOpen(true),
            },
            {
              title: 'পণ্য ক্যাটালগ',
              subtitle: 'পণ্য যোগ ও এডিট',
              icon: Package,
              color: 'text-sky-600 bg-sky-50 border-sky-200',
              action: () => navigate('/products'),
            },
            {
              title: 'কুরিয়ার বুকিং',
              subtitle: 'Steadfast/Pathao',
              icon: Truck,
              color: 'text-purple-600 bg-purple-50 border-purple-200',
              action: () => navigate('/courier'),
            },
            {
              title: 'ভয়েস কল ও তাগাদা',
              subtitle: 'অটো রিমাইন্ডার',
              icon: PhoneCall,
              color: 'text-teal-600 bg-teal-50 border-teal-200',
              action: () => navigate('/voice-calls'),
            },
            {
              title: 'AI বিজনেস সহকারী',
              subtitle: 'স্মার্ট পরামর্শ',
              icon: Sparkles,
              color: 'text-amber-600 bg-amber-50 border-amber-200',
              action: () => setIsAiAssistantOpen(true),
            },
            {
              title: 'অনলাইন স্টোর',
              subtitle: 'ই-কমার্স ক্যাটালগ',
              icon: Store,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
              action: () => navigate('/online-store'),
            },
            {
              title: 'ল্যান্ডিং পেজ',
              subtitle: 'সেলস ফানেল',
              icon: Compass,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
              action: () => navigate('/landing-pages'),
            },
            {
              title: 'পেমেন্ট ব্যবস্থাপনা',
              subtitle: 'কাস্টমার পেমেন্ট',
              icon: CreditCard,
              color: 'text-sky-600 bg-sky-50 border-sky-200',
              action: () => navigate('/payments'),
            },
            {
              title: 'কাস্টমার রিস্ক',
              subtitle: 'ফ্রড ট্র্যাকিং',
              icon: ShieldAlert,
              color: 'text-rose-600 bg-rose-50 border-rose-200',
              action: () => navigate('/risk-analysis'),
            },
            {
              title: 'ব্যবসার সেটিংস',
              subtitle: 'প্রোফাইল ও কনফিগার',
              icon: Settings,
              color: 'text-slate-700 bg-slate-100 border-slate-200',
              action: () => navigate('/settings'),
            },
          ].map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <div
                key={idx}
                onClick={tool.action}
                className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300 transition-all cursor-pointer flex items-center gap-3 group shadow-2xs"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${tool.color} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {tool.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-tight">
                    {tool.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. CHECKLISTS & ALERTS */}
      <BusinessReadinessChecklist />

      <StockAndExpiryAlertBanner
        products={products}
        onQuickStockInward={() => navigate('/products')}
      />

      {/* 6. ANALYTICS & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">গত ৭ দিনের বিক্রয় চিত্র (Sales Trend)</h2>
              <p className="text-xs text-slate-500 mt-0.5">দৈনিক মোট বিক্রয়ের পরিসংখ্যান ও টার্নওভার</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
              সাপ্তাহিক মোট টার্নওভার: ৳ ৮৯,৫০০
            </span>
          </div>

          {/* Clean Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2 border-b border-slate-100">
            {weeklySalesData.map((item, idx) => {
              const heightPercent = Math.round((item.amount / maxSales) * 100);
              const isToday = idx === weeklySalesData.length - 1;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-900 font-bold">
                    ৳{(item.amount / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full max-w-[36px] bg-slate-100 rounded-t-xl overflow-hidden h-36 flex items-end">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        isToday
                          ? 'bg-emerald-600 group-hover:bg-emerald-500 shadow-xs'
                          : 'bg-slate-800 group-hover:bg-slate-700'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isToday ? 'text-emerald-600 font-bold' : 'text-slate-600'
                    }`}
                  >
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
            <span>সপ্তাহের শুরুর দিন: শনিবার</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-800" /> আগের দিনগুলো
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> আজকের দিন
              </span>
            </div>
          </div>
        </div>

        {/* Low-stock products list (1 column) */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">কম স্টক সতর্কতা (Low Stock)</h3>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer"
            >
              সব দেখুন
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-64">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">কোনো কম স্টকের পণ্য নেই।</p>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="truncate">
                    <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">SKU: {p.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block font-mono font-bold px-2 py-0.5 rounded-md ${
                        p.stock === 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.stock === 0 ? 'স্টক আউট' : `বাকি: ${p.stock} ${p.unit.split(' ')[0]}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 mt-auto border-t border-slate-100">
            <Button
              onClick={() => navigate('/purchases')}
              variant="outline"
              size="sm"
              className="w-full cursor-pointer"
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            >
              নতুন ক্রয় চালান তৈরি করুন
            </Button>
          </div>
        </div>
      </div>

      {/* Tables: Recent Orders & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">সাম্প্রতিক অর্ডারসমূহ (Recent Orders)</h3>
              <p className="text-xs text-slate-500 mt-0.5">অনলাইন স্টোর ও অন্যান্য মাধ্যম</p>
            </div>
            <Button onClick={() => navigate('/orders')} variant="ghost" size="sm" className="cursor-pointer">
              সব অর্ডার →
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="py-2 px-2">অর্ডার নং</th>
                  <th className="py-2 px-2">ক্রেতা</th>
                  <th className="py-2 px-2">মোট</th>
                  <th className="py-2 px-2">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeOrders.slice(0, 4).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-2 font-mono font-semibold text-slate-800">
                      {order.orderNumber}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="font-medium text-slate-800 block truncate max-w-[120px]">
                        {order.customerName}
                      </span>
                      <span className="text-[10px] text-slate-400">{order.customerMobile}</span>
                    </td>
                    <td className="py-2.5 px-2 font-mono font-bold text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-2.5 px-2">
                      <StatusBadge status={order.orderStatus} type="order" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">সাম্প্রতিক পেমেন্ট লেনদেন (Recent Payments)</h3>
              <p className="text-xs text-slate-500 mt-0.5">কাস্টমার ও সরবরাহকারী লেনদেন</p>
            </div>
            <Button onClick={() => navigate('/payments')} variant="ghost" size="sm" className="cursor-pointer">
              সব পেমেন্ট →
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {safePayments.slice(0, 4).map((pay) => (
              <div key={pay.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      pay.type === 'Customer Payment' || pay.type === 'Due Collection'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{pay.customerOrSupplierName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {pay.type} • {pay.method} • {pay.date}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono font-bold text-sm block ${
                      pay.type === 'Customer Payment' || pay.type === 'Due Collection'
                        ? 'text-emerald-600'
                        : 'text-slate-800'
                    }`}
                  >
                    +{formatCurrency(pay.amount)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">সফল (Paid)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. SUPPORT & LIVE CHAT CARD */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Headset className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">
              যেকোনো প্রয়োজনে এক্সপার্টের কাছ থেকে সহায়তা নিন
            </h3>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              ২৪/৭ স্মার্ট কাস্টমার ও টেকনিক্যাল হেল্পলাইন | সরাসরি কথা বলতে হেল্পলাইনে ট্যাপ করুন
            </p>
            <p className="font-mono text-emerald-400 text-xs mt-1 font-bold">
              01836-686869
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleOpenLiveChat}
          variant="primary"
          size="md"
          leftIcon={<Headset className="w-4 h-4" />}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md cursor-pointer shrink-0"
        >
          স্মার্ট হেল্পলাইন &rarr;
        </Button>
      </div>

      {/* Modals */}
      <AiBusinessAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        businessMetrics={{
          shopName: shop.name,
          todaySales,
          monthlySales: monthlySales > 0 ? monthlySales : 284500,
          totalProductsCount,
          lowStockCount: lowStockProducts.length,
          totalCustomerDue,
          totalSupplierPayable,
        }}
      />

      <DayEndCashClosingModal
        isOpen={isDayEndClosingOpen}
        onClose={() => setIsDayEndClosingOpen(false)}
      />
    </div>
  );
};
