import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import productRoutes from './routes/productRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import personalRoutes from './routes/personalRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import migrationRoutes from './routes/migrationRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import aiStudioRoutes from './routes/aiStudioRoutes.js';

export function createApp(): Express {
  const app = express();

  // Basic security and parsing
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Store-Id'],
  }));

  // Production Security Headers (Section 26)
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API v1 Central Authority Endpoints
  const apiV1 = express.Router();

  apiV1.use('/', healthRoutes);
  apiV1.use('/auth', authRoutes);
  apiV1.use('/business', businessRoutes);
  apiV1.use('/products', productRoutes);
  apiV1.use('/sales', saleRoutes);
  apiV1.use('/customers', customerRoutes);
  apiV1.use('/suppliers', supplierRoutes);
  apiV1.use('/payments', paymentRoutes);
  apiV1.use('/personal', personalRoutes);
  apiV1.use('/subscription', subscriptionRoutes);
  apiV1.use('/admin', adminRoutes);
  apiV1.use('/migration', migrationRoutes);
  apiV1.use('/ai', aiStudioRoutes);

  app.use('/api/v1', apiV1);

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled API error:', err);
    res.status(err.status || 500).json({
      error: err.name || 'InternalServerError',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected internal error occurred' : err.message,
    });
  });

  return app;
}
