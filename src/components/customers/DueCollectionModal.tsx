import React, { useState } from 'react';
import { Customer, PaymentMethod } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { customerService, DueCollectionReceipt } from '../../services/customerService';
import { useToast } from '../../context/ToastContext';
import { DataStore } from '../../services/dataStorage';
import {
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  Receipt,
  FileCheck,
  Building,
} from 'lucide-react';

interface DueCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess: () => void;
}

export const DueCollectionModal: React.FC<DueCollectionModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const shop = DataStore.getShop();

  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [receiptNumber, setReceiptNumber] = useState<string>(
    () => `MR-${Date.now().toString().slice(-6)}`
  );
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Success Receipt view
  const [generatedReceipt, setGeneratedReceipt] = useState<DueCollectionReceipt | null>(null);

  // Sync initial state when customer changes
  React.useEffect(() => {
    if (customer) {
      setCollectAmount(customer.totalDue);
      setDiscountAmount(0);
      setReceiptNumber(`MR-${Date.now().toString().slice(-6)}`);
      setNotes('');
      setGeneratedReceipt(null);
    }
  }, [customer]);

  if (!customer) return null;

  const totalDeduction = (collectAmount || 0) + (discountAmount || 0);
  const remainingDue = Math.max(0, customer.totalDue - totalDeduction);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (collectAmount <= 0 && discountAmount <= 0) {
      showToast('আদায়ের পরিমাণ বা ছাড়ের টাকা প্রদান করুন', 'warning');
      return;
    }

    if (totalDeduction > customer.totalDue) {
      showToast('আদায় ও ছাড়ের মোট যোগফল বর্তমান বকেয়ার চেয়ে বেশি হতে পারে না', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const { receipt } = await customerService.collectDue({
        customerId: customer.id,
        amount: collectAmount,
        discountAdjusted: discountAmount,
        method: paymentMethod,
        receiptNumber,
        notes: notes.trim() || 'বকেয়া খাতা হতে আদায়',
      });

      setGeneratedReceipt(receipt);
      onSuccess();
      showToast(`${customer.name} এর ৳${collectAmount} বকেয়া আদায় রেকর্ড হয়েছে`, 'success');
    } catch {
      showToast('বকেয়া সংগ্রহ করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={generatedReceipt ? 'টাকা আদায়ের মানি রিসিট (Money Receipt)' : 'বকেয়া আদায় ও হিসাব সমন্বয়'}
      subtitle={
        generatedReceipt
          ? `রসিদ নং: ${generatedReceipt.receiptNumber}`
          : `গ্রাহক: ${customer.name} (মোবাইল: ${customer.mobile})`
      }
      maxWidth="md"
    >
      {generatedReceipt ? (
        /* Printable Money Receipt View */
        <div className="space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs print:p-6 print:border-none print:shadow-none space-y-4">
            {/* Receipt Header */}
            <div className="text-center border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">{shop.name || 'SmartShopX Store'}</h2>
              <p className="text-xs text-slate-500">{shop.address || 'দোকান ঠিকানা'}</p>
              <span className="inline-block mt-1 px-3 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200">
                টাকা আদায়ের মানি রিসিট (Money Receipt)
              </span>
            </div>

            {/* Receipt Details */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">রসিদ নম্বর:</span>
                <span className="font-mono font-bold text-slate-800">
                  {generatedReceipt.receiptNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">তারিখ:</span>
                <span className="font-mono text-slate-800">{generatedReceipt.date}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">গ্রাহকের নাম:</span>
                <span className="font-bold text-slate-900">{generatedReceipt.customerName}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">মোবাইল:</span>
                <span className="font-mono text-slate-800">{generatedReceipt.customerMobile}</span>
              </div>
            </div>

            {/* Calculation Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/70">
                    <td className="py-2 px-3 text-slate-600">পূর্ববর্তী মোট বকেয়া</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                      {formatCurrency(generatedReceipt.previousDue)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/40">
                    <td className="py-2 px-3 text-emerald-800 font-semibold">
                      নগদ আদায়কৃত টাকা ({generatedReceipt.method})
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                      (-) {formatCurrency(generatedReceipt.collectedAmount)}
                    </td>
                  </tr>
                  {generatedReceipt.discountAdjusted > 0 && (
                    <tr className="bg-amber-50/40">
                      <td className="py-2 px-3 text-amber-800 font-medium">বিশেষ ছাড় / সমন্বয়</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">
                        (-) {formatCurrency(generatedReceipt.discountAdjusted)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-slate-100/70 font-bold">
                    <td className="py-2.5 px-3 text-slate-900">অবশিষ্ট বকেয়া ব্যালেন্স</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                      {formatCurrency(generatedReceipt.newDue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {generatedReceipt.notes && (
              <p className="text-[11px] text-slate-500 italic">
                মন্তব্য: {generatedReceipt.notes}
              </p>
            )}

            {/* Signatures */}
            <div className="flex justify-between pt-6 text-[11px] text-slate-400">
              <div className="border-t border-slate-300 pt-1 text-center w-28">গ্রাহকের স্বাক্ষর</div>
              <div className="border-t border-slate-300 pt-1 text-center w-28">
                আদায়কারীর স্বাক্ষর
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintReceipt}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              রসিদ প্রিন্ট করুন
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              সম্পন্ন
            </Button>
          </div>
        </div>
      ) : (
        /* Form for Collection */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Due Highlight */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-rose-600 font-semibold block">বর্তমান মোট বকেয়া</span>
              <span className="text-xl font-bold font-mono text-rose-700">
                {formatCurrency(customer.totalDue)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCollectAmount(customer.totalDue);
                setDiscountAmount(0);
              }}
              className="px-2.5 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-100 cursor-pointer shadow-2xs"
            >
              সম্পূর্ণ বকেয়া
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Collected Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                আদায়ের পরিমাণ (৳) *
              </label>
              <input
                type="number"
                min={0}
                max={customer.totalDue}
                value={collectAmount || ''}
                onChange={(e) => setCollectAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Special Waiver / Discount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                বিশেষ ছাড় / সমন্বয় (৳)
              </label>
              <input
                type="number"
                min={0}
                max={customer.totalDue - (collectAmount || 0)}
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                placeholder="যেমন: ৫০ বা ১০০"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পেমেন্ট মাধ্যম *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Cash">নগদ টাকা (Cash)</option>
                <option value="bKash">বিকাশ (bKash)</option>
                <option value="Nagad">নগদ (Nagad)</option>
                <option value="Rocket">রকেট (Rocket)</option>
                <option value="Bank">ব্যাংক ট্রান্সফার (Bank)</option>
                <option value="Other">চেক বা অন্যান্য</option>
              </select>
            </div>

            {/* Receipt Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                মানি রিসিট নম্বর
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              আদায়ের বিবরণ বা মন্তব্য
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: দোকানে এসে নগদ পরিশোধ করলেন..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Balance Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
            <span className="text-slate-600 font-medium">আদায় ও ছাড় বাদে অবশিষ্ট বকেয়া:</span>
            <span
              className={`font-mono font-bold text-sm ${
                remainingDue > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {formatCurrency(remainingDue)}
            </span>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              leftIcon={<CreditCard className="w-4 h-4" />}
            >
              {isSubmitting ? 'প্রসেসিং...' : 'আদায় নিশ্চিত করুন ও রসিদ প্রস্তুত করুন'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
