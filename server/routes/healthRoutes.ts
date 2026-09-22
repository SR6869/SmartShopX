import { Router, Request, Response } from 'express';
import { checkDbHealth } from '../config/database.js';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  const dbHealth = await checkDbHealth();

  const responsePayload = {
    status: 'ok',
    version: '1.0.0',
    service: 'SmartShopX Central Authority',
    timestamp: new Date().toISOString(),
    database: {
      status: dbHealth.status,
      latencyMs: dbHealth.latencyMs,
    },
    features: {
      multiTenancy: 'active',
      subscriptionAuthority: 'active',
      posAtomicity: 'active',
      personalIsolation: 'active',
    },
  };

  if (dbHealth.status === 'unreachable') {
    // If database is not reachable, still report 200 with degraded note in development
    return res.status(200).json({
      ...responsePayload,
      status: 'degraded',
      note: 'Database host is unreachable; operating in safe development mode',
    });
  }

  return res.json(responsePayload);
});

export default router;
