import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BusinessCategory } from '../../types';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { DataStore } from '../../services/dataStorage';
import { getPresetCatalogForCategory } from '../../services/mockData';
import {
  ShoppingBag,
  Shirt,
  Smartphone,
  Tv,
  Pill,
  Utensils,
  Sparkles,
  BookOpen,
  Wrench,
  Armchair,
  Cookie,
  Fish,
  Scissors,
  Printer,
  Store,
  HelpCircle,
  PlusCircle,
  Building2,
  CheckCircle2,
  Search,
  PackageCheck,
  Footprints,
  Gem,
  Sprout,
  Truck,
  X,
  CheckSquare,
  Square,
  Check,
} from 'lucide-react';

export const BusinessSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { shop, updateShop, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  // Multi-selection categories state initialized with current shop categories or primary category
  const [selectedCategories, setSelectedCategories] = useState<BusinessCategory[]>(() => {
    if (shop.categories && shop.categories.length > 0) {
      return shop.categories;
    }
    if (shop.category) {
      return [shop.category];
    }
    return ['Mobile, Telecom & Gadgets'];
  });

  const [customCategory, setCustomCategory] = useState(shop.customCategory || '');
  const [shopName, setShopName] = useState(
    shop.name && shop.name !== 'আমার স্মার্ট শপ' ? shop.name : 'আমার স্মার্ট শপ'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'retail' | 'fashion' | 'food' | 'tech' | 'service'>('all');
  const [seedPresetCatalog, setSeedPresetCatalog] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const categories: {
    id: BusinessCategory;
    title: string;
    subtitle: string;
    group: 'retail' | 'fashion' | 'food' | 'tech' | 'service';
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'Mobile, Telecom & Gadgets',
      title: '📱 মোবাইল, টেলিকম ও গ্যাজেট',
      subtitle: 'Mobile, Telecom & Gadgets',
      group: 'tech',
      icon: Smartphone,
    },
    {
      id: 'Grocery & Essentials',
      title: '🛒 মুদি ও নিত্যপ্রয়োজনীয় পণ্য',
      subtitle: 'Grocery & Essentials',
      group: 'retail',
      icon: ShoppingBag,
    },
    {
      id: 'Fashion & Apparel',
      title: '👕 পোশাক ও ফ্যাশন',
      subtitle: 'Fashion & Apparel',
      group: 'fashion',
      icon: Shirt,
    },
    {
      id: 'Electronics & Home Appliances',
      title: '📺 ইলেকট্রনিক্স ও হোম অ্যাপ্লায়েন্স',
      subtitle: 'Electronics & Home Appliances',
      group: 'tech',
      icon: Tv,
    },
    {
      id: 'Pharmacy & Medicine',
      title: '💊 ফার্মেসি ও ঔষধালয়',
      subtitle: 'Pharmacy & Medicine',
      group: 'retail',
      icon: Pill,
    },
    {
      id: 'Restaurant, Cafe & Fast Food',
      title: '🍽️ রেস্তোরাঁ, ক্যাফে ও ফাস্টফুড',
      subtitle: 'Restaurant, Cafe & Fast Food',
      group: 'food',
      icon: Utensils,
    },
    {
      id: 'Footwear & Leather',
      title: '👟 জুতা ও লেদার পণ্য',
      subtitle: 'Footwear & Leather Goods',
      group: 'fashion',
      icon: Footprints,
    },
    {
      id: 'Cosmetics & Beauty',
      title: '💄 কসমেটিকস ও বিউটি',
      subtitle: 'Cosmetics & Beauty Care',
      group: 'fashion',
      icon: Sparkles,
    },
    {
      id: 'Books & Stationery',
      title: '📚 বই ও স্টেশনারি',
      subtitle: 'Books & Stationery Supplies',
      group: 'retail',
      icon: BookOpen,
    },
    {
      id: 'Hardware & Sanitary',
      title: '🔧 হার্ডওয়্যার ও স্যানিটারি',
      subtitle: 'Hardware, Fittings & Sanitary',
      group: 'retail',
      icon: Wrench,
    },
    {
      id: 'Furniture',
      title: '🛋️ ফার্নিচার ও আসবাবপত্র',
      subtitle: 'Furniture & Woodwork',
      group: 'retail',
      icon: Armchair,
    },
    {
      id: 'Sweets & Bakery',
      title: '🍰 মিষ্টি ও বেকারি',
      subtitle: 'Sweets, Bakery & Confectionery',
      group: 'food',
      icon: Cookie,
    },
    {
      id: 'Fresh Market, Fish & Meat',
      title: '🐟 কাঁচাবাজার, মাছ ও মাংস',
      subtitle: 'Fresh Raw Market, Fish & Meat',
      group: 'food',
      icon: Fish,
    },
    {
      id: 'Salon & Beauty',
      title: '✂️ সেলুন ও বিউটি পার্লার',
      subtitle: 'Salon, Spa & Beauty Care',
      group: 'service',
      icon: Scissors,
    },
    {
      id: 'Tailoring, Boutique & Fabric',
      title: '🪡 দর্জি, বুটিক ও কাপড়',
      subtitle: 'Tailoring, Boutique & Fabrics',
      group: 'fashion',
      icon: Scissors,
    },
    {
      id: 'Auto, Bike & Parts',
      title: '🛞 অটো, বাইক ও যন্ত্রাংশ',
      subtitle: 'Auto, Bike Parts & Mechanics',
      group: 'tech',
      icon: Truck,
    },
    {
      id: 'Agro, Poultry & Feed',
      title: '🌾 কৃষি, পোল্ট্রি ও ফিড',
      subtitle: 'Agro, Fertilizers, Poultry & Feed',
      group: 'retail',
      icon: Sprout,
    },
    {
      id: 'Jewelry & Gold',
      title: '💎 জুয়েলারি ও স্বর্ণালংকার',
      subtitle: 'Jewelry & Gold Ornaments',
      group: 'fashion',
      icon: Gem,
    },
    {
      id: 'Printing, Photocopy & Digital Press',
      title: '🖨️ প্রিন্টিং, ফটোকপি ও ডিজিটাল প্রেস',
      subtitle: 'Printing, Photocopy & Digital Press',
      group: 'service',
      icon: Printer,
    },
    {
      id: 'Super Shop & Departmental Store',
      title: '🏢 সুপার শপ ও ডিপার্টমেন্টাল স্টোর',
      subtitle: 'Super Shop & Departmental Mart',
      group: 'retail',
      icon: Store,
    },
    {
      id: 'Custom Business',
      title: '➕ কাস্টম ব্যবসা',
      subtitle: 'Custom Business Type',
      group: 'service',
      icon: PlusCircle,
    },
    {
      id: 'Other Business & Services',
      title: '🌐 অন্যান্য ব্যবসা ও সেবা',
      subtitle: 'Other Business & Commercial Services',
      group: 'service',
      icon: HelpCircle,
    },
  ];

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch =
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'all' || cat.group === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [categories, searchQuery, activeTab]);

  const toggleCategory = (catId: BusinessCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        // Unselect
        return prev.filter((c) => c !== catId);
      } else {
        // Select
        return [...prev, catId];
      }
    });
  };

  const handleClose = () => {
    if (isAuthenticated) {
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      showToast('দোকানের নাম লিখুন', 'warning');
      return;
    }
    if (selectedCategories.length === 0) {
      showToast('কমপক্ষে ১টি ক্যাটাগরি নির্বাচন করুন', 'warning');
      return;
    }
    const hasCustom = selectedCategories.includes('Custom Business') || selectedCategories.includes('Custom Category' as any);
    if (hasCustom && !customCategory.trim()) {
      showToast('কাস্টম ক্যাটাগরির নাম লিখুন', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const primaryCat = selectedCategories[0];
      const updated = await authService.completeBusinessSetup(
        selectedCategories,
        hasCustom ? customCategory : undefined,
        shopName.trim()
      );
      updateShop(updated);

      // Seed preset catalog if checked
      if (seedPresetCatalog) {
        const catName = hasCustom ? customCategory : primaryCat;
        const presetItems = getPresetCatalogForCategory(catName);
        if (presetItems && presetItems.length > 0) {
          DataStore.setProducts(presetItems, updated.id);
        }
      }

      showToast('আপনার ব্যবসার সেটআপ সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করছেন...', 'success');
      navigate('/');
    } catch {
      showToast('সেটআপ সম্পন্ন করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const isCustomSelected =
    selectedCategories.includes('Custom Business') ||
    selectedCategories.includes('Custom Category' as any);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-800 flex flex-col justify-between relative overflow-x-hidden">
      {/* Fixed White Header with Title & Close (X) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-2xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Choose Business Category
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold font-mono">
              {selectedCategories.length} Selected
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            ব্যবসার ধরন নির্বাচন করুন (মাল্টি-সিলেকশন সাপোর্ট)
          </p>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200/60"
          title="বন্ধ করুন (Close)"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-28">
        <form id="business-setup-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Shop Name Input Container */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              দোকান বা ব্যবসা প্রতিষ্ঠানের নাম (Shop Name) *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="যেমন: স্মার্ট ফ্যাশন অ্যান্ড গ্যাজেট"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              />
            </div>
          </div>

          {/* Search & Filter Toolbar Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ক্যাটাগরি খুঁজুন (যেমন: মুদি, শার্ট)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
              </div>

              {/* Group Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 text-xs scrollbar-none">
                {[
                  { id: 'all', label: 'সবগুলো (২২)' },
                  { id: 'retail', label: 'রিটেইল শপ' },
                  { id: 'fashion', label: 'ফ্যাশন ও জুতা' },
                  { id: 'tech', label: 'গ্যাজেট ও আইটি' },
                  { id: 'food', label: 'খাদ্য ও রেস্তোরাঁ' },
                  { id: 'service', label: 'সেবা' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      activeTab === tab.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category List Rows with Checkboxes */}
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 border-t border-slate-100 pt-2">
              {filteredCategories.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  কোনো ক্যাটাগরি পাওয়া যায়নি। কাস্টম ব্যবসা নির্বাচন করুন।
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isChecked = selectedCategories.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-3.5 my-1 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isChecked
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="truncate">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
                            {cat.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                            {cat.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Checkbox Icon */}
                      <div className="shrink-0 pl-2">
                        {isChecked ? (
                          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg border-2 border-slate-300 bg-white" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Custom Category Input if selected */}
          {isCustomSelected && (
            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                আপনার কাস্টম ক্যাটাগরি নাম লিখুন *
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="যেমন: লেদার গুডস ও ফুটওয়্যার"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              />
            </div>
          )}

          {/* Seed Sample Catalog Option */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={seedPresetCatalog}
                onChange={(e) => setSeedPresetCatalog(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ক্যাটাগরি অনুযায়ী জনপ্রিয় পণ্য ১-ক্লিকে যোগ করুন</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  সেটআপ শেষে ক্যাটালগে কিছু প্রস্তুত নমুনা পণ্য যুক্ত থাকবে যা আপনি পরিবর্তন করতে পারবেন
                </p>
              </div>
            </label>
          </div>
        </form>
      </main>

      {/* Fixed Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 p-3 sm:p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs hidden sm:block">
            <span className="font-bold text-slate-800">
              {selectedCategories.length} টি ক্যাটাগরি নির্বাচিত
            </span>
            <p className="text-[11px] text-slate-500">
              {selectedCategories.length > 0
                ? `প্রাইমারি: ${selectedCategories[0]}`
                : 'কমপক্ষে ১টি ক্যাটাগরি বেছে নিন'}
            </p>
          </div>

          <Button
            type="submit"
            form="business-setup-form"
            variant="primary"
            size="md"
            isLoading={isLoading}
            disabled={selectedCategories.length === 0}
            className="w-full sm:w-auto px-8 shadow-md"
          >
            সম্পন্ন করুন (Done - {selectedCategories.length}) &rarr;
          </Button>
        </div>
      </footer>
    </div>
  );
};
