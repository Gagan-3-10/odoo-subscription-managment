import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Play,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { NotificationItem } from '../../types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, collapsed }) => {
  const { user, isAdmin, isStaff, quickSwitchRole } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [billingRunning, setBillingRunning] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 20000);
    return () => clearInterval(timer);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (e) {
      // ignore
    }
  };

  const handleTriggerAutomatedBilling = async () => {
    setBillingRunning(true);
    setBillingMessage(null);
    try {
      const res = await api.post('/invoices/run-automated-billing');
      if (res.data?.success) {
        setBillingMessage(res.data.message);
        fetchNotifications();
        setTimeout(() => setBillingMessage(null), 5000);
      }
    } catch (err: any) {
      setBillingMessage(err.response?.data?.message || 'Billing run failed');
    } finally {
      setBillingRunning(false);
    }
  };

  const pageTitles: Record<string, string> = {
    dashboard: 'Executive Dashboard & KPI Analytics',
    customers: 'Customer Directory & Accounts',
    quotations: 'Sales Quotations & Proposals',
    'quotation-templates': 'Reusable Quotation Templates',
    subscriptions: 'Subscription Lifecycle Management',
    products: 'Product Catalog & Variant Pricing',
    plans: 'Subscription Plans & Tiers',
    invoices: 'Invoice Management & Recurring Invoices',
    payments: 'Payment Transactions & Reconciliation',
    taxes: 'Tax Configuration (GST, CGST, SGST, IGST)',
    discounts: 'Discount Coupons & Promotion Rules',
    reports: 'Financial Reports & Analytics',
    staff: 'Staff Access & RBAC Administration',
    notifications: 'System Notifications & Email Logs',
    'activity-logs': 'Immutable Activity & Audit Logs',
    settings: 'System & Gateway Configuration',
    'customer-portal': 'Customer Portal — Subscriptions',
    'customer-invoices': 'Customer Portal — Invoices',
    'customer-payments': 'Customer Portal — Payment History',
    'customer-profile': 'Customer Portal — Account Profile',
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300 flex items-center justify-between px-6 ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Title & Page Breadcrumb */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-slate-900 tracking-tight">
          {pageTitles[currentTab] || 'Brightloop'}
        </h1>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        {/* Automated Billing Trigger (Admin & Staff) */}
        {(isAdmin || isStaff) && (
          <button
            onClick={handleTriggerAutomatedBilling}
            disabled={billingRunning}
            className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition shadow-xs disabled:opacity-50"
            title="Evaluate and process all due subscriptions for billing immediately"
          >
            {billingRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-indigo-700" />
            )}
            Run Automated Billing
          </button>
        )}

        {/* Quick Role Switcher for Hackathon Reviewers */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-1.5">Demo Role:</span>
          <button
            onClick={() => quickSwitchRole('ADMIN')}
            className={`px-2 py-0.5 text-xs font-bold rounded-md transition ${
              user?.role === 'ADMIN' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => quickSwitchRole('STAFF')}
            className={`px-2 py-0.5 text-xs font-bold rounded-md transition ${
              user?.role === 'STAFF' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Staff
          </button>
          <button
            onClick={() => quickSwitchRole('CUSTOMER')}
            className={`px-2 py-0.5 text-xs font-bold rounded-md transition ${
              user?.role === 'CUSTOMER' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Customer
          </button>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl relative transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-float border border-slate-200/80 p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-brand-50 text-brand-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setCurrentTab('notifications')}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  View All
                </button>
              </div>

              <div className="mt-2 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">No notifications yet.</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`py-3 px-2 rounded-lg cursor-pointer transition flex items-start gap-3 ${
                        n.isRead ? 'opacity-70' : 'bg-slate-50/70 font-medium'
                      }`}
                    >
                      <div className="mt-0.5">
                        {n.type === 'SUCCESS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : n.type === 'ERROR' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-brand-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{n.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Billing Run Alert Toast */}
      {billingMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-float flex items-center gap-3 text-xs border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{billingMessage}</span>
        </div>
      )}
    </header>
  );
};
