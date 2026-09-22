import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  BookOpen,
  Package,
  Menu as MenuIcon,
  X,
  Receipt,
  Scale,
  FileSpreadsheet,
  Wallet,
  Users,
  Truck,
  ShoppingBag,
  Boxes,
  BarChart3,
  Store,
  Compass,
  CreditCard,
  PhoneCall,
  ShieldAlert,
  Zap,
  FileText,
  RotateCcw,
  XCircle,
  Settings,
  Sparkles,
  PiggyBank,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { hasPermission, activeAccountMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isKhataOpen, setIsKhataOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const currentPath = location.pathname;

  // Automatically close sheets when location path changes
  useEffect(() => {
    setIsKhataOpen(false);
    setIsMoreOpen(false);
  }, [currentPath]);

  // Handle ESC or Back gesture for sheets
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsKhataOpen(false);
        setIsMoreOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isKhataActive =
    currentPath === '/due' ||
    currentPath === '/sales' ||
    currentPath === '/purchases' ||
    currentPath === '/expenses' ||
    currentPath === '/customers' ||
    currentPath === '/suppliers';

  const isMoreActive =
    currentPath === '/orders' ||
    currentPath === '/inventory' ||
    currentPath === '/courier' ||
    currentPath === '/reports' ||
    currentPath === '/online-store' ||
    currentPath === '/landing-pages' ||
    currentPath === '/payments' ||
    currentPath === '/voice-calls' ||
    currentPath === '/risk-analysis' ||
    currentPath === '/telecom' ||
    currentPath === '/invoices' ||
    currentPath === '/returns' ||
    currentPath === '/incomplete-orders' ||
    currentPath === '/staff' ||
    currentPath === '/subscription' ||
    currentPath === '/settings';

  // Personal mode navigation items
  if (activeAccountMode === 'personal') {
    const personalItems = [
      { to: '/personal', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
      { to: '/personal?tab=transactions', label: 'আয়-ব্যয়', icon: Wallet },
      { to: '/personal?tab=savings', label: 'সঞ্চয় খাতা', icon: PiggyBank },
      { to: '/personal?tab=budgets', label: 'বাজেট', icon: FileSpreadsheet },
      { to: '/personal?tab=due', label: 'দেনা-পাওনা', icon: Scale },
    ];

    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {personalItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  isActive
                    ? 'text-amber-600 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span className="mt-1 leading-none">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    );
  }

  // Business mode navigation
  return (
    <>
      {/* Khata Sheet Modal Overlay */}
      {isKhataOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="fixed inset-0"
            onClick={() => setIsKhataOpen(false)}
          />

          <div className="relative z-50 bg-white rounded-t-3xl p-5 border-t border-slate-200 shadow-2xl max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>খাতা সমূহ (Ledgers)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  আপনার ব্যবসার বকেয়া, বিক্রি, ক্রয় ও খরচের খতিয়ান
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsKhataOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  title: 'বাকির খাতা',
                  desc: 'গ্রাহক বকেয়া ও তাগাদা',
                  to: '/due',
                  icon: Scale,
                  color: 'text-amber-600 bg-amber-50 border-amber-200',
                  allowed: hasPermission('canManagePayments'),
                },
                {
                  title: 'বেচার খাতা',
                  desc: 'বিক্রয় ইতিহাস ও হিসাব',
                  to: '/sales',
                  icon: Receipt,
                  color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
                  allowed: hasPermission('canViewSales'),
                },
                {
                  title: 'কেনার খাতা',
                  desc: 'সাপ্লায়ার ক্রয় চালান',
                  to: '/purchases',
                  icon: FileSpreadsheet,
                  color: 'text-purple-600 bg-purple-50 border-purple-200',
                  allowed: true,
                },
                {
                  title: 'খরচের খাতা',
                  desc: 'দৈনন্দিন দোকান খরচ',
                  to: '/expenses',
                  icon: Wallet,
                  color: 'text-rose-600 bg-rose-50 border-rose-200',
                  allowed: true,
                },
                {
                  title: 'গ্রাহক তালিকা',
                  desc: 'কাস্টমার লেজার ও লিমিট',
                  to: '/customers',
                  icon: Users,
                  color: 'text-sky-600 bg-sky-50 border-sky-200',
                  allowed: hasPermission('canManageCustomers'),
                },
                {
                  title: 'সরবরাহকারী',
                  desc: 'সাপ্লায়ার দেনা খাতা',
                  to: '/suppliers',
                  icon: Truck,
                  color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
                  allowed: true,
                },
              ]
                .filter((item) => item.allowed)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => {
                        setIsKhataOpen(false);
                        navigate(item.to);
                      }}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/80 transition-all text-left flex items-start gap-3 cursor-pointer group shadow-2xs"
                    >
                      <div className={`p-2 rounded-xl border ${item.color} shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-tight">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* More Sheet Modal Overlay */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreOpen(false)}
          />

          <div className="relative z-50 bg-white rounded-t-3xl p-5 border-t border-slate-200 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <MenuIcon className="w-4 h-4 text-emerald-600" />
                  <span>আরও ফিচার ও টুলস (More Features)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  স্মার্টশপএক্স-এর সমস্ত ব্যবসায়িক ফিচার
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { title: 'অর্ডারসমূহ', to: '/orders', icon: ShoppingBag, allowed: hasPermission('canManageOrders') },
                { title: 'ইনভেন্টরি ও স্টক', to: '/inventory', icon: Boxes, allowed: hasPermission('canManageProducts') },
                { title: 'কুরিয়ার ট্র্যাকিং', to: '/courier', icon: Truck, allowed: true },
                { title: 'ব্যবসার রিপোর্ট', to: '/reports', icon: BarChart3, allowed: hasPermission('canViewReports') },
                { title: 'অনলাইন স্টোর', to: '/online-store', icon: Store, allowed: true },
                { title: 'ল্যান্ডিং পেজ', to: '/landing-pages', icon: Compass, allowed: true },
                { title: 'পেমেন্ট খতিয়ান', to: '/payments', icon: CreditCard, allowed: hasPermission('canManagePayments') },
                { title: 'ভয়েস কল তাগাদা', to: '/voice-calls', icon: PhoneCall, allowed: true },
                { title: 'কাস্টমার রিস্ক', to: '/risk-analysis', icon: ShieldAlert, allowed: true },
                { title: 'টেলিকম ও রিচার্জ', to: '/telecom', icon: Zap, allowed: true },
                { title: 'চালান ও ইনভয়েস', to: '/invoices', icon: FileText, allowed: true },
                { title: 'রিটার্ন ও এক্সচেঞ্জ', to: '/returns', icon: RotateCcw, allowed: true },
                { title: 'অসম্পূর্ণ অর্ডার', to: '/incomplete-orders', icon: XCircle, allowed: hasPermission('canManageOrders') },
                { title: 'স্টাফ ও এক্সেস', to: '/staff', icon: Users, allowed: true },
                { title: 'প্যাকেজ প্ল্যান', to: '/subscription', icon: Sparkles, allowed: true },
                { title: 'ব্যবসার সেটিংস', to: '/settings', icon: Settings, allowed: true },
              ]
                .filter((item) => item.allowed !== false)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        navigate(item.to);
                      }}
                      className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left flex items-center gap-2.5 cursor-pointer group shadow-2xs"
                    >
                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 truncate flex-1">
                        {item.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Main 5-Item Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200/90 px-3 py-1.5 flex items-center justify-around shadow-lg">
        {/* 1. 🏠 হোম */}
        <NavLink
          to="/"
          onClick={() => {
            setIsKhataOpen(false);
            setIsMoreOpen(false);
          }}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              isActive && !isKhataOpen && !isMoreOpen
                ? 'text-emerald-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="mt-1 leading-none">হোম</span>
        </NavLink>

        {/* 2. 🛒 বেচা (POS Primary Button) */}
        {hasPermission('canCreateSale') && (
          <NavLink
            to="/pos"
            onClick={() => {
              setIsKhataOpen(false);
              setIsMoreOpen(false);
            }}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                isActive && !isKhataOpen && !isMoreOpen
                  ? 'text-white bg-emerald-600 px-3.5 py-1.5 -mt-3 shadow-md rounded-2xl'
                  : 'text-white bg-emerald-600 px-3.5 py-1.5 -mt-3 shadow-sm rounded-2xl opacity-90 hover:opacity-100'
              }`
            }
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="mt-0.5 leading-none">বেচা (POS)</span>
          </NavLink>
        )}

        {/* 3. 📒 খাতা */}
        <button
          type="button"
          onClick={() => {
            setIsMoreOpen(false);
            setIsKhataOpen(!isKhataOpen);
          }}
          className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            isKhataActive || isKhataOpen
              ? 'text-emerald-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="mt-1 leading-none">খাতা</span>
        </button>

        {/* 4. 📦 পণ্য */}
        {hasPermission('canManageProducts') && (
          <NavLink
            to="/products"
            onClick={() => {
              setIsKhataOpen(false);
              setIsMoreOpen(false);
            }}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                isActive && !isKhataOpen && !isMoreOpen
                  ? 'text-emerald-600 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Package className="w-4 h-4" />
            <span className="mt-1 leading-none">পণ্য</span>
          </NavLink>
        )}

        {/* 5. ☰ আরও */}
        <button
          type="button"
          onClick={() => {
            setIsKhataOpen(false);
            setIsMoreOpen(!isMoreOpen);
          }}
          className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            isMoreActive || isMoreOpen
              ? 'text-emerald-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MenuIcon className="w-4 h-4" />
          <span className="mt-1 leading-none">আরও</span>
        </button>
      </div>
    </>
  );
};
