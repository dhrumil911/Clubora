import { query } from '../config/db.js';

/**
 * GET /api/invoices - List all invoices with optional status filter
 */
export async function getInvoices(req, res) {
  try {
    const { status, type } = req.query;
    let sql = `
      SELECT id, invoice_number AS "invoiceNumber", client_name AS "clientName",
             client_email AS "clientEmail", type, amount, due_date AS "dueDate",
             status, paid_at AS "paidAt", notes, created_at AS "createdAt"
      FROM invoices
    `;
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (type) {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY created_at DESC';

    const rows = await query(sql, params);
    const invoices = rows.map(i => ({ ...i, amount: parseFloat(i.amount) }));

    return res.json(invoices);
  } catch (error) {
    console.error('getInvoices Error:', error);
    return res.status(500).json({ error: 'Failed to fetch invoices.' });
  }
}

/**
 * GET /api/invoices/summary - Invoice summary metrics
 */
export async function getInvoiceSummary(req, res) {
  try {
    const totalRes = await query(`SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM invoices`);
    const pendingRes = await query(`SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'PENDING'`);
    const paidRes = await query(`SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'PAID'`);
    const overdueRes = await query(`SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'OVERDUE'`);

    return res.json({
      total: { count: parseInt(totalRes[0].count), amount: parseFloat(totalRes[0].total) },
      pending: { count: parseInt(pendingRes[0].count), amount: parseFloat(pendingRes[0].total) },
      paid: { count: parseInt(paidRes[0].count), amount: parseFloat(paidRes[0].total) },
      overdue: { count: parseInt(overdueRes[0].count), amount: parseFloat(overdueRes[0].total) },
    });
  } catch (error) {
    console.error('getInvoiceSummary Error:', error);
    return res.status(500).json({ error: 'Failed to fetch invoice summary.' });
  }
}

/**
 * POST /api/invoices - Create a new invoice
 */
export async function createInvoice(req, res) {
  try {
    const { clientName, clientEmail, type, amount, dueDate, notes = '' } = req.body;

    if (!clientName || !clientEmail || !type || !amount || !dueDate) {
      return res.status(400).json({ error: 'clientName, clientEmail, type, amount, and dueDate are required.' });
    }

    const id = `inv-${Date.now()}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    await query(`
      INSERT INTO invoices (id, invoice_number, client_name, client_email, type, amount, due_date, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
    `, [id, invoiceNumber, clientName, clientEmail, type, parseFloat(amount), dueDate, notes]);

    return res.status(201).json({
      id, invoiceNumber, clientName, clientEmail, type,
      amount: parseFloat(amount), dueDate, status: 'PENDING', notes
    });
  } catch (error) {
    console.error('createInvoice Error:', error);
    return res.status(500).json({ error: 'Failed to create invoice.' });
  }
}

/**
 * PUT /api/invoices/:id - Update invoice details
 */
export async function updateInvoice(req, res) {
  try {
    const { id } = req.params;
    const { clientName, clientEmail, type, amount, dueDate, notes } = req.body;

    const existing = await query('SELECT id FROM invoices WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    await query(`
      UPDATE invoices SET
        client_name = COALESCE($1, client_name),
        client_email = COALESCE($2, client_email),
        type = COALESCE($3, type),
        amount = COALESCE($4, amount),
        due_date = COALESCE($5, due_date),
        notes = COALESCE($6, notes)
      WHERE id = $7
    `, [clientName, clientEmail, type, amount ? parseFloat(amount) : null, dueDate, notes, id]);

    return res.json({ message: 'Invoice updated successfully.', id });
  } catch (error) {
    console.error('updateInvoice Error:', error);
    return res.status(500).json({ error: 'Failed to update invoice.' });
  }
}

/**
 * PUT /api/invoices/:id/pay - Mark an invoice as paid
 */
export async function markInvoicePaid(req, res) {
  try {
    const { id } = req.params;

    const existing = await query('SELECT id, status FROM invoices WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    await query(`
      UPDATE invoices SET status = 'PAID', paid_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [id]);

    return res.json({ message: 'Invoice marked as paid.', id, status: 'PAID' });
  } catch (error) {
    console.error('markInvoicePaid Error:', error);
    return res.status(500).json({ error: 'Failed to mark invoice as paid.' });
  }
}

/**
 * PUT /api/invoices/:id/overdue - Mark an invoice as overdue
 */
export async function markInvoiceOverdue(req, res) {
  try {
    const { id } = req.params;

    await query(`UPDATE invoices SET status = 'OVERDUE' WHERE id = $1`, [id]);

    return res.json({ message: 'Invoice marked as overdue.', id, status: 'OVERDUE' });
  } catch (error) {
    console.error('markInvoiceOverdue Error:', error);
    return res.status(500).json({ error: 'Failed to mark invoice as overdue.' });
  }
}

/**
 * DELETE /api/invoices/:id - Delete an invoice
 */
export async function deleteInvoice(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM invoices WHERE id = $1', [id]);
    return res.json({ message: 'Invoice deleted.', id });
  } catch (error) {
    console.error('deleteInvoice Error:', error);
    return res.status(500).json({ error: 'Failed to delete invoice.' });
  }
}
