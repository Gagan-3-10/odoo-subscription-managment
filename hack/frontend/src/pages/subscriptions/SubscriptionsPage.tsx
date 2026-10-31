import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Search,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Ban,
  CheckCircle,
  Eye,
  Clock,
  Activity,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { Subscription, Customer, Plan } from '../../types';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';

export const SubscriptionsPage: React.FC = () => {
  const { user, isAdmin, isStaff, isCustomer } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [freqFilter, setFreqFilter] = useState('ALL');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('IMMEDIATE');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscriptions', {
        params: { search, status: statusFilter, frequency: freqFilter },
      });
      if (res.data?.success) setSubscriptions(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/customers'),
        api.get('/plans'),
      ]);
      if (cRes.data?.success) setCustomers(cRes.data.data || []);
      if (pRes.data?.success) setPlans(pRes.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [search, statusFilter, freqFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleStatusChange = async (id: string, action: string) => {
    if (!window.confirm(`Are you sure you want to perform action: ${action} on this subscription?`)) return;
    try {
      const res = await api.post(`/subscriptions/${id}/change-status`, { action });
      if (res.data?.success) {
        fetchSubscriptions();
        if (selectedSub && selectedSub.id === id) {
          handleViewDetails(id);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} subscription`);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await api.get(`/subscriptions/${id}`);
      if (res.data?.success) {
        setSelectedSub(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/subscriptions', {
        customerId,
        planId,
        paymentTerms,
      });
      if (res.data?.success) {
        setIsCreateOpen(false);
        fetchSubscriptions();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create subscription');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by subscription #, customer, plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="CLOSED">Closed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="DRAFT">Draft</option>
          </select>
          <select
            value={freqFilter}
            onChange={(e) => setFreqFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hidden md:block"
          >
            <option value="ALL">All Frequencies</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
            <option value="WEEKLY">Weekly</option>
            <option value="DAILY">Daily</option>
          </select>
        </div>

        {(isAdmin || isStaff) && (
          <button
            onClick={() => {
              if (customers.length > 0 && !customerId) setCustomerId(customers[0].id);
              if (plans.length > 0 && !planId) setPlanId(plans[0].id);
              setIsCreateOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            New Subscription
          </button>
        )}
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Sub Number</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Plan & Frequency</th>
                <th className="py-3.5 px-4">Billing Date</th>
                <th className="py-3.5 px-4 text-right">Recurring Rate</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No subscriptions found matching filters.
                  </td>
                </tr>
              ) : (
                subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      {s.subscriptionNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{s.customer?.companyName || s.customer?.contactName}</p>
                      <p className="text-[11px] text-slate-400">{s.customer?.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{s.plan?.name}</p>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{s.billingFrequency}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {s.nextBillingDate ? new Date(s.nextBillingDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{s.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={s.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleViewDetails(s.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        View
                      </button>
                      {/* Quick status action buttons */}
                      {s.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleStatusChange(s.id, 'PAUSE')}
                          title="Pause Subscription"
                          className="p-1 text-amber-600 hover:bg-amber-50 rounded-lg"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {s.status === 'PAUSED' && (
                        <button
                          onClick={() => handleStatusChange(s.id, 'RESUME')}
                          title="Resume Subscription"
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        >
                          <Play className="w-3.5 h-3.5" />
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

      {/* Create Subscription Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Subscription">
        <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">{errorMsg}</div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName || c.contactName} ({c.customerNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Subscription Plan *</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            >
              {plans.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name} — ₹{pl.basePrice}/{pl.billingFrequency.toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold"
            >
              <option value="IMMEDIATE">Immediate Due</option>
              <option value="NET_15">Net 15 Days</option>
              <option value="NET_30">Net 30 Days</option>
              <option value="NET_60">Net 60 Days</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {formLoading ? 'Creating...' : 'Activate Subscription'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Subscription Detail and Complete Lifecycle Actions Modal */}
      {selectedSub && (
        <Modal
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          title={`Subscription Details — ${selectedSub.subscriptionNumber}`}
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs">
            {/* Header info */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Customer</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedSub.customer?.companyName || selectedSub.customer?.contactName}</p>
                <p className="text-slate-500">{selectedSub.customer?.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Plan & Frequency</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedSub.plan?.name}</p>
                <p className="text-brand-600 font-semibold">{selectedSub.billingFrequency}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Next Billing Date</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {selectedSub.nextBillingDate ? new Date(selectedSub.nextBillingDate).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-slate-500">Terms: {selectedSub.paymentTerms}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedSub.status} />
                </div>
                <p className="text-slate-500 mt-0.5">Expires: {new Date(selectedSub.expiryDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Lifecycle Command Buttons Bar */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-2">Lifecycle Actions:</span>
              {selectedSub.status === 'ACTIVE' && (
                <button
                  onClick={() => handleStatusChange(selectedSub.id, 'PAUSE')}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pause Subscription
                </button>
              )}
              {selectedSub.status === 'PAUSED' && (
                <button
                  onClick={() => handleStatusChange(selectedSub.id, 'RESUME')}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                >
                  <Play className="w-3.5 h-3.5" />
                  Resume Subscription
                </button>
              )}
              <button
                onClick={() => handleStatusChange(selectedSub.id, 'RENEW')}
                className="flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Renew for 1 Year
              </button>
              {selectedSub.status !== 'CANCELLED' && (
                <button
                  onClick={() => handleStatusChange(selectedSub.id, 'CANCEL')}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Cancel Subscription
                </button>
              )}
              {selectedSub.status !== 'CLOSED' && (
                <button
                  onClick={() => handleStatusChange(selectedSub.id, 'CLOSE')}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Close Contract
                </button>
              )}
            </div>

            {/* Generated Invoices for this subscription */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Billing History & Generated Invoices ({selectedSub.invoices?.length || 0})</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-40 overflow-y-auto">
                {selectedSub.invoices?.length === 0 ? (
                  <p className="p-3 text-slate-400 text-center">No invoices generated yet.</p>
                ) : (
                  selectedSub.invoices?.map((inv: any) => (
                    <div key={inv.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                        <p className="text-[11px] text-slate-400">Issued: {new Date(inv.issueDate).toLocaleDateString()} • Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</p>
                        <StatusBadge status={inv.status} size="sm" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Complete Activity Audit Log */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand-600" />
                Audit Activity History ({selectedSub.activityLogs?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 max-h-48 overflow-y-auto">
                {selectedSub.activityLogs?.map((log: any) => (
                  <div key={log.id} className="p-2 bg-white rounded-lg border border-slate-200 flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">{log.details}</p>
                      {log.user && <p className="text-[10px] text-slate-400 mt-0.5">By: {log.user.name} ({log.user.email})</p>}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
