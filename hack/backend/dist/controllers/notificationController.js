"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class NotificationController {
    static async getNotifications(req, res) {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        const notifications = await prisma_1.default.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        const unreadCount = await prisma_1.default.notification.count({
            where: { userId: req.user.id, isRead: false },
        });
        res.json({ success: true, data: notifications, unreadCount });
    }
    static async markAsRead(req, res) {
        const { id } = req.params;
        await prisma_1.default.notification.updateMany({
            where: { id, userId: req.user.id },
            data: { isRead: true },
        });
        res.json({ success: true, message: 'Notification marked as read' });
    }
    static async markAllAsRead(req, res) {
        await prisma_1.default.notification.updateMany({
            where: { userId: req.user.id, isRead: false },
            data: { isRead: true },
        });
        res.json({ success: true, message: 'All notifications marked as read' });
    }
}
exports.NotificationController = NotificationController;
