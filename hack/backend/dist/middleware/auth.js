"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'brightloop_super_secret_jwt_key_2026_hackathon';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await prisma_1.default.user.findUnique({
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
            role: user.role,
            name: user.name,
            customerId: user.customerProfile?.id,
            staffId: user.staffProfile?.id,
        };
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Session expired or invalid token. Please log in again.' });
    }
};
exports.authenticate = authenticate;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
