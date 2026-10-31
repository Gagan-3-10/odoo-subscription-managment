"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class NotificationService {
    static async send(options) {
        try {
            // 1. Create In-App Notification
            const notification = await prisma_1.default.notification.create({
                data: {
                    userId: options.userId,
                    title: options.title,
                    message: options.message,
                    type: options.type || 'INFO',
                    link: options.link,
                },
            });
            // 2. Simulate email dispatch
            if (options.sendEmail) {
                console.log(`[EMAIL DISPATCH] To: ${options.emailTo || options.userId} | Subject: ${options.title} | Body: ${options.message}`);
            }
            return notification;
        }
        catch (error) {
            console.error('Failed to create notification:', error);
            return null;
        }
    }
    static async notifyAdminsAndStaff(title, message, type = 'INFO') {
        const users = await prisma_1.default.user.findMany({
            where: { role: { in: ['ADMIN', 'STAFF'] }, status: 'ACTIVE' },
            select: { id: true, email: true },
        });
        for (const u of users) {
            await this.send({
                userId: u.id,
                title,
                message,
                type,
                sendEmail: true,
                emailTo: u.email,
            });
        }
    }
}
exports.NotificationService = NotificationService;
