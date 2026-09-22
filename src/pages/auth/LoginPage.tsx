import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { isValidBdMobile } from '../../utils/validation';
import { Phone, Lock, Sparkles, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [mobile, setMobile] = useState('01711002233');
  const [password, setPassword] = useState('password123');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidBdMobile(mobile)) {
      setError('সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01711002233)');
      return;
    }

    if (authMethod === 'password' && !password) {
      setError('পাসওয়ার্ড প্রদান করুন');
      return;
    }

    if (authMethod === 'otp' && otp.length < 4) {
      setError('৪ বা ৬ ডিজিটের ওটিপি (OTP) প্রদান করুন');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.login({
        mobile,
        password: authMethod === 'password' ? password : undefined,
        otp: authMethod === 'otp' ? otp : undefined,
      });
      login(res.token, res.user, res.shop);
      showToast(`স্বাগতম, ${res.user.name}! দোকান সিলেক্ট করে ড্যাশবোর্ডে প্রবেশ করুন।`, 'success');
      navigate('/select-store');
    } catch (err: any) {
      setError(err.message || 'লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const res = await authService.login({ mobile: '01711002233', password: 'demo' });
      login(res.token, res.user, res.shop);
      showToast('ডেমো অ্যাকাউন্টে সফলভাবে প্রবেশ করা হয়েছে', 'success');
      navigate('/select-store');
    } catch {
      showToast('লগইন ব্যর্থ হয়েছে', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="SmartShopX Logo"
            className="inline-block w-16 h-16 rounded-2xl object-contain shadow-md mb-2 bg-white p-1 border border-slate-100"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">SmartShopX</h1>
          <p className="text-xs text-slate-500 mt-0.5">Smart Choice, Better Life • ক্লাউড পিওএস ও একাউন্টিং</p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('password');
              setError('');
            }}
            className={`flex-1 py-2 font-medium rounded-lg transition-all cursor-pointer ${
              authMethod === 'password'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            পাসওয়ার্ড দিয়ে লগইন
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('otp');
              setError('');
            }}
            className={`flex-1 py-2 font-medium rounded-lg transition-all cursor-pointer ${
              authMethod === 'otp'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            OTP ওটিপি দিয়ে লগইন
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              মোবাইল নম্বর
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono"
                required
              />
            </div>
          </div>

          {authMethod === 'password' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">পাসওয়ার্ড</label>
                <button
                  type="button"
                  onClick={() => showToast('পাসওয়ার্ড রিসেট ওটিপি এসএমএস আকারে পাঠানো হবে', 'info')}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ওটিপি কোড (OTP)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="৪ বা ৬ ডিজিট কোড"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono tracking-widest text-center"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                টেস্টিংয়ের জন্য যেকোনো ৪ বা ৬ সংখ্যার কোড দিন (যেমন: 1234)
              </p>
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
            লগইন করুন
          </Button>
        </form>

        {/* Demo Fast Login */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <Button
            type="button"
            onClick={handleDemoLogin}
            variant="outline"
            size="md"
            className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            leftIcon={<Sparkles className="w-4 h-4 text-emerald-600" />}
          >
            ১-ক্লিকে ডেমো টেস্ট একাউন্টে লগইন
          </Button>
        </div>

        {/* Registration Link */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-600">
            নতুন ব্যবসা নিবন্ধন করতে চান?{' '}
            <Link to="/register" className="text-emerald-600 font-bold hover:underline">
              অ্যাকাউন্ট তৈরি করুন
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
