import { BillingService } from '../services/billingService';
import prisma from '../config/prisma';
import { NotificationService } from '../services/notificationService';

export class BackgroundScheduler {
  private static intervalId: NodeJS.Timeout | null = null;

  static start(intervalMs: number = 60000) {
    console.log(`[SCHEDULER] Automated Billing & Maintenance Scheduler started (Interval: ${intervalMs / 1000}s)`);

    // Run once on boot after a slight delay
    setTimeout(() => {
      this.runMaintenance();
    }, 5000);

    this.intervalId = setInterval(() => {
      this.runMaintenance();
    }, intervalMs);
  }

  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[SCHEDULER] Background scheduler stopped.');
    }
  }

  static async runMaintenance() {
    try {
      // 1. Run Automated Billing
      const billingResult = await BillingService.runAutomatedBilling();
      if (billingResult.invoicesCreated > 0) {
        console.log(`[SCHEDULER] Automated billing created ${billingResult.invoicesCreated} invoices for due subscriptions.`);
      }

      // 2. Mark overdue invoices
      const now = new Date();
      const overdue = await prisma.invoice.findMany({
        where: {
          dueDate: { lt: now },
          status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
          balanceDue: { gt: 0 },
        },
        include: { customer: true },
      });

      for (const inv of overdue) {
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { status: 'OVERDUE' },
        });

        if (inv.customer.userId) {
          await NotificationService.send({
            userId: inv.customer.userId,
            title: `Payment Overdue: Invoice ${inv.invoiceNumber}`,
            message: `Invoice ${inv.invoiceNumber} for ₹${inv.balanceDue} is overdue. Please process payment.`,
            type: 'ERROR',
            link: `/invoices/${inv.id}`,
          });
        }
      }
    } catch (err) {
      console.error('[SCHEDULER ERROR]:', err);
    }
  }
}
