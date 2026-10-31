import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { passwordSchema } from './authController';

const createStaffSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().min(2),
  phone: z.string().optional(),
  department: z.string().min(2),
  designation: z.string().min(2),
  permissions: z.string().default('ALL'),
});

export class StaffController {
  static async listStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
    const staffMembers = await prisma.staff.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: staffMembers });
  }

  static async createStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
    const data = createStaffSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const employeeId = `STF-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          password: hashedPassword,
          name: data.name,
          phone: data.phone,
          role: 'STAFF',
          status: 'ACTIVE',
        },
      });

      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          employeeId,
          department: data.department,
          designation: data.designation,
          permissions: data.permissions,
        },
        include: {
          user: true,
        },
      });

      return staff;
    });

    res.status(201).json({
      success: true,
      message: 'Staff account created successfully',
      data: result,
    });
  }

  static async updateStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { department, designation, permissions, status, name, phone } = req.body;

    const staff = await prisma.staff.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff member not found.' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.staff.update({
        where: { id },
        data: {
          department: department || undefined,
          designation: designation || undefined,
          permissions: permissions || undefined,
        },
      });

      if (name || phone || status) {
        await tx.user.update({
          where: { id: staff.userId },
          data: {
            name: name || undefined,
            phone: phone || undefined,
            status: status || undefined,
          },
        });
      }
    });

    res.json({ success: true, message: 'Staff member updated successfully' });
  }

  static async deleteStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff member not found.' });
      return;
    }

    await prisma.user.delete({
      where: { id: staff.userId },
    });

    res.json({ success: true, message: 'Staff member deleted successfully' });
  }
}
