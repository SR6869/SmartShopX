import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DataStore } from '../../services/dataStorage';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import {
  Store,
  ExternalLink,
  Globe,
  Copy,
  Eye,
  Settings,
  ShoppingBag,
  Sparkles,
  Share2,
} from 'lucide-react';

export const OnlineStorePage: React.FC = () => {
  const { shop, updateShop } = useAuth();
  const { showToast } = useToast();
  const [products] = useState<Product[]>(() => DataStore.getProducts());

  const [isPublished, setIsPublished] = useState(shop.storePublished);
  const [primaryColor, setPrimaryColor] = useState('#059669');
  const [bannerUrl, setBannerUrl] = useState(
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80'
  );
  const [storeNotice, setStoreNotice] = useState(
    'সকল অর্ডারে নিশ্চিত ফাস্ট হোম ডেলিভারি এবং ক্যাশ অন ডেলিভারি সুবিধা!'
  );
  const [facebookLink, setFacebookLink] = useState('https://facebook.com/smartshopx');
  const [whatsappNumber, setWhatsappNumber] = useState(shop.mobile);

  const publicStoreUrl = `${window.location.origin}/#/store/${shop.storeSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicStoreUrl);
    showToast('অনলাইন স্টোরের লিংক ক্লিপবোর্ডে কপি করা হয়েছে', 'success');
  };

  const handleTogglePublish = () => {
    const nextState = !isPublished;
    setIsPublished(nextState);
    const updated = { ...shop, storePublished: nextState };
    updateShop(updated);
    showToast(
      nextState ? 'অনলাইন স্টোর সফলভাবে লাইভ পাবলিশ করা হয়েছে!' : 'অনলাইন স্টোর ড্রাফট করা হয়েছে',
      nextState ? 'success' : 'info'
    );
  };

  const onlineProducts = products.filter((p) => p.onlineStoreVisible && p.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">অনলাইন স্টোর সেটিংস ও প্রিভিউ</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            আপনার ফেসবুক পেজ ও গ্রাহকদের জন্য নিজস্ব ই-কমার্স ক্যাটালগ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleTogglePublish}
            variant={isPublished ? 'success' : 'outline'}
            size="md"
          >
            {isPublished ? '● স্টোর লাইভ (Published)' : '○ ড্রাফট (Unpublished)'}
          </Button>

          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="md"
            leftIcon={<Copy className="w-4 h-4" />}
          >
            লিংক কপি
          </Button>
        </div>
      </div>

      {/* Store Link Banner */}
      <div className="bg-emerald-950 text-emerald-100 rounded-3xl p-5 sm:p-6 border border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300">আপনার পাবলিক স্টোর এড্রেস</span>
          </div>
          <p className="font-mono text-white text-base sm:text-lg font-bold truncate">
            {publicStoreUrl}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => window.open(publicStoreUrl, '_blank')}
            variant="primary"
            size="sm"
            leftIcon={<ExternalLink className="w-4 h-4" />}
          >
            নতুন ট্যাবে দেখুন
          </Button>
        </div>
      </div>

      {/* Main Layout: Left settings form, Right Live Device Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Settings Form */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-600" />
            <span>স্টোর ব্র্যান্ডিং ও কাস্টমাইজেশন</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              হিরো ব্যানার ইমেজ লিংক (Banner Image URL)
            </label>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              স্টোর ঘোষণা / অফার টেক্সট (Notice Bar)
            </label>
            <input
              type="text"
              value={storeNotice}
              onChange={(e) => setStoreNotice(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                থিম কালার (Primary Brand Color)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                />
                <span className="font-mono text-xs text-slate-600">{primaryColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                হোয়াটসঅ্যাপ অর্ডার নম্বর
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ফেসবুক পেজ লিংক (Facebook Page Link)
            </label>
            <input
              type="url"
              value={facebookLink}
              onChange={(e) => setFacebookLink(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2">
            <Button
              onClick={() => showToast('অনলাইন স্টোর সেটিংস সফলভাবে সেভ করা হয়েছে!', 'success')}
              variant="primary"
              size="md"
              className="w-full"
            >
              সেটিংস সেভ করুন
            </Button>
          </div>
        </div>

        {/* Live Device Preview (Mobile/Web Mockup) */}
        <div className="lg:col-span-6 bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-xl text-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono text-slate-400 ml-2">গ্রাহক প্রিভিউ (Customer View)</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">লাইভ ভিউ</span>
          </div>

          {/* Embedded Store Frame */}
          <div className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 max-w-sm mx-auto">
            {/* Top Announcement */}
            <div
              style={{ backgroundColor: primaryColor }}
              className="py-1 px-2 text-[10px] text-white text-center font-medium truncate"
            >
              {storeNotice}
            </div>

            {/* Store Nav */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  style={{ backgroundColor: primaryColor }}
                  className="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs"
                >
                  SX
                </div>
                <div>
                  <h4 className="font-bold text-xs leading-tight">{shop.name}</h4>
                  <p className="text-[10px] text-slate-400">{shop.category}</p>
                </div>
              </div>
              <ShoppingBag className="w-4 h-4 text-slate-600" />
            </div>

            {/* Banner */}
            <div className="relative h-28 bg-slate-100">
              <img
                src={bannerUrl}
                alt="Banner"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                <span className="text-white text-xs font-bold">সেরা অফার ও নতুন কালেকশন</span>
              </div>
            </div>

            {/* Products grid */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">পণ্য তালিকা ({onlineProducts.length})</span>
                <span className="text-[10px] text-emerald-600 font-semibold">সকল পণ্য</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {onlineProducts.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="border border-slate-100 rounded-xl p-1.5 flex flex-col justify-between"
                  >
                    <div className="aspect-square rounded-lg bg-slate-50 overflow-hidden mb-1">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[11px] font-mono font-black text-emerald-700 mt-0.5">
                      {formatCurrency(p.sellingPrice - p.discount)}
                    </p>
                    <button
                      style={{ backgroundColor: primaryColor }}
                      className="mt-1 w-full py-1 text-[10px] text-white font-semibold rounded-md"
                    >
                      অর্ডার করুন
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
