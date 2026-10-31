import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  name: string;
  customerId?: string;
  staffId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'brightloop_super_secret_jwt_key_2026_hackathon';

    const decoded = jwt.verify(token, secret) as { id: string; email: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        customerProfile: true,
        staffProfile: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ success: false, message: 'Invalid or inactive user account.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'STAFF' | 'CUSTOMER',
      name: user.name,
      customerId: user.customerProfile?.id,
      staffId: user.staffProfile?.id,
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Session expired or invalid token. Please log in again.' });
  }
};

export const requireRole = (allowedRoles: ('ADMIN' | 'STAFF' | 'CUSTOMER')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] permissions. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};
