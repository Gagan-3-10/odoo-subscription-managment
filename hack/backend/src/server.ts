import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { BackgroundScheduler } from './jobs/scheduler';
import prisma from './config/prisma';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Brightloop Subscription & Billing API',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api', routes);

// Centralized Error Handler
app.use(errorHandler);

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✔ Connected to SQLite database with Prisma');

    // Start background billing scheduler
    BackgroundScheduler.start(60000); // Check every 60 seconds

    app.listen(PORT, () => {
      console.log(`🚀 Brightloop backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
