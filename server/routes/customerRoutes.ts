import { Router, Response } from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

// List customers
router.get('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const cRes = await query(
      `SELECT id, name, mobile, address, email,
              total_spent::float as "totalSpent",
              total_orders as "totalOrders",
              total_due::float as "totalDue",
              credit_limit::float as "creditLimit",
              created_at as "createdAt"
       FROM customers
       WHERE business_id = $1 AND is_active = true
       ORDER BY name ASC`,
      [req.business?.id]
    );
    return res.json(cRes.rows);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Create customer
router.post('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { name, mobile, address, email, creditLimit = 0 } = req.body;
  if (!name) {
    return res.status(422).json({ error: 'ValidationError', message: 'Customer name is required' });
  }

  const customerId = 'cust_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  try {
    const created = await query(
      `INSERT INTO customers (id, business_id, name, mobile, address, email, credit_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, mobile, address, email, total_spent::float as "totalSpent", total_due::float as "totalDue"`,
      [customerId, req.business?.id, name, mobile || '', address || '', email || '', creditLimit]
    );
    return res.status(201).json(created.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Update customer
router.put('/:id', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { name, mobile, address, email, creditLimit } = req.body;
  try {
    const updated = await query(
      `UPDATE customers
       SET name = COALESCE($1, name),
           mobile = COALESCE($2, mobile),
           address = COALESCE($3, address),
           email = COALESCE($4, email),
           credit_limit = COALESCE($5, credit_limit),
           updated_at = NOW()
       WHERE id = $6 AND business_id = $7
       RETURNING id, name, mobile, address, email, total_spent::float as "totalSpent", total_due::float as "totalDue"`,
      [name, mobile, address, email, creditLimit, id, req.business?.id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'CustomerNotFound' });
    }

    return res.json(updated.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;
