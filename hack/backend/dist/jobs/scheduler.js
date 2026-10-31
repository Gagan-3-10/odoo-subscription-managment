"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundScheduler = void 0;
const billingService_1 = require("../services/billingService");
const prisma_1 = __importDefault(require("../config/prisma"));
const notificationService_1 = require("../services/notificationService");
class BackgroundScheduler {
    static intervalId = null;
    static start(intervalMs = 60000) {
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
            const billingResult = await billingService_1.BillingService.runAutomatedBilling();
            if (billingResult.invoicesCreated > 0) {
                console.log(`[SCHEDULER] Automated billing created ${billingResult.invoicesCreated} invoices for due subscriptions.`);
            }
            // 2. Mark overdue invoices
            const now = new Date();
            const overdue = await prisma_1.default.invoice.findMany({
                where: {
                    dueDate: { lt: now },
                    status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
                    balanceDue: { gt: 0 },
                },
                include: { customer: true },
            });
            for (const inv of overdue) {
                await prisma_1.default.invoice.update({
                    where: { id: inv.id },
                    data: { status: 'OVERDUE' },
                });
                if (inv.customer.userId) {
                    await notificationService_1.NotificationService.send({
                        userId: inv.customer.userId,
                        title: `Payment Overdue: Invoice ${inv.invoiceNumber}`,
                        message: `Invoice ${inv.invoiceNumber} for ₹${inv.balanceDue} is overdue. Please process payment.`,
                        type: 'ERROR',
                        link: `/invoices/${inv.id}`,
                    });
                }
            }
        }
        catch (err) {
            console.error('[SCHEDULER ERROR]:', err);
        }
    }
}
exports.BackgroundScheduler = BackgroundScheduler;
