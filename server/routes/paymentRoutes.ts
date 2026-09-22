import { Router, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

// List payments
router.get('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const pRes = await query(
      `SELECT id, transaction_number as "transactionNumber",
              payment_type as "paymentType", method, amount::float as amount,
              customer_id as "customerId", supplier_id as "supplierId", order_id as "orderId",
              status, reference_note as "referenceNote", created_at as "createdAt"
       FROM payments
       WHERE business_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.business?.id]
    );
    return res.json(pRes.rows);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Record new payment / due repayment
router.post('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { paymentType, method, amount, customerId, supplierId, orderId, referenceNote } = req.body;

  if (!paymentType || !method || !amount || amount <= 0) {
    return res.status(422).json({ error: 'ValidationError', message: 'Valid payment type, method, and amount required' });
  }

  const paymentId = 'pay_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const txnNumber = 'TXN-' + Date.now().toString().slice(-8);

  try {
    const result = await transaction(async (client) => {
      // 1. Insert payment record
      const insertRes = await client.query(
        `INSERT INTO payments (
          id, business_id, transaction_number, payment_type, method,
          amount, customer_id, supplier_id, order_id, reference_note, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          paymentId,
          req.business?.id,
          txnNumber,
          paymentType,
          method,
          amount,
          customerId || null,
          supplierId || null,
          orderId || null,
          referenceNote || '',
          req.user?.id,
        ]
      );

      // 2. Adjust customer due if CustomerPayment
      if (customerId && paymentType === 'CustomerDuePayment') {
        await client.query(
          `UPDATE customers
           SET total_due = GREATEST(0, total_due - $1), updated_at = NOW()
           WHERE id = $2 AND business_id = $3`,
          [amount, customerId, req.business?.id]
        );
      }

      // 3. Adjust supplier payable if SupplierPayment
      if (supplierId && paymentType === 'SupplierPayment') {
        await client.query(
          `UPDATE suppliers
           SET total_paid = total_paid + $1,
               total_payable = GREATEST(0, total_payable - $1),
               updated_at = NOW()
           WHERE id = $2 AND business_id = $3`,
          [amount, supplierId, req.business?.id]
        );
      }

      return insertRes.rows[0];
    });

    return res.status(201).json({
      id: result.id,
      transactionNumber: result.transaction_number,
      paymentType: result.payment_type,
      method: result.method,
      amount: parseFloat(result.amount),
      status: result.status,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;
