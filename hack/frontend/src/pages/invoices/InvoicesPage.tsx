import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Download,
  Play,
  CreditCard,
  AlertOctagon,
  Eye,
  CheckCircle2,
  Calendar,
  RefreshCw,
  FileText,
} from 'lucide-react';
import api from '../../services/api';
import { Invoice } from '../../types';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';

export const InvoicesPage: React.FC = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Automated billing run states
  const [billingRunning, setBillingRunning] = useState(false);
  const [billingResult, setBillingResult] = useState<string | null>(null);

  // Selected Invoice Modal & Payment Checkout
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [payLoading, setPayLoading] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices', {
        params: {
          search,
          status: statusFilter,
          overdueOnly: overdueOnly ? 'true' : 'false',
        },
      });
      if (res.data?.success) setInvoices(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, statusFilter, overdueOnly]);

  const handleRunBilling = async () => {
    setBillingRunning(true);
    setBillingResult(null);
    try {
      const res = await api.post('/invoices/run-automated-billing');
      if (res.data?.success) {
        setBillingResult(res.data.message);
        fetchInvoices();
        setTimeout(() => setBillingResult(null), 7000);
      }
    } catch (err: any) {
      setBillingResult(err.response?.data?.message || 'Billing cycle trigger failed');
    } finally {
      setBillingRunning(false);
    }
  };

  const handleDownloadPDF = (id: string, invoiceNumber: string) => {
    const token = localStorage.getItem('brightloop_token');
    // Open direct PDF endpoint
    window.open(`/api/invoices/${id}/pdf?token=${token}`, '_blank');
  };

  const handleOpenPay = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(String(inv.balanceDue));
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setPayLoading(true);
    try {
      // Razorpay test mode simulation
      const res = await api.post('/payments/record', {
        invoiceId: selectedInvoice.id,
        amount: Number(paymentAmount),
        paymentMethod,
        transactionRef: `RZP_TEST_${Date.now()}`,
        notes: `Simulated checkout via ${paymentMethod}`,
      });
      if (res.data?.success) {
        alert(res.data.message);
        setIsPayModalOpen(false);
        fetchInvoices();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setPayLoading(false);
    }
  };

  const handleViewInvoice = async (id: string) => {
    try {
      const res = await api.get(`/invoices/${id}`);
      if (res.data?.success) setSelectedInvoice(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Automated Billing Result Banner */}
      {billingResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{billingResult}</span>
          </div>
          <button onClick={() => setBillingResult(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 cursor-pointer">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="rounded text-rose-600"
            />
            <span>Overdue Only</span>
          </label>
        </div>

        {(isAdmin || isStaff) && (
          <button
            onClick={handleRunBilling}
            disabled={billingRunning}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white hover:opacity-95 shadow-sm transition disabled:opacity-50"
          >
            {billingRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            {billingRunning ? 'Processing Billing...' : 'Run Automated Billing'}
          </button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Issue & Due Date</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{inv.customer?.companyName || inv.customer?.contactName}</p>
                      <p className="text-[11px] text-slate-400">{inv.subscription?.subscriptionNumber || 'One-time'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800">{new Date(inv.issueDate).toLocaleDateString()}</p>
                      <p className={`text-[11px] ${new Date(inv.dueDate) < new Date() && inv.status !== 'PAID' ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                        Due: {new Date(inv.dueDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={inv.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        ₹{inv.balanceDue.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleViewInvoice(inv.id)}
                        className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(inv.id, inv.invoiceNumber)}
                        title="Download PDF Invoice"
                        className="p-1 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {inv.balanceDue > 0 && (
                        <button
                          onClick={() => handleOpenPay(inv)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-xs transition"
                        >
                          Pay
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

      {/* Invoice Detail View Modal */}
      {selectedInvoice && !isPayModalOpen && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900 text-sm">{selectedInvoice.customer?.companyName || selectedInvoice.customer?.contactName}</p>
                <p className="text-slate-500">Issued: {new Date(selectedInvoice.issueDate).toLocaleDateString()} • Due: {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={selectedInvoice.status} />
            </div>

            {/* Line items */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Invoice Product Lines</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {selectedInvoice.lines?.map((l: any, i: number) => (
                  <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-900">{l.description || l.product?.name}</p>
                      <p className="text-[11px] text-slate-500">Qty: {l.quantity} × ₹{l.unitPrice} (+{l.taxRate}% tax)</p>
                    </div>
                    <p className="font-bold font-mono text-slate-900">₹{l.lineTotal.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{selectedInvoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxes (GST/IGST):</span>
                <span>+₹{selectedInvoice.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-brand-700">₹{selectedInvoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Amount Paid:</span>
                <span>₹{selectedInvoice.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Remaining Balance Due:</span>
                <span>₹{selectedInvoice.balanceDue.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => handleDownloadPDF(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                className="flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
              {selectedInvoice.balanceDue > 0 && (
                <button
                  onClick={() => setIsPayModalOpen(true)}
                  className="px-4 py-2 font-bold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                >
                  Proceed to Payment
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Razorpay Test Mode Checkout Modal */}
      {isPayModalOpen && selectedInvoice && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Pay Invoice ${selectedInvoice.invoiceNumber}`}
        >
          <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900">
              <div className="flex items-center gap-2 font-bold mb-1">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                Razorpay Checkout (Test Mode)
              </div>
              <p className="text-[11px] text-indigo-700">
                Instant test settlement with automated transaction deduplication & status reconciliation.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount to Pay (₹) *</label>
              <input
                type="number"
                required
                max={selectedInvoice.balanceDue}
                min="1"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Total balance due: ₹{selectedInvoice.balanceDue.toFixed(2)} (Partial payments supported)
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="CREDIT_CARD">Credit Card (Visa / Mastercard)</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="BANK_TRANSFER">Direct Bank Transfer / NEFT</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={payLoading}
                className="px-4 py-2 font-bold rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {payLoading ? 'Authorizing Payment...' : `Pay ₹${Number(paymentAmount || 0).toLocaleString('en-IN')}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
