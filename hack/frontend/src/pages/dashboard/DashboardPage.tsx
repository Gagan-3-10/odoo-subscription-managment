import React, { useEffect, useState } from 'react';
import {
  Users,
  Repeat,
  TrendingUp,
  CreditCard,
  AlertOctagon,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  PlusCircle,
  FilePlus,
  Play,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../../services/api';
import { DashboardMetrics } from '../../types';
import { KPICard } from '../../components/common/KPICard';
import { StatusBadge } from '../../components/common/StatusBadge';

const COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

interface DashboardPageProps {
  setCurrentTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setCurrentTab }) => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/metrics');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRunBilling = async () => {
    try {
      setTriggerLoading(true);
      const res = await api.post('/invoices/run-automated-billing');
      if (res.data?.success) {
        setBannerNotice(res.data.message);
        fetchMetrics();
        setTimeout(() => setBannerNotice(null), 6000);
      }
    } catch (e: any) {
      setBannerNotice(e.response?.data?.message || 'Billing cycle trigger failed');
    } finally {
      setTriggerLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Calculating real-time database metrics...</p>
        </div>
      </div>
    );
  }

  const { kpi, charts, lists } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      {bannerNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-sm shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{bannerNotice}</span>
          </div>
          <button onClick={() => setBannerNotice(null)} className="text-xs font-semibold text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Overdue alert banner if invoices are overdue */}
      {kpi.overdueInvoicesCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-rose-900 text-sm shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">
                {kpi.overdueInvoicesCount} Overdue Invoices Require Action
              </p>
              <p className="text-xs text-rose-700">
                Total outstanding overdue balance: ₹{kpi.overdueInvoicesAmount.toLocaleString('en-IN')}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentTab('invoices')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition"
            >
              Review Overdue Invoices
            </button>
          </div>
        </div>
      )}

      {/* Quick Action Command Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-soft">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">Engine Online</span>
          <span className="text-xs text-slate-400">• Automated Billing Scheduled (Every 60s)</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunBilling}
            disabled={triggerLoading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white hover:opacity-95 shadow-sm transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {triggerLoading ? 'Processing...' : 'Run Billing Run Now'}
          </button>
          <button
            onClick={() => setCurrentTab('subscriptions')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Subscription
          </button>
          <button
            onClick={() => setCurrentTab('quotations')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            <FilePlus className="w-3.5 h-3.5" />
            Create Quotation
          </button>
          <button
            onClick={() => setCurrentTab('payments')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Section 4: KPI Cards (8 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Monthly Recurring Revenue"
          value={`₹${kpi.mrr.toLocaleString('en-IN')}`}
          subtitle="Normalized active recurring rate"
          icon={TrendingUp}
          trend="+18.4% MoM"
          color="purple"
        />
        <KPICard
          title="Annual Recurring Revenue"
          value={`₹${kpi.arr.toLocaleString('en-IN')}`}
          subtitle="Projected run rate"
          icon={ArrowUpRight}
          trend="+22.1% YoY"
          color="blue"
        />
        <KPICard
          title="Active Subscriptions"
          value={kpi.activeSubscriptions}
          subtitle="Customer contracts running"
          icon={Repeat}
          color="emerald"
        />
        <KPICard
          title="Total Customers"
          value={kpi.totalCustomers}
          subtitle="Enterprise & SMB accounts"
          icon={Users}
          color="purple"
        />
        <KPICard
          title="Total Revenue Collected"
          value={`₹${kpi.totalRevenue.toLocaleString('en-IN')}`}
          subtitle="Settled payments received"
          icon={CreditCard}
          color="emerald"
        />
        <KPICard
          title="Outstanding Payments"
          value={`₹${kpi.outstandingPayments.toLocaleString('en-IN')}`}
          subtitle="Unpaid issued invoice balances"
          icon={Clock}
          color="amber"
        />
        <KPICard
          title="Overdue Invoices"
          value={kpi.overdueInvoicesCount}
          subtitle={`₹${kpi.overdueInvoicesAmount.toLocaleString('en-IN')} past due`}
          icon={AlertOctagon}
          trend={kpi.overdueInvoicesCount > 0 ? 'Requires Follow-up' : 'All Clear'}
          trendPositive={kpi.overdueInvoicesCount === 0}
          color="rose"
        />
        <KPICard
          title="Expiring Subscriptions"
          value={kpi.expiringSubscriptions}
          subtitle="Expiring in next 30 days"
          icon={Calendar}
          color="amber"
        />
      </div>

      {/* Section 4: Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trends */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Monthly Revenue & Collection Trends</h3>
              <p className="text-xs text-slate-500">Invoiced value vs actual collected payments (Last 6 Months)</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
              Historical DB Data
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyTrends}>
                <defs>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="invoiced" name="Invoiced Amount" stroke="#7c3aed" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInvoiced)" />
                <Area type="monotone" dataKey="collected" name="Collected Payments" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCollected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Growth & Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Subscription Status Breakdown</h3>
            <p className="text-xs text-slate-500">Live portfolio breakdown across states</p>
          </div>
          <div className="h-60 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.subscriptionStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {charts.subscriptionStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} subscriptions`, name]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
            {charts.subscriptionStatus.map((item, idx) => (
              <div key={item.status} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-600 truncate">{item.status}:</span>
                <span className="font-bold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Product */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Revenue by Product</h3>
            <p className="text-xs text-slate-500">Top catalog items generating recurring revenue</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenueByProduct} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <YAxis dataKey="name" type="category" width={110} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#334155' }} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="value" fill="#7c3aed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Billing Cycle */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Revenue by Billing Cycle</h3>
            <p className="text-xs text-slate-500">Monthly vs Annual vs Weekly distribution</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.billingCycles}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="frequency" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Payment Collections by Gateway/Method</h3>
            <p className="text-xs text-slate-500">UPI, Cards, NetBanking distribution</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.paymentMethods}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="amount"
                  nameKey="method"
                  label={(entry) => entry.method}
                >
                  {charts.paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Collected']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 4: Dynamic Activity Lists (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Payment Transactions</h3>
              <p className="text-xs text-slate-500">Latest settled invoice payments</p>
            </div>
            <button
              onClick={() => setCurrentTab('payments')}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
            >
              View All Payments
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {lists.recentTransactions.map((tx: any) => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{tx.customer?.companyName || tx.customer?.contactName}</p>
                  <p className="text-[11px] text-slate-500">
                    Inv: {tx.invoice?.invoiceNumber} • {tx.paymentMethod}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-600">+₹{tx.amount.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(tx.paymentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Upcoming Subscription Renewals</h3>
              <p className="text-xs text-slate-500">Scheduled for recurring invoice dispatch</p>
            </div>
            <button
              onClick={() => setCurrentTab('subscriptions')}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
            >
              View All Subscriptions
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {lists.upcomingRenewals.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No upcoming renewals in next 30 days.</p>
            ) : (
              lists.upcomingRenewals.map((sub: any) => (
                <div key={sub.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{sub.customer?.companyName || sub.customer?.contactName}</p>
                    <p className="text-[11px] text-slate-500">{sub.plan?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-brand-600">
                      {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'Pending'}
                    </p>
                    <StatusBadge status="ACTIVE" size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
