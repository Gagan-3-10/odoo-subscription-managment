"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class PlanController {
    static async listPlans(req, res) {
        const { frequency, status, productId } = req.query;
        const where = {};
        if (frequency && frequency !== 'ALL')
            where.billingFrequency = frequency;
        if (status && status !== 'ALL')
            where.status = status;
        if (productId && productId !== 'ALL')
            where.productId = productId;
        const plans = await prisma_1.default.plan.findMany({
            where,
            include: {
                product: {
                    include: { variants: true },
                },
                _count: {
                    select: { subscriptions: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: plans });
    }
    static async getPlanById(req, res) {
        const { id } = req.params;
        const plan = await prisma_1.default.plan.findUnique({
            where: { id },
            include: {
                product: {
                    include: { variants: true },
                },
                subscriptions: {
                    take: 10,
                    include: { customer: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!plan) {
            res.status(404).json({ success: false, message: 'Plan not found.' });
            return;
        }
        res.json({ success: true, data: plan });
    }
    static async createPlan(req, res) {
        const { productId, name, code, description, basePrice, billingFrequency, minQuantity = 1, startAvailabilityDate, endAvailabilityDate, autoClose = false, earlyCancellation = true, pauseAllowed = true, renewalAllowed = true, } = req.body;
        const existing = await prisma_1.default.plan.findUnique({ where: { code } });
        if (existing) {
            res.status(400).json({ success: false, message: 'Plan code must be unique.' });
            return;
        }
        const plan = await prisma_1.default.plan.create({
            data: {
                productId,
                name,
                code: code.toUpperCase(),
                description,
                basePrice: Number(basePrice),
                billingFrequency: billingFrequency || 'MONTHLY',
                minQuantity: Number(minQuantity) || 1,
                startAvailabilityDate: startAvailabilityDate ? new Date(startAvailabilityDate) : new Date(),
                endAvailabilityDate: endAvailabilityDate ? new Date(endAvailabilityDate) : null,
                autoClose: Boolean(autoClose),
                earlyCancellation: Boolean(earlyCancellation),
                pauseAllowed: Boolean(pauseAllowed),
                renewalAllowed: Boolean(renewalAllowed),
                status: 'ACTIVE',
            },
            include: { product: true },
        });
        res.status(201).json({ success: true, message: 'Plan created successfully', data: plan });
    }
    static async updatePlan(req, res) {
        const { id } = req.params;
        const { name, description, basePrice, billingFrequency, minQuantity, startAvailabilityDate, endAvailabilityDate, autoClose, earlyCancellation, pauseAllowed, renewalAllowed, status, } = req.body;
        const updated = await prisma_1.default.plan.update({
            where: { id },
            data: {
                name: name || undefined,
                description: description !== undefined ? description : undefined,
                basePrice: basePrice !== undefined ? Number(basePrice) : undefined,
                billingFrequency: billingFrequency || undefined,
                minQuantity: minQuantity !== undefined ? Number(minQuantity) : undefined,
                startAvailabilityDate: startAvailabilityDate ? new Date(startAvailabilityDate) : undefined,
                endAvailabilityDate: endAvailabilityDate !== undefined ? (endAvailabilityDate ? new Date(endAvailabilityDate) : null) : undefined,
                autoClose: autoClose !== undefined ? Boolean(autoClose) : undefined,
                earlyCancellation: earlyCancellation !== undefined ? Boolean(earlyCancellation) : undefined,
                pauseAllowed: pauseAllowed !== undefined ? Boolean(pauseAllowed) : undefined,
                renewalAllowed: renewalAllowed !== undefined ? Boolean(renewalAllowed) : undefined,
                status: status || undefined,
            },
            include: { product: true },
        });
        res.json({ success: true, message: 'Plan updated successfully', data: updated });
    }
    static async toggleStatus(req, res) {
        const { id } = req.params;
        const plan = await prisma_1.default.plan.findUnique({ where: { id } });
        if (!plan) {
            res.status(404).json({ success: false, message: 'Plan not found.' });
            return;
        }
        const newStatus = plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const updated = await prisma_1.default.plan.update({
            where: { id },
            data: { status: newStatus },
        });
        res.json({ success: true, message: `Plan ${newStatus.toLowerCase()} successfully`, data: updated });
    }
}
exports.PlanController = PlanController;
