import React, { useState, useEffect } from 'react';
import { FileCheck, Plus, Trash2, Calendar, FileText } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/common/Modal';

export const QuotationTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [defaultNotes, setDefaultNotes] = useState('Standard enterprise terms apply.');

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quotations/templates');
      if (res.data?.success) setTemplates(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/quotations/templates', {
        name,
        description,
        validityDays: Number(validityDays),
        defaultNotes,
        lines: [],
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      fetchTemplates();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.delete(`/quotations/templates/${id}`);
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Reusable Quotation Templates</h3>
          <p className="text-xs text-slate-500">Speed up sales proposals with preconfigured product bundles and validity rules</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">No quotation templates found.</div>
        ) : (
          templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-card transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {tpl.validityDays} Days Validity
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 mt-3">{tpl.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{tpl.description || 'Preconfigured quotation bundle.'}</p>
                <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                  <span className="font-semibold block text-[10px] text-slate-400 uppercase">Default Notes</span>
                  <p className="mt-0.5 line-clamp-2">{tpl.defaultNotes}</p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleDelete(tpl.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 transition"
                  title="Delete Template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Quotation Template">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Template Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Enterprise Annual Onboarding Bundle"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Validity (Days) *</label>
            <input
              type="number"
              min="1"
              required
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this proposal preset..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Default Terms / Notes</label>
            <textarea
              rows={3}
              value={defaultNotes}
              onChange={(e) => setDefaultNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
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
              className="px-4 py-2 font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700"
            >
              Save Template
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
