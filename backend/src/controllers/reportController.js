import { query } from '../config/db.js';

/**
 * GET /api/reports/revenue - Revenue breakdown by period (today, week, month, all)
 */
export async function getRevenueReport(req, res) {
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

    // Court revenue
    const courtRes = await query(`
      SELECT COALESCE(SUM(final_fee), 0) AS total, COUNT(*) AS count
      FROM bookings WHERE status = 'CONFIRMED' ${dateFilter.replace('created_at', 'created_at')}
    `);

    // Shop revenue
    const shopRes = await query(`
      SELECT COALESCE(SUM(total_price), 0) AS total, COUNT(*) AS count
      FROM inventory_transactions WHERE type IN ('SALE_POS', 'SALE_ONLINE') ${dateFilter}
    `);

    // Bar revenue
    const barDateFilter = dateFilter.replace('created_at', 'settled_at');
    const barRes = await query(`
      SELECT COALESCE(SUM(final_amount), 0) AS total, COUNT(*) AS count
      FROM bar_tabs WHERE status = 'SETTLED' ${barDateFilter || ''}
    `);

    // Membership revenue
    const memRes = await query(`
      SELECT COALESCE(SUM(t.monthly_fee), 0) AS total, COUNT(*) AS count
      FROM members m JOIN membership_tiers t ON m.tier_id = t.id
      WHERE m.status = 'ACTIVE'
    `);

    // Invoice revenue (paid)
    const invoiceRes = await query(`
      SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
      FROM invoices WHERE status = 'PAID' ${dateFilter}
    `);

    const courtRevenue = parseFloat(courtRes[0].total);
    const shopRevenue = parseFloat(shopRes[0].total);
    const barRevenue = parseFloat(barRes[0].total);
    const membershipRevenue = parseFloat(memRes[0].total);
    const invoiceRevenue = parseFloat(invoiceRes[0].total);
    const totalRevenue = courtRevenue + shopRevenue + barRevenue + membershipRevenue + invoiceRevenue;

    return res.json({
      period,
      totalRevenue,
      breakdown: {
        courts: { revenue: courtRevenue, transactions: parseInt(courtRes[0].count) },
        shop: { revenue: shopRevenue, transactions: parseInt(shopRes[0].count) },
        bar: { revenue: barRevenue, transactions: parseInt(barRes[0].count) },
        memberships: { revenue: membershipRevenue, members: parseInt(memRes[0].count) },
        invoices: { revenue: invoiceRevenue, paid: parseInt(invoiceRes[0].count) },
      }
    });
  } catch (error) {
    console.error('getRevenueReport Error:', error);
    return res.status(500).json({ error: 'Failed to generate revenue report.' });
  }
}

/**
 * GET /api/reports/tax - Tax report with GST/tax breakdown
 */
