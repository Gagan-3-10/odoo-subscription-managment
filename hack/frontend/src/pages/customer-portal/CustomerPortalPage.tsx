import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Receipt,
  CreditCard,
  UserCheck,
  Calendar,
  Download,
  Pause,
  Play,
  Ban,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

export const CustomerPortalPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'SUBSCRIPTIONS' | 'INVOICES' | 'PAYMENTS' | 'PROFILE'>('SUBSCRIPTIONS');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Pay modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  // Profile update form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, iRes, pRes, mRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/invoices'),
        api.get('/payments'),
        api.get('/auth/me'),
      ]);
      if (sRes.data?.success) setSubscriptions(sRes.data.data || []);
      if (iRes.data?.success) setInvoices(iRes.data.data || []);
      if (pRes.data?.success) setPayments(pRes.data.data || []);
      if (mRes.data?.success) {
        const u = mRes.data.user;
        setProfile(u);
        setName(u.name || '');
        setPhone(u.phone || '');
        setCompanyName(u.customerProfile?.companyName || '');
        setBillingAddress(u.customerProfile?.billingAddress || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubAction = async (id: string, action: string) => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this subscription?`)) return;
    try {
      const res = await api.post(`/subscriptions/${id}/change-status`, { action });
      if (res.data?.success) {
        alert(res.data.message);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || `Action failed`);
    }
  };

  const handleDownloadPDF = (id: string) => {
    const token = localStorage.getItem('brightloop_token');
    window.open(`/api/invoices/${id}/pdf?token=${token}`, '_blank');
  };

  const handleOpenPay = (inv: any) => {
    setSelectedInvoice(inv);
    setPayAmount(String(inv.balanceDue));
    setIsPayOpen(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setPayLoading(true);
    try {
      const res = await api.post('/payments/record', {
        invoiceId: selectedInvoice.id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        transactionRef: `RZP_CUST_${Date.now()}`,
        notes: `Customer self-service payment via ${payMethod}`,
      });
      if (res.data?.success) {
        alert(res.data.message);
        setIsPayOpen(false);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setPayLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put('/auth/profile', {
        name,
        phone,
        companyName,
        billingAddress,
      });
      if (res.data?.success) {
        setProfileMessage('Profile updated successfully!');
        setTimeout(() => setProfileMessage(null), 4000);
      }
    } catch (err: any) {
      alert('Failed to update profile');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Bar */}
      <div className="p-6 bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 rounded-3xl text-white shadow-float flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-brand-200">Customer Self-Service Hub</span>
          <h2 className="text-2xl font-extrabold mt-0.5">{profile?.name || user?.name}</h2>
          <p className="text-xs text-brand-100 mt-1">
            {profile?.customerProfile?.companyName ? `${profile.customerProfile.companyName} • ` : ''}
            Account ID: <span className="font-mono font-bold text-white">{profile?.customerProfile?.customerNumber || 'CUST-XXXX'}</span>
          </p>
        </div>

        {/* Navigation tabs */}
        <div className="flex items-center gap-1 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab('SUBSCRIPTIONS')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'SUBSCRIPTIONS' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            My Subscriptions ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'INVOICES' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'PAYMENTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            Payment Receipts ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'PROFILE' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            Profile
          </button>
        </div>
      </div>

      {/* Tab: Subscriptions */}
      {activeTab === 'SUBSCRIPTIONS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subscriptions.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                No active subscriptions found for your account.
              </div>
            ) : (
              subscriptions.map((s) => (
                <div key={s.id} className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-soft flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-brand-700">{s.subscriptionNumber}</span>
                      <StatusBadge status={s.status} size="sm" />
                    </div>

                    <h3 className="font-bold text-base text-slate-900 mt-2">{s.plan?.name}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{s.plan?.description || 'Active Enterprise Tier'}</p>

                    <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Recurring Fee</span>
                        <p className="text-lg font-extrabold text-slate-900 font-mono">₹{s.totalAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Frequency</span>
                        <p className="font-bold text-brand-700">{s.billingFrequency}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                      <p className="flex justify-between">
                        <span className="text-slate-400">Next Billing Renewal:</span>
                        <span className="font-bold text-slate-800">
                          {s.nextBillingDate ? new Date(s.nextBillingDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">Contract Expiry:</span>
                        <span className="font-semibold">{new Date(s.expiryDate).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Customer self-service actions based on plan permissions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold">Self-Service</span>
                    <div className="space-x-2">
                      {s.status === 'ACTIVE' && s.plan?.pauseAllowed && (
                        <button
                          onClick={() => handleSubAction(s.id, 'PAUSE')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                        >
                          Pause
                        </button>
                      )}
                      {s.status === 'PAUSED' && (
                        <button
                          onClick={() => handleSubAction(s.id, 'RESUME')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          Resume
                        </button>
                      )}
                      {s.status !== 'CANCELLED' && s.plan?.earlyCancellation && (
                        <button
                          onClick={() => handleSubAction(s.id, 'CANCEL')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Invoices */}
      {activeTab === 'INVOICES' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No invoices generated yet.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-brand-700">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{new Date(inv.issueDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-slate-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">₹{inv.balanceDue.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4"><StatusBadge status={inv.status} size="sm" /></td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleDownloadPDF(inv.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          PDF
                        </button>
                        {inv.balanceDue > 0 && (
                          <button
                            onClick={() => handleOpenPay(inv)}
                            className="px-3 py-1 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-xs"
                          >
                            Pay Online
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
      )}

      {/* Tab: Payments */}
      {activeTab === 'PAYMENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Settled Date</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">No payments found.</td></tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-brand-700">{p.paymentNumber}</td>
                      <td className="py-3 px-4 font-mono">{p.invoice?.invoiceNumber}</td>
                      <td className="py-3 px-4 font-semibold">{p.paymentMethod}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.transactionRef}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">₹{p.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4"><StatusBadge status={p.status} size="sm" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === 'PROFILE' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft max-w-2xl">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Account Profile & Billing Address</h3>
          {profileMessage && (
            <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200">
              {profileMessage}
            </div>
          )}
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Online Payment Modal */}
      {isPayOpen && selectedInvoice && (
        <Modal
          isOpen={isPayOpen}
          onClose={() => setIsPayOpen(false)}
          title={`Pay Invoice ${selectedInvoice.invoiceNumber}`}
        >
          <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
            <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-900">
              <span className="font-bold">Instant Online Settlement</span>
              <p className="text-[11px] text-brand-700 mt-0.5">
                Powered by Razorpay Secure Gateway (Test Mode). Balance: ₹{selectedInvoice.balanceDue}
              </p>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount to Pay (₹)</label>
              <input
                type="number"
                required
                max={selectedInvoice.balanceDue}
                min="1"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / QR)</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="NET_BANKING">Net Banking</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPayOpen(false)}
                className="px-4 py-2 font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={payLoading}
                className="px-4 py-2 font-bold rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {payLoading ? 'Authorizing...' : `Pay ₹${Number(payAmount || 0).toLocaleString('en-IN')}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
