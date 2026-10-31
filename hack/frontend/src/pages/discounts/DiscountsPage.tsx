import React, { useState, useEffect } from 'react';
import { Tag, Plus, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { Discount } from '../../types';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';

export const DiscountsPage: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('0');
  const [minQuantity, setMinQuantity] = useState('1');
  const [maxUsageCount, setMaxUsageCount] = useState('100');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/discounts');
      if (res.data?.success) setDiscounts(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/discounts/${id}/toggle-status`);
      fetchDiscounts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error toggling discount');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg(null);
    try {
      await api.post('/discounts', {
        name,
        code,
        discountType,
        discountValue: Number(discountValue),
        minPurchaseAmount: Number(minPurchaseAmount),
        minQuantity: Number(minQuantity),
        maxUsageCount: Number(maxUsageCount),
      });
      setIsModalOpen(false);
      setName('');
      setCode('');
      fetchDiscounts();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create discount');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Discount Coupons & Promotion Rules</h3>
          <p className="text-xs text-slate-500">Configure percentage or flat waivers with usage and order minimums</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create Discount Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">Loading discounts...</div>
        ) : (
          discounts.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-card transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-brand-700 px-2 py-0.5 bg-brand-50 rounded-lg">
                    {d.code}
                  </span>
                  <StatusBadge status={d.status} size="sm" />
                </div>
                <h4 className="font-bold text-base text-slate-900 mt-2">{d.name}</h4>
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold uppercase">{d.discountType}</span>
                  <span className="text-xl font-extrabold text-emerald-600 font-mono">
                    {d.discountType === 'PERCENTAGE' ? `${d.discountValue}% OFF` : `₹${d.discountValue} FLAT`}
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <p><span className="text-slate-400">Min Order:</span> <span className="font-semibold">₹{d.minPurchaseAmount}</span></p>
                  <p><span className="text-slate-400">Usage Limit:</span> <span className="font-semibold">{d.currentUsageCount} / {d.maxUsageCount || 'Unlimited'} uses</span></p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleToggleStatus(d.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    d.status === 'ACTIVE' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {d.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure Discount Coupon Rule">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">{errorMsg}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discount Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hackathon Early Bird"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. HACK20"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discount Type *</label>
              <select
                value={discountType}
                onChange={(e: any) => setDiscountType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discount Value *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Purchase Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={minPurchaseAmount}
                onChange={(e) => setMinPurchaseAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Usages Count</label>
              <input
                type="number"
                min="1"
                value={maxUsageCount}
                onChange={(e) => setMaxUsageCount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : 'Save Discount'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
