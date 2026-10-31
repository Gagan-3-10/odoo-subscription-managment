"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const authController_1 = require("./authController");
const createStaffSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: authController_1.passwordSchema,
    name: zod_1.z.string().min(2),
    phone: zod_1.z.string().optional(),
    department: zod_1.z.string().min(2),
    designation: zod_1.z.string().min(2),
    permissions: zod_1.z.string().default('ALL'),
});
class StaffController {
    static async listStaff(req, res) {
        const staffMembers = await prisma_1.default.staff.findMany({
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
    static async createStaff(req, res) {
        const data = createStaffSchema.parse(req.body);
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'An account with this email already exists.' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const employeeId = `STF-${Math.floor(1000 + Math.random() * 9000)}`;
        const result = await prisma_1.default.$transaction(async (tx) => {
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
    static async updateStaff(req, res) {
        const { id } = req.params;
        const { department, designation, permissions, status, name, phone } = req.body;
        const staff = await prisma_1.default.staff.findUnique({
            where: { id },
            include: { user: true },
        });
        if (!staff) {
            res.status(404).json({ success: false, message: 'Staff member not found.' });
            return;
        }
        await prisma_1.default.$transaction(async (tx) => {
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
    static async deleteStaff(req, res) {
        const { id } = req.params;
        const staff = await prisma_1.default.staff.findUnique({
            where: { id },
        });
        if (!staff) {
            res.status(404).json({ success: false, message: 'Staff member not found.' });
            return;
        }
        await prisma_1.default.user.delete({
            where: { id: staff.userId },
        });
        res.json({ success: true, message: 'Staff member deleted successfully' });
    }
}
exports.StaffController = StaffController;
