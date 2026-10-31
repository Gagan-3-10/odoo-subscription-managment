import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export class CustomerController {
  static async listCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { search, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { contactName: { contains: q } },
        { companyName: { contains: q } },
        { email: { contains: q } },
        { customerNumber: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: { select: { status: true, createdAt: true } },
          _count: {
            select: {
              subscriptions: true,
              invoices: true,
              payments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }

  static async getCustomerById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    // Customer data isolation check
    if (req.user?.role === 'CUSTOMER' && req.user.customerId !== id) {
      res.status(403).json({ success: false, message: 'Unauthorized access to other customer profile.' });
      return;
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true } },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    res.json({ success: true, data: customer });
  }

  static async createCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { contactName, companyName, email, phone, billingAddress, shippingAddress, taxId, currency = 'INR', notes } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    const defaultPassword = await bcrypt.hash('Brightloop@2026', 10);
    const customerNumber = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: defaultPassword,
          name: contactName,
          phone,
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          customerNumber,
          contactName,
          companyName,
          email: email.toLowerCase(),
          phone,
          billingAddress,
          shippingAddress,
          taxId,
          currency,
          notes,
        },
        include: { user: true },
      });

      return customer;
    });

    res.status(201).json({ success: true, message: 'Customer created successfully', data: result });
  }

  static async updateCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    // Customer isolation
    if (req.user?.role === 'CUSTOMER' && req.user.customerId !== id) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { contactName, companyName, phone, billingAddress, shippingAddress, taxId, currency, notes, status } = req.body;

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        contactName: contactName || undefined,
        companyName: companyName !== undefined ? companyName : undefined,
        phone: phone || undefined,
        billingAddress: billingAddress || undefined,
        shippingAddress: shippingAddress !== undefined ? shippingAddress : undefined,
        taxId: taxId !== undefined ? taxId : undefined,
        currency: currency || undefined,
        notes: notes !== undefined ? notes : undefined,
        status: status || undefined,
      },
    });

    res.json({ success: true, message: 'Customer updated successfully', data: updated });
  }
}
