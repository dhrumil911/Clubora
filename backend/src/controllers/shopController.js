import { query, getClient } from '../config/db.js';

const normalizeCategory = (value = 'ACCESSORIES') => String(value || 'ACCESSORIES').trim().toUpperCase();

const parsePositiveInteger = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getStockStatus = (stockQuantity, lowStockThreshold = 5) => {
  if (stockQuantity <= 0) return 'OUT OF STOCK';
  if (stockQuantity <= lowStockThreshold) return 'LOW STOCK';
  return 'IN STOCK';
};

async function ensureInventoryRequestTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS inventory_requests (
      id VARCHAR(36) PRIMARY KEY,
      product_id VARCHAR(36) REFERENCES products(id) ON DELETE SET NULL,
      item_name VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'ACCESSORIES',
      requested_quantity INTEGER NOT NULL CHECK (requested_quantity > 0),
      received_quantity INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
      current_stock INTEGER DEFAULT 0,
      reason TEXT,
      requested_by VARCHAR(255) NOT NULL,
      requested_by_role VARCHAR(50) DEFAULT 'BAR_SHOP_STAFF',
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      rejection_reason TEXT,
      approved_by VARCHAR(255),
      approved_at TIMESTAMP WITH TIME ZONE,
      ordered_at TIMESTAMP WITH TIME ZONE,
      received_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id VARCHAR(36) PRIMARY KEY,
      product_id VARCHAR(36) REFERENCES products(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
      total_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
      channel VARCHAR(50) NOT NULL DEFAULT 'RESTOCK',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const cols = [
    "ALTER TABLE inventory_requests ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0",
    "ALTER TABLE inventory_requests ADD COLUMN IF NOT EXISTS reason TEXT",
    "ALTER TABLE inventory_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT",
    "ALTER TABLE inventory_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE",
    "ALTER TABLE inventory_requests ADD COLUMN IF NOT EXISTS ordered_at TIMESTAMP WITH TIME ZONE",
    "ALTER TABLE inventory_requests ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE",
    "ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS notes TEXT"
  ];
  for (const sql of cols) {
    try { await query(sql); } catch (e) {}
  }

  const legacyTable = await query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'purchase_order_requests'
  `);

  if (legacyTable.length === 0) {
    try {
      await query(`
        CREATE VIEW purchase_order_requests AS
        SELECT
          id,
          product_id,
          item_name AS product_name,
          category,
          requested_quantity,
          notes,
          requested_by,
          status,
          created_at,
          updated_at AS reviewed_at,
          approved_by AS reviewed_by
        FROM inventory_requests
      `);
    } catch (e) {}
  }
}

export async function getProducts(req, res) {
  try {
    const { category, search } = req.query;
    let sql = `
      SELECT
        id,
        name,
        category,
        price,
        stock_quantity AS "stockQuantity",
        low_stock_threshold AS "lowStockThreshold",
        description
      FROM products
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND name ILIKE $${params.length}`;
    }

    sql += ` ORDER BY name ASC`;

    const rows = await query(sql, params);
    const products = rows.map((p) => {
      const qty = parseInt(p.stockQuantity, 10);
      const threshold = parseInt(p.lowStockThreshold, 10) || 5;
      const status = getStockStatus(qty, threshold);
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        price: parseFloat(p.price),
        stockQuantity: qty,
        lowStockThreshold: threshold,
        description: p.description,
        stockStatus: status,
        isLowStock: qty <= threshold,
        isOutOfStock: qty === 0
      };
    });

    return res.json(products);
  } catch (error) {
    console.error('getProducts Error:', error);
    return res.status(500).json({ error: 'Failed to fetch shop inventory.' });
  }
}

export async function checkout(req, res) {
  const client = await getClient();
  try {
    const { items, memberId, channel = 'COUNTER' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Checkout cart cannot be empty.' });
    }

    await client.query('BEGIN');

    let discountPercent = 0;
    let memberName = 'Guest Customer';
    let memberCode = null;
    let tierName = 'Walk-in';

    if (memberId) {
      const memberRes = await client.query(`
        SELECT m.name, m.member_code, t.name AS tier_name, t.shop_discount_percent
        FROM members m
        JOIN membership_tiers t ON m.tier_id = t.id
        WHERE m.id = $1
      `, [memberId]);

      if (memberRes.rows.length > 0) {
        memberName = memberRes.rows[0].name;
        memberCode = memberRes.rows[0].member_code;
        tierName = memberRes.rows[0].tier_name;
        discountPercent = parseFloat(memberRes.rows[0].shop_discount_percent || 0);
      }
    }

    let subtotal = 0;
    const processedItems = [];

    for (const cartItem of items) {
      const qty = parsePositiveInteger(cartItem.quantity);
      if (!qty) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Enter a valid quantity.' });
      }

      const prdRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [cartItem.productId]);
      if (prdRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Product not found: ${cartItem.productId}` });
      }

      const product = prdRes.rows[0];
      const availableStock = parseInt(product.stock_quantity, 10);

      if (availableStock <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Item is currently out of stock.' });
      }

      if (availableStock < qty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Insufficient stock for "${product.name}". Available: ${availableStock}, Requested: ${qty}.`
        });
      }

      await client.query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [qty, product.id]);

      const unitPrice = parseFloat(product.price);
      const itemGrossTotal = unitPrice * qty;
      subtotal += itemGrossTotal;

      const itemDiscountedTotal = itemGrossTotal * (1 - discountPercent / 100);

      const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await client.query(`
        INSERT INTO inventory_transactions (id, product_id, type, quantity, unit_price, total_price, channel)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [txId, product.id, channel === 'ONLINE' ? 'SALE_ONLINE' : 'SALE_POS', qty, unitPrice, itemDiscountedTotal, channel]);

      processedItems.push({
        productName: product.name,
        quantity: qty,
        unitPrice,
        totalPrice: itemDiscountedTotal
      });
    }

    await client.query('COMMIT');

    const discountAmount = (subtotal * discountPercent) / 100;
    const finalTotal = Math.max(0, subtotal - discountAmount);

    return res.json({
      message: 'Checkout completed successfully!',
      receipt: {
        customerName: memberName,
        memberCode,
        tierName,
        discountPercent,
        subtotal,
        discountAmount,
        finalTotal,
        channel,
        items: processedItems,
        timestamp: new Date()
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('checkout Error:', error);
    return res.status(500).json({ error: 'Failed to complete checkout.' });
  } finally {
    client.release();
  }
}

export async function restockProduct(req, res) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const qtyToAdd = parsePositiveInteger(quantity);

    if (!qtyToAdd) {
      return res.status(400).json({ error: 'Enter a valid quantity.' });
    }

    const prdRes = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (prdRes.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = prdRes[0];
    const oldStock = parseInt(product.stock_quantity, 10);

    await query('UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [qtyToAdd, id]);

    const txId = `tx-${Date.now()}`;
    await query(`
      INSERT INTO inventory_transactions (id, product_id, type, quantity, unit_price, total_price, channel)
      VALUES ($1, $2, 'RESTOCK', $3, $4, $5, 'RESTOCK')
    `, [txId, id, qtyToAdd, parseFloat(product.price), parseFloat(product.price) * qtyToAdd]);

    const updated = await query(`
      SELECT id, name, category, price, stock_quantity AS "stockQuantity", low_stock_threshold AS "lowStockThreshold"
      FROM products WHERE id = $1
    `, [id]);

    return res.json({
      ...updated[0],
      previousStock: oldStock,
      added: qtyToAdd,
      newStock: oldStock + qtyToAdd,
      stockStatus: getStockStatus(oldStock + qtyToAdd, parseInt(updated[0].lowStockThreshold, 10) || 5)
    });
  } catch (error) {
    console.error('restockProduct Error:', error);
    return res.status(500).json({ error: 'Failed to restock product.' });
  }
}

export async function addStockToProduct(req, res) {
  try {
    await ensureInventoryRequestTable();
    const { id } = req.params;
    const { quantity, notes } = req.body;
    const qtyToAdd = parsePositiveInteger(quantity);

    if (!qtyToAdd) {
      return res.status(400).json({ error: 'Enter a valid quantity.' });
    }

    const prdRes = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (prdRes.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = prdRes[0];
    const oldStock = parseInt(product.stock_quantity, 10);

    await query('UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [qtyToAdd, id]);

    try {
      const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await query(`
        INSERT INTO inventory_transactions (id, product_id, type, quantity, unit_price, total_price, channel, notes)
        VALUES ($1, $2, 'RESTOCK', $3, $4, $5, 'RESTOCK', $6)
      `, [txId, id, qtyToAdd, parseFloat(product.price || 0), parseFloat(product.price || 0) * qtyToAdd, notes || 'Stock added by staff']);
    } catch (txErr) {
      console.warn('Inventory transaction log warning:', txErr.message);
    }

    const updated = await query(`
      SELECT id, name, category, price, stock_quantity AS "stockQuantity", low_stock_threshold AS "lowStockThreshold"
      FROM products WHERE id = $1
    `, [id]);

    return res.json({
      message: 'Stock added successfully.',
      previousStock: oldStock,
      added: qtyToAdd,
      newStock: oldStock + qtyToAdd,
      product: updated[0]
    });
  } catch (error) {
    console.error('addStockToProduct Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to add stock.' });
  }
}

export async function createProduct(req, res) {
  try {
    const { name, category, price, stockQuantity, lowStockThreshold, description } = req.body;

    if (!name || price === undefined || stockQuantity === undefined) {
      return res.status(400).json({ error: 'Name, price, and initial stock quantity are required.' });
    }

    const qty = parsePositiveInteger(stockQuantity);
    if (!qty) {
      return res.status(400).json({ error: 'Enter a valid quantity.' });
    }

    const id = `prd-${Date.now()}`;
    const cat = normalizeCategory(category || 'ACCESSORIES');
    const numPrice = parseFloat(price);
    const threshold = parsePositiveInteger(lowStockThreshold) || 5;

    await query(`
      INSERT INTO products (id, name, category, price, stock_quantity, low_stock_threshold, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, name.trim(), cat, numPrice, qty, threshold, description || '']);

    return res.status(201).json({
      message: 'Product created successfully!',
      product: {
        id,
        name: name.trim(),
        category: cat,
        price: numPrice,
        stockQuantity: qty,
        lowStockThreshold: threshold,
        description: description || '',
        isLowStock: qty <= threshold
      }
    });
  } catch (error) {
    console.error('createProduct Error:', error);
    return res.status(500).json({ error: 'Failed to create new product.' });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, category, price, stockQuantity, lowStockThreshold, description } = req.body;

    const prdRes = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (prdRes.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const cat = category ? normalizeCategory(category) : prdRes[0].category;
    const numPrice = price !== undefined ? parseFloat(price) : parseFloat(prdRes[0].price);
    const qty = stockQuantity !== undefined ? parsePositiveInteger(stockQuantity) : parseInt(prdRes[0].stock_quantity, 10);
    const threshold = lowStockThreshold !== undefined ? parsePositiveInteger(lowStockThreshold) : parseInt(prdRes[0].low_stock_threshold, 10) || 5;

    if (!qty) {
      return res.status(400).json({ error: 'Enter a valid quantity.' });
    }

    await query(`
      UPDATE products
      SET name = $1, category = $2, price = $3, stock_quantity = $4, low_stock_threshold = $5, description = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `, [name ? name.trim() : prdRes[0].name, cat, numPrice, qty, threshold, description !== undefined ? description : prdRes[0].description, id]);

    return res.json({ message: 'Product updated successfully.' });
  } catch (error) {
    console.error('updateProduct Error:', error);
    return res.status(500).json({ error: 'Failed to update product.' });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (result.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.json({ message: 'Product deleted successfully.', id });
  } catch (error) {
    console.error('deleteProduct Error:', error);
    return res.status(500).json({ error: 'Failed to delete product.' });
  }
}

export async function getInventoryHistory(req, res) {
  try {
    const rows = await query(`
      SELECT it.id, it.product_id AS "productId", p.name AS "productName", it.type, it.quantity, it.unit_price AS "unitPrice",
             it.total_price AS "totalPrice", it.channel, it.created_at AS "createdAt"
      FROM inventory_transactions it
      LEFT JOIN products p ON p.id = it.product_id
      ORDER BY it.created_at DESC
      LIMIT 100
    `);
    return res.json(rows);
  } catch (error) {
    console.error('getInventoryHistory Error:', error);
    return res.status(500).json({ error: 'Failed to fetch stock history.' });
  }
}

export async function getInventoryRequests(req, res) {
  try {
    await ensureInventoryRequestTable();
    const rows = await query(`
      SELECT
        r.id,
        r.product_id AS "productId",
        r.item_name AS "itemName",
        r.item_name AS "productName",
        r.category,
        r.requested_quantity AS "requestedQuantity",
        r.received_quantity AS "receivedQuantity",
        r.current_stock AS "currentStock",
        p.stock_quantity AS "liveStock",
        r.reason,
        r.requested_by AS "requestedBy",
        r.requested_by_role AS "requestedByRole",
        r.status,
        r.notes,
        r.rejection_reason AS "rejectionReason",
        r.approved_by AS "approvedBy",
        r.approved_at AS "approvedAt",
        r.ordered_at AS "orderedAt",
        r.received_at AS "receivedAt",
        r.created_at AS "createdAt",
        r.updated_at AS "updatedAt"
      FROM inventory_requests r
      LEFT JOIN products p ON p.id = r.product_id
      ORDER BY r.created_at DESC
    `);
    const mapped = rows.map(r => ({
      ...r,
      currentStock: r.liveStock !== null && r.liveStock !== undefined ? parseInt(r.liveStock, 10) : (r.currentStock || 0)
    }));
    return res.json(mapped);
  } catch (error) {
    console.error('getInventoryRequests Error:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory requests.' });
  }
}

export async function createInventoryRequest(req, res) {
  try {
    await ensureInventoryRequestTable();
    const { productId, itemName, productName, category, requestedQuantity, reason, notes, requestedBy } = req.body;
    const qty = parsePositiveInteger(requestedQuantity);

    if (!qty) {
      return res.status(400).json({ error: 'Enter a valid quantity.' });
    }

    let finalName = (itemName || productName || '').trim();
    let productCategory = category || 'ACCESSORIES';
    let currentStock = 0;

    if (productId) {
      const existing = await query('SELECT id, name, category, stock_quantity FROM products WHERE id = $1', [productId]);
      if (existing.length > 0) {
        finalName = existing[0].name;
        productCategory = existing[0].category;
        currentStock = parseInt(existing[0].stock_quantity, 10) || 0;
      }
    }

    if (!finalName) {
      return res.status(400).json({ error: 'Item name is required.' });
    }

    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const requestReason = (reason || notes || 'Stock replenishment requested').trim();

    await query(`
      INSERT INTO inventory_requests (id, product_id, item_name, category, requested_quantity, current_stock, reason, requested_by, requested_by_role, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      requestId,
      productId || null,
      finalName,
      normalizeCategory(productCategory),
      qty,
      currentStock,
      requestReason,
      req.user?.name || requestedBy || 'Shop Staff',
      req.user?.role || 'BAR_SHOP_STAFF',
      'PENDING',
      notes || ''
    ]);

    return res.status(201).json({ message: 'Inventory request submitted to owner.', requestId, status: 'PENDING' });
  } catch (error) {
    console.error('createInventoryRequest Error:', error);
    return res.status(500).json({ error: 'Unable to send inventory request.' });
  }
}

export async function approveInventoryRequest(req, res) {
  try {
    await ensureInventoryRequestTable();
    const { id } = req.params;
    const { approvedBy = req.user?.name || 'Club Owner' } = req.body;
    const rows = await query('SELECT * FROM inventory_requests WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inventory request not found.' });
    }

    await query(`
      UPDATE inventory_requests
      SET status = 'APPROVED', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [approvedBy, id]);

    return res.json({ message: 'Inventory request approved.', status: 'APPROVED' });
  } catch (error) {
    console.error('approveInventoryRequest Error:', error);
    return res.status(500).json({ error: 'Failed to approve inventory request.' });
  }
}

export async function rejectInventoryRequest(req, res) {
  try {
    await ensureInventoryRequestTable();
    const { id } = req.params;
    const { approvedBy = req.user?.name || 'Club Owner', rejectionReason = '' } = req.body;
    const rows = await query('SELECT * FROM inventory_requests WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inventory request not found.' });
    }

    await query(`
      UPDATE inventory_requests
      SET status = 'REJECTED', approved_by = $1, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [approvedBy, rejectionReason, id]);

    return res.json({ message: 'Inventory request rejected.', status: 'REJECTED' });
  } catch (error) {
    console.error('rejectInventoryRequest Error:', error);
    return res.status(500).json({ error: 'Failed to reject inventory request.' });
  }
}

