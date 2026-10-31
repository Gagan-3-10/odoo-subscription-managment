import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  ArrowRight,
  Eye,
  Trash2,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { Quotation, Customer, Product, Plan } from '../../types';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';

export const QuotationsPage: React.FC = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [notes, setNotes] = useState('Special proposal valid for 30 days.');
  const [lines, setLines] = useState<any[]>([
    { productId: '', planId: '', quantity: 1, unitPrice: 0, taxRate: 18, discountRate: 0, lineTotal: 0 },
  ]);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // View detail modal
  const [activeQuotation, setActiveQuotation] = useState<Quotation | null>(null);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quotations', { params: { status: statusFilter } });
      if (res.data?.success) setQuotations(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [cRes, pRes, plRes] = await Promise.all([
        api.get('/customers'),
        api.get('/products'),
        api.get('/plans'),
      ]);
      if (cRes.data?.success) setCustomers(cRes.data.data || []);
      if (pRes.data?.success) setProducts(pRes.data.data || []);
      if (plRes.data?.success) setPlans(plRes.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleAddLine = () => {
    setLines([
      ...lines,
      { productId: '', planId: '', quantity: 1, unitPrice: 0, taxRate: 18, discountRate: 0, lineTotal: 0 },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...lines];
    updated[index][field] = value;

    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        updated[index].unitPrice = prod.salesPrice;
      }
    } else if (field === 'planId') {
      const pl = plans.find((p) => p.id === value);
      if (pl) {
        updated[index].unitPrice = pl.basePrice;
        if (!updated[index].productId) updated[index].productId = pl.productId;
      }
    }

    const qty = Number(updated[index].quantity) || 1;
    const price = Number(updated[index].unitPrice) || 0;
    const disc = (qty * price) * ((Number(updated[index].discountRate) || 0) / 100);
    const taxable = (qty * price) - disc;
    const tax = taxable * ((Number(updated[index].taxRate) || 0) / 100);
    updated[index].lineTotal = Math.round((taxable + tax) * 100) / 100;

    setLines(updated);
  };

  const calculateFormTotals = () => {
    let sub = 0;
    let disc = 0;
    let tax = 0;
    lines.forEach((l) => {
      const base = (Number(l.quantity) || 1) * (Number(l.unitPrice) || 0);
      const d = base * ((Number(l.discountRate) || 0) / 100);
      const t = (base - d) * ((Number(l.taxRate) || 0) / 100);
      sub += base;
      disc += d;
      tax += t;
    });
    return {
      subtotal: Math.round(sub * 100) / 100,
      discountAmount: Math.round(disc * 100) / 100,
      taxAmount: Math.round(tax * 100) / 100,
      totalAmount: Math.round((sub - disc + tax) * 100) / 100,
    };
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setErrorMsg('Please select a customer');
      return;
    }
    if (lines.length === 0 || !lines[0].productId) {
      setErrorMsg('Please select at least one product or plan line');
      return;
    }

    setFormLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/quotations', {
        customerId: selectedCustomerId,
        validityDays: Number(validityDays),
        notes,
        lines,
      });
      if (res.data?.success) {
        setIsCreateOpen(false);
        fetchQuotations();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error creating quotation');
    } finally {
      setFormLoading(false);
    }
  };

  // Convert Quotation into Active Subscription with 1-click!
  const handleConvertToSubscription = async (id: string) => {
    if (!window.confirm('Convert this accepted quotation into an active subscription? Recurring billing and subscription lines will be automatically configured.')) return;
    try {
      const res = await api.post(`/quotations/${id}/convert-subscription`);
      if (res.data?.success) {
        alert(res.data.message);
        fetchQuotations();
        if (activeQuotation) setActiveQuotation(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to convert quotation');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/quotations/${id}/status`, { status });
      fetchQuotations();
      if (activeQuotation) setActiveQuotation(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const totals = calculateFormTotals();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
                statusFilter === st
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {(isAdmin || isStaff) && (
          <button
            onClick={() => {
              if (customers.length > 0 && !selectedCustomerId) setSelectedCustomerId(customers[0].id);
              if (products.length > 0 && !lines[0].productId) {
                setLines([{
                  productId: products[0].id,
                  planId: plans[0]?.id || '',
                  quantity: 1,
                  unitPrice: products[0].salesPrice,
                  taxRate: 18,
                  discountRate: 0,
                  lineTotal: products[0].salesPrice * 1.18,
                }]);
              }
              setIsCreateOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Create Quotation
          </button>
        )}
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Quotation #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Validity Date</th>
                <th className="py-3.5 px-4 text-right">Subtotal</th>
                <th className="py-3.5 px-4 text-right">Total (Incl. Tax)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading quotations...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No quotations found.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      {q.quotationNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{q.customer?.companyName || q.customer?.contactName}</p>
                      <p className="text-[11px] text-slate-400">{q.customer?.email}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(q.validityDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      ₹{q.subtotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{q.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={q.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => setActiveQuotation(q)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        View
                      </button>
                      {(isAdmin || isStaff) && q.status === 'ACCEPTED' && !q.convertedSubscriptionId && (
                        <button
                          onClick={() => handleConvertToSubscription(q.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition"
                          title="Convert to Active Subscription"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Convert to Sub
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Quotation Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Sales Quotation" maxWidth="4xl">
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">{errorMsg}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || c.contactName} ({c.customerNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Validity (Days)</label>
              <input
                type="number"
                min="1"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Product Lines Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900">Quotation Product Lines</span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                + Add Another Line
              </button>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              {lines.map((l, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                  <div className="col-span-4">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Product</label>
                    <select
                      value={l.productId}
                      onChange={(e) => handleLineChange(index, 'productId', e.target.value)}
                      className="w-full p-1.5 text-xs rounded border border-slate-200"
                    >
                      <option value="">Select Product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Plan</label>
                    <select
                      value={l.planId}
                      onChange={(e) => handleLineChange(index, 'planId', e.target.value)}
                      className="w-full p-1.5 text-xs rounded border border-slate-200"
                    >
                      <option value="">Select Plan...</option>
                      {plans.map((pl) => (
                        <option key={pl.id} value={pl.id}>{pl.name} (₹{pl.basePrice})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={l.quantity}
                      onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                      className="w-full p-1.5 text-xs rounded border border-slate-200"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Unit Price (₹)</label>
                    <input
                      type="number"
                      value={l.unitPrice}
                      onChange={(e) => handleLineChange(index, 'unitPrice', e.target.value)}
                      className="w-full p-1.5 text-xs rounded border border-slate-200 font-mono"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Tax %</label>
                    <input
                      type="number"
                      value={l.taxRate}
                      onChange={(e) => handleLineChange(index, 'taxRate', e.target.value)}
                      className="w-full p-1.5 text-xs rounded border border-slate-200 font-mono"
                    />
                  </div>
                  <div className="col-span-1 text-right pt-3">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(index)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxes (18% GST):</span>
                <span className="font-mono">+₹{totals.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                <span>Total Amount:</span>
                <span className="font-mono text-brand-700">₹{totals.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {formLoading ? 'Creating...' : 'Save & Send Quotation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Quotation Detail Modal */}
      {activeQuotation && (
        <Modal
          isOpen={!!activeQuotation}
          onClose={() => setActiveQuotation(null)}
          title={`Quotation Details — ${activeQuotation.quotationNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900 text-sm">{activeQuotation.customer?.companyName || activeQuotation.customer?.contactName}</p>
                <p className="text-slate-500">Validity until: {new Date(activeQuotation.validityDate).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={activeQuotation.status} />
            </div>

            {/* Line items */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Quotation Line Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {activeQuotation.lines?.map((l: any, i: number) => (
                  <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-900">{l.product?.name || 'Service Item'}</p>
                      <p className="text-[11px] text-slate-500">{l.plan?.name ? `Plan: ${l.plan.name}` : ''} • Qty: {l.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono text-slate-900">₹{l.lineTotal.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-slate-400">₹{l.unitPrice} ea + {l.taxRate}% tax</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions for Quotation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="space-x-2">
                {activeQuotation.status === 'DRAFT' && (
                  <button
                    onClick={() => handleUpdateStatus(activeQuotation.id, 'SENT')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  >
                    Mark as Sent
                  </button>
                )}
                {activeQuotation.status === 'SENT' && (
                  <button
                    onClick={() => handleUpdateStatus(activeQuotation.id, 'ACCEPTED')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  >
                    Accept Quotation
                  </button>
                )}
              </div>

              {activeQuotation.status === 'ACCEPTED' && !activeQuotation.convertedSubscriptionId && (
                <button
                  onClick={() => handleConvertToSubscription(activeQuotation.id)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-95 shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Convert to Active Subscription Now
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
