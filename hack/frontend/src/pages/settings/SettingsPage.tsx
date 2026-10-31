import React, { useState } from 'react';
import { Settings, Shield, Bell, Key, Database, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl text-xs">
      {saved && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configuration saved successfully.</span>
        </div>
      )}

      {/* System info */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">System & Organization Settings</h3>
            <p className="text-slate-500">Configure corporate identity, default currency, and invoicing parameters</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Organization Name</label>
              <input
                type="text"
                defaultValue="Brightloop Technologies Inc."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate GSTIN</label>
              <input
                type="text"
                defaultValue="27AABCB1234F1Z5"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Currency</label>
              <select defaultValue="INR" className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold">
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Payment Grace Period (Days)</label>
              <input
                type="number"
                defaultValue="15"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
            >
              Save Parameters
            </button>
          </div>
        </form>
      </div>

      {/* Gateway & Webhooks */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Payment Gateway Credentials (Razorpay Test Mode)</h3>
            <p className="text-slate-500">Active test key and secret configuration for payment simulations</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Razorpay Key ID</label>
            <input
              type="text"
              readOnly
              defaultValue="rzp_test_brightloop_demo_key"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-600"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Razorpay Key Secret</label>
            <input
              type="password"
              readOnly
              defaultValue="••••••••••••••••••••••••••••••••"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