export async function orderedInventoryRequest(req, res) {
  try {
    await ensureInventoryRequestTable();
    const { id } = req.params;
    const rows = await query('SELECT * FROM inventory_requests WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inventory request not found.' });
    }

    await query(`
      UPDATE inventory_requests
      SET status = 'ORDERED', ordered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    return res.json({ message: 'Inventory request marked as ordered.', status: 'ORDERED' });
  } catch (error) {
    console.error('orderedInventoryRequest Error:', error);
    return res.status(500).json({ error: 'Failed to mark inventory request as ordered.' });
  }
}

export async function receiveInventoryRequest(req, res) {
  let client;
  try {
    await ensureInventoryRequestTable();
    const { id } = req.params;
    const { quantity, receivedBy = req.user?.name || 'Shop Staff' } = req.body;
    client = await getClient();
    await client.query('BEGIN');
    const result = await client.query('SELECT * FROM inventory_requests WHERE id = $1 FOR UPDATE', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Inventory request not found.' });
    }

    const request = rows[0];
    if (!['APPROVED', 'ORDERED'].includes(request.status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Only approved or ordered inventory requests can be received.' });
    }

    const qty = parsePositiveInteger(quantity ?? request.requested_quantity);
    if (!qty) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Enter a valid quantity.' });
    }

    if (!request.product_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This request does not reference an existing product in inventory.' });
    }

    const productResult = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [request.product_id]);
    const productRows = productResult.rows;
    if (productRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Related product is no longer available in inventory.' });
    }

    const product = productRows[0];
    const oldStock = parseInt(product.stock_quantity, 10);
    await client.query('UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [qty, request.product_id]);

    const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await client.query(`
      INSERT INTO inventory_transactions (id, product_id, type, quantity, unit_price, total_price, channel)
      VALUES ($1, $2, 'RECEIVED', $3, $4, $5, 'RESTOCK')
    `, [txId, request.product_id, qty, parseFloat(product.price || 0), parseFloat(product.price || 0) * qty]);

    await client.query(`
      UPDATE inventory_requests
      SET status = 'RECEIVED', received_quantity = $1, received_at = CURRENT_TIMESTAMP,
          notes = CASE WHEN $3::text = '' THEN notes ELSE CONCAT_WS(E'\\n', NULLIF(notes, ''), 'Received by: ' || $3) END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [qty, id, receivedBy]);
    await client.query('COMMIT');

    return res.json({
      message: 'Stock received and inventory updated.',
      previousStock: oldStock,
      received: qty,
      newStock: oldStock + qty,
      status: 'RECEIVED'
    });
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch (rollbackError) {}
    }
    console.error('receiveInventoryRequest Error:', error);
    return res.status(500).json({ error: 'Failed to receive stock.' });
  } finally {
    client?.release();
  }
}

export async function getPurchaseRequests(req, res) {
  return getInventoryRequests(req, res);
}

export async function createPurchaseRequest(req, res) {
  return createInventoryRequest(req, res);
}

export async function reviewPurchaseRequest(req, res) {
  const { status } = req.body;
  if (status === 'APPROVED') return approveInventoryRequest(req, res);
  if (status === 'REJECTED') return rejectInventoryRequest(req, res);
  return res.status(400).json({ error: 'Status must be APPROVED or REJECTED.' });
}

