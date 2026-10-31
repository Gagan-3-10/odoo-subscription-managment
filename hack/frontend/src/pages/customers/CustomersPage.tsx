import React, { useState, useEffect } from 'react';
import { Search, Plus, Mail, Phone, MapPin, Building, ShieldCheck, Eye, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { Customer } from '../../types';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Form state
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers', {
        params: { search, status: statusFilter },
      });
      if (res.data?.success) {
        setCustomers(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/customers', {
        contactName,
        companyName,
        email,
        phone,
        billingAddress,
        taxId,
      });
      if (res.data?.success) {
        setIsCreateOpen(false);
        // Reset form
        setContactName('');
        setCompanyName('');
        setEmail('');
        setPhone('');
        setBillingAddress('');
        setTaxId('');
        fetchCustomers();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await api.get(`/customers/${id}`);
      if (res.data?.success) {
        setSelectedCustomer(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company, name, email, or customer ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Customer ID</th>
                <th className="py-3.5 px-4">Company & Contact</th>
                <th className="py-3.5 px-4">Email & Phone</th>
                <th className="py-3.5 px-4">Tax ID (GSTIN)</th>
                <th className="py-3.5 px-4 text-center">Subscriptions</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading customers directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found matching criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-brand-700">
                      {c.customerNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{c.companyName || c.contactName}</p>
                      {c.companyName && (
                        <p className="text-[11px] text-slate-500 font-normal">{c.contactName}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-900 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {c.email}
                      </p>
                      <p className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {c.phone}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {c.taxId || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 font-bold rounded-full bg-slate-100 text-slate-700 text-[11px]">
                        {c._count?.subscriptions || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewDetails(c.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Customer Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add New Customer">
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name *</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Malhotra Logistics Pvt Ltd"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@company.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address *</label>
            <textarea
              required
              rows={2}
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="Full registered tax and billing address"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tax ID / GSTIN</label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value.toUpperCase())}
              placeholder="e.g. 27AABCV1234F1Z1"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title={`Customer Details — ${selectedCustomer.customerNumber}`} maxWidth="2xl">
          <div className="space-y-6 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Contact Person</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedCustomer.contactName}</p>
                <p className="text-slate-600">{selectedCustomer.companyName || 'Individual Account'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Tax & GSTIN</p>
                <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedCustomer.taxId || 'N/A'}</p>
                <p className="text-slate-600">Currency: {selectedCustomer.currency}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Registered Address</p>
                <p className="text-slate-700 mt-0.5">{selectedCustomer.billingAddress}</p>
              </div>
            </div>

            {/* Subscriptions list */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Active Subscriptions ({selectedCustomer.subscriptions?.length || 0})</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedCustomer.subscriptions?.length === 0 ? (
                  <p className="p-3 text-slate-400 text-center">No subscriptions yet.</p>
                ) : (
                  selectedCustomer.subscriptions?.map((s: any) => (
                    <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-mono font-semibold text-brand-700">{s.subscriptionNumber}</span>
                        <p className="font-medium text-slate-900">{s.plan?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">₹{s.totalAmount.toLocaleString('en-IN')}/{s.billingFrequency.toLowerCase()}</p>
                        <StatusBadge status={s.status} size="sm" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Invoices list */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Invoice History ({selectedCustomer.invoices?.length || 0})</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {selectedCustomer.invoices?.length === 0 ? (
                  <p className="p-3 text-slate-400 text-center">No invoices generated.</p>
                ) : (
                  selectedCustomer.invoices?.map((inv: any) => (
                    <div key={inv.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-mono font-semibold text-slate-900">{inv.invoiceNumber}</span>
                        <p className="text-[11px] text-slate-500">Issued: {new Date(inv.issueDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</p>
                        <StatusBadge status={inv.status} size="sm" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
