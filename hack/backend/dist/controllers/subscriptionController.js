"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const billingCalculator_1 = require("../utils/billingCalculator");
const notificationService_1 = require("../services/notificationService");
class SubscriptionController {
    static async listSubscriptions(req, res) {
        const { status, frequency, search, customerId } = req.query;
        const where = {};
        if (status && status !== 'ALL')
            where.status = status;
        if (frequency && frequency !== 'ALL')
            where.billingFrequency = frequency;
        if (customerId && customerId !== 'ALL')
            where.customerId = customerId;
        // Customer isolation
        if (req.user?.role === 'CUSTOMER' && req.user.customerId) {
            where.customerId = req.user.customerId;
        }
        if (search) {
            const q = String(search).trim();
            where.OR = [
                { subscriptionNumber: { contains: q } },
                { customer: { contactName: { contains: q } } },
                { customer: { companyName: { contains: q } } },
                { plan: { name: { contains: q } } },
            ];
        }
        const subscriptions = await prisma_1.default.subscription.findMany({
            where,
            include: {
                customer: true,
                plan: true,
                lines: { include: { product: true, variant: true } },
                _count: {
                    select: { invoices: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: subscriptions });
    }
    static async getSubscriptionById(req, res) {
        const { id } = req.params;
        const subscription = await prisma_1.default.subscription.findUnique({
            where: { id },
            include: {
                customer: true,
                plan: true,
                lines: { include: { product: true, variant: true } },
                invoices: {
                    orderBy: { issueDate: 'desc' },
                    include: { payments: true },
                },
                billingHistories: {
                    orderBy: { executedAt: 'desc' },
                },
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { name: true, email: true, role: true } } },
                },
            },
        });
        if (!subscription) {
            res.status(404).json({ success: false, message: 'Subscription not found.' });
            return;
        }
        // Customer isolation
        if (req.user?.role === 'CUSTOMER' && req.user.customerId !== subscription.customerId) {
            res.status(403).json({ success: false, message: 'Unauthorized' });
            return;
        }
        res.json({ success: true, data: subscription });
    }
    static async createSubscription(req, res) {
        const { customerId, planId, billingFrequency, paymentTerms = 'IMMEDIATE', startDate, expiryDate, autoRenew = true, autoClose = false, notes, lines } = req.body;
        const plan = await prisma_1.default.plan.findUnique({ where: { id: planId } });
        if (!plan) {
            res.status(404).json({ success: false, message: 'Plan not found.' });
            return;
        }
        const start = startDate ? new Date(startDate) : new Date();
        const frequency = billingFrequency || plan.billingFrequency;
        const expiry = expiryDate ? new Date(expiryDate) : (0, billingCalculator_1.calculateNextBillingDate)(start, 'YEARLY');
        const nextBilling = (0, billingCalculator_1.calculateNextBillingDate)(start, frequency);
        const subscriptionNumber = (0, billingCalculator_1.generateDocNumber)('SUB');
        // Default lines if not provided
        const subLines = lines && lines.length > 0 ? lines : [
            {
                productId: plan.productId,
                description: `${plan.name} Base Subscription`,
                quantity: 1,
                unitPrice: plan.basePrice,
                taxRate: 18,
                discountRate: 0,
                lineTotal: plan.basePrice * 1.18,
            },
        ];
        const totals = (0, billingCalculator_1.calculateTotals)(subLines);
        const subscription = await prisma_1.default.$transaction(async (tx) => {
            const sub = await tx.subscription.create({
                data: {
                    subscriptionNumber,
                    customerId,
                    planId,
                    status: 'ACTIVE',
                    billingFrequency: frequency,
                    paymentTerms,
                    startDate: start,
                    expiryDate: expiry,
                    nextBillingDate: nextBilling,
                    autoRenew: Boolean(autoRenew),
                    autoClose: Boolean(autoClose),
                    subtotal: totals.subtotal,
                    taxAmount: totals.taxAmount,
                    discountAmount: totals.discountAmount,
                    totalAmount: totals.totalAmount,
                    notes,
                    lines: {
                        create: subLines.map((l) => ({
                            productId: l.productId,
                            variantId: l.variantId || null,
                            description: l.description,
                            quantity: Number(l.quantity) || 1,
                            unitPrice: Number(l.unitPrice) || 0,
                            taxRate: Number(l.taxRate) || 0,
                            discountRate: Number(l.discountRate) || 0,
                            lineTotal: Number(l.lineTotal) || (Number(l.quantity) * Number(l.unitPrice)),
                        })),
                    },
                },
                include: { lines: true, customer: true, plan: true },
            });
            await tx.activityLog.create({
                data: {
                    userId: req.user?.id,
                    subscriptionId: sub.id,
                    action: 'SUBSCRIPTION_CREATED',
                    details: `Subscription ${subscriptionNumber} created with ${frequency} billing`,
                },
            });
            return sub;
        });
        res.status(201).json({ success: true, message: 'Subscription created successfully', data: subscription });
    }
    static async changeStatus(req, res) {
        const { id } = req.params;
        const { action } = req.body; // CONFIRM, ACTIVATE, PAUSE, RESUME, RENEW, CANCEL, CLOSE
        const subscription = await prisma_1.default.subscription.findUnique({
            where: { id },
            include: { plan: true, customer: true },
        });
        if (!subscription) {
            res.status(404).json({ success: false, message: 'Subscription not found.' });
            return;
        }
        // Role checks and plan permissions for CUSTOMER role
        if (req.user?.role === 'CUSTOMER') {
            if (req.user.customerId !== subscription.customerId) {
                res.status(403).json({ success: false, message: 'Unauthorized' });
                return;
            }
            if (action === 'PAUSE' || action === 'RESUME') {
                if (!subscription.plan.pauseAllowed) {
                    res.status(400).json({ success: false, message: 'Pausing is not permitted for your subscription plan.' });
                    return;
                }
            }
            if (action === 'CANCEL') {
                if (!subscription.plan.earlyCancellation) {
                    res.status(400).json({ success: false, message: 'Early cancellation is not permitted for your subscription plan.' });
                    return;
                }
            }
        }
        let newStatus = subscription.status;
        let updateData = {};
        const now = new Date();
        switch (action) {
            case 'CONFIRM':
                newStatus = 'CONFIRMED';
                break;
            case 'ACTIVATE':
                newStatus = 'ACTIVE';
                updateData.nextBillingDate = (0, billingCalculator_1.calculateNextBillingDate)(now, subscription.billingFrequency);
                break;
            case 'PAUSE':
                newStatus = 'PAUSED';
                updateData.pausedAt = now;
                break;
            case 'RESUME':
                newStatus = 'ACTIVE';
                updateData.pausedAt = null;
                updateData.nextBillingDate = (0, billingCalculator_1.calculateNextBillingDate)(now, subscription.billingFrequency);
                break;
            case 'RENEW':
                newStatus = 'ACTIVE';
                updateData.expiryDate = (0, billingCalculator_1.calculateNextBillingDate)(subscription.expiryDate, 'YEARLY');
                updateData.nextBillingDate = (0, billingCalculator_1.calculateNextBillingDate)(now, subscription.billingFrequency);
                break;
            case 'CANCEL':
                newStatus = 'CANCELLED';
                break;
            case 'CLOSE':
                newStatus = 'CLOSED';
                break;
            default:
                res.status(400).json({ success: false, message: `Invalid action: ${action}` });
                return;
        }
        updateData.status = newStatus;
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const sub = await tx.subscription.update({
                where: { id },
                data: updateData,
                include: { plan: true, customer: true },
            });
            await tx.activityLog.create({
                data: {
                    userId: req.user?.id,
                    subscriptionId: sub.id,
                    action: `SUBSCRIPTION_${action}`,
                    details: `Subscription ${sub.subscriptionNumber} status updated to ${newStatus} (Action: ${action})`,
                },
            });
            return sub;
        });
        // Notify customer
        if (updated.customer.userId) {
            await notificationService_1.NotificationService.send({
                userId: updated.customer.userId,
                title: `Subscription Status Updated: ${updated.subscriptionNumber}`,
                message: `Your subscription is now ${newStatus}.`,
                type: newStatus === 'ACTIVE' ? 'SUCCESS' : newStatus === 'CANCELLED' ? 'WARNING' : 'INFO',
                link: `/subscriptions/${updated.id}`,
            });
        }
        res.json({
            success: true,
            message: `Subscription ${action.toLowerCase()}d successfully`,
            data: updated,
        });
    }
}
exports.SubscriptionController = SubscriptionController;
