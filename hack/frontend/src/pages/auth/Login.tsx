import React, { useState } from 'react';
import { Sparkles, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
  onNavigateRegister: () => void;
  onNavigateForgot: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateRegister, onNavigateForgot }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@brightloop.io');
  const [password, setPassword] = useState('Brightloop@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Brightloop@2026');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 shadow-md shadow-brand-500/20 text-white mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Sign in to Bright<span className="text-brand-600">loop</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enterprise Subscription Lifecycle & Automated Billing Cloud
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-3xl shadow-float border border-slate-200/80">
          {/* Quick Demo Credentials Switcher for Evaluators */}
          <div className="mb-6 p-3.5 bg-brand-50/70 border border-brand-200/80 rounded-2xl">
            <span className="text-[10px] font-bold text-brand-800 uppercase tracking-wider block mb-2">
              ⚡ Quick Fill Demo Credentials:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => fillCredentials('admin@brightloop.io')}
                className="py-1.5 px-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition shadow-xs"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('rohan.mehra@brightloop.io')}
                className="py-1.5 px-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('customer@brightloop.io')}
                className="py-1.5 px-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs"
              >
                Customer
              </button>
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block text-center">
              Password for all accounts: <code className="font-mono font-bold text-slate-700">Brightloop@2026</code>
            </span>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={onNavigateForgot}
                  className="text-brand-600 hover:text-brand-700 font-semibold text-[11px]"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs hover:opacity-95 shadow-sm transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign in to Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Need a customer account?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
              >
                Register as Customer
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
