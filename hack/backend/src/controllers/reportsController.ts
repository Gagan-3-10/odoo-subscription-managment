import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { roundMoney } from '../utils/billingCalculator';

const getDateFilter = (filter?: string, customStart?: string, customEnd?: string) => {
  const now = new Date();
  let start = new Date(0);
  let end = new Date(2100, 0, 1);

  if (filter === 'TODAY') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  } else if (filter === 'THIS_WEEK') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
  } else if (filter === 'THIS_MONTH') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (filter === 'THIS_QUARTER') {
    const quarter = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), quarter * 3, 1);
  } else if (filter === 'THIS_YEAR') {
    start = new Date(now.getFullYear(), 0, 1);
  } else if (filter === 'CUSTOM' && customStart) {
    start = new Date(customStart);
    if (customEnd) end = new Date(new Date(customEnd).setHours(23, 59, 59));
  }

  return { start, end };
};

export class ReportsController {
  static async getReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { type = 'REVENUE', dateFilter = 'THIS_MONTH', startDate, endDate } = req.query;
    const { start, end } = getDateFilter(dateFilter as string, startDate as string, endDate as string);

    let reportData: any[] = [];
    let summary: any = {};

    switch (type) {
      case 'REVENUE': {
        const invoices = await prisma.invoice.findMany({
          where: { issueDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
          include: { customer: true, subscription: true },
          orderBy: { issueDate: 'desc' },
        });

        const totalInvoiced = roundMoney(invoices.reduce((a, b) => a + b.totalAmount, 0));
        const totalPaid = roundMoney(invoices.reduce((a, b) => a + b.amountPaid, 0));
        const totalOutstanding = roundMoney(invoices.reduce((a, b) => a + b.balanceDue, 0));

        summary = { totalInvoiced, totalPaid, totalOutstanding, count: invoices.length };
        reportData = invoices.map(i => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          customer: i.customer.contactName,
          company: i.customer.companyName || '-',
          date: i.issueDate.toISOString().split('T')[0],
          dueDate: i.dueDate.toISOString().split('T')[0],
          subtotal: i.subtotal,
          tax: i.taxAmount,
          discount: i.discountAmount,
          total: i.totalAmount,
          paid: i.amountPaid,
          balance: i.balanceDue,
          status: i.status,
        }));
        break;
      }

      case 'PAYMENTS': {
        const payments = await prisma.payment.findMany({
          where: { paymentDate: { gte: start, lte: end } },
          include: { customer: true, invoice: true },
          orderBy: { paymentDate: 'desc' },
        });

        const totalCollected = roundMoney(payments.reduce((a, b) => a + b.amount, 0));
        summary = { totalCollected, count: payments.length };
        reportData = payments.map(p => ({
          paymentNumber: p.paymentNumber,
          invoiceNumber: p.invoice.invoiceNumber,
          customer: p.customer.contactName,
          company: p.customer.companyName || '-',
          amount: p.amount,
          method: p.paymentMethod,
          transactionRef: p.transactionRef || '-',
          date: p.paymentDate.toISOString().split('T')[0],
          status: p.status,
        }));
        break;
      }

      case 'SUBSCRIPTIONS': {
        const subscriptions = await prisma.subscription.findMany({
          where: { createdAt: { gte: start, lte: end } },
          include: { customer: true, plan: true },
          orderBy: { createdAt: 'desc' },
        });

        const totalValue = roundMoney(subscriptions.reduce((a, b) => a + b.totalAmount, 0));
        summary = { totalValue, count: subscriptions.length };
        reportData = subscriptions.map(s => ({
          subscriptionNumber: s.subscriptionNumber,
          customer: s.customer.contactName,
          plan: s.plan.name,
          frequency: s.billingFrequency,
          amount: s.totalAmount,
          status: s.status,
          startDate: s.startDate.toISOString().split('T')[0],
          expiryDate: s.expiryDate.toISOString().split('T')[0],
        }));
        break;
      }

      case 'TAXES': {
        const invoiceLines = await prisma.invoiceLine.findMany({
          where: { invoice: { issueDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } } },
          include: { invoice: true, product: true },
        });

        let totalTaxCollected = 0;
        const taxGroup: Record<number, number> = {};
        invoiceLines.forEach(l => {
          const taxable = l.lineTotal / (1 + (l.taxRate / 100));
          const taxVal = l.lineTotal - taxable;
          totalTaxCollected += taxVal;
          taxGroup[l.taxRate] = (taxGroup[l.taxRate] || 0) + taxVal;
        });

        summary = { totalTaxCollected: roundMoney(totalTaxCollected) };
        reportData = Object.entries(taxGroup).map(([rate, amt]) => ({
          taxSlab: `${rate}% GST`,
          taxCollected: roundMoney(amt),
        }));
        break;
      }

      default:
        res.status(400).json({ success: false, message: 'Invalid report type' });
        return;
    }

    res.json({ success: true, type, filter: dateFilter, summary, data: reportData });
  }

  static async exportCSV(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { type = 'REVENUE', dateFilter = 'THIS_MONTH' } = req.query;
    const { start, end } = getDateFilter(dateFilter as string);

    let rows: any[] = [];
    let headers: string[] = [];

    if (type === 'REVENUE' || type === 'INVOICES') {
      const invoices = await prisma.invoice.findMany({
        where: { issueDate: { gte: start, lte: end } },
        include: { customer: true },
        orderBy: { issueDate: 'desc' },
      });
      headers = ['Invoice Number', 'Customer', 'Issue Date', 'Due Date', 'Total (INR)', 'Paid (INR)', 'Balance (INR)', 'Status'];
      rows = invoices.map(i => [
        i.invoiceNumber,
        `"${i.customer.contactName}"`,
        i.issueDate.toISOString().split('T')[0],
        i.dueDate.toISOString().split('T')[0],
        i.totalAmount,
        i.amountPaid,
        i.balanceDue,
        i.status,
      ]);
    } else if (type === 'PAYMENTS') {
      const payments = await prisma.payment.findMany({
        where: { paymentDate: { gte: start, lte: end } },
        include: { customer: true, invoice: true },
        orderBy: { paymentDate: 'desc' },
      });
      headers = ['Payment Number', 'Invoice Number', 'Customer', 'Amount (INR)', 'Method', 'Transaction Ref', 'Date', 'Status'];
      rows = payments.map(p => [
        p.paymentNumber,
        p.invoice.invoiceNumber,
        `"${p.customer.contactName}"`,
        p.amount,
        p.paymentMethod,
        p.transactionRef,
        p.paymentDate.toISOString().split('T')[0],
        p.status,
      ]);
    } else {
      const subs = await prisma.subscription.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { customer: true, plan: true },
      });
      headers = ['Subscription Number', 'Customer', 'Plan', 'Frequency', 'Amount (INR)', 'Status', 'Start Date', 'Expiry Date'];
      rows = subs.map(s => [
        s.subscriptionNumber,
        `"${s.customer.contactName}"`,
        `"${s.plan.name}"`,
        s.billingFrequency,
        s.totalAmount,
        s.status,
        s.startDate.toISOString().split('T')[0],
        s.expiryDate.toISOString().split('T')[0],
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Brightloop-${type}-Report.csv"`);
    res.send(csvContent);
  }
}
