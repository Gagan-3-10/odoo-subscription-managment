"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class DiscountController {
    static async listDiscounts(req, res) {
        const { status, type } = req.query;
        const where = {};
        if (status && status !== 'ALL')
            where.status = status;
        if (type && type !== 'ALL')
            where.discountType = type;
        const discounts = await prisma_1.default.discount.findMany({
            where,
            include: {
                _count: { select: { usages: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: discounts });
    }
    static async createDiscount(req, res) {
        const { name, code, discountType, discountValue, minPurchaseAmount = 0, minQuantity = 1, applicableProducts = 'ALL', maxUsageCount, startDate, endDate, } = req.body;
        const existing = await prisma_1.default.discount.findUnique({ where: { code } });
        if (existing) {
            res.status(400).json({ success: false, message: 'Discount coupon code must be unique.' });
            return;
        }
        const discount = await prisma_1.default.discount.create({
            data: {
                name,
                code: code.toUpperCase(),
                discountType: discountType || 'PERCENTAGE',
                discountValue: Number(discountValue),
                minPurchaseAmount: Number(minPurchaseAmount || 0),
                minQuantity: Number(minQuantity || 1),
                applicableProducts,
                maxUsageCount: maxUsageCount ? Number(maxUsageCount) : null,
                currentUsageCount: 0,
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : null,
                status: 'ACTIVE',
            },
        });
        res.status(201).json({ success: true, message: 'Discount rule created successfully', data: discount });
    }
    static async validateDiscount(req, res) {
        const { code, amount = 0, quantity = 1 } = req.body;
        const discount = await prisma_1.default.discount.findUnique({
            where: { code: String(code).toUpperCase() },
        });
        if (!discount || discount.status !== 'ACTIVE') {
            res.status(400).json({ success: false, message: 'Invalid or inactive discount code.' });
            return;
        }
        const now = new Date();
        if (discount.startDate && new Date(discount.startDate) > now) {
            res.status(400).json({ success: false, message: 'This discount rule is not yet active.' });
            return;
        }
        if (discount.endDate && new Date(discount.endDate) < now) {
            res.status(400).json({ success: false, message: 'This discount code has expired.' });
            return;
        }
        if (discount.maxUsageCount && discount.currentUsageCount >= discount.maxUsageCount) {
            res.status(400).json({ success: false, message: 'This discount has reached its maximum usage limit.' });
            return;
        }
        if (Number(amount) < discount.minPurchaseAmount) {
            res.status(400).json({
                success: false,
                message: `Minimum order amount of ₹${discount.minPurchaseAmount} is required for this discount.`,
            });
            return;
        }
        if (Number(quantity) < discount.minQuantity) {
            res.status(400).json({
                success: false,
                message: `Minimum quantity of ${discount.minQuantity} is required for this discount.`,
            });
            return;
        }
        let calculatedDiscount = 0;
        if (discount.discountType === 'PERCENTAGE') {
            calculatedDiscount = (Number(amount) * discount.discountValue) / 100;
        }
        else {
            calculatedDiscount = Math.min(Number(amount), discount.discountValue);
        }
        res.json({
            success: true,
            data: {
                discountId: discount.id,
                code: discount.code,
                name: discount.name,
                discountType: discount.discountType,
                discountValue: discount.discountValue,
                calculatedDiscount: Math.round(calculatedDiscount * 100) / 100,
            },
        });
    }
    static async toggleStatus(req, res) {
        const { id } = req.params;
        const discount = await prisma_1.default.discount.findUnique({ where: { id } });
        if (!discount) {
            res.status(404).json({ success: false, message: 'Discount not found.' });
            return;
        }
        const newStatus = discount.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const updated = await prisma_1.default.discount.update({
            where: { id },
            data: { status: newStatus },
        });
        res.json({ success: true, message: `Discount set to ${newStatus}`, data: updated });
    }
}
exports.DiscountController = DiscountController;
