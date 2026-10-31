"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const billingService_1 = require("../services/billingService");
const pdfService_1 = require("../services/pdfService");
const notificationService_1 = require("../services/notificationService");
class InvoiceController {
    static async listInvoices(req, res) {
        const { status, customerId, search, overdueOnly } = req.query;
        const where = {};
        if (status && status !== 'ALL')
            where.status = status;
        if (customerId && customerId !== 'ALL')
            where.customerId = customerId;
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
        const invoices = await prisma_1.default.invoice.findMany({
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
    static async getInvoiceById(req, res) {
        const { id } = req.params;
        const invoice = await prisma_1.default.invoice.findUnique({
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
    static async downloadInvoicePDF(req, res) {
        const { id } = req.params;
        const invoice = await prisma_1.default.invoice.findUnique({
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
        pdfService_1.PDFService.generateInvoicePDF(invoice, res);
    }
    static async updateStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const invoice = await prisma_1.default.invoice.update({
            where: { id },
            data: { status },
            include: { customer: true },
        });
        res.json({ success: true, message: `Invoice status updated to ${status}`, data: invoice });
    }
    /**
     * Run automated billing engine on demand
     */
    static async runAutomatedBilling(req, res) {
        const result = await billingService_1.BillingService.runAutomatedBilling();
        res.json({
            success: true,
            message: `Automated billing processed ${result.processed} subscriptions. Created ${result.invoicesCreated} invoices.`,
            data: result,
        });
    }
    /**
     * Check and mark overdue invoices
     */
    static async checkOverdueInvoices(req, res) {
        const now = new Date();
        const overdueInvoices = await prisma_1.default.invoice.findMany({
            where: {
                dueDate: { lt: now },
                status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
                balanceDue: { gt: 0 },
            },
            include: { customer: true },
        });
        for (const inv of overdueInvoices) {
            await prisma_1.default.invoice.update({
                where: { id: inv.id },
                data: { status: 'OVERDUE' },
            });
            if (inv.customer.userId) {
                await notificationService_1.NotificationService.send({
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
exports.InvoiceController = InvoiceController;
