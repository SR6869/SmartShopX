import { Router, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

// Atomic POS Sale Checkout
router.post('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const {
    customerId,
    customerName,
    customerPhone,
    items,
    subtotal,
    discount = 0,
    deliveryCharge = 0,
    vat = 0,
    total,
    paidAmount = 0,
    paymentMethod = 'cash',
    channel = 'pos',
    notes,
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(422).json({ error: 'ValidationError', message: 'Cart items cannot be empty' });
  }

  const dueAmount = Math.max(0, total - paidAmount);
  const paymentStatus = dueAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
  const orderId = 'ord_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const orderNumber = 'INV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

  try {
    const saleResult = await transaction(async (client) => {
      // 1. Check & Validate Stock Deductions
      for (const item of items) {
        const prodRes = await client.query(
          'SELECT id, name, stock, purchase_price, selling_price FROM products WHERE id = $1 AND business_id = $2 FOR UPDATE',
          [item.productId, req.business?.id]
        );

        if (prodRes.rows.length === 0) {
          throw new Error(`Product not found: ${item.productName || item.productId}`);
        }

        const currentStock = parseFloat(prodRes.rows[0].stock);
        const qtyToDeduct = parseFloat(item.quantity);

        // Deduct stock
        const newStock = currentStock - qtyToDeduct;
        await client.query(
          'UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2',
          [newStock, item.productId]
        );

        // Record stock movement
        await client.query(
          `INSERT INTO stock_movements (
            id, business_id, product_id, movement_type, quantity,
            stock_before, stock_after, reason, reference_id, created_by
          ) VALUES ($1, $2, $3, 'SALE', $4, $5, $6, 'POS Sale checkout', $7, $8)`,
          [
            'mov_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            req.business?.id,
            item.productId,
            qtyToDeduct,
            currentStock,
            newStock,
            orderId,
            req.user?.id,
          ]
        );
      }

      // 2. Insert Order
      await client.query(
        `INSERT INTO orders (
          id, business_id, order_number, customer_id, customer_name, customer_phone,
          subtotal, discount, delivery_charge, vat, total, paid_amount, due_amount,
          payment_method, payment_status, order_status, channel, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'completed', $16, $17, $18)`,
        [
          orderId,
          req.business?.id,
          orderNumber,
          customerId || null,
          customerName || 'Walk-in Customer',
          customerPhone || '',
          subtotal,
          discount,
          deliveryCharge,
          vat,
          total,
          paidAmount,
          dueAmount,
          paymentMethod,
          paymentStatus,
          channel,
          notes || '',
          req.user?.id,
        ]
      );

      // 3. Insert Order Items
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (
            id, order_id, product_id, product_name, quantity, purchase_price, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            'item_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            orderId,
            item.productId,
            item.productName,
            item.quantity,
            item.purchasePrice || 0,
            item.unitPrice,
            item.totalPrice || item.quantity * item.unitPrice,
          ]
        );
      }

      // 4. Record Payment if paidAmount > 0
      if (paidAmount > 0) {
        await client.query(
          `INSERT INTO payments (
            id, business_id, transaction_number, payment_type, method,
            amount, customer_id, order_id, reference_note, created_by
          ) VALUES ($1, $2, $3, 'SalePayment', $4, $5, $6, $7, $8, $9)`,
          [
            'pay_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            req.business?.id,
            'TXN-' + Date.now().toString().slice(-8),
            paymentMethod,
            paidAmount,
            customerId || null,
            orderId,
            `POS checkout payment for order ${orderNumber}`,
            req.user?.id,
          ]
        );
      }

      // 5. Update Customer stats if customer exists
      if (customerId) {
        await client.query(
          `UPDATE customers
           SET total_spent = total_spent + $1,
               total_orders = total_orders + 1,
               total_due = total_due + $2,
               updated_at = NOW()
           WHERE id = $3 AND business_id = $4`,
          [total, dueAmount, customerId, req.business?.id]
        );
      }

      return {
        id: orderId,
        orderNumber,
        subtotal,
        discount,
        total,
        paidAmount,
        dueAmount,
        paymentMethod,
        paymentStatus,
        createdAt: new Date().toISOString(),
      };
    });

    return res.status(201).json(saleResult);
  } catch (error: any) {
    console.error('POS Checkout Transaction Failed (Rolled Back):', error.message);
    return res.status(500).json({
      error: 'TransactionFailed',
      message: error.message || 'POS transaction failed and was rolled back',
    });
  }
});

// List Sales/Orders
router.get('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const oRes = await query(
      `SELECT id, order_number as "orderNumber",
              customer_name as "customerName", customer_phone as "customerPhone",
              total::float as total, paid_amount::float as "paidAmount", due_amount::float as "dueAmount",
              payment_method as "paymentMethod", payment_status as "paymentStatus",
              order_status as "orderStatus", channel, created_at as "createdAt"
       FROM orders
       WHERE business_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.business?.id]
    );
    return res.json(oRes.rows);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;
