import { Router, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';
import { devStore } from '../database/devStore.js';

const router = Router();

// List products for active business
router.get('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const pRes = await query(
      `SELECT id, name, category, brand, sku, barcode,
              purchase_price::float as "purchasePrice",
              selling_price::float as "sellingPrice",
              wholesale_price::float as "wholesalePrice",
              stock::float as stock,
              min_stock_alert::float as "minStockAlert",
              unit, vat_percent::float as "vatPercent",
              is_active as "isActive",
              online_store_visible as "onlineStoreVisible",
              image_url as "image",
              created_at as "createdAt"
       FROM products
       WHERE business_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [req.business?.id]
    );
    return res.json(pRes.rows);
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      const filtered = devStore.products.filter((p) => p.businessId === req.business?.id && p.isActive);
      return res.json(filtered);
    }
    return res.status(503).json({ error: 'DatabaseUnavailable', message: 'PostgreSQL database is currently unreachable' });
  }
});

// Create product
router.post('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const {
    name,
    category,
    brand,
    sku,
    barcode,
    purchasePrice = 0,
    sellingPrice = 0,
    wholesalePrice = 0,
    stock = 0,
    minStockAlert = 5,
    unit = 'pcs',
    image,
  } = req.body;

  if (!name || sellingPrice === undefined) {
    return res.status(422).json({ error: 'ValidationError', message: 'Product name and selling price are required' });
  }

  const productId = 'prod_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

  try {
    const created = await transaction(async (client) => {
      const res = await client.query(
        `INSERT INTO products (
          id, business_id, name, category, brand, sku, barcode,
          purchase_price, selling_price, wholesale_price, stock,
          min_stock_alert, unit, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          productId,
          req.business?.id,
          name,
          category || 'General',
          brand || '',
          sku || 'SKU-' + Date.now().toString().slice(-6),
          barcode || '',
          purchasePrice,
          sellingPrice,
          wholesalePrice,
          stock,
          minStockAlert,
          unit,
          image || '',
        ]
      );

      // Record initial stock movement
      if (stock > 0) {
        await client.query(
          `INSERT INTO stock_movements (
            id, business_id, product_id, movement_type, quantity,
            stock_before, stock_after, reason, created_by
          ) VALUES ($1, $2, $3, 'INITIAL', $4, 0, $4, 'Initial stock entry', $5)`,
          ['mov_' + Date.now(), req.business?.id, productId, stock, req.user?.id]
        );
      }

      return res.rows[0];
    });

    return res.status(201).json({
      id: created.id,
      name: created.name,
      category: created.category,
      brand: created.brand,
      sku: created.sku,
      barcode: created.barcode,
      purchasePrice: parseFloat(created.purchase_price),
      sellingPrice: parseFloat(created.selling_price),
      wholesalePrice: parseFloat(created.wholesale_price),
      stock: parseFloat(created.stock),
      minStockAlert: parseFloat(created.min_stock_alert),
      unit: created.unit,
      image: created.image_url,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Update product
router.put('/:id', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { name, category, brand, sku, barcode, purchasePrice, sellingPrice, stock, minStockAlert, unit, image } =
    req.body;

  try {
    const updated = await query(
      `UPDATE products
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           brand = COALESCE($3, brand),
           sku = COALESCE($4, sku),
           barcode = COALESCE($5, barcode),
           purchase_price = COALESCE($6, purchase_price),
           selling_price = COALESCE($7, selling_price),
           stock = COALESCE($8, stock),
           min_stock_alert = COALESCE($9, min_stock_alert),
           unit = COALESCE($10, unit),
           image_url = COALESCE($11, image_url),
           updated_at = NOW()
       WHERE id = $12 AND business_id = $13
       RETURNING *`,
      [
        name,
        category,
        brand,
        sku,
        barcode,
        purchasePrice,
        sellingPrice,
        stock,
        minStockAlert,
        unit,
        image,
        id,
        req.business?.id,
      ]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'ProductNotFound' });
    }

    const row = updated.rows[0];
    return res.json({
      id: row.id,
      name: row.name,
      category: row.category,
      sku: row.sku,
      barcode: row.barcode,
      purchasePrice: parseFloat(row.purchase_price),
      sellingPrice: parseFloat(row.selling_price),
      stock: parseFloat(row.stock),
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Delete (archive) product
router.delete('/:id', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(
      'UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 AND business_id = $2 RETURNING id',
      [id, req.business?.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ProductNotFound' });
    }
    return res.json({ success: true, message: 'Product archived successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;
