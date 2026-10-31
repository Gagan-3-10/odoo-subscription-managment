import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, Filter, RefreshCw, FileSpreadsheet } from 'lucide-react';
import api from '../../services/api';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('REVENUE');
  const [dateFilter, setDateFilter] = useState('THIS_MONTH');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports', {
        params: { type: reportType, dateFilter },
      });
      if (res.data?.success) {
        setReportData(res.data.data || []);
        setSummary(res.data.summary || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, dateFilter]);

  const handleExportCSV = () => {
    window.open(`/api/reports/export-csv?type=${reportType}&dateFilter=${dateFilter}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Filter and Export Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
          >
            <option value="REVENUE">Revenue & Invoicing Report</option>
            <option value="PAYMENTS">Payments & Collections Report</option>
            <option value="SUBSCRIPTIONS">Subscription Contracts Report</option>
            <option value="TAXES">GST Tax Slab Collection Report</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="THIS_MONTH">This Month</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="TODAY">Today</option>
            <option value="THIS_QUARTER">This Quarter</option>
            <option value="THIS_YEAR">This Year (YTD)</option>
            <option value="ALL">All Time</option>
          </select>
        </div>

        <button
          onClick={handleExportCSV}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export CSV Spreadsheet
        </button>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {reportType === 'REVENUE' && (
          <>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Invoiced</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">₹{(summary.totalInvoiced || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Collected</span>
              <p className="text-xl font-extrabold text-emerald-600 mt-1">₹{(summary.totalPaid || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Outstanding Balance</span>
              <p className="text-xl font-extrabold text-rose-600 mt-1">₹{(summary.totalOutstanding || 0).toLocaleString('en-IN')}</p>
            </div>
          </>
        )}
        {reportType === 'PAYMENTS' && (
          <>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Payments Settled</span>
              <p className="text-xl font-extrabold text-emerald-600 mt-1">₹{(summary.totalCollected || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Transactions Count</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">{summary.count || 0}</p>
            </div>
          </>
        )}
        {reportType === 'SUBSCRIPTIONS' && (
          <>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Contract Value</span>
              <p className="text-xl font-extrabold text-brand-700 mt-1">₹{(summary.totalValue || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Active Subscriptions</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">{summary.count || 0}</p>
            </div>
          </>
        )}
        {reportType === 'TAXES' && (
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-soft">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tax Collected</span>
            <p className="text-xl font-extrabold text-indigo-700 mt-1">₹{(summary.totalTaxCollected || 0).toLocaleString('en-IN')}</p>
          </div>
        )}
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {reportType === 'REVENUE' && (
                  <>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">Tax</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4">Status</th>
                  </>
                )}
                {reportType === 'PAYMENTS' && (
                  <>
                    <th className="py-3 px-4">Payment #</th>
                    <th className="py-3 px-4">Invoice Ref</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Transaction Ref</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </>
                )}
                {reportType === 'SUBSCRIPTIONS' && (
                  <>
                    <th className="py-3 px-4">Subscription #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Frequency</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4 text-right">Recurring Rate</th>
                    <th className="py-3 px-4">Status</th>
                  </>
                )}
                {reportType === 'TAXES' && (
                  <>
                    <th className="py-3 px-4">Tax Bracket / Slab</th>
                    <th className="py-3 px-4 text-right">Tax Collected (₹)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Generating financial report...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No data found for selected period.
                  </td>
                </tr>
              ) : (
                reportData.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    {reportType === 'REVENUE' && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-brand-700">{row.invoiceNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{row.company !== '-' ? row.company : row.customer}</td>
                        <td className="py-3 px-4 text-slate-500">{row.date}</td>
                        <td className="py-3 px-4 text-right font-mono">₹{row.subtotal}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">+₹{row.tax}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{row.total}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600">₹{row.paid}</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600 font-bold">₹{row.balance}</td>
                        <td className="py-3 px-4 font-bold text-[10px] uppercase text-slate-600">{row.status}</td>
                      </>
                    )}
                    {reportType === 'PAYMENTS' && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-brand-700">{row.paymentNumber}</td>
                        <td className="py-3 px-4 font-mono">{row.invoiceNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{row.company !== '-' ? row.company : row.customer}</td>
                        <td className="py-3 px-4">{row.method}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{row.transactionRef}</td>
                        <td className="py-3 px-4 text-slate-500">{row.date}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">₹{row.amount}</td>
                      </>
                    )}
                    {reportType === 'SUBSCRIPTIONS' && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-brand-700">{row.subscriptionNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{row.customer}</td>
                        <td className="py-3 px-4 font-semibold">{row.plan}</td>
                        <td className="py-3 px-4 text-slate-500">{row.frequency}</td>
                        <td className="py-3 px-4 text-slate-500">{row.startDate}</td>
                        <td className="py-3 px-4 text-slate-500">{row.expiryDate}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{row.amount}</td>
                        <td className="py-3 px-4 font-bold text-[10px] uppercase text-slate-600">{row.status}</td>
                      </>
                    )}
                    {reportType === 'TAXES' && (
                      <>
                        <td className="py-3 px-4 font-bold text-slate-900">{row.taxSlab}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">₹{row.taxCollected}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
