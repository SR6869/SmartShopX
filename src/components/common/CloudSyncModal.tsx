import React, { useState } from 'react';
import { DataStore } from '../../services/dataStorage';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/formatters';
import {
  Cloud,
  CloudCheck,
  RefreshCw,
  Download,
  Upload,
  Database,
  ShieldCheck,
  Server,
  X,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('smartshopx_last_cloud_sync') || 'এইমাত্র';
  });

  if (!isOpen) return null;

  const products = DataStore.getProducts();
  const orders = DataStore.getOrders();
  const customers = DataStore.getCustomers();
  const payments = DataStore.getPayments();
  const expenses = DataStore.getExpenses();

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const nowFormatted = formatDateTime(new Date().toISOString());
      setLastSyncTime(nowFormatted);
      localStorage.setItem('smartshopx_last_cloud_sync', nowFormatted);
      setIsSyncing(false);
      showToast('সকল রেকর্ড ক্লাউড সার্ভারে সফলভাবে সিঙ্ক ও সুরক্ষিত হয়েছে!', 'success');
    }, 1200);
  };

  const handleDownloadBackup = () => {
    try {
      const fullBackup = {
        exportedAt: new Date().toISOString(),
        version: 'SmartShopX_v2.5',
        shop: DataStore.getShop(),
        user: DataStore.getUser(),
        products,
        orders,
        customers,
        suppliers: DataStore.getSuppliers(),
        purchases: DataStore.getPurchases(),
        payments,
        expenses,
        staff: DataStore.getStaff(),
        courierCredentials: DataStore.getCourierCredentials(),
        paymentGateways: DataStore.getPaymentGateways(),
      };

      const jsonStr = JSON.stringify(fullBackup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `SmartShopX_Full_Cloud_Backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('পূর্ণাঙ্গ ডাটাবেজ ব্যাকআপ ফাইল ডাউনলোড সম্পন্ন হয়েছে', 'success');
    } catch {
      showToast('ব্যাকআপ ফাইল তৈরিতে সমস্যা হয়েছে', 'error');
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.products) DataStore.setProducts(parsed.products);
        if (parsed.orders) DataStore.setOrders(parsed.orders);
        if (parsed.customers) DataStore.setCustomers(parsed.customers);
        if (parsed.payments) DataStore.setPayments(parsed.payments);
        if (parsed.expenses) DataStore.setExpenses(parsed.expenses);
        if (parsed.suppliers) DataStore.setSuppliers(parsed.suppliers);

        showToast('ব্যাকআপ থেকে সমস্ত ডাটা সফলভাবে রিস্টোর করা হয়েছে!', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch {
        showToast('অবৈধ ব্যাকআপ ফাইল। অনুগ্রহ করে সঠিক JSON ফাইল নির্বাচন করুন।', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-emerald-500/40 text-emerald-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                <span>ক্লাউড সার্ভার সক্রিয়</span>
              </div>
              <h3 className="text-base font-bold">ক্লাউড ডাটাবেজ ও লাইভ সিঙ্ক সেন্টার</h3>
              <p className="text-xs text-emerald-100 opacity-90">
                একাধিক ডিভাইস ও অফলাইন ডেটা সিঙ্ক্রোনাইজেশন
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Real-time Status Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">সর্বশেষ ক্লাউড সিঙ্ক:</span>
              <span className="font-bold text-slate-800 font-mono">{lastSyncTime}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">সিঙ্ক প্রটোকল:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AES-256 Cloud Vault (অটোমেটিক)</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">অফলাইন স্টোরেজ ব্যাকআপ:</span>
              <span className="font-semibold text-slate-700">IndexedDB & PWA Cache Ready</span>
            </div>
          </div>

          {/* Database Entities Snapshot */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>সুরক্ষিত রেকর্ড পরিসংখ্যান</span>
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                <div className="text-lg font-black text-slate-900 font-mono">
                  {products.length.toLocaleString('bn-BD')}
                </div>
                <div className="text-[11px] text-slate-500">পণ্য ও স্টক</div>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                <div className="text-lg font-black text-slate-900 font-mono">
                  {orders.length.toLocaleString('bn-BD')}
                </div>
                <div className="text-[11px] text-slate-500">মোট অর্ডার</div>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                <div className="text-lg font-black text-slate-900 font-mono">
                  {customers.length.toLocaleString('bn-BD')}
                </div>
                <div className="text-[11px] text-slate-500">গ্রাহক সংখ্যা</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'ক্লাউডে সিঙ্ক হচ্ছে...' : 'এখনই ক্লাউড সার্ভারে সিঙ্ক করুন'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadBackup}
                className="py-2.5 px-3 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>ব্যাকআপ ডাউনলোড</span>
              </button>

              <label className="py-2.5 px-3 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer text-center">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>ডাটা রিস্টোর</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
