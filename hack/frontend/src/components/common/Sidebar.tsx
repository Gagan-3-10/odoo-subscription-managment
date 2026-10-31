import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  FileCheck,
  Repeat,
  Package,
  Layers,
  CalendarCheck,
  Receipt,
  CreditCard,
  Percent,
  Tag,
  BarChart3,
  ShieldAlert,
  Bell,
  Settings,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
}) => {
  const { user, logout, isAdmin, isStaff, isCustomer } = useAuth();

  // Navigation schema based on Section 18: MAIN NAVIGATION
  const navSections = [
    {
      title: 'OVERVIEW',
      allowedRoles: ['ADMIN', 'STAFF'],
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'SALES',
      allowedRoles: ['ADMIN', 'STAFF'],
      items: [
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'quotations', label: 'Quotations', icon: FileText },
        { id: 'quotation-templates', label: 'Quotation Templates', icon: FileCheck },
        { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
      ],
    },
    {
      title: 'CATALOG',
      allowedRoles: ['ADMIN', 'STAFF', 'CUSTOMER'],
      items: [
        { id: 'products', label: 'Products & Variants', icon: Package },
        { id: 'plans', label: 'Subscription Plans', icon: Layers },
      ],
    },
    {
      title: 'BILLING',
      allowedRoles: ['ADMIN', 'STAFF'],
      items: [
        { id: 'invoices', label: 'Invoices', icon: Receipt },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'taxes', label: 'Taxes', icon: Percent, adminOnly: true },
        { id: 'discounts', label: 'Discounts', icon: Tag, adminOnly: true },
      ],
    },
    {
      title: 'ANALYTICS',
      allowedRoles: ['ADMIN', 'STAFF'],
      items: [
        { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
      ],
    },
    {
      title: 'CUSTOMER PORTAL',
      allowedRoles: ['CUSTOMER'],
      items: [
        { id: 'customer-portal', label: 'My Subscriptions', icon: Repeat },
        { id: 'customer-invoices', label: 'My Invoices & Receipts', icon: Receipt },
        { id: 'customer-payments', label: 'Payment History', icon: CreditCard },
        { id: 'customer-profile', label: 'Account Profile', icon: UserCheck },
      ],
    },
    {
      title: 'SYSTEM',
      allowedRoles: ['ADMIN', 'STAFF'],
      items: [
        { id: 'staff', label: 'Staff Management', icon: ShieldAlert, adminOnly: true },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'activity-logs', label: 'Audit Activity Logs', icon: Activity },
        { id: 'settings', label: 'System Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white border-r border-slate-200/80 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => setCurrentTab(isCustomer ? 'customer-portal' : 'dashboard')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
                Bright<span className="text-brand-600">loop</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-0.5">
                Subscription Cloud
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition hidden lg:block"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => {
          if (!section.allowedRoles.includes(user?.role || '')) return null;

          return (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <h4 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {section.title}
                </h4>
              )}
              {section.items.map((item) => {
                if (item.adminOnly && !isAdmin) return null;
                const isActive = currentTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Footer & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className={`flex items-center gap-3 p-2 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
              <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                isAdmin ? 'bg-purple-100 text-purple-700' : isStaff ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {user?.role || 'Guest'}
              </span>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
