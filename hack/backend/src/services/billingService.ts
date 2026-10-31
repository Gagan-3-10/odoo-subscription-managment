import prisma from '../config/prisma';
import { calculateNextBillingDate, generateDocNumber, roundMoney } from '../utils/billingCalculator';
import { NotificationService } from './notificationService';

export interface BillingRunResult {
  processed: number;
  invoicesCreated: number;
  skipped: number;
  errors: string[];
}

export class BillingService {
  /**
   * Process all subscriptions that are due for billing
   */
  static async runAutomatedBilling(): Promise<BillingRunResult> {
    const result: BillingRunResult = {
      processed: 0,
      invoicesCreated: 0,
      skipped: 0,
      errors: [],
    };

    const now = new Date();

    // Fetch active subscriptions due for billing
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { nextBillingDate: { lte: now } },
          { nextBillingDate: null },
        ],
      },
      include: {
        customer: { include: { user: true } },
        plan: true,
        lines: { include: { product: true, variant: true } },
      },
    });

    for (const sub of dueSubscriptions) {
      result.processed++;

      // Check if subscription has expired
      if (sub.expiryDate && new Date(sub.expiryDate) < now) {
        if (sub.autoClose || !sub.autoRenew) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'EXPIRED' },
          });
          await prisma.activityLog.create({
            data: {
              subscriptionId: sub.id,
              action: 'SUBSCRIPTION_EXPIRED',
              details: `Subscription ${sub.subscriptionNumber} marked as expired on automated billing run.`,
            },
          });
          result.skipped++;
          continue;
        }
      }

      const periodStart = sub.lastBilledDate || sub.startDate;
      const periodEnd = calculateNextBillingDate(periodStart, sub.billingFrequency);

      // Check for duplicate invoice in this billing period
      const existingHistory = await prisma.billingHistory.findFirst({
        where: {
          subscriptionId: sub.id,
          billingPeriodStart: { gte: new Date(new Date(periodStart).setHours(0, 0, 0, 0)) },
          status: 'SUCCESS',
        },
      });

      if (existingHistory) {
        result.skipped++;
        continue;
      }

      // Generate invoice within a transaction
      try {
        await prisma.$transaction(async (tx) => {
          const invoiceNumber = generateDocNumber('INV');
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + (sub.paymentTerms === 'NET_30' ? 30 : sub.paymentTerms === 'NET_15' ? 15 : 7));

          const invoice = await tx.invoice.create({
            data: {
              invoiceNumber,
              customerId: sub.customerId,
              subscriptionId: sub.id,
              status: 'CONFIRMED',
              issueDate: now,
              dueDate,
              billingPeriodStart: periodStart,
              billingPeriodEnd: periodEnd,
              subtotal: sub.subtotal,
              taxAmount: sub.taxAmount,
              discountAmount: sub.discountAmount,
              totalAmount: sub.totalAmount,
              amountPaid: 0,
              balanceDue: sub.totalAmount,
              currency: sub.customer.currency || 'INR',
              notes: `Automated recurring invoice for subscription ${sub.subscriptionNumber} (${sub.billingFrequency})`,
              terms: `Payment term: ${sub.paymentTerms}. Please settle before due date.`,
              lines: {
                create: sub.lines.map((line) => ({
                  productId: line.productId,
                  variantId: line.variantId,
                  description: line.description || `${sub.plan.name} Recurring Charge`,
                  quantity: line.quantity,
                  unitPrice: line.unitPrice,
                  taxRate: line.taxRate,
                  discountRate: line.discountRate,
                  lineTotal: line.lineTotal,
                })),
              },
            },
          });

          // Record billing history
          await tx.billingHistory.create({
            data: {
              subscriptionId: sub.id,
              invoiceId: invoice.id,
              billingPeriodStart: periodStart,
              billingPeriodEnd: periodEnd,
              status: 'SUCCESS',
              amount: sub.totalAmount,
            },
          });

          // Advance nextBillingDate and update lastBilledDate
          const nextBilling = calculateNextBillingDate(now, sub.billingFrequency);
          await tx.subscription.update({
            where: { id: sub.id },
            data: {
              lastBilledDate: now,
              nextBillingDate: nextBilling,
            },
          });

          // Activity log
          await tx.activityLog.create({
            data: {
              subscriptionId: sub.id,
              invoiceId: invoice.id,
              action: 'INVOICE_GENERATED',
              details: `Automated invoice ${invoiceNumber} created for ₹${sub.totalAmount}`,
            },
          });

          result.invoicesCreated++;

          // Send notification to customer
          if (sub.customer.userId) {
            await NotificationService.send({
              userId: sub.customer.userId,
              title: `New Invoice Generated: ${invoiceNumber}`,
              message: `Your subscription invoice ${invoiceNumber} for ₹${sub.totalAmount} has been generated. Due date: ${dueDate.toLocaleDateString()}.`,
              type: 'INFO',
              link: `/invoices/${invoice.id}`,
              sendEmail: true,
              emailTo: sub.customer.email,
            });
          }
        });
      } catch (err: any) {
        console.error(`Error processing subscription ${sub.id}:`, err);
        result.errors.push(`Sub ${sub.subscriptionNumber}: ${err.message}`);

        await prisma.billingHistory.create({
          data: {
            subscriptionId: sub.id,
            billingPeriodStart: periodStart,
            billingPeriodEnd: periodEnd,
            status: 'FAILED',
            amount: sub.totalAmount,
            errorMessage: err.message,
          },
        });
      }
    }

    return result;
  }
}
