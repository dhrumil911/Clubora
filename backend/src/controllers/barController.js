import { query, getClient } from '../config/db.js';

export async function getBarItems(req, res) {
  try {
    const rows = await query(`
      SELECT id, name, category, price, is_available AS "isAvailable"
      FROM bar_items
      WHERE is_available = true
      ORDER BY category ASC, name ASC
    `);
    const items = rows.map(i => ({ ...i, price: parseFloat(i.price) }));
    return res.json(items);
  } catch (error) {
    console.error('getBarItems Error:', error);
    return res.status(500).json({ error: 'Failed to fetch bar menu items.' });
  }
}

export async function getTabs(req, res) {
  try {
    const { status = 'OPEN' } = req.query;

    const tabRows = await query(`
      SELECT 
        bt.id, bt.tab_number AS "tabNumber", bt.member_id AS "memberId", bt.customer_name AS "customerName",
        bt.table_number AS "tableNumber", bt.status, bt.total_amount AS "totalAmount",
        bt.discount_percent AS "discountPercent", bt.discount_amount AS "discountAmount",
        bt.final_amount AS "finalAmount", bt.payment_method AS "paymentMethod",
        bt.opened_at AS "openedAt", bt.settled_at AS "settledAt",
        m.name AS member_name, t.name AS tier_name
      FROM bar_tabs bt
      LEFT JOIN members m ON bt.member_id = m.id
      LEFT JOIN membership_tiers t ON m.tier_id = t.id
      WHERE bt.status = $1
      ORDER BY bt.opened_at DESC
    `, [status]);

    const tabs = [];
    for (const tab of tabRows) {
      const itemRows = await query(`
        SELECT 
          boi.id, boi.tab_id AS "tabId", boi.bar_item_id AS "barItemId",
          boi.quantity, boi.unit_price AS "unitPrice", boi.total_price AS "totalPrice",
          bi.name AS bar_item_name, bi.category AS bar_item_category
        FROM bar_order_items boi
        JOIN bar_items bi ON boi.bar_item_id = bi.id
        WHERE boi.tab_id = $1
      `, [tab.id]);

      tabs.push({
        id: tab.id,
        tabNumber: tab.tabNumber,
        memberId: tab.memberId,
        customerName: tab.customerName,
        tableNumber: tab.tableNumber,
        status: tab.status,
        totalAmount: parseFloat(tab.totalAmount || 0),
        discountPercent: parseFloat(tab.discountPercent || 0),
        discountAmount: parseFloat(tab.discountAmount || 0),
        finalAmount: parseFloat(tab.finalAmount || 0),
        paymentMethod: tab.paymentMethod,
        openedAt: tab.openedAt,
        settledAt: tab.settledAt,
        member: tab.memberId ? { id: tab.memberId, name: tab.member_name, tier: { name: tab.tier_name } } : null,
        items: itemRows.map(i => ({
          id: i.id,
          tabId: i.tabId,
          barItemId: i.barItemId,
          quantity: i.quantity,
          unitPrice: parseFloat(i.unitPrice),
          totalPrice: parseFloat(i.totalPrice),
          barItem: { name: i.bar_item_name, category: i.bar_item_category }
        }))
      });
    }

    return res.json(tabs);
  } catch (error) {
    console.error('getTabs Error:', error);
    return res.status(500).json({ error: 'Failed to fetch bar tabs.' });
  }
}

export async function createOrUpdateTab(req, res) {
  const client = await getClient();
  try {
    const { tabId, memberId, customerName, tableNumber, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one order item is required.' });
    }

    await client.query('BEGIN');

    let discountPercent = 0;
    let displayName = customerName || 'Guest Customer';

    if (memberId) {
      const memRes = await client.query(`
        SELECT m.name, t.bar_discount_percent 
        FROM members m
        JOIN membership_tiers t ON m.tier_id = t.id
        WHERE m.id = $1
      `, [memberId]);

      if (memRes.rows.length > 0) {
        displayName = memRes.rows[0].name;
        discountPercent = parseFloat(memRes.rows[0].bar_discount_percent || 0);
      }
    }

    let activeTabId = tabId;

    if (!activeTabId) {
      const countRes = await client.query('SELECT COUNT(*) FROM bar_tabs');
      const tabNum = `TAB-${String(parseInt(countRes.rows[0].count, 10) + 101).padStart(3, '0')}`;
      activeTabId = `tab-${Date.now()}`;

      await client.query(`
        INSERT INTO bar_tabs (id, tab_number, member_id, customer_name, table_number, status, discount_percent)
        VALUES ($1, $2, $3, $4, $5, 'OPEN', $6)
      `, [activeTabId, tabNum, memberId || null, displayName, tableNumber || 'Counter', discountPercent]);
    }

    // Insert order line items
    for (const item of items) {
      const itemRes = await client.query('SELECT price FROM bar_items WHERE id = $1', [item.barItemId]);
      if (itemRes.rows.length > 0) {
        const unitPrice = parseFloat(itemRes.rows[0].price);
        const totalPrice = unitPrice * item.quantity;
        const lineId = `toi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        await client.query(`
          INSERT INTO bar_order_items (id, tab_id, bar_item_id, quantity, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [lineId, activeTabId, item.barItemId, item.quantity, unitPrice, totalPrice]);
      }
    }

    // Calculate totals
    const sumRes = await client.query('SELECT SUM(total_price) AS sum FROM bar_order_items WHERE tab_id = $1', [activeTabId]);
    const totalAmount = parseFloat(sumRes.rows[0].sum || 0);
    const discountAmount = (totalAmount * discountPercent) / 100;
    const finalAmount = Math.max(0, totalAmount - discountAmount);

    await client.query(`
      UPDATE bar_tabs
      SET total_amount = $1, discount_amount = $2, final_amount = $3
      WHERE id = $4
    `, [totalAmount, discountAmount, finalAmount, activeTabId]);

    await client.query('COMMIT');

    return res.json({ message: 'Tab updated successfully.', tabId: activeTabId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('createOrUpdateTab Error:', error);
    return res.status(500).json({ error: 'Failed to update bar tab.' });
  } finally {
    client.release();
  }
}

export async function settleTab(req, res) {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    if (!paymentMethod || !['CASH', 'CARD', 'UPI'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Valid payment method (CASH, CARD, or UPI) is required.' });
    }

    const tabRows = await query('SELECT * FROM bar_tabs WHERE id = $1', [id]);
    if (tabRows.length === 0) {
      return res.status(404).json({ error: 'Bar tab not found.' });
    }

    if (tabRows[0].status === 'SETTLED') {
      return res.status(400).json({ error: 'Tab is already settled.' });
    }

    await query(`
      UPDATE bar_tabs
      SET status = 'SETTLED', payment_method = $1, settled_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [paymentMethod, id]);

    return res.json({ message: `Tab settled successfully via ${paymentMethod}.`, tabId: id });
  } catch (error) {
    console.error('settleTab Error:', error);
    return res.status(500).json({ error: 'Failed to settle bar tab.' });
  }
}