export async function getTaxReport(req, res) {
  try {
    const { period = 'month' } = req.query;

    let dateFilter = '';
    if (period === 'today') {
      dateFilter = `AND created_at >= CURRENT_DATE`;
    } else if (period === 'week') {
      dateFilter = `AND created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === 'month') {
      dateFilter = `AND created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    } else if (period === 'quarter') {
      dateFilter = `AND created_at >= CURRENT_DATE - INTERVAL '90 days'`;
    } else if (period === 'year') {
      dateFilter = `AND created_at >= CURRENT_DATE - INTERVAL '365 days'`;
    }

    // Court bookings (taxable)
    const courtRes = await query(`
      SELECT COALESCE(SUM(final_fee), 0) AS total
      FROM bookings WHERE status = 'CONFIRMED' ${dateFilter}
    `);

    // Shop sales (taxable)
    const shopRes = await query(`
      SELECT COALESCE(SUM(total_price), 0) AS total
      FROM inventory_transactions WHERE type IN ('SALE_POS', 'SALE_ONLINE') ${dateFilter}
    `);

    // Bar sales (taxable)
    const barDateFilter = dateFilter.replace('created_at', 'settled_at');
    const barRes = await query(`
      SELECT COALESCE(SUM(final_amount), 0) AS total
      FROM bar_tabs WHERE status = 'SETTLED' ${barDateFilter || ''}
    `);

    // Memberships (exempt or lower rate)
    const memRes = await query(`
      SELECT COALESCE(SUM(t.monthly_fee), 0) AS total
      FROM members m JOIN membership_tiers t ON m.tier_id = t.id
      WHERE m.status = 'ACTIVE'
    `);

    // Paid invoices
    const invRes = await query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM invoices WHERE status = 'PAID' ${dateFilter}
    `);

    const courtTotal = parseFloat(courtRes[0].total);
    const shopTotal = parseFloat(shopRes[0].total);
    const barTotal = parseFloat(barRes[0].total);
    const membershipTotal = parseFloat(memRes[0].total);
    const invoiceTotal = parseFloat(invRes[0].total);

    // Tax rates (configurable - using standard rates)
    const GST_RATE = 0.18;       // 18% GST on services & goods
    const MEMBERSHIP_TAX = 0.12; // 12% on membership fees
    const FOOD_TAX = 0.05;       // 5% on food/beverage

    const courtTax = courtTotal * GST_RATE;
    const shopTax = shopTotal * GST_RATE;
    const barTax = barTotal * FOOD_TAX;
    const membershipTax = membershipTotal * MEMBERSHIP_TAX;
    const invoiceTax = invoiceTotal * GST_RATE;

    const totalGross = courtTotal + shopTotal + barTotal + membershipTotal + invoiceTotal;
    const totalTax = courtTax + shopTax + barTax + membershipTax + invoiceTax;

    return res.json({
      period,
      totalGrossRevenue: totalGross,
      totalTaxLiability: totalTax,
      totalNetRevenue: totalGross - totalTax,
      categories: [
        { name: 'Court Bookings', grossRevenue: courtTotal, taxRate: GST_RATE * 100, taxAmount: courtTax, netRevenue: courtTotal - courtTax },
        { name: 'Gear Shop Sales', grossRevenue: shopTotal, taxRate: GST_RATE * 100, taxAmount: shopTax, netRevenue: shopTotal - shopTax },
        { name: 'Bar & Cafeteria', grossRevenue: barTotal, taxRate: FOOD_TAX * 100, taxAmount: barTax, netRevenue: barTotal - barTax },
        { name: 'Memberships', grossRevenue: membershipTotal, taxRate: MEMBERSHIP_TAX * 100, taxAmount: membershipTax, netRevenue: membershipTotal - membershipTax },
        { name: 'Client Invoices', grossRevenue: invoiceTotal, taxRate: GST_RATE * 100, taxAmount: invoiceTax, netRevenue: invoiceTotal - invoiceTax },
      ]
    });
  } catch (error) {
    console.error('getTaxReport Error:', error);
    return res.status(500).json({ error: 'Failed to generate tax report.' });
  }
}

/**
 * GET /api/reports/export - Export-ready financial summary
 */
export async function getExportData(req, res) {
  try {
    const { period = 'month' } = req.query;

    let dateFilter = '';
    if (period === 'today') {
      dateFilter = `WHERE created_at >= CURRENT_DATE`;
    } else if (period === 'week') {
      dateFilter = `WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === 'month') {
      dateFilter = `WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    // Get all bookings for the period
    const bookings = await query(`
      SELECT id, court_id, customer_name, booking_date, final_fee, status, created_at
      FROM bookings ${dateFilter || ''} ORDER BY created_at DESC
    `);

    // Get all shop transactions
    const shopTx = await query(`
      SELECT id, product_id, type, quantity, total_price, channel, created_at
      FROM inventory_transactions ${dateFilter || ''} ORDER BY created_at DESC
    `);

    // Get all bar tabs
    const barDateFilter = dateFilter.replace('created_at', 'settled_at');
    const barTabs = await query(`
      SELECT id, tab_number, customer_name, total_amount, discount_amount, final_amount, payment_method, status, settled_at
      FROM bar_tabs ${barDateFilter || ''} ORDER BY opened_at DESC
    `);

    // Get all invoices
    const invoices = await query(`
      SELECT id, invoice_number, client_name, type, amount, due_date, status
      FROM invoices ${dateFilter || ''} ORDER BY created_at DESC
    `);

    return res.json({
      exportDate: new Date().toISOString(),
      period,
      data: {
        bookings: bookings.map(b => ({ ...b, final_fee: parseFloat(b.final_fee) })),
        shopTransactions: shopTx.map(t => ({ ...t, total_price: parseFloat(t.total_price) })),
        barTabs: barTabs.map(t => ({ ...t, total_amount: parseFloat(t.total_amount), final_amount: parseFloat(t.final_amount) })),
        invoices: invoices.map(i => ({ ...i, amount: parseFloat(i.amount) })),
      },
      summary: {
        totalBookings: bookings.length,
        totalShopTransactions: shopTx.length,
        totalBarTabs: barTabs.length,
        totalInvoices: invoices.length,
      }
    });
  } catch (error) {
    console.error('getExportData Error:', error);
    return res.status(500).json({ error: 'Failed to export financial data.' });
  }
}
