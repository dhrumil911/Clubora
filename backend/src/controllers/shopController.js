import { query, getClient } from '../config/db.js';

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
    const products = rows.map(p => {
      const qty = parseInt(p.stockQuantity, 10);
      const threshold = parseInt(p.lowStockThreshold, 10);
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        price: parseFloat(p.price),
        stockQuantity: qty,
        lowStockThreshold: threshold,
        description: p.description,
        isLowStock: qty <= threshold
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
      const prdRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [cartItem.productId]);
      if (prdRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Product not found: ${cartItem.productId}` });
      }

      const product = prdRes.rows[0];
      const availableStock = parseInt(product.stock_quantity, 10);

      if (availableStock < cartItem.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Insufficient stock for "${product.name}". Available: ${availableStock}, Requested: ${cartItem.quantity}.`
        });
      }

      // Decrement inventory stock
      await client.query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [
        cartItem.quantity, product.id
      ]);

      const unitPrice = parseFloat(product.price);
      const itemGrossTotal = unitPrice * cartItem.quantity;
      subtotal += itemGrossTotal;

      // Net discounted item total recorded for owner financial reports
      const itemDiscountedTotal = itemGrossTotal * (1 - discountPercent / 100);

      const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await client.query(`
        INSERT INTO inventory_transactions (id, product_id, type, quantity, unit_price, total_price, channel)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [txId, product.id, channel === 'ONLINE' ? 'SALE_ONLINE' : 'SALE_POS', cartItem.quantity, unitPrice, itemDiscountedTotal, channel]);

      processedItems.push({
        productName: product.name,
        quantity: cartItem.quantity,
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

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid restock quantity is required.' });
    }

    const prdRes = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (prdRes.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    const product = prdRes[0];

    const qtyToAdd = parseInt(quantity, 10);
    const unitPrice = parseFloat(product.price);

    await query('UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2', [qtyToAdd, id]);

    const txId = `tx-${Date.now()}`;
    await query(`
      INSERT INTO inventory_transactions (id, product_id, type, quantity, unit_price, total_price, channel)
      VALUES ($1, $2, 'RESTOCK', $3, $4, $5, 'RESTOCK')
    `, [txId, id, qtyToAdd, unitPrice, unitPrice * qtyToAdd]);

    const updated = await query(`
      SELECT id, name, category, price, stock_quantity AS "stockQuantity", low_stock_threshold AS "lowStockThreshold"
      FROM products WHERE id = $1
    `, [id]);

    return res.json(updated[0]);
  } catch (error) {
    console.error('restockProduct Error:', error);
    return res.status(500).json({ error: 'Failed to restock product.' });
  }
}

export async function createProduct(req, res) {
  try {
    const { name, category, price, stockQuantity, lowStockThreshold, description } = req.body;

    if (!name || price === undefined || stockQuantity === undefined) {
      return res.status(400).json({ error: 'Name, price, and initial stock quantity are required.' });
    }

    const id = `prd-${Date.now()}`;
    const cat = (category || 'ACCESSORIES').toUpperCase();
    const numPrice = parseFloat(price);
    const qty = parseInt(stockQuantity, 10);
    const threshold = lowStockThreshold ? parseInt(lowStockThreshold, 10) : 5;

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

    const cat = category ? category.toUpperCase() : prdRes[0].category;
    const numPrice = price !== undefined ? parseFloat(price) : parseFloat(prdRes[0].price);
    const qty = stockQuantity !== undefined ? parseInt(stockQuantity, 10) : parseInt(prdRes[0].stock_quantity, 10);
    const threshold = lowStockThreshold !== undefined ? parseInt(lowStockThreshold, 10) : parseInt(prdRes[0].low_stock_threshold, 10);

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
