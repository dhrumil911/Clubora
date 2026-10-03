import { query } from '../config/db.js';

/**
 * GET /api/dashboard/metrics - Enhanced owner dashboard with time-filtered metrics
 */
export async function getOwnerDashboardMetrics(req, res) {
  try {
    const { period = 'all' } = req.query;

    let dateFilter = '';
    if (period === 'today') {
      dateFilter = `AND created_at >= CURRENT_DATE`;
    } else if (period === 'week') {
      dateFilter = `AND created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === 'month') {
      dateFilter = `AND created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    // 1. Calculate Court Revenue
    const courtRes = await query(`SELECT COALESCE(SUM(final_fee), 0) AS total FROM bookings WHERE status = 'CONFIRMED' ${dateFilter}`);
    const courtRevenue = parseFloat(courtRes[0].total);

    // 2. Calculate Shop Revenue
    const shopRes = await query(`SELECT COALESCE(SUM(total_price), 0) AS total FROM inventory_transactions WHERE type IN ('SALE_POS', 'SALE_ONLINE') ${dateFilter}`);
    const shopRevenue = parseFloat(shopRes[0].total);

    // 3. Calculate Bar Revenue
    const barDateFilter = dateFilter.replace('created_at', 'settled_at');
    const barRes = await query(`SELECT COALESCE(SUM(final_amount), 0) AS total FROM bar_tabs WHERE status = 'SETTLED' ${barDateFilter || ''}`);
    const barRevenue = parseFloat(barRes[0].total);

    // 4. Calculate Membership Revenue
    const memRes = await query(`
      SELECT COALESCE(SUM(t.monthly_fee), 0) AS total
      FROM members m
      JOIN membership_tiers t ON m.tier_id = t.id
      WHERE m.status = 'ACTIVE'
    `);
    const membershipRevenue = parseFloat(memRes[0].total);

    const totalEarned = courtRevenue + shopRevenue + barRevenue + membershipRevenue;

    // 5. Payment Methods Distribution
    const paymentMethods = {
      UPI: 0,
      CARD: 0,
      CASH: 0,
      ONLINE: 0
    };

    const barTabs = await query(`SELECT payment_method, final_amount FROM bar_tabs WHERE status = 'SETTLED' ${barDateFilter || ''}`);
    barTabs.forEach(t => {
      if (t.payment_method && paymentMethods[t.payment_method] !== undefined) {
        paymentMethods[t.payment_method] += parseFloat(t.final_amount || 0);
      }
    });

    const shopTx = await query(`SELECT channel, total_price FROM inventory_transactions WHERE type IN ('SALE_POS', 'SALE_ONLINE') ${dateFilter}`);
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
             client_email AS "clientEmail", type, amount, due_date AS "dueDate", status,
             paid_at AS "paidAt", notes
      FROM invoices ORDER BY created_at DESC
    `);

    const invoices = invoicesRows.map(i => ({ ...i, amount: parseFloat(i.amount) }));
    const totalOwed = invoices.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE').reduce((sum, i) => sum + i.amount, 0);

    const shiftRows = await query(`
      SELECT id, staff_name AS "staffName", role, date, start_time AS "startTime",
             end_time AS "endTime", status
      FROM shifts ORDER BY date DESC LIMIT 10
    `);

    const totalMembersRes = await query(`SELECT COUNT(*) FROM members`);
    const activeMembersRes = await query(`SELECT COUNT(*) FROM members WHERE status = 'ACTIVE'`);

    // 7. Lead funnel stats
    const leadStats = {};
    const leadRows = await query(`SELECT status, COUNT(*) AS count FROM leads GROUP BY status`);
    leadRows.forEach(r => { leadStats[r.status] = parseInt(r.count); });

    // 8. Today's bookings count
    const todayBookingsRes = await query(`
      SELECT COUNT(*) FROM bookings WHERE booking_date = $1 AND status = 'CONFIRMED'
    `, [new Date().toISOString().split('T')[0]]);

    // 9. Pending leave requests
    const pendingLeavesRes = await query(`SELECT COUNT(*) FROM leave_requests WHERE status = 'PENDING'`);

    return res.json({
      period,
      metrics: {
        totalEarned,
        courtRevenue,
        shopRevenue,
        barRevenue,
        membershipRevenue,
        totalOwed,
        totalMembersCount: parseInt(totalMembersRes[0].count, 10),
        activeMembersCount: parseInt(activeMembersRes[0].count, 10),
        todayBookings: parseInt(todayBookingsRes[0].count, 10),
        pendingLeaves: parseInt(pendingLeavesRes[0].count, 10),
      },
      leadStats,
      paymentMethods,
      invoices,
      shifts: shiftRows
    });
  } catch (error) {
    console.error('getOwnerDashboardMetrics Error:', error);
    return res.status(500).json({ error: 'Failed to fetch executive dashboard metrics.' });
  }
}
