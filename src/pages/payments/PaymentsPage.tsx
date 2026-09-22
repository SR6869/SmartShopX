import React, { useState, useMemo } from 'react';
import { PaymentRecord, PaymentType, PaymentMethod } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { CreditCard, Plus, Search, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>(() => DataStore.getPayments());
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');

  // New Payment Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newType, setNewType] = useState<PaymentType>('Customer Payment');
  const [partyName, setPartyName] = useState('');
  const [amount, setAmount] = useState<number>(1000);
  const [method, setMethod] = useState<PaymentMethod>('bKash');
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (filterType !== 'all' && p.type !== filterType) return false;
      if (filterMethod !== 'all' && p.method !== filterMethod) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.customerOrSupplierName.toLowerCase().includes(q) ||
          p.reference.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [payments, search, filterType, filterMethod]);

  const totalInflow = useMemo(() => {
    return payments
      .filter((p) => p.type === 'Customer Payment' || p.type === 'Due Collection')
      .reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  const totalOutflow = useMemo(() => {
    return payments
      .filter((p) => p.type === 'Supplier Payment' || p.type === 'Supplier Due Pay')
      .reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim() || amount <= 0) {
      showToast('গ্রহীতা/প্রদানকারী এবং টাকার পরিমাণ আবশ্যক', 'warning');
      return;
    }

    const rec: PaymentRecord = {
      id: `pay_${Date.now()}`,
      orderId: undefined,
      type: newType,
      customerOrSupplierName: partyName.trim(),
      amount,
      method,
      reference: `TRX-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
    };

    const updated = [rec, ...payments];
    setPayments(updated);
    DataStore.setPayments(updated);
    setIsAddModalOpen(false);
    setPartyName('');
    setNotes('');
    showToast('পেমেন্ট লেনদেন সফলভাবে সংরক্ষণ করা হয়েছে', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">পেমেন্ট লেনদেন রেকর্ড</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            কাস্টমার ও সরবরাহকারীদের সকল অর্থ প্রাপ্তি ও পরিশোধের খতিয়ান
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          ম্যানুয়াল লেনদেন যোগ
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">মোট অর্থ প্রাপ্তি (Inflow)</span>
            <p className="text-2xl font-black font-mono text-emerald-700 mt-1">
              {formatCurrency(totalInflow)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">কাস্টমার বিক্রয় ও বকেয়া কালেকশন</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">মোট অর্থ প্রদান (Outflow)</span>
            <p className="text-2xl font-black font-mono text-rose-700 mt-1">
              {formatCurrency(totalOutflow)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">সাপ্লায়ার বিল ও পাওনা পরিশোধ</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম বা ট্রানজেকশন রেফারেন্স দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="all">সকল লেনদেন টাইপ</option>
          <option value="Customer Payment">কাস্টমার পেমেন্ট</option>
          <option value="Due Collection">বকেয়া আদায়</option>
          <option value="Supplier Payment">সাপ্লায়ার পেমেন্ট</option>
        </select>

        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="w-full sm:w-40 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="all">সকল মাধ্যম</option>
          <option value="Cash">ক্যাশ</option>
          <option value="bKash">বিকাশ</option>
          <option value="Nagad">নগদ</option>
          <option value="Bank">ব্যাংক</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">ব্যক্তি / প্রতিষ্ঠান</th>
                <th className="py-3 px-4">লেনদেন প্রকার (Type)</th>
                <th className="py-3 px-4">পেমেন্ট মাধ্যম</th>
                <th className="py-3 px-4">রেফারেন্স নং</th>
                <th className="py-3 px-4 text-right">টাকার পরিমাণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const isInflow = p.type === 'Customer Payment' || p.type === 'Due Collection';
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600">{formatDate(p.date)}</td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">
                        {p.customerOrSupplierName}
                      </span>
                      {p.notes && <span className="text-[11px] text-slate-400">{p.notes}</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                          isInflow
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {p.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">{p.method}</td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">{p.reference}</td>

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          isInflow ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isInflow ? '+' : '-'} {formatCurrency(p.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Payment Entry Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="ম্যানুয়াল পেমেন্ট লেনদেন যোগ করুন"
        maxWidth="sm"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              লেনদেনের ধরন *
            </label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as PaymentType)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="Customer Payment">কাস্টমার পেমেন্ট (Customer Payment)</option>
              <option value="Due Collection">বকেয়া আদায় (Due Collection)</option>
              <option value="Supplier Payment">সাপ্লায়ার দেনা পরিশোধ (Supplier Payment)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              গ্রাহক বা সাপ্লায়ারের নাম *
            </label>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="যেমন: সাকিব হাসান / ঢাকা ট্রেডার্স"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">টাকার পরিমাণ (৳) *</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="Cash">ক্যাশ</option>
              <option value="bKash">বিকাশ</option>
              <option value="Nagad">নগদ</option>
              <option value="Rocket">রকেট</option>
              <option value="Bank">ব্যাংক</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">নোট / রেফারেন্স</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: রসিদ নং / বিকাশ ট্রানজেকশন আইডি"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
