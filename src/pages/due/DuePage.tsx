import React, { useState, useMemo } from 'react';
import { Customer, Supplier } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { customerService } from '../../services/customerService';
import { supplierService } from '../../services/supplierService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { CustomerLedgerModal } from '../../components/customers/CustomerLedgerModal';
import { DueCollectionModal } from '../../components/customers/DueCollectionModal';
import { DueReminderModal } from '../../components/customers/DueReminderModal';
import { VoiceDialerModal } from '../../components/voice/VoiceDialerModal';
import {
  Scale,
  CreditCard,
  Send,
  Search,
  PhoneCall,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  Building,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export const DuePage: React.FC = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>(() => DataStore.getCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => DataStore.getSuppliers());

  const [activeTab, setActiveTab] = useState<'customer_due' | 'supplier_due'>('customer_due');
  const [search, setSearch] = useState('');
  const [agingFilter, setAgingFilter] = useState<'All' | '0-30' | '31-60' | '61-90' | '90+'>('All');

  // Modals for Customer Management
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isVoiceDialerOpen, setIsVoiceDialerOpen] = useState(false);

  // Supplier Pay Modal
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);

  const refreshData = () => {
    setCustomers(DataStore.getCustomers());
    setSuppliers(DataStore.getSuppliers());
  };

  // Total sums
  const totalCustomerDue = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);
  }, [customers]);

  const totalSupplierPayable = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.totalPayable || 0), 0);
  }, [suppliers]);

  // Aging Analysis Calculations for Customers
  const agingStats = useMemo(() => {
    let b1 = { count: 0, sum: 0 }; // 0-30 days
    let b2 = { count: 0, sum: 0 }; // 31-60 days
    let b3 = { count: 0, sum: 0 }; // 61-90 days
    let b4 = { count: 0, sum: 0 }; // 90+ days

    customers
      .filter((c) => c.totalDue > 0)
      .forEach((c) => {
        const days = c.oldestDueDays || 0;
        if (days <= 30) {
          b1.count++;
          b1.sum += c.totalDue;
        } else if (days <= 60) {
          b2.count++;
          b2.sum += c.totalDue;
        } else if (days <= 90) {
          b3.count++;
          b3.sum += c.totalDue;
        } else {
          b4.count++;
          b4.sum += c.totalDue;
        }
      });

    return { b1, b2, b3, b4 };
  }, [customers]);

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => c.totalDue > 0)
      .filter((c) => {
        const days = c.oldestDueDays || 0;
        if (agingFilter === '0-30' && days > 30) return false;
        if (agingFilter === '31-60' && (days <= 30 || days > 60)) return false;
        if (agingFilter === '61-90' && (days <= 60 || days > 90)) return false;
        if (agingFilter === '90+' && days <= 90) return false;

        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          (c.address && c.address.toLowerCase().includes(q))
        );
      });
  }, [customers, search, agingFilter]);

  const filteredSuppliers = useMemo(() => {
    return suppliers
      .filter((s) => s.totalPayable > 0)
      .filter((s) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          s.companyName.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.mobile.includes(q)
        );
      });
  }, [suppliers, search]);

  const handlePaySupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || payAmount <= 0) return;

    try {
      await supplierService.paySupplier(
        selectedSupplier.id,
        payAmount,
        'Bank',
        'বকেয়া খাতা হতে দেনা পরিশোধ'
      );
      refreshData();
      setIsPayModalOpen(false);
      showToast(`${selectedSupplier.companyName} কে ৳${payAmount} পরিশোধ সম্পন্ন হয়েছে`, 'success');
    } catch {
      showToast('পরিশোধ করতে সমস্যা হয়েছে', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">বকেয়া ও দেনা-পাওনা খাতা</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            গ্রাহকদের নিকট প্রাপ্য বাকি (Aging Analysis সহ) এবং সরবরাহকারীদের দেয় দেনার কেন্দ্রীয় হিসাব
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('customer_due')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'customer_due'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            গ্রাহক বকেয়া (পাওনা: {formatCurrency(totalCustomerDue)})
          </button>
          <button
            onClick={() => setActiveTab('supplier_due')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'supplier_due'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            সাপ্লায়ার দেনা ({formatCurrency(totalSupplierPayable)})
          </button>
        </div>
      </div>

      {/* Aging Analysis Cards (Shown on Customer Due Tab) */}
      {activeTab === 'customer_due' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>বকেয়ার বয়স ভিত্তিক বিশ্লেষণ (Due Aging Analysis)</span>
            </span>
            {agingFilter !== 'All' && (
              <button
                onClick={() => setAgingFilter('All')}
                className="text-[11px] text-emerald-600 hover:underline font-medium"
              >
                ফিল্টার রিসেট করুন
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 0-30 Days */}
            <button
              type="button"
              onClick={() => setAgingFilter(agingFilter === '0-30' ? 'All' : '0-30')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                agingFilter === '0-30'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}
            >
              <span className="text-[11px] font-semibold text-emerald-700 block">০-৩০ দিন (স্বাভাবিক)</span>
              <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
                {formatCurrency(agingStats.b1.sum)}
              </span>
              <span className="text-[10px] text-slate-500">{agingStats.b1.count} জন গ্রাহক</span>
            </button>

            {/* 31-60 Days */}
            <button
              type="button"
              onClick={() => setAgingFilter(agingFilter === '31-60' ? 'All' : '31-60')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                agingFilter === '31-60'
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 hover:border-amber-300'
              }`}
            >
              <span className="text-[11px] font-semibold text-amber-700 block">৩১-৬০ দিন (সতর্কতা)</span>
              <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
                {formatCurrency(agingStats.b2.sum)}
              </span>
              <span className="text-[10px] text-slate-500">{agingStats.b2.count} জন গ্রাহক</span>
            </button>

            {/* 61-90 Days */}
            <button
              type="button"
              onClick={() => setAgingFilter(agingFilter === '61-90' ? 'All' : '61-90')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                agingFilter === '61-90'
                  ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-500/20'
                  : 'bg-white border-slate-200 hover:border-orange-300'
              }`}
            >
              <span className="text-[11px] font-semibold text-orange-700 block">৬১-৯০ দিন (উচ্চ ঝুঁকি)</span>
              <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
                {formatCurrency(agingStats.b3.sum)}
              </span>
              <span className="text-[10px] text-slate-500">{agingStats.b3.count} জন গ্রাহক</span>
            </button>

            {/* 90+ Days */}
            <button
              type="button"
              onClick={() => setAgingFilter(agingFilter === '90+' ? 'All' : '90+')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                agingFilter === '90+'
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200 hover:border-rose-300'
              }`}
            >
              <span className="text-[11px] font-semibold text-rose-700 block">৯০+ দিন (অনাদায়ী/খেলাপি)</span>
              <span className="text-base font-bold font-mono text-rose-700 mt-1 block">
                {formatCurrency(agingStats.b4.sum)}
              </span>
              <span className="text-[10px] text-rose-600 font-medium">{agingStats.b4.count} জন গ্রাহক</span>
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'customer_due'
                ? 'বাকিদার কাস্টমারের নাম বা মোবাইল দিয়ে খুঁজুন...'
                : 'সাপ্লায়ার বা প্রতিষ্ঠানের নাম দিয়ে খুঁজুন...'
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Customer Due List */}
      {activeTab === 'customer_due' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                  <th className="py-3 px-4">গ্রাহকের নাম ও মোবাইল</th>
                  <th className="py-3 px-4">ধরন ও ঠিকানা</th>
                  <th className="py-3 px-4">মোট ক্রয়</th>
                  <th className="py-3 px-4">বকেয়ার পরিমাণ</th>
                  <th className="py-3 px-4">বকেয়ার বয়স (Aging)</th>
                  <th className="py-3 px-4">পরিশোধের প্রতিশ্রুতি</th>
                  <th className="py-3 px-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      কোনো বকেয়া রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const days = c.oldestDueDays || 0;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{c.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{c.mobile}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-medium block w-fit mb-0.5">
                            {c.customerType || 'খুচরা'}
                          </span>
                          <span className="text-slate-600 text-[11px] max-w-[140px] truncate block">
                            {c.address || '—'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                          {formatCurrency(c.totalPurchase)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 text-sm">
                            {formatCurrency(c.totalDue)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              days > 60
                                ? 'bg-rose-100 text-rose-800'
                                : days > 30
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {days > 0 ? `${days} দিন পুরনো` : 'সাম্প্রতিক'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {c.promiseDate ? (
                            <div>
                              <span className="text-purple-700 font-medium text-[11px] block">
                                📅 {c.promiseDate}
                              </span>
                              {c.reminderNotes && (
                                <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">
                                  {c.reminderNotes}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">নির্ধারিত নেই</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Ledger */}
                            <button
                              onClick={() => {
                                setSelectedCustomer(c);
                                setIsLedgerModalOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                              title="খতিয়ান স্টেটমেন্ট দেখুন"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {/* Reminder */}
                            <Button
                              onClick={() => {
                                setSelectedCustomer(c);
                                setIsReminderModalOpen(true);
                              }}
                              variant="outline"
                              size="sm"
                              leftIcon={<Send className="w-3.5 h-3.5 text-blue-600" />}
                            >
                              তাগাদা
                            </Button>

                            {/* Voice Call */}
                            <Button
                              onClick={() => {
                                setSelectedCustomer(c);
                                setIsVoiceDialerOpen(true);
                              }}
                              variant="outline"
                              size="sm"
                              leftIcon={<PhoneCall className="w-3.5 h-3.5 text-emerald-600" />}
                            >
                              ভয়েস কল
                            </Button>

                            {/* Collect */}
                            <Button
                              onClick={() => {
                                setSelectedCustomer(c);
                                setIsCollectModalOpen(true);
                              }}
                              variant="primary"
                              size="sm"
                              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                            >
                              আদায়
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Supplier Payable List */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                  <th className="py-3 px-4">সরবরাহকারী প্রতিষ্ঠান</th>
                  <th className="py-3 px-4">যোগাযোগ</th>
                  <th className="py-3 px-4">মোট ক্রয় চালান</th>
                  <th className="py-3 px-4">দেনার পরিমাণ</th>
                  <th className="py-3 px-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      কোনো সাপ্লায়ার দেনা নেই!
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{s.companyName}</span>
                        <span className="text-[11px] text-slate-400">{s.address}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-800 font-medium block">{s.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{s.mobile}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {formatCurrency(s.totalPurchase)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 text-sm">
                          {formatCurrency(s.totalPayable)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Button
                          onClick={() => {
                            setSelectedSupplier(s);
                            setPayAmount(s.totalPayable);
                            setIsPayModalOpen(true);
                          }}
                          variant="danger"
                          size="sm"
                          leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                        >
                          দেনা পরিশোধ
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Modals */}
      <CustomerLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        customer={selectedCustomer}
        onCollectDueClick={(c) => {
          setIsLedgerModalOpen(false);
          setSelectedCustomer(c);
          setIsCollectModalOpen(true);
        }}
        onSendReminderClick={(c) => {
          setIsLedgerModalOpen(false);
          setSelectedCustomer(c);
          setIsReminderModalOpen(true);
        }}
      />

      <DueCollectionModal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={refreshData}
      />

      <DueReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={refreshData}
      />

      <VoiceDialerModal
        isOpen={isVoiceDialerOpen}
        onClose={() => setIsVoiceDialerOpen(false)}
        customer={selectedCustomer}
        callType="due_reminder"
        onCallCompleted={refreshData}
      />

      {/* Supplier Pay Modal */}
      {selectedSupplier && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title="সরবরাহকারী দেনা পরিশোধ"
          subtitle={`প্রতিষ্ঠান: ${selectedSupplier.companyName} (মোট দেনা: ৳${selectedSupplier.totalPayable})`}
          maxWidth="sm"
        >
          <form onSubmit={handlePaySupplierSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পরিশোধের পরিমাণ (৳) *
              </label>
              <input
                type="number"
                min={1}
                max={selectedSupplier.totalPayable}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPayModalOpen(false)}
              >
                বাতিল
              </Button>
              <Button type="submit" variant="danger" size="sm">
                পরিশোধ নিশ্চিত করুন
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
