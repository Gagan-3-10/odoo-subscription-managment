import React, { useState, useEffect } from 'react';
import { Percent, Plus, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { Tax } from '../../types';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';

export const TaxesPage: React.FC = () => {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [percentage, setPercentage] = useState('18.0');
  const [taxType, setTaxType] = useState('GST');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/taxes');
      if (res.data?.success) setTaxes(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/taxes/${id}/toggle-status`);
      fetchTaxes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error toggling tax');
    }
  };

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg(null);
    try {
      await api.post('/taxes', {
        name,
        code,
        percentage: Number(percentage),
        taxType,
      });
      setIsModalOpen(false);
      setName('');
      setCode('');
      fetchTaxes();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create tax rule');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Tax Rates & GST Compliance Rules</h3>
          <p className="text-xs text-slate-500">Automated Indian GST, CGST, SGST & IGST rate calculations</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create Tax Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">Loading tax rules...</div>
        ) : (
          taxes.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-card transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">{t.code}</span>
                  <StatusBadge status={t.status} size="sm" />
                </div>
                <h4 className="font-bold text-base text-slate-900 mt-2">{t.name}</h4>
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Rate Slab</span>
                  <span className="text-xl font-extrabold text-brand-700 font-mono">{t.percentage}%</span>
                </div>
                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <p><span className="text-slate-400">Classification:</span> <span className="font-bold">{t.taxType}</span></p>
                  <p><span className="text-slate-400">Applicable Products:</span> <span className="font-semibold">{t.applicableProducts}</span></p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleToggleStatus(t.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    t.status === 'ACTIVE' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {t.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure Tax Rule">
        <form onSubmit={handleCreateTax} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">{errorMsg}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. GST Standard 18%"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. GST_18"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax Percentage (%) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax Type *</label>
              <select
                value={taxType}
                onChange={(e) => setTaxType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold"
              >
                <option value="GST">GST (Integrated Standard)</option>
                <option value="CGST">CGST (Central GST)</option>
                <option value="SGST">SGST (State GST)</option>
                <option value="IGST">IGST (Inter-state)</option>
              </select>
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
              {formLoading ? 'Saving...' : 'Save Tax Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
