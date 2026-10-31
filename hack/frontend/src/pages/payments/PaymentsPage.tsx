import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Search, Calendar, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { Payment, Invoice } from '../../types';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';

export const PaymentsPage: React.FC = () => {
  const { isAdmin, isStaff } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments');
      if (res.data?.success) setPayments(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvoices = async () => {
    try {
      const res = await api.get('/invoices', { params: { status: 'ALL' } });
      if (res.data?.success) {
        const pending = (res.data.data || []).filter((i: Invoice) => i.balanceDue > 0);
        setInvoices(pending);
        if (pending.length > 0 && !invoiceId) {
          setInvoiceId(pending[0].id);
          setAmount(String(pending[0].balanceDue));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchPendingInvoices();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/payments/record', {
        invoiceId,
        amount: Number(amount),
        paymentMethod,
        transactionRef,
        notes,
      });
      if (res.data?.success) {
        setIsModalOpen(false);
        fetchPayments();
        fetchPendingInvoices();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error recording payment');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Settled Payment Transactions</h3>
          <p className="text-xs text-slate-500">Live payment audit trail & gateway reconciliations</p>
        </div>

        {(isAdmin || isStaff) && (
          <button
            onClick={() => {
              setTransactionRef(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Record Offline Payment
          </button>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Payment #</th>
                <th className="py-3.5 px-4">Invoice Reference</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Method & Transaction Ref</th>
                <th className="py-3.5 px-4">Settled Date</th>
                <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading payment records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payment transactions recorded.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      {p.paymentNumber}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {p.invoice?.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.customer?.companyName || p.customer?.contactName}</p>
                      <p className="text-[11px] text-slate-400">{p.customer?.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{p.paymentMethod}</span>
                      <p className="font-mono text-[10px] text-slate-400">{p.transactionRef || 'N/A'}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Manual / Offline Payment">
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">{errorMsg}</div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Outstanding Invoice *</label>
            <select
              value={invoiceId}
              onChange={(e) => {
                setInvoiceId(e.target.value);
                const inv = invoices.find((i) => i.id === e.target.value);
                if (inv) setAmount(String(inv.balanceDue));
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            >
              {invoices.length === 0 ? (
                <option value="">No outstanding invoices available</option>
              ) : (
                invoices.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.invoiceNumber} — {i.customer.contactName} (Balance Due: ₹{i.balanceDue})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold"
              >
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="CASH">Cash Settlement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bank / Transaction Reference *</label>
            <input
              type="text"
              required
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. UTR-9876543210 or Cheque #"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional deposit confirmation notes..."
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
              disabled={formLoading || invoices.length === 0}
              className="px-4 py-2 font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {formLoading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
