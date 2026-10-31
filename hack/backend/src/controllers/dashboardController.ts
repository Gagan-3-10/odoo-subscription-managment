import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { roundMoney } from '../utils/billingCalculator';

export class DashboardController {
  static async getDashboardMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // 1. KPI Counts and Sums
    const [
      totalCustomers,
      activeSubscriptions,
      allActiveSubs,
      paidInvoicesAgg,
      unpaidInvoicesAgg,
      overdueInvoices,
      expiringSubscriptions,
    ] = await Promise.all([
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        select: { totalAmount: true, billingFrequency: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'OVERDUE'] } },
        _sum: { balanceDue: true },
      }),
      prisma.invoice.findMany({
        where: {
          status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'OVERDUE'] },
          dueDate: { lt: now },
        },
        select: { balanceDue: true },
      }),
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          expiryDate: { lte: thirtyDaysFromNow, gte: now },
        },
      }),
    ]);

    // Calculate MRR from active subscriptions normalized to monthly
    let mrr = 0;
    allActiveSubs.forEach((sub) => {
      const amt = sub.totalAmount || 0;
      switch (sub.billingFrequency.toUpperCase()) {
        case 'DAILY':
          mrr += amt * 30;
          break;
        case 'WEEKLY':
          mrr += amt * 4.33;
          break;
        case 'YEARLY':
          mrr += amt / 12;
          break;
        case 'MONTHLY':
        default:
          mrr += amt;
          break;
      }
    });

    mrr = roundMoney(mrr);
    const arr = roundMoney(mrr * 12);
    const totalRevenue = roundMoney(paidInvoicesAgg._sum.amount || 0);
    const outstandingPayments = roundMoney(unpaidInvoicesAgg._sum.balanceDue || 0);
    const overdueTotal = roundMoney(overdueInvoices.reduce((acc, curr) => acc + (curr.balanceDue || 0), 0));

    // 2. Charts Data
    // Monthly Revenue Trend (Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenueMap: Record<string, { revenue: number; collections: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyRevenueMap[key] = { revenue: 0, collections: 0 };
    }

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [recentPayments, recentInvoices] = await Promise.all([
      prisma.payment.findMany({
        where: { paymentDate: { gte: sixMonthsAgo }, status: 'SUCCESS' },
        select: { amount: true, paymentDate: true },
      }),
      prisma.invoice.findMany({
        where: { issueDate: { gte: sixMonthsAgo }, status: { not: 'CANCELLED' } },
        select: { totalAmount: true, issueDate: true },
      }),
    ]);

    recentInvoices.forEach((inv) => {
      const d = new Date(inv.issueDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (monthlyRevenueMap[key]) {
        monthlyRevenueMap[key].revenue += inv.totalAmount;
      }
    });

    recentPayments.forEach((pay) => {
      const d = new Date(pay.paymentDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (monthlyRevenueMap[key]) {
        monthlyRevenueMap[key].collections += pay.amount;
      }
    });

    const monthlyTrendsChart = Object.keys(monthlyRevenueMap).map((k) => ({
      month: k,
      invoiced: roundMoney(monthlyRevenueMap[k].revenue),
      collected: roundMoney(monthlyRevenueMap[k].collections),
    }));

    // Active vs Cancelled vs Paused Subscriptions
    const subStatuses = await prisma.subscription.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    const subscriptionStatusChart = subStatuses.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    // Revenue by Billing Cycle
    const billingCycleRev = await prisma.subscription.groupBy({
      by: ['billingFrequency'],
      _sum: { totalAmount: true },
      _count: { id: true },
    });
    const billingCycleChart = billingCycleRev.map((b) => ({
      frequency: b.billingFrequency,
      revenue: roundMoney(b._sum.totalAmount || 0),
      subscriptions: b._count.id,
    }));

    // Revenue by Product
    const invoiceLinesWithProduct = await prisma.invoiceLine.findMany({
      select: {
        lineTotal: true,
        product: { select: { name: true } },
      },
      take: 200,
    });
    const productRevMap: Record<string, number> = {};
    invoiceLinesWithProduct.forEach((l) => {
      const pName = l.product?.name || 'Other';
      productRevMap[pName] = (productRevMap[pName] || 0) + l.lineTotal;
    });
    const revenueByProductChart = Object.entries(productRevMap).map(([name, value]) => ({
      name,
      value: roundMoney(value),
    })).sort((a, b) => b.value - a.value).slice(0, 6);

    // Payment collection by method
    const paymentMethods = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      _sum: { amount: true },
      _count: { id: true },
    });
    const paymentMethodsChart = paymentMethods.map((p) => ({
      method: p.paymentMethod,
      amount: roundMoney(p._sum.amount || 0),
      count: p._count.id,
    }));

    // 3. Recent activities & lists
    const [recentTransactions, upcomingRenewals, recentSubscriptions, overdueInvoiceList] = await Promise.all([
      prisma.payment.findMany({
        take: 6,
        orderBy: { paymentDate: 'desc' },
        include: {
          customer: { select: { contactName: true, companyName: true } },
          invoice: { select: { invoiceNumber: true } },
        },
      }),
      prisma.subscription.findMany({
        take: 6,
        where: {
          status: 'ACTIVE',
          nextBillingDate: { lte: thirtyDaysFromNow, gte: now },
        },
        orderBy: { nextBillingDate: 'asc' },
        include: {
          customer: { select: { contactName: true, companyName: true } },
          plan: { select: { name: true } },
        },
      }),
      prisma.subscription.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { contactName: true, companyName: true } },
          plan: { select: { name: true } },
        },
      }),
      prisma.invoice.findMany({
        take: 6,
        where: {
          status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'OVERDUE'] },
          dueDate: { lt: now },
        },
        orderBy: { dueDate: 'asc' },
        include: {
          customer: { select: { contactName: true, companyName: true, phone: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        kpi: {
          totalCustomers,
          activeSubscriptions,
          mrr,
          arr,
          totalRevenue,
          outstandingPayments,
          overdueInvoicesCount: overdueInvoices.length,
          overdueInvoicesAmount: overdueTotal,
          expiringSubscriptions,
        },
        charts: {
          monthlyTrends: monthlyTrendsChart,
          subscriptionStatus: subscriptionStatusChart,
          billingCycles: billingCycleChart,
          revenueByProduct: revenueByProductChart,
          paymentMethods: paymentMethodsChart,
        },
        lists: {
          recentTransactions,
          upcomingRenewals,
          recentSubscriptions,
          overdueInvoices: overdueInvoiceList,
        },
      },
    });
  }
}
