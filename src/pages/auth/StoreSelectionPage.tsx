import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import {
  Building2,
  Store,
  Plus,
  Check,
  ArrowRight,
  User,
  ShieldCheck,
  Sparkles,
  LogOut,
} from 'lucide-react';

export const StoreSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    shop,
    user,
    businesses,
    activeBusinessId,
    activeAccountMode,
    switchToBusiness,
    switchToPersonal,
    logout,
  } = useAuth();
  const { showToast } = useToast();

  const safeBusinesses = Array.isArray(businesses) ? businesses : [];

  const handleSelectStore = (storeId: string, storeName: string) => {
    switchToBusiness(storeId);
    showToast(`'${storeName}' দোকানে সফলভাবে সুইচ করা হয়েছে!`, 'success');
    navigate('/');
  };

  const handleSelectPersonal = () => {
    switchToPersonal();
    showToast('ব্যক্তিগত হিসাব মোডে সুইচ করা হয়েছে!', 'info');
    navigate('/personal');
  };

  const handleLogout = () => {
    logout();
    showToast('সফলভাবে লগআউট করা হয়েছে', 'info');
    navigate('/welcome');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="flex items-center justify-between pt-2 relative z-10 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="SmartShopX Logo"
            className="w-9 h-9 rounded-xl bg-white p-1 object-contain"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-base font-black text-white leading-none">SmartShopX</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">দোকান ও অ্যাকাউন্ট সিলেক্ট করুন</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>লগআউট</span>
        </button>
      </div>

      {/* Center Store Selector Container */}
      <div className="my-auto py-8 relative z-10 max-w-2xl mx-auto w-full">
        <div className="text-center mb-6">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold inline-flex items-center gap-1.5 mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>স্বাগতম, {user?.name || 'দোকানদার'}!</span>
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            আপনার দোকান সিলেক্ট করুন
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            আপনার নিবন্ধিত দোকানসমূহ বা শাখাগুলোর মধ্যে প্রবেশ করুন
          </p>
        </div>

        {/* Store List Grid */}
        <div className="space-y-3">
          {safeBusinesses.map((biz) => {
            const isCurrent = activeAccountMode === 'business' && biz.id === activeBusinessId;
            return (
              <div
                key={biz.id}
                onClick={() => handleSelectStore(biz.id, biz.name)}
                className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                  isCurrent
                    ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500/80 shadow-lg ring-1 ring-emerald-500/40'
                    : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                      isCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                    }`}
                  >
                    <Store className="w-6 h-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-white truncate">{biz.name}</h3>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          সক্রিয়
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {biz.category} • <span className="text-indigo-400 font-medium">{biz.template || 'Standard'}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <Button
                    type="button"
                    variant={isCurrent ? 'primary' : 'outline'}
                    size="md"
                    className={
                      isCurrent
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold'
                        : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    }
                  >
                    <span>প্রবেশ করুন</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Business / Setup Button */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('/setup')}
            variant="outline"
            size="md"
            leftIcon={<Plus className="w-4 h-4 text-emerald-400" />}
            className="w-full sm:flex-1 border-dashed border-emerald-500/50 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/30 font-bold"
          >
            নতুন দোকান বা শাখা খুলুন
          </Button>

          <Button
            onClick={handleSelectPersonal}
            variant="outline"
            size="md"
            leftIcon={<User className="w-4 h-4 text-amber-400" />}
            className="w-full sm:flex-1 border-slate-800 bg-slate-900 text-amber-300 hover:bg-slate-800 font-bold"
          >
            ব্যক্তিগত হিসাব মোড
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-500 pb-2 relative z-10">
        SmartShopX Multi-Tenant Engine • প্রতিটি দোকানের হিসাব সম্পূর্ণ আইসোলেটেড ও সুরক্ষিত
      </div>
    </div>
  );
};
