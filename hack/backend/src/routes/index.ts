import { Router } from 'express';
import authRoutes from './authRoutes';
import staffRoutes from './staffRoutes';
import customerRoutes from './customerRoutes';
import productRoutes from './productRoutes';
import planRoutes from './planRoutes';
import quotationRoutes from './quotationRoutes';
import subscriptionRoutes from './subscriptionRoutes';
import invoiceRoutes from './invoiceRoutes';
import paymentRoutes from './paymentRoutes';
import taxRoutes from './taxRoutes';
import discountRoutes from './discountRoutes';
import dashboardRoutes from './dashboardRoutes';
import reportsRoutes from './reportsRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/staff', staffRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/plans', planRoutes);
router.use('/quotations', quotationRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/taxes', taxRoutes);
router.use('/discounts', discountRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);
router.use('/notifications', notificationRoutes);

export default router;
