export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  status: string;
  customerId?: string;
  customerNumber?: string;
  staffId?: string;
}

export interface Customer {
  id: string;
  userId: string;
  customerNumber: string;
  companyName?: string;
  contactName: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress?: string;
  taxId?: string;
  currency: string;
  status: string;
  createdAt: string;
  user?: { status: string; createdAt: string };
  _count?: {
    subscriptions: number;
    invoices: number;
    payments: number;
  };
}

export interface Staff {
  id: string;
  userId: string;
  employeeId: string;
  department: string;
  designation: string;
  permissions: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    status: string;
    createdAt: string;
  };
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  variantType: string;
  variantValue: string;
  additionalPrice: number;
  sku?: string;
  status: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  type: string;
  salesPrice: number;
  costPrice: number;
  description?: string;
  imageUrl?: string;
  status: string;
  variants?: ProductVariant[];
  plans?: Plan[];
  _count?: {
    subscriptionLines: number;
    invoiceLines: number;
  };
}

export interface Plan {
  id: string;
  productId: string;
  name: string;
  code: string;
  description?: string;
  basePrice: number;
  billingFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  minQuantity: number;
  startAvailabilityDate: string;
  endAvailabilityDate?: string | null;
  autoClose: boolean;
  earlyCancellation: boolean;
  pauseAllowed: boolean;
  renewalAllowed: boolean;
  status: string;
  product?: Product;
}

export interface QuotationLine {
  id?: string;
  productId: string;
  variantId?: string | null;
  planId?: string | null;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  lineTotal: number;
  product?: Product;
  variant?: ProductVariant;
  plan?: Plan;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customer: Customer;
  createdById: string;
  createdBy?: { id: string; name: string; email: string };
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  validityDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  terms?: string;
  convertedSubscriptionId?: string | null;
  createdAt: string;
  lines: QuotationLine[];
}

export interface SubscriptionLine {
  id: string;
  productId: string;
  variantId?: string | null;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  lineTotal: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customer: Customer;
  planId: string;
  plan: Plan;
  status: 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'CANCELLED' | 'EXPIRED';
  billingFrequency: string;
  paymentTerms: string;
  startDate: string;
  expiryDate: string;
  nextBillingDate?: string | null;
  lastBilledDate?: string | null;
  pausedAt?: string | null;
  autoRenew: boolean;
  autoClose: boolean;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  lines: SubscriptionLine[];
  invoices?: Invoice[];
  activityLogs?: ActivityLog[];
}

export interface InvoiceLine {
  id: string;
  productId: string;
  variantId?: string | null;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  lineTotal: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: Customer;
  subscriptionId?: string | null;
  subscription?: Subscription;
  status: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issueDate: string;
  dueDate: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  notes?: string;
  terms?: string;
  createdAt: string;
  lines?: InvoiceLine[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoice?: Invoice;
  customerId: string;
  customer?: Customer;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionRef?: string;
  notes?: string;
  status: string;
}

export interface Tax {
  id: string;
  name: string;
  code: string;
  percentage: number;
  taxType: string;
  applicableProducts: string;
  status: string;
}

export interface Discount {
  id: string;
  name: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchaseAmount: number;
  minQuantity: number;
  applicableProducts: string;
  maxUsageCount?: number | null;
  currentUsageCount: number;
  startDate: string;
  endDate?: string | null;
  status: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user?: { name: string; email: string };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  kpi: {
    totalCustomers: number;
    activeSubscriptions: number;
    mrr: number;
    arr: number;
    totalRevenue: number;
    outstandingPayments: number;
    overdueInvoicesCount: number;
    overdueInvoicesAmount: number;
    expiringSubscriptions: number;
  };
  charts: {
    monthlyTrends: { month: string; invoiced: number; collected: number }[];
    subscriptionStatus: { status: string; count: number }[];
    billingCycles: { frequency: string; revenue: number; subscriptions: number }[];
    revenueByProduct: { name: string; value: number }[];
    paymentMethods: { method: string; amount: number; count: number }[];
  };
  lists: {
    recentTransactions: any[];
    upcomingRenewals: any[];
    recentSubscriptions: any[];
    overdueInvoices: any[];
  };
}
