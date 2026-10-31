import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { BillingService } from '../services/billingService';
import { PDFService } from '../services/pdfService';
import { NotificationService } from '../services/notificationService';

export class InvoiceController {
  static async listInvoices(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { status, customerId, search, overdueOnly } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (customerId && customerId !== 'ALL') where.customerId = customerId;

    // Customer isolation
    if (req.user?.role === 'CUSTOMER' && req.user.customerId) {
      where.customerId = req.user.customerId;
    }

    if (overdueOnly === 'true') {
      where.status = { not: 'PAID' };
      where.dueDate = { lt: new Date() };
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { invoiceNumber: { contains: q } },
        { customer: { contactName: { contains: q } } },
        { customer: { companyName: { contains: q } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        subscription: true,
        _count: { select: { payments: true } },
      },
      orderBy: { issueDate: 'desc' },
    });

    res.json({ success: true, data: invoices });
  }

  static async getInvoiceById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: { include: { plan: true } },
        lines: { include: { product: true, variant: true } },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: { recordedBy: { select: { name: true, email: true } } },
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    // Customer isolation
    if (req.user?.role === 'CUSTOMER' && req.user.customerId !== invoice.customerId) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    res.json({ success: true, data: invoice });
  }

  static async downloadInvoicePDF(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: true,
        lines: { include: { product: true, variant: true } },
      },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    // Customer isolation
    if (req.user?.role === 'CUSTOMER' && req.user.customerId !== invoice.customerId) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    PDFService.generateInvoicePDF(invoice, res);
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: { customer: true },
    });

    res.json({ success: true, message: `Invoice status updated to ${status}`, data: invoice });
  }

  /**
   * Run automated billing engine on demand
   */
  static async runAutomatedBilling(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await BillingService.runAutomatedBilling();
    res.json({
      success: true,
      message: `Automated billing processed ${result.processed} subscriptions. Created ${result.invoicesCreated} invoices.`,
      data: result,
    });
  }

  /**
   * Check and mark overdue invoices
   */
  static async checkOverdueInvoices(req: AuthenticatedRequest, res: Response): Promise<void> {
    const now = new Date();
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
        balanceDue: { gt: 0 },
      },
      include: { customer: true },
    });

    for (const inv of overdueInvoices) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { status: 'OVERDUE' },
      });

      if (inv.customer.userId) {
        await NotificationService.send({
          userId: inv.customer.userId,
          title: `Invoice Overdue: ${inv.invoiceNumber}`,
          message: `Your invoice ${inv.invoiceNumber} for ₹${inv.balanceDue} is past its due date. Please settle your outstanding balance.`,
          type: 'ERROR',
          link: `/invoices/${inv.id}`,
        });
      }
    }

    res.json({
      success: true,
      message: `Marked ${overdueInvoices.length} invoices as OVERDUE.`,
      count: overdueInvoices.length,
    });
  }
}
