"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const billingCalculator_1 = require("../utils/billingCalculator");
const notificationService_1 = require("../services/notificationService");
class PaymentController {
    static async listPayments(req, res) {
        const { customerId, invoiceId, status } = req.query;
        const where = {};
        if (customerId && customerId !== 'ALL')
            where.customerId = customerId;
        if (invoiceId && invoiceId !== 'ALL')
            where.invoiceId = invoiceId;
        if (status && status !== 'ALL')
            where.status = status;
        // Customer isolation
        if (req.user?.role === 'CUSTOMER' && req.user.customerId) {
            where.customerId = req.user.customerId;
        }
        const payments = await prisma_1.default.payment.findMany({
            where,
            include: {
                customer: true,
                invoice: true,
                recordedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { paymentDate: 'desc' },
        });
        res.json({ success: true, data: payments });
    }
    static async recordPayment(req, res) {
        const { invoiceId, amount, paymentMethod = 'UPI', transactionRef, notes, paymentDate } = req.body;
        const invoice = await prisma_1.default.invoice.findUnique({
            where: { id: invoiceId },
            include: { customer: true },
        });
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found.' });
            return;
        }
        const paymentAmount = (0, billingCalculator_1.roundMoney)(Number(amount));
        if (paymentAmount <= 0) {
            res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
            return;
        }
        if (paymentAmount > (0, billingCalculator_1.roundMoney)(invoice.balanceDue)) {
            res.status(400).json({
                success: false,
                message: `Payment amount (₹${paymentAmount}) exceeds the remaining balance due (₹${invoice.balanceDue}).`,
            });
            return;
        }
        // Check duplicate transaction reference if provided
        if (transactionRef) {
            const existingRef = await prisma_1.default.payment.findFirst({
                where: { transactionRef: String(transactionRef).trim() },
            });
            if (existingRef) {
                res.status(400).json({ success: false, message: 'A payment with this transaction reference already exists.' });
                return;
            }
        }
        const paymentNumber = (0, billingCalculator_1.generateDocNumber)('PAY');
        const newAmountPaid = (0, billingCalculator_1.roundMoney)(invoice.amountPaid + paymentAmount);
        const newBalanceDue = (0, billingCalculator_1.roundMoney)(Math.max(0, invoice.totalAmount - newAmountPaid));
        const newInvoiceStatus = newBalanceDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';
        const result = await prisma_1.default.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    paymentNumber,
                    invoiceId: invoice.id,
                    customerId: invoice.customerId,
                    recordedById: req.user?.id || null,
                    amount: paymentAmount,
                    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                    paymentMethod,
                    transactionRef: transactionRef || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
                    notes,
                    status: 'SUCCESS',
                },
                include: { invoice: true, customer: true },
            });
            await tx.invoice.update({
                where: { id: invoice.id },
                data: {
                    amountPaid: newAmountPaid,
                    balanceDue: newBalanceDue,
                    status: newInvoiceStatus,
                },
            });
            await tx.activityLog.create({
                data: {
                    userId: req.user?.id,
                    invoiceId: invoice.id,
                    action: 'PAYMENT_RECORDED',
                    details: `Payment of ₹${paymentAmount} recorded (${paymentMethod}). Invoice status updated to ${newInvoiceStatus}.`,
                },
            });
            return payment;
        });
        // Notify customer
        if (invoice.customer.userId) {
            await notificationService_1.NotificationService.send({
                userId: invoice.customer.userId,
                title: `Payment Received: ₹${paymentAmount}`,
                message: `Your payment of ₹${paymentAmount} for invoice ${invoice.invoiceNumber} was successfully processed via ${paymentMethod}.`,
                type: 'SUCCESS',
                link: `/invoices/${invoice.id}`,
                sendEmail: true,
                emailTo: invoice.customer.email,
            });
        }
        res.status(201).json({
            success: true,
            message: `Payment of ₹${paymentAmount} successfully recorded. Invoice is now ${newInvoiceStatus}.`,
            data: result,
        });
    }
    /**
     * Razorpay Test Mode: Create Checkout Order
     */
    static async createRazorpayOrder(req, res) {
        const { invoiceId, amount } = req.body;
        const invoice = await prisma_1.default.invoice.findUnique({
            where: { id: invoiceId },
            include: { customer: true },
        });
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found.' });
            return;
        }
        const payAmount = amount ? Number(amount) : invoice.balanceDue;
        // Simulated Razorpay Order Object
        const simulatedOrderId = `order_${Math.random().toString(36).substring(2, 12)}`;
        res.json({
            success: true,
            order: {
                id: simulatedOrderId,
                amount: Math.round(payAmount * 100), // in paise
                currency: 'INR',
                invoiceNumber: invoice.invoiceNumber,
                customerName: invoice.customer.contactName,
                customerEmail: invoice.customer.email,
                customerPhone: invoice.customer.phone,
                key: process.env.RAZORPAY_KEY_ID || 'rzp_test_brightloop_demo_key',
            },
        });
    }
    /**
     * Razorpay Test Mode: Confirm Payment Callback
     */
    static async verifyRazorpayPayment(req, res) {
        const { invoiceId, razorpayPaymentId, razorpayOrderId, amount, method = 'CREDIT_CARD' } = req.body;
        if (!razorpayPaymentId) {
            res.status(400).json({ success: false, message: 'Invalid payment confirmation from provider.' });
            return;
        }
        // Call recordPayment logic
        req.body = {
            invoiceId,
            amount,
            paymentMethod: method,
            transactionRef: razorpayPaymentId,
            notes: `Verified via Razorpay Test Gateway (Order: ${razorpayOrderId})`,
        };
        return PaymentController.recordPayment(req, res);
    }
}
exports.PaymentController = PaymentController;
