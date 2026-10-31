"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class ProductController {
    static async listProducts(req, res) {
        const { search, status, type } = req.query;
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (type && type !== 'ALL') {
            where.type = type;
        }
        if (search) {
            const q = String(search).trim();
            where.OR = [
                { name: { contains: q } },
                { code: { contains: q } },
                { description: { contains: q } },
            ];
        }
        const products = await prisma_1.default.product.findMany({
            where,
            include: {
                variants: true,
                plans: true,
                _count: {
                    select: {
                        subscriptionLines: true,
                        invoiceLines: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: products });
    }
    static async getProductById(req, res) {
        const { id } = req.params;
        const product = await prisma_1.default.product.findUnique({
            where: { id },
            include: {
                variants: true,
                plans: true,
            },
        });
        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }
        res.json({ success: true, data: product });
    }
    static async createProduct(req, res) {
        const { name, code, type, salesPrice, costPrice, description, imageUrl, variants } = req.body;
        const existing = await prisma_1.default.product.findUnique({ where: { code } });
        if (existing) {
            res.status(400).json({ success: false, message: 'Product code must be unique.' });
            return;
        }
        const product = await prisma_1.default.product.create({
            data: {
                name,
                code: code.toUpperCase(),
                type: type || 'SERVICE',
                salesPrice: Number(salesPrice),
                costPrice: Number(costPrice || 0),
                description,
                imageUrl,
                status: 'ACTIVE',
                variants: variants && Array.isArray(variants) ? {
                    create: variants.map((v) => ({
                        name: v.name,
                        variantType: v.variantType || 'Brand',
                        variantValue: v.variantValue || v.name,
                        additionalPrice: Number(v.additionalPrice || 0),
                        sku: v.sku,
                        status: 'ACTIVE',
                    })),
                } : undefined,
            },
            include: { variants: true },
        });
        res.status(201).json({ success: true, message: 'Product created successfully', data: product });
    }
    static async updateProduct(req, res) {
        const { id } = req.params;
        const { name, type, salesPrice, costPrice, description, imageUrl, status } = req.body;
        const updated = await prisma_1.default.product.update({
            where: { id },
            data: {
                name: name || undefined,
                type: type || undefined,
                salesPrice: salesPrice !== undefined ? Number(salesPrice) : undefined,
                costPrice: costPrice !== undefined ? Number(costPrice) : undefined,
                description: description !== undefined ? description : undefined,
                imageUrl: imageUrl !== undefined ? imageUrl : undefined,
                status: status || undefined,
            },
            include: { variants: true, plans: true },
        });
        res.json({ success: true, message: 'Product updated successfully', data: updated });
    }
    static async addVariant(req, res) {
        const { id: productId } = req.params;
        const { name, variantType, variantValue, additionalPrice, sku } = req.body;
        const variant = await prisma_1.default.productVariant.create({
            data: {
                productId,
                name,
                variantType: variantType || 'Brand',
                variantValue: variantValue || name,
                additionalPrice: Number(additionalPrice || 0),
                sku,
                status: 'ACTIVE',
            },
        });
        res.status(201).json({ success: true, message: 'Variant added successfully', data: variant });
    }
    static async updateVariant(req, res) {
        const { variantId } = req.params;
        const { name, variantType, variantValue, additionalPrice, sku, status } = req.body;
        const variant = await prisma_1.default.productVariant.update({
            where: { id: variantId },
            data: {
                name: name || undefined,
                variantType: variantType || undefined,
                variantValue: variantValue || undefined,
                additionalPrice: additionalPrice !== undefined ? Number(additionalPrice) : undefined,
                sku: sku !== undefined ? sku : undefined,
                status: status || undefined,
            },
        });
        res.json({ success: true, message: 'Variant updated successfully', data: variant });
    }
    static async deleteVariant(req, res) {
        const { variantId } = req.params;
        await prisma_1.default.productVariant.delete({ where: { id: variantId } });
        res.json({ success: true, message: 'Variant deleted successfully' });
    }
    static async deleteProduct(req, res) {
        const { id } = req.params;
        await prisma_1.default.product.update({
            where: { id },
            data: { status: 'ARCHIVED' },
        });
        res.json({ success: true, message: 'Product archived successfully' });
    }
}
exports.ProductController = ProductController;
