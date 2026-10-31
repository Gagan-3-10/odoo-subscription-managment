import prisma from '../config/prisma';

export interface SendNotificationOptions {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  link?: string;
  sendEmail?: boolean;
  emailTo?: string;
}

export class NotificationService {
  static async send(options: SendNotificationOptions) {
    try {
      // 1. Create In-App Notification
      const notification = await prisma.notification.create({
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
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  static async notifyAdminsAndStaff(title: string, message: string, type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' = 'INFO') {
    const users = await prisma.user.findMany({
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
