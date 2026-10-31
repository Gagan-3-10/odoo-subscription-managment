import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateNextBillingDate, calculateTotals, generateDocNumber } from '../utils/billingCalculator';

export class QuotationController {
  static async listQuotations(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { status, customerId } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (customerId && customerId !== 'ALL') where.customerId = customerId;

    // Customer isolation
    if (req.user?.role === 'CUSTOMER' && req.user.customerId) {
      where.customerId = req.user.customerId;
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true } },
        lines: {
          include: { product: true, variant: true, plan: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: quotations });
  }

  static async getQuotationById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true } },
        lines: {
          include: { product: true, variant: true, plan: true },
        },
      },
    });

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found.' });
      return;
    }

    // Customer isolation
    if (req.user?.role === 'CUSTOMER' && req.user.customerId !== quotation.customerId) {
      res.status(403).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    res.json({ success: true, data: quotation });
  }

  static async createQuotation(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { customerId, validityDays = 30, notes, terms, lines } = req.body;

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      res.status(400).json({ success: false, message: 'Quotation must have at least one product line.' });
      return;
    }

    const totals = calculateTotals(lines);
    const quotationNumber = generateDocNumber('QUO');
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + Number(validityDays));

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId,
        createdById: req.user!.id,
        status: 'DRAFT',
        validityDate,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        notes,
        terms,
        lines: {
          create: lines.map((line: any) => ({
            productId: line.productId,
            variantId: line.variantId || null,
            planId: line.planId || null,
            description: line.description || '',
            quantity: Number(line.quantity) || 1,
            unitPrice: Number(line.unitPrice) || 0,
            taxRate: Number(line.taxRate) || 0,
            discountRate: Number(line.discountRate) || 0,
            lineTotal: Number(line.lineTotal) || (Number(line.quantity) * Number(line.unitPrice)),
          })),
        },
      },
      include: {
        customer: true,
        lines: { include: { product: true, variant: true, plan: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Quotation created successfully', data: quotation });
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;

    const quotation = await prisma.quotation.update({
      where: { id },
      data: { status },
      include: { customer: true },
    });

    res.json({ success: true, message: `Quotation status updated to ${status}`, data: quotation });
  }

  /**
   * Convert accepted quotation into a subscription automatically
   */
  static async convertToSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: { include: { plan: true, product: true } },
      },
    });

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found.' });
      return;
    }

    if (quotation.convertedSubscriptionId) {
      res.status(400).json({ success: false, message: 'This quotation has already been converted into a subscription.' });
      return;
    }

    // Determine primary plan or default plan from lines
    const lineWithPlan = quotation.lines.find(l => l.planId);
    let planId = lineWithPlan?.planId;

    if (!planId) {
      // Find default active plan
      const defaultPlan = await prisma.plan.findFirst({ where: { status: 'ACTIVE' } });
      if (!defaultPlan) {
        res.status(400).json({ success: false, message: 'No active plan found to associate with subscription.' });
        return;
      }
      planId = defaultPlan.id;
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    const frequency = plan?.billingFrequency || 'MONTHLY';
    const startDate = new Date();
    const expiryDate = calculateNextBillingDate(startDate, frequency === 'YEARLY' ? 'YEARLY' : 'YEARLY'); // 1 year term default
    const nextBillingDate = calculateNextBillingDate(startDate, frequency);
    const subscriptionNumber = generateDocNumber('SUB');

    const subscription = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId: quotation.customerId,
          planId,
          status: 'ACTIVE',
          billingFrequency: frequency,
          paymentTerms: 'IMMEDIATE',
          startDate,
          expiryDate,
          nextBillingDate,
          subtotal: quotation.subtotal,
          taxAmount: quotation.taxAmount,
          discountAmount: quotation.discountAmount,
          totalAmount: quotation.totalAmount,
          notes: `Converted from quotation ${quotation.quotationNumber}. ${quotation.notes || ''}`,
          quotationId: quotation.id,
          lines: {
            create: quotation.lines.map(l => ({
              productId: l.productId,
              variantId: l.variantId,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              taxRate: l.taxRate,
              discountRate: l.discountRate,
              lineTotal: l.lineTotal,
            })),
          },
        },
        include: { lines: true, customer: true, plan: true },
      });

      await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          status: 'ACCEPTED',
          convertedSubscriptionId: sub.id,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: req.user!.id,
          subscriptionId: sub.id,
          action: 'CONVERTED_FROM_QUOTATION',
          details: `Subscription created from accepted quotation ${quotation.quotationNumber}`,
        },
      });

      return sub;
    });

    res.json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} successfully converted to subscription ${subscription.subscriptionNumber}!`,
      data: subscription,
    });
  }

  // Quotation Templates
  static async listTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    const templates = await prisma.quotationTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: templates });
  }

  static async createTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, description, validityDays = 30, defaultNotes, defaultTerms, lines } = req.body;

    const template = await prisma.quotationTemplate.create({
      data: {
        name,
        description,
        validityDays: Number(validityDays),
        defaultNotes,
        defaultTerms,
        linesJson: JSON.stringify(lines || []),
      },
    });

    res.status(201).json({ success: true, message: 'Template created successfully', data: template });
  }

  static async deleteTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    await prisma.quotationTemplate.delete({ where: { id } });
    res.json({ success: true, message: 'Template deleted successfully' });
  }
}
