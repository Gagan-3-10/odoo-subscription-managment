import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export class TaxController {
  static async listTaxes(req: Request, res: Response): Promise<void> {
    const { status, type } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (type && type !== 'ALL') where.taxType = type;

    const taxes = await prisma.tax.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: taxes });
  }

  static async createTax(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, code, percentage, taxType, applicableProducts = 'ALL', effectiveStart, effectiveEnd } = req.body;

    const existing = await prisma.tax.findUnique({ where: { code } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Tax code must be unique.' });
      return;
    }

    const tax = await prisma.tax.create({
      data: {
        name,
        code: code.toUpperCase(),
        percentage: Number(percentage),
        taxType: taxType || 'GST',
        applicableProducts,
        effectiveStart: effectiveStart ? new Date(effectiveStart) : new Date(),
        effectiveEnd: effectiveEnd ? new Date(effectiveEnd) : null,
        status: 'ACTIVE',
      },
    });

    res.status(201).json({ success: true, message: 'Tax rule created successfully', data: tax });
  }

  static async updateTax(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, percentage, taxType, applicableProducts, effectiveStart, effectiveEnd, status } = req.body;

    const updated = await prisma.tax.update({
      where: { id },
      data: {
        name: name || undefined,
        percentage: percentage !== undefined ? Number(percentage) : undefined,
        taxType: taxType || undefined,
        applicableProducts: applicableProducts || undefined,
        effectiveStart: effectiveStart ? new Date(effectiveStart) : undefined,
        effectiveEnd: effectiveEnd !== undefined ? (effectiveEnd ? new Date(effectiveEnd) : null) : undefined,
        status: status || undefined,
      },
    });

    res.json({ success: true, message: 'Tax rule updated successfully', data: updated });
  }

  static async toggleStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const tax = await prisma.tax.findUnique({ where: { id } });
    if (!tax) {
      res.status(404).json({ success: false, message: 'Tax not found.' });
      return;
    }

    const newStatus = tax.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await prisma.tax.update({
      where: { id },
      data: { status: newStatus },
    });

    res.json({ success: true, message: `Tax rule set to ${newStatus}`, data: updated });
  }
}
