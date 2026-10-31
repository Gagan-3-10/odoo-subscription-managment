import React, { useState, useEffect } from 'react';
import { Layers, Plus, Check, X, Calendar, RefreshCw, AlertCircle, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { Plan, Product } from '../../types';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';

export const PlansPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [freqFilter, setFreqFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [productId, setProductId] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [billingFrequency, setBillingFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [minQuantity, setMinQuantity] = useState('1');
  const [pauseAllowed, setPauseAllowed] = useState(true);
  const [earlyCancellation, setEarlyCancellation] = useState(true);
  const [autoClose, setAutoClose] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const [pRes, prodRes] = await Promise.all([
        api.get('/plans', { params: { frequency: freqFilter } }),
        api.get('/products'),
      ]);
      if (pRes.data?.success) setPlans(pRes.data.data || []);
      if (prodRes.data?.success) setProducts(prodRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [freqFilter]);

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/plans/${id}/toggle-status`);
      fetchPlans();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg(null);
    try {
      await api.post('/plans', {
        name,
        code,
        productId,
        description,
        basePrice: Number(basePrice),
        billingFrequency,
        minQuantity: Number(minQuantity),
        pauseAllowed,
        earlyCancellation,
        autoClose,
      });
      setIsModalOpen(false);
      // Reset
      setName('');
      setCode('');
      setBasePrice('');
      fetchPlans();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create plan');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'MONTHLY', 'YEARLY', 'WEEKLY', 'DAILY'].map((freq) => (
            <button
              key={freq}
              onClick={() => setFreqFilter(freq)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
                freqFilter === freq
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {freq === 'ALL' ? 'All Frequencies' : freq}
            </button>
          ))}
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              if (products.length > 0 && !productId) setProductId(products[0].id);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Create Plan
          </button>
        )}
      </div>

      {/* Plan Comparison Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Loading subscription plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No plans available for this billing frequency.
          </div>
        ) : (
          plans.map((p) => {
            const isYearly = p.billingFrequency === 'YEARLY';
            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border transition relative flex flex-col justify-between overflow-hidden ${
                  isYearly
                    ? 'border-brand-300 ring-1 ring-brand-400/30 shadow-card'
                    : 'border-slate-200/80 shadow-soft hover:shadow-card'
                } p-6`}
              >
                {isYearly && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-brand-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Annual Saver
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                      {p.code}
                    </span>
                    <StatusBadge status={p.status} size="sm" />
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 mt-2">{p.name}</h3>
                  <p className="text-xs text-brand-600 font-semibold">{p.product?.name}</p>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2">{p.description || 'Standard subscription tier.'}</p>

                  {/* Price display */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900">₹{p.basePrice.toLocaleString('en-IN')}</span>
                    <span className="text-xs font-semibold text-slate-400">/{p.billingFrequency.toLowerCase()}</span>
                  </div>

                  {/* Feature checklist */}
                  <div className="mt-5 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>Min Order Quantity: {p.minQuantity} unit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${p.pauseAllowed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {p.pauseAllowed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      </div>
                      <span>Subscription Pause Allowed: {p.pauseAllowed ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${p.earlyCancellation ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {p.earlyCancellation ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      </div>
                      <span>Early Cancellation Allowed: {p.earlyCancellation ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>Auto-renewal Enabled</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Status Control</span>
                    <button
                      onClick={() => handleToggleStatus(p.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                        p.status === 'ACTIVE'
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Plan Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Subscription Plan">
        <form onSubmit={handleSavePlan} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">{errorMsg}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Growth Pro Annual"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. PLAN-GROWTH-A"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Linked Catalog Product *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              >
                {products.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name} ({pr.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Frequency *</label>
              <select
                value={billingFrequency}
                onChange={(e: any) => setBillingFrequency(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="DAILY">Daily</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="3999.00"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Quantity</label>
              <input
                type="number"
                min="1"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Features, support SLA and included quotas..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Permissions & Rules Toggles */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pauseAllowed}
                onChange={(e) => setPauseAllowed(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="font-semibold text-slate-800">Allow Customer to Pause/Resume Subscription</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={earlyCancellation}
                onChange={(e) => setEarlyCancellation(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="font-semibold text-slate-800">Allow Early Cancellation by Customer</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoClose}
                onChange={(e) => setAutoClose(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="font-semibold text-slate-800">Auto-Close on Expiry (No Auto-Renew)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {formLoading ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
