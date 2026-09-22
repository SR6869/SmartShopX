import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import {
  ShoppingCart,
  BookOpen,
  Boxes,
  Truck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Store,
  CheckCircle2,
  Lock,
  UserPlus,
} from 'lucide-react';

export const WelcomeSplashPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const handleDemoTrial = async () => {
    try {
      const res = await authService.login({ mobile: '01711002233', password: 'demo' });
      login(res.token, res.user, res.shop);
      showToast('ডেমো অ্যাকাউন্টে প্রবেশ করা হয়েছে! আপনার দোকান সিলেক্ট করুন।', 'success');
      navigate('/select-store');
    } catch {
      showToast('ডেমো লগইন ব্যর্থ হয়েছে', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Header */}
      <div className="flex items-center justify-between pt-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="SmartShopX Logo"
            className="w-10 h-10 rounded-xl bg-white p-1 object-contain shadow-md"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">
              SmartShopX
            </h1>
            <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
              Smart Choice, Better Life
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ভার্সন ২.৫ • প্রোডাকশন
        </span>
      </div>

      {/* Center Hero Section */}
      <div className="my-auto py-8 relative z-10 max-w-xl mx-auto text-center">
        {/* Splash Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold mb-5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>বাংলাদেশের সবচেয়ে বিশ্বস্ত ডিজিটাল বিজনেস প্ল্যাটফর্ম</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
          আপনার ব্যবসার হিসাব ও ডিজিটাল কেনাবেচা{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
            এক ছাতার নিচে
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 mt-3 max-w-md mx-auto leading-relaxed">
          কাউন্টার পিওএস (POS), বকেয়া বাকির খাতা, ইনভেন্টরি, কুরিয়ার ট্র্যাকিং এবং অনলাইন ক্যাটালগ পরিচালনা করুন সম্পূর্ণ ডিজিটাল মাধ্যমে।
        </p>

        {/* Core Feature Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-8 text-left">
          {[
            { icon: ShoppingCart, label: 'কাউন্টার POS', desc: 'দ্রুত ইনভয়েস প্রিন্টিং', color: 'text-emerald-400' },
            { icon: BookOpen, label: 'বাকির খাতা', desc: 'অটো এসএমএস তাগাদা', color: 'text-amber-400' },
            { icon: Boxes, label: 'ইনভেন্টরি', desc: 'স্টক ও এক্সপায়ারি ট্র্যাকিং', color: 'text-sky-400' },
            { icon: Truck, label: 'কুরিয়ার বুকিং', desc: 'Steadfast ও Pathao', color: 'text-purple-400' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xs"
              >
                <Icon className={`w-5 h-5 ${item.color} mb-1.5`} />
                <h3 className="text-xs font-bold text-white leading-tight">{item.label}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA & Onboarding Action Buttons */}
      <div className="space-y-3 relative z-10 max-w-md mx-auto w-full pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Button
            onClick={() => navigate('/login')}
            variant="primary"
            size="lg"
            leftIcon={<Lock className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/50 cursor-pointer w-full"
          >
            লগইন করুন
          </Button>

          <Button
            onClick={() => navigate('/register')}
            variant="secondary"
            size="lg"
            leftIcon={<UserPlus className="w-4 h-4 text-emerald-400" />}
            className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold cursor-pointer w-full"
          >
            নতুন রেজিস্ট্রেশন
          </Button>
        </div>

        {/* Demo Fast Trial Option */}
        <button
          onClick={handleDemoTrial}
          type="button"
          className="w-full py-2.5 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>১-ক্লিকে ফ্রি ডেমো ট্রায়াল দেখুন</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
          ১০০% সুরক্ষিত ক্লাউড ডাটা এনক্রিপশন ও মাল্টি-টেন্যান্ট সিকিউরিটি
        </p>
      </div>
    </div>
  );
};
