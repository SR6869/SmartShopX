import React, { useState, useEffect } from 'react';
import {
  Menu,
  ShoppingCart,
  Globe,
  UserCheck,
  LogOut,
  ExternalLink,
  ChevronDown,
  Bell,
  Sparkles,
  Cloud,
  Shield,
  Wifi,
  WifiOff,
  RefreshCw,
  Headset,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { CloudSyncModal } from '../common/CloudSyncModal';
import { BusinessSwitcher } from '../common/BusinessSwitcher';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { offlineSyncService } from '../../services/offlineSyncService';
import { UserRole } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenHelpline?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenHelpline }) => {
  const { user, shop, role, switchRole, language, setLanguage, logout } = useAuth();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [profileOpen, setProfileOpen] = useState(false);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(() => offlineSyncService.getPendingCount());

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe(() => {
      setPendingSyncCount(offlineSyncService.getPendingCount());
    });
    return unsubscribe;
  }, []);

  const roleLabels: Record<UserRole, { label: string; badge: string }> = {
    owner: { label: 'মালিক (Owner)', badge: 'bg-emerald-100 text-emerald-800' },
    manager: { label: 'ম্যানেজার (Manager)', badge: 'bg-indigo-100 text-indigo-800' },
    cashier: { label: 'ক্যাশিয়ার (Cashier)', badge: 'bg-amber-100 text-amber-800' },
    stock_keeper: { label: 'স্টক কিপার (Stock)', badge: 'bg-purple-100 text-purple-800' },
    staff: { label: 'স্টাফ (Staff)', badge: 'bg-slate-100 text-slate-800' },
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
        {/* Left section: Hamburger & Store / Account Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors lg:hidden cursor-pointer"
            title="মেনু খুলুন"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Business & Personal Account Switcher */}
          <BusinessSwitcher variant="header" />

          <div className="hidden xl:flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {shop.category}
            </span>
            <div className="h-4 w-px bg-slate-200" />
            <a
              href={`#/online-store`}
              className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"
              title="আপনার অনলাইন স্টোর লিংক"
            >
              <span>smartshopx.store/{shop.storeSlug}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Right section: Quick POS, Role Switcher, Language & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Sync / Offline Status Pill */}
          <button
            onClick={() => setCloudModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              !isOnline
                ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800'
                : pendingSyncCount > 0
                ? 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-800'
                : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
            }`}
            title={
              !isOnline
                ? 'ইন্টারনেট বিচ্ছিন্ন: অফলাইন মোডে সংরক্ষিত হচ্ছে'
                : pendingSyncCount > 0
                ? `${pendingSyncCount} টি ডাটা ক্লাউডে সিঙ্ক হচ্ছে`
                : 'ক্লাউড ডাটাবেজের সাথে সম্পূর্ণ সিঙ্কড ও নিরাপদ'
            }
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden md:inline">অফলাইন সেভড</span>
              </>
            ) : pendingSyncCount > 0 ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                <span className="hidden md:inline">সিঙ্ক হচ্ছে ({pendingSyncCount})</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">ক্লাউড সুরক্ষিত</span>
              </>
            )}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton compact={true} />

          {/* Smart Helpline Button */}
          <button
            type="button"
            onClick={onOpenHelpline}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-2xs group"
            title="২৪/৭ স্মার্ট হেল্পলাইন ও সাপোর্ট সেন্টার"
          >
            <span className="relative flex items-center justify-center">
              <Headset className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </span>
            <span className="hidden md:inline">হেল্পলাইন</span>
          </button>

          {/* Quick POS action */}
          <Button
            onClick={() => navigate('/pos')}
            variant="primary"
            size="sm"
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            className="shadow-emerald-100"
          >
            <span className="hidden sm:inline">দ্রুত বিক্রয়</span>
            <span className="sm:hidden">POS</span>
          </Button>

          {/* Role Preview Switcher Dropdown */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <Shield className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <select
              value={role}
              onChange={(e) => switchRole(e.target.value as UserRole)}
              className="bg-transparent text-slate-800 font-semibold text-xs border-none focus:outline-none cursor-pointer py-0.5 pr-2"
              title="ভূমিকা বা রোল পরিবর্তন করুন"
            >
              <option value="owner">মালিক (Full Access)</option>
              <option value="manager">ম্যানেজার (Manager)</option>
              <option value="cashier">ক্যাশিয়ার (Sales POS)</option>
              <option value="stock_keeper">স্টক কিপার (Inventory)</option>
            </select>
          </div>

          {/* Language switch */}
          <button
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="ভাষা পরিবর্তন"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold">{language === 'bn' ? 'বাং' : 'EN'}</span>
          </button>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">{roleLabels[role]?.label || 'রোল'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-30 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{user?.mobile}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>প্ল্যান: {shop.subscriptionPlan}</span>
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${roleLabels[role]?.badge}`}>
                        {role}
                      </span>
                    </div>
                  </div>

                  <div className="p-1">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        if (onOpenHelpline) onOpenHelpline();
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Headset className="w-4 h-4 text-emerald-600" />
                      <span>স্মার্ট হেল্পলাইন ও সাপোর্ট</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setCloudModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Cloud className="w-4 h-4 text-emerald-600" />
                      <span>ক্লাউড সিঙ্ক ও ব্যাকআপ</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      <span>দোকান প্রোফাইল ও সেটিংস</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/subscription');
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      <span>প্যাকেজ ও সাবস্ক্রিপশন</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1 p-1">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>লগ আউট</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Role Notice Banner when role !== 'owner' */}
      {role !== 'owner' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between sticky top-16 z-20 shadow-2xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              আপনি বর্তমানে <strong>{roleLabels[role]?.label}</strong> রোলে আছেন। এই রোলের নির্ধারিত সীমিত অ্যাক্সেস সক্রিয় রয়েছে।
            </span>
          </div>
          <button
            onClick={() => switchRole('owner')}
            className="text-[11px] font-bold text-amber-900 underline hover:text-amber-700 ml-2 shrink-0 cursor-pointer"
          >
            মালিক রোলে ফিরুন
          </button>
        </div>
      )}

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
      />
    </>
  );
};
