import { query } from '../config/db.js';

export async function getOwnerDashboardMetrics(req, res) {
  try {
    // 1. Calculate Court Revenue
    const courtRes = await query(`SELECT SUM(final_fee) AS total FROM bookings WHERE status = 'CONFIRMED'`);
    const courtRevenue = parseFloat(courtRes[0].total || 0);

    // 2. Calculate Shop Revenue
    const shopRes = await query(`SELECT SUM(total_price) AS total FROM inventory_transactions WHERE type IN ('SALE_POS', 'SALE_ONLINE')`);
    const shopRevenue = parseFloat(shopRes[0].total || 0);

    // 3. Calculate Bar Revenue
    const barRes = await query(`SELECT SUM(final_amount) AS total FROM bar_tabs WHERE status = 'SETTLED'`);
    const barRevenue = parseFloat(barRes[0].total || 0);

    // 4. Calculate Membership Revenue
    const memRes = await query(`
      SELECT SUM(t.monthly_fee) AS total
      FROM members m
      JOIN membership_tiers t ON m.tier_id = t.id
      WHERE m.status = 'ACTIVE'
    `);
    const membershipRevenue = parseFloat(memRes[0].total || 0);

    const totalEarned = courtRevenue + shopRevenue + barRevenue + membershipRevenue;

    // 5. Payment Methods Distribution
    const paymentMethods = {
      UPI: 0,
      CARD: 0,
      CASH: 0,
      ONLINE: 0
    };

    const barTabs = await query(`SELECT payment_method, final_amount FROM bar_tabs WHERE status = 'SETTLED'`);
    barTabs.forEach(t => {
      if (t.payment_method && paymentMethods[t.payment_method] !== undefined) {
        paymentMethods[t.payment_method] += parseFloat(t.final_amount || 0);
      }
    });

    const shopTx = await query(`SELECT channel, total_price FROM inventory_transactions WHERE type IN ('SALE_POS', 'SALE_ONLINE')`);
    shopTx.forEach(t => {
      const amt = parseFloat(t.total_price || 0);
      if (t.channel === 'ONLINE') {
        paymentMethods.ONLINE += amt;
      } else {
        paymentMethods.CARD += amt * 0.6;
        paymentMethods.CASH += amt * 0.4;
      }
    });

    // 6. Corporate Invoices & Staff Shifts
    const invoicesRows = await query(`
      SELECT id, invoice_number AS "invoiceNumber", client_name AS "clientName",
             client_email AS "clientEmail", type, amount, due_date AS "dueDate", status
      FROM invoices ORDER BY due_date ASC
    `);

    const invoices = invoicesRows.map(i => ({ ...i, amount: parseFloat(i.amount) }));
    const totalOwed = invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0);

    const shiftRows = await query(`
      SELECT id, staff_name AS "staffName", role, date, start_time AS "startTime",
             end_time AS "endTime", status
      FROM shifts ORDER BY date DESC LIMIT 10
    `);

    const totalMembersRes = await query(`SELECT COUNT(*) FROM members`);
    const activeMembersRes = await query(`SELECT COUNT(*) FROM members WHERE status = 'ACTIVE'`);

    return res.json({
      metrics: {
        totalEarned,
        courtRevenue,
        shopRevenue,
        barRevenue,
        membershipRevenue,
        totalOwed,
        totalMembersCount: parseInt(totalMembersRes[0].count, 10),
        activeMembersCount: parseInt(activeMembersRes[0].count, 10)
      },
      paymentMethods,
      invoices,
      shifts: shiftRows
    });
  } catch (error) {
    console.error('getOwnerDashboardMetrics Error:', error);
    return res.status(500).json({ error: 'Failed to fetch executive dashboard metrics.' });
  }
}
