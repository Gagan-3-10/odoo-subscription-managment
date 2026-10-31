import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

// Password requirement: >= 9 chars, 1 uppercase, 1 lowercase, 1 special char
export const passwordSchema = z.string()
  .min(9, 'Password must be at least 9 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().min(2),
  phone: z.string().min(6),
  companyName: z.string().optional(),
  billingAddress: z.string().min(5),
  taxId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        customerProfile: true,
        staffProfile: true,
      },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'brightloop_super_secret_jwt_key_2026_hackathon';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        customerId: user.customerProfile?.id,
        customerNumber: user.customerProfile?.customerNumber,
        staffId: user.staffProfile?.id,
      },
    });
  }

  static async register(req: Request, res: Response): Promise<void> {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const customerNumber = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          password: hashedPassword,
          name: data.name,
          phone: data.phone,
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
      });

      const newCustomer = await tx.customer.create({
        data: {
          userId: newUser.id,
          customerNumber,
          contactName: data.name,
          companyName: data.companyName,
          email: data.email.toLowerCase(),
          phone: data.phone,
          billingAddress: data.billingAddress,
          taxId: data.taxId,
        },
      });

      return { user: newUser, customer: newCustomer };
    });

    // Notify admins of new registration
    await NotificationService.notifyAdminsAndStaff(
      'New Customer Registration',
      `${data.name} (${data.companyName || 'Individual'}) registered an account. Customer ID: ${customerNumber}`
    );

    const secret = process.env.JWT_SECRET || 'brightloop_super_secret_jwt_key_2026_hackathon';
    const token = jwt.sign(
      { id: result.user.id, email: result.user.email, role: result.user.role },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        customerId: result.customer.id,
        customerNumber: result.customer.customerNumber,
      },
    });
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Don't reveal user existence for security, but set token if found
    if (user) {
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expires = new Date(Date.now() + 3600000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: expires,
        },
      });

      console.log(`[PASSWORD RESET] Email: ${user.email} | Token: ${resetToken} | Reset URL: http://localhost:5173/reset-password?token=${resetToken}`);
    }

    res.json({
      success: true,
      message: 'If the email exists in our system, password reset instructions have been dispatched.',
    });
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = z.object({
      token: z.string(),
      newPassword: passwordSchema,
    }).parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired password reset link.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  }

  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        customerProfile: true,
        staffProfile: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
        customerProfile: user.customerProfile,
        staffProfile: user.staffProfile,
      },
    });
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { name, phone, billingAddress, companyName, taxId } = req.body;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: req.user!.id },
        data: {
          name: name || undefined,
          phone: phone || undefined,
        },
      });

      if (req.user!.customerId) {
        await tx.customer.update({
          where: { id: req.user!.customerId },
          data: {
            contactName: name || undefined,
            phone: phone || undefined,
            billingAddress: billingAddress || undefined,
            companyName: companyName || undefined,
            taxId: taxId || undefined,
          },
        });
      }
    });

    res.json({ success: true, message: 'Profile updated successfully' });
  }
}
