import { Router, Response } from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

// List suppliers
router.get('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const sRes = await query(
      `SELECT id, name, company, mobile, email, address,
              total_payable::float as "totalPayable",
              total_paid::float as "totalPaid",
              created_at as "createdAt"
       FROM suppliers
       WHERE business_id = $1 AND is_active = true
       ORDER BY name ASC`,
      [req.business?.id]
    );
    return res.json(sRes.rows);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Create supplier
router.post('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { name, company, mobile, email, address, totalPayable = 0 } = req.body;
  if (!name) {
    return res.status(422).json({ error: 'ValidationError', message: 'Supplier name is required' });
  }

  const supplierId = 'sup_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  try {
    const created = await query(
      `INSERT INTO suppliers (id, business_id, name, company, mobile, email, address, total_payable)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, company, mobile, email, address, total_payable::float as "totalPayable"`,
      [supplierId, req.business?.id, name, company || '', mobile || '', email || '', address || '', totalPayable]
    );
    return res.status(201).json(created.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;
