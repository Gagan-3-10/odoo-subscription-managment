import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';

// Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { PlansPage } from './pages/plans/PlansPage';
import { QuotationsPage } from './pages/quotations/QuotationsPage';
import { QuotationTemplatesPage } from './pages/quotations/QuotationTemplatesPage';
import { SubscriptionsPage } from './pages/subscriptions/SubscriptionsPage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { TaxesPage } from './pages/taxes/TaxesPage';
import { DiscountsPage } from './pages/discounts/DiscountsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { StaffPage } from './pages/staff/StaffPage';
import { CustomerPortalPage } from './pages/customer-portal/CustomerPortalPage';
import { SettingsPage } from './pages/settings/SettingsPage';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';

export const AppContent: React.FC = () => {
  const { user, loading, isCustomer } = useAuth();
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
  const [currentTab, setCurrentTab] = useState<string>(isCustomer ? 'customer-portal' : 'dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // If role is customer and tab is dashboard, default to customer portal
  React.useEffect(() => {
    if (isCustomer && currentTab === 'dashboard') {
      setCurrentTab('customer-portal');
    }
  }, [isCustomer]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Connecting to Brightloop Cloud...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated routing
  if (!user) {
    if (authView === 'REGISTER') {
      return <Register onNavigateLogin={() => setAuthView('LOGIN')} />;
    }
    if (authView === 'FORGOT') {
      return <ForgotPassword onNavigateLogin={() => setAuthView('LOGIN')} />;
    }
    return (
      <Login
        onNavigateRegister={() => setAuthView('REGISTER')}
        onNavigateForgot={() => setAuthView('FORGOT')}
      />
    );
  }

  // Authenticated Main Application Layout
  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage setCurrentTab={setCurrentTab} />;
      case 'customers':
        return <CustomersPage />;
      case 'products':
        return <ProductsPage />;
      case 'plans':
        return <PlansPage />;
      case 'quotations':
        return <QuotationsPage />;
      case 'quotation-templates':
        return <QuotationTemplatesPage />;
      case 'subscriptions':
        return <SubscriptionsPage />;
      case 'invoices':
      case 'customer-invoices':
        return <InvoicesPage />;
      case 'payments':
      case 'customer-payments':
        return <PaymentsPage />;
      case 'taxes':
        return <TaxesPage />;
      case 'discounts':
        return <DiscountsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'staff':
        return <StaffPage />;
      case 'customer-portal':
      case 'customer-profile':
        return <CustomerPortalPage />;
      case 'settings':
        return <SettingsPage />;
      case 'notifications':
      case 'activity-logs':
        return <DashboardPage setCurrentTab={setCurrentTab} />;
      default:
        return <DashboardPage setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Workspace */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          sidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {/* Header */}
        <Header
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          collapsed={sidebarCollapsed}
        />

        {/* Page View Body */}
        <main className="flex-1 pt-20 px-6 pb-12 max-w-7xl w-full mx-auto">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
