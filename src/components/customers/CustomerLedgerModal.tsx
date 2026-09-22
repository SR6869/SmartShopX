import React, { useState, useMemo, useRef } from 'react';
import { Customer, CustomerLedgerEntry } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { DataStore } from '../../services/dataStorage';
import {
  FileText,
  Printer,
  Calendar,
  CreditCard,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
} from 'lucide-react';

interface CustomerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onCollectDueClick?: (customer: Customer) => void;
  onSendReminderClick?: (customer: Customer) => void;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onCollectDueClick,
  onSendReminderClick,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);
  const shop = useMemo(() => DataStore.getShop(), []);

  if (!customer) return null;

  // Build full ledger entries (fallback from orders if customer.ledger is empty)
  const entries: CustomerLedgerEntry[] = useMemo(() => {
    if (customer.ledger && customer.ledger.length > 0) {
      return customer.ledger;
    }

    // Fallback: derive entries from Orders & Payments in DataStore
    const orders = DataStore.getOrders().filter((o) => o.customerId === customer.id);
    const payments = DataStore.getPayments().filter(
      (p) => p.customerOrSupplierName.toLowerCase() === customer.name.toLowerCase()
    );

    const synthetic: CustomerLedgerEntry[] = [];
    let currentBalance = 0;

    orders.forEach((o) => {
      currentBalance += o.dueAmount;
      synthetic.push({
        id: `synth_ord_${o.id}`,
        date: o.createdAt.split('T')[0],
        type: 'Sale',
        referenceId: o.orderNumber,
        debit: o.totalAmount,
        credit: o.paidAmount,
        discount: o.discount > 0 ? o.discount : undefined,
        balance: currentBalance,
        method: o.paymentMethod,
        notes: `বিক্রয় চালান #${o.orderNumber}`,
      });
    });

    return synthetic.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [customer]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (e.referenceId && e.referenceId.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          e.date.includes(q)
        );
      }
      return true;
    });
  }, [entries, filterType, search]);

  const creditLimit = customer.creditLimit || 0;
  const creditLimitUsage =
    creditLimit > 0 ? Math.min(100, Math.round((customer.totalDue / creditLimit) * 100)) : 0;
  const isOverLimit = creditLimit > 0 && customer.totalDue > creditLimit;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="গ্রাহকের ডিজিটাল খতিয়ান ও বাকি খাতা (Ledger Statement)"
      subtitle={`${customer.name} | মোবাইল: ${customer.mobile} ${
        customer.customerType ? `• ধরন: ${customer.customerType}` : ''
      }`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Printable Statement Sheet Container */}
        <div ref={printRef} className="space-y-4 print:p-6 print:text-black">
          {/* Shop and Customer Header (Visible for Print & UI) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 print:border-none print:p-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{shop.name || 'SmartShopX Store'}</h2>
                <p className="text-xs text-slate-500">
                  {shop.address || 'দোকান ঠিকানা'} | মোবাইল: {shop.mobile || '—'}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg print:border">
                  গ্রাহক খতিয়ান স্টেটমেন্ট
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  তারিখ: {new Date().toLocaleDateString('bn-BD')}
                </p>
              </div>
            </div>

            {/* Customer Details Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">গ্রাহকের নাম</span>
                <span className="font-bold text-slate-900">{customer.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">মোবাইল নম্বর</span>
                <span className="font-mono font-semibold text-slate-800">{customer.mobile}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ঠিকানা</span>
                <span className="text-slate-700 truncate block">{customer.address || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">গ্রাহক স্তর ও ধরন</span>
                <span className="font-medium text-slate-800">
                  {customer.customerType || 'খুচরা'} ({customer.tier || 'General'})
                </span>
              </div>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium block">মোট ক্রয় (Total)</span>
              <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                {formatCurrency(customer.totalPurchase)}
              </span>
              <span className="text-[10px] text-slate-400">{customer.ordersCount} টি চালান</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium block">মোট জমা (Paid)</span>
              <span className="text-base font-bold text-emerald-700 font-mono mt-0.5 block">
                {formatCurrency(customer.totalPaid)}
              </span>
              <span className="text-[10px] text-emerald-600">পরিশোধিত</span>
            </div>

            <div
              className={`p-3 rounded-xl border shadow-2xs ${
                customer.totalDue > 0
                  ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold block">বর্তমান বাকি (Current Due)</span>
                {customer.totalDue > 0 && customer.oldestDueDays ? (
                  <span className="text-[10px] px-1.5 py-0.5 bg-rose-200 text-rose-800 rounded font-medium">
                    {customer.oldestDueDays} দিন পুরনো
                  </span>
                ) : null}
              </div>
              <span className="text-base font-bold font-mono mt-0.5 block text-rose-700">
                {formatCurrency(customer.totalDue)}
              </span>
              <span className="text-[10px] text-slate-500">
                {customer.promiseDate ? `প্রতিশ্রুতি: ${customer.promiseDate}` : 'জের বাকি'}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium block">বাকি সীমা (Limit)</span>
                {isOverLimit && (
                  <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                    <ShieldAlert className="w-3 h-3" /> সীমা অতিক্রম!
                  </span>
                )}
              </div>
              <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">
                {creditLimit > 0 ? formatCurrency(creditLimit) : 'সীমাহীন'}
              </span>
              {creditLimit > 0 && (
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-full ${
                      isOverLimit ? 'bg-rose-600' : creditLimitUsage > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${creditLimitUsage}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Toolbar & Filters (Hidden on Print) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 print:hidden">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterType === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সকল লেনদেন ({entries.length})
              </button>
              <button
                onClick={() => setFilterType('Sale')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterType === 'Sale'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                বিক্রয় চালান
              </button>
              <button
                onClick={() => setFilterType('Due Collection')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterType === 'Due Collection'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                বকেয়া আদায়
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="মেমো বা বিবরণ..."
                  className="w-full pl-8 pr-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
                title="স্টেটমেন্ট প্রিন্ট করুন"
              >
                প্রিন্ট
              </Button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">তারিখ</th>
                    <th className="py-2.5 px-3">মেমো / রসিদ নং</th>
                    <th className="py-2.5 px-3">লেনদেনের ধরন ও বিবরণ</th>
                    <th className="py-2.5 px-3 text-right">বিক্রয় / দাবি (Debit)</th>
                    <th className="py-2.5 px-3 text-right">জমা (Credit)</th>
                    <th className="py-2.5 px-3 text-right">ছাড় (Waive)</th>
                    <th className="py-2.5 px-3 text-right">চলমান বাকি (Balance)</th>
                    <th className="py-2.5 px-3 text-center">মাধ্যম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 text-slate-600 font-mono whitespace-nowrap">
                          {item.date}
                        </td>

                        <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                          {item.referenceId || '—'}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            {item.type === 'Sale' ? (
                              <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <ArrowUpRight className="w-3 h-3" />
                              </span>
                            ) : item.type === 'Due Collection' ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <ArrowDownLeft className="w-3 h-3" />
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <FileText className="w-3 h-3" />
                              </span>
                            )}
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                {item.type === 'Sale'
                                  ? 'পণ্য বিক্রয় চালান'
                                  : item.type === 'Due Collection'
                                  ? 'বকেয়া টাকা জমা'
                                  : item.type === 'Discount Adjustment'
                                  ? 'বিশেষ ছাড়'
                                  : 'ওপেনিং হিসাব'}
                              </span>
                              {item.notes && (
                                <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                                  {item.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                          {item.debit > 0 ? formatCurrency(item.debit) : '—'}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                          {item.credit > 0 ? formatCurrency(item.credit) : '—'}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-amber-600">
                          {item.discount && item.discount > 0 ? formatCurrency(item.discount) : '—'}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 bg-rose-50/30">
                          {formatCurrency(item.balance)}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                            {item.method || 'Cash'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statement Footer Note for Customer */}
          <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>* এটি একটি কম্পিউটার জেনারেটেড ডিজিটাল খতিয়ান স্টেটমেন্ট।</span>
            <span className="font-semibold text-slate-700">
              সর্বমোট বকেয়া জের: {formatCurrency(customer.totalDue)}
            </span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 print:hidden">
          {customer.totalDue > 0 && onSendReminderClick && (
            <Button
              onClick={() => onSendReminderClick(customer)}
              variant="outline"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5 text-blue-600" />}
            >
              তাগাদা বার্তা পাঠান
            </Button>
          )}

          {customer.totalDue > 0 && onCollectDueClick && (
            <Button
              onClick={() => onCollectDueClick(customer)}
              variant="primary"
              size="sm"
              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
            >
              বকেয়া আদায় করুন
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={onClose}>
            বন্ধ করুন
          </Button>
        </div>
      </div>
    </Modal>
  );
};
