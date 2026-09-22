import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  ShoppingBag,
  Package,
  Boxes,
  Users,
  Truck,
  FileSpreadsheet,
  CreditCard,
  Scale,
  Store,
  Compass,
  Send,
  ShieldAlert,
  BarChart3,
  Settings,
  Sparkles,
  HelpCircle,
  X,
  XCircle,
  FileText,
  RotateCcw,
  Zap,
  Wallet,
  PiggyBank,
  PhoneCall,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { BusinessSwitcher } from '../common/BusinessSwitcher';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHelpline?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenHelpline }) => {
  const { shop, hasPermission, activeAccountMode, activeBusinessId, switchToBusiness } = useAuth();

  const businessNavItems = [
    {
      to: '/',
      label: 'ড্যাশবোর্ড',
      icon: LayoutDashboard,
      allowed: true,
    },
    {
      to: '/pos',
      label: 'পিওএস (POS)',
      icon: ShoppingCart,
      badge: 'সেলস',
      badgeColor: 'bg-emerald-500 text-white',
      allowed: hasPermission('canCreateSale'),
    },
    {
      to: '/sales',
      label: 'বিক্রয় হিস্ট্রি',
      icon: Receipt,
      allowed: hasPermission('canViewSales'),
    },
    {
      to: '/orders',
      label: 'অর্ডারসমূহ',
      icon: ShoppingBag,
      allowed: hasPermission('canManageOrders'),
    },
    {
      to: '/incomplete-orders',
      label: 'অসম্পূর্ণ অর্ডার',
      icon: XCircle,
      allowed: hasPermission('canManageOrders'),
    },
    {
      to: '/invoices',
      label: 'চালান ও ইনভয়েস',
      icon: FileText,
      allowed: true,
    },
    {
      to: '/returns',
      label: 'রিটার্ন ও এক্সচেঞ্জ',
      icon: RotateCcw,
      allowed: true,
    },
    {
      to: '/telecom',
      label: 'টেলিকম ও রিচার্জ',
      icon: Zap,
      badge: 'মোবাইল',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
      allowed: true,
    },
    {
      to: '/products',
      label: 'পণ্য ব্যবস্থাপনা',
      icon: Package,
      allowed: hasPermission('canManageProducts'),
    },
    {
      to: '/inventory',
      label: 'ইনভেন্টরি ও স্টক',
      icon: Boxes,
      allowed: hasPermission('canManageProducts'),
    },
    {
      to: '/customers',
      label: 'গ্রাহক তালিকা',
      icon: Users,
      allowed: hasPermission('canManageCustomers'),
    },
    {
      to: '/suppliers',
      label: 'সরবরাহকারী',
      icon: Truck,
      allowed: true,
    },
    {
      to: '/purchases',
      label: 'ক্রয় চালান',
      icon: FileSpreadsheet,
      allowed: true,
    },
    {
      to: '/payments',
      label: 'পেমেন্ট ব্যবস্থাপনা',
      icon: CreditCard,
      allowed: hasPermission('canManagePayments'),
    },
    {
      to: '/due',
      label: 'বকেয়া ও দেনা-পাওনা',
      icon: Scale,
      allowed: hasPermission('canManagePayments'),
    },
    {
      to: '/voice-calls',
      label: 'এআই ভয়েস কল ও তাগাদা',
      icon: PhoneCall,
      badge: 'অটো কল',
      badgeColor: 'bg-emerald-500 text-white',
      allowed: hasPermission('canManageCustomers'),
    },
    {
      to: '/online-store',
      label: 'অনলাইন স্টোর',
      icon: Store,
      badge: shop.storePublished ? 'লাইভ' : 'ড্রাফট',
      badgeColor: shop.storePublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700',
      allowed: true,
    },
    {
      to: '/landing-pages',
      label: 'ল্যান্ডিং পেজ',
      icon: Compass,
      allowed: true,
    },
    {
      to: '/courier',
      label: 'কুরিয়ার ট্র্যাকিং',
      icon: Send,
      allowed: true,
    },
    {
      to: '/risk-analysis',
      label: 'কাস্টমার রিস্ক ও ফ্রড',
      icon: ShieldAlert,
      allowed: true,
    },
    {
      to: '/personal',
      label: 'ব্যক্তিগত হিসাব',
      icon: Wallet,
      badge: 'ব্যক্তিগত',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      allowed: true,
    },
    {
      to: '/reports',
      label: 'রিপোর্ট ও অ্যানালিটিক্স',
      icon: BarChart3,
      allowed: hasPermission('canViewReports'),
    },
    {
      to: '/settings',
      label: 'ব্যবসার সেটিংস',
      icon: Settings,
      allowed: true,
    },
    {
      to: '/subscription',
      label: 'সাবস্ক্রিপশন প্ল্যান',
      icon: Sparkles,
      badge: shop.subscriptionPlan,
      badgeColor: 'bg-indigo-100 text-indigo-800 font-semibold',
      allowed: true,
    },
  ];

  const personalNavItems = [
    {
      to: '/personal',
      label: 'ব্যক্তিগত ড্যাশবোর্ড',
      icon: LayoutDashboard,
      allowed: true,
    },
    {
      to: '/personal?tab=transactions',
      label: 'আয় ও ব্যয় তালিকা',
      icon: Wallet,
      badge: 'ক্যাশ',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      allowed: true,
    },
    {
      to: '/personal?tab=savings',
      label: 'ডিপিএস ও সঞ্চয় খাতা',
      icon: PiggyBank,
      badge: 'সঞ্চয়',
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
      allowed: true,
    },
    {
      to: '/personal?tab=budgets',
      label: 'মাসিক বাজেট প্ল্যানার',
      icon: FileSpreadsheet,
      badge: 'বাজেট',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40',
      allowed: true,
    },
    {
      to: '/personal?tab=due',
      label: 'ব্যক্তিগত ধার ও ঋণ',
      icon: Scale,
      badge: 'দেনা-পাওনা',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      allowed: true,
    },
    {
      to: '/personal?tab=reports',
      label: 'ব্যক্তিগত আর্থিক রিপোর্ট',
      icon: BarChart3,
      allowed: true,
    },
  ];

  const navItems = activeAccountMode === 'personal' ? personalNavItems : businessNavItems;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="SmartShopX Logo"
              className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 shadow-sm shrink-0 border border-slate-700"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white tracking-tight">SmartShopX</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                  Client
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                {activeAccountMode === 'personal' ? 'ব্যক্তিগত খাতা' : shop.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business & Account Switcher in Sidebar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
          <BusinessSwitcher variant="sidebar" />
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {navItems
            .filter((item) => item.allowed)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className="w-4 h-4 shrink-0 opacity-90" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

          {activeAccountMode === 'personal' && (
            <div className="p-3 mt-4 bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-800/80 rounded-xl text-center">
              <p className="text-xs text-emerald-300 font-semibold mb-1.5">দোকান পরিচালনা করবেন?</p>
              <button
                onClick={() => {
                  switchToBusiness(activeBusinessId || 'shop_101');
                  onClose();
                }}
                className="w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                🏢 ব্যবসা মোডে ফিরুন
              </button>
            </div>
          )}
        </nav>

        {/* Footer Support Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <PWAInstallButton variant="sidebar" />

          <button
            type="button"
            onClick={() => {
              if (onOpenHelpline) {
                onOpenHelpline();
                onClose();
              }
            }}
            className="w-full text-left bg-slate-800/80 hover:bg-slate-800 p-3 rounded-xl border border-slate-700/80 text-xs transition-all cursor-pointer group shadow-xs block"
          >
            <div className="flex items-center justify-between text-slate-200 font-semibold mb-1">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400 group-hover:animate-bounce" />
                <span className="group-hover:text-emerald-300 transition-colors">স্মার্ট হেল্পলাইন</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">২৪/৭ কাস্টমার ও টেকনিক্যাল সাপোর্ট</p>
            <p className="font-mono text-emerald-400 text-xs mt-1 font-semibold flex items-center justify-between">
              <span>01836-686869</span>
              <span className="text-[10px] text-slate-400 group-hover:text-white underline">সহায়তা নিন &rarr;</span>
            </p>
          </button>
        </div>
      </aside>
    </>
  );
};
