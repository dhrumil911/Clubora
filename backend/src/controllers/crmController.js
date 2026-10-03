import { query } from '../config/db.js';

export async function getLeads(req, res) {
  try {
    const leadRows = await query(`
      SELECT id, name, phone, email, interest, status, notes, created_at AS "createdAt"
      FROM leads
      ORDER BY created_at DESC
    `);

    const leads = [];
    for (const lead of leadRows) {
      const quoteRows = await query(`
        SELECT id, lead_id AS "leadId", tier_name AS "tierName", court_hours AS "courtHours",
               total_price AS "totalPrice", valid_until AS "validUntil", status
        FROM quotes
        WHERE lead_id = $1
      `, [lead.id]);

      leads.push({
        ...lead,
        quotes: quoteRows.map(q => ({
          ...q,
          totalPrice: parseFloat(q.totalPrice)
        }))
      });
    }

    return res.json(leads);
  } catch (error) {
    console.error('getLeads Error:', error);
    return res.status(500).json({ error: 'Failed to fetch CRM leads.' });
  }
}

export async function createLead(req, res) {
  try {
    const { name, phone, email, interest = 'General Enquiry', notes = '' } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Name, phone, and email are required for lead capture.' });
    }

    const leadId = `lead-${Date.now()}`;

    await query(`
      INSERT INTO leads (id, name, phone, email, interest, status, notes)
      VALUES ($1, $2, $3, $4, $5, 'NEW', $6)
    `, [leadId, name, phone, email, interest, notes]);

    return res.status(201).json({
      id: leadId,
      name,
      phone,
      email,
      interest,
      status: 'NEW',
      notes
    });
  } catch (error) {
    console.error('createLead Error:', error);
    return res.status(500).json({ error: 'Failed to record visitor enquiry.' });
  }
}

export async function updateLeadStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (notes) {
      await query('UPDATE leads SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [status, notes, id]);
    } else {
      await query('UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);
    }

    return res.json({ message: 'Lead status updated.', id, status });
  } catch (error) {
    console.error('updateLeadStatus Error:', error);
    return res.status(500).json({ error: 'Failed to update lead status.' });
  }
}

export async function generateQuote(req, res) {
  try {
    const { leadId, tierName = 'Custom Plan', courtHours = 0, totalPrice = 0, validUntil } = req.body;

    const leadRows = await query('SELECT id FROM leads WHERE id = $1', [leadId]);
    if (leadRows.length === 0) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const quoteId = `q-${Date.now()}`;
    const validUntilDate = validUntil || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    await query(`
      INSERT INTO quotes (id, lead_id, tier_name, court_hours, total_price, valid_until, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'SENT')
    `, [quoteId, leadId, tierName, parseInt(courtHours, 10), parseFloat(totalPrice), validUntilDate]);

    await query(`UPDATE leads SET status = 'QUOTED' WHERE id = $1`, [leadId]);

    return res.status(201).json({
      id: quoteId,
      leadId,
      tierName,
      courtHours,
      totalPrice: parseFloat(totalPrice),
      validUntil: validUntilDate,
      status: 'SENT'
    });
  } catch (error) {
    console.error('generateQuote Error:', error);
    return res.status(500).json({ error: 'Failed to generate quote.' });
  }
}
