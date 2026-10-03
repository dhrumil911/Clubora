import { query } from '../config/db.js';
import { randomUUID } from 'crypto';

function formatTierRow(row) {
  if (!row) return null;
  return {
    id: row.tier_id || row.id,
    name: row.tier_name || row.name,
    monthlyFee: parseFloat(row.monthly_fee || 0),
    courtDiscountPercent: parseFloat(row.court_discount_percent || 0),
    shopDiscountPercent: parseFloat(row.shop_discount_percent || 0),
    barDiscountPercent: parseFloat(row.bar_discount_percent || 0),
    description: row.description
  };
}

function formatMemberRow(row) {
  if (!row) return null;
  const now = new Date();
  const expiresAtDate = new Date(row.expires_at);
  const isExpired = expiresAtDate < now;

  return {
    id: row.id,
    memberCode: row.member_code,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    tierId: row.tier_id,
    joinedAt: row.joined_at,
    expiresAt: row.expires_at,
    status: row.status,
    computedStatus: isExpired ? 'EXPIRED' : row.status,
    tier: {
      id: row.tier_id,
      name: row.tier_name,
      monthlyFee: parseFloat(row.monthly_fee || 0),
      courtDiscountPercent: parseFloat(row.court_discount_percent || 0),
      shopDiscountPercent: parseFloat(row.shop_discount_percent || 0),
      barDiscountPercent: parseFloat(row.bar_discount_percent || 0)
    }
  };
}

export async function getTiers(req, res) {
  try {
    const rows = await query(`
      SELECT 
        id, 
        name, 
        monthly_fee AS "monthlyFee", 
        court_discount_percent AS "courtDiscountPercent", 
        shop_discount_percent AS "shopDiscountPercent", 
        bar_discount_percent AS "barDiscountPercent", 
        description 
      FROM membership_tiers
      ORDER BY monthly_fee DESC
    `);
    const formatted = rows.map(r => ({
      ...r,
      monthlyFee: parseFloat(r.monthlyFee),
      courtDiscountPercent: parseFloat(r.courtDiscountPercent),
      shopDiscountPercent: parseFloat(r.shopDiscountPercent),
      barDiscountPercent: parseFloat(r.barDiscountPercent)
    }));
    return res.json(formatted);
  } catch (error) {
    console.error('getTiers Error:', error);
    return res.status(500).json({ error: 'Failed to fetch membership tiers.' });
  }
}

export async function getMembers(req, res) {
  try {
    const { search = '', tier = '' } = req.query;

    let sql = `
      SELECT 
        m.id, m.member_code, m.name, m.email, m.phone, m.tier_id, m.joined_at, m.expires_at, m.status,
        t.name AS tier_name, t.monthly_fee, t.court_discount_percent, t.shop_discount_percent, t.bar_discount_percent
      FROM members m
      JOIN membership_tiers t ON m.tier_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (m.name ILIKE $${params.length} OR m.email ILIKE $${params.length} OR m.member_code ILIKE $${params.length} OR m.phone ILIKE $${params.length})`;
    }

    if (tier) {
      params.push(tier);
      sql += ` AND t.name = $${params.length}`;
    }

    sql += ` ORDER BY m.created_at DESC`;

    const rows = await query(sql, params);
    const members = rows.map(formatMemberRow);

    return res.json(members);
  } catch (error) {
    console.error('getMembers Error:', error);
    return res.status(500).json({ error: 'Failed to fetch members.' });
  }
}

export async function getMemberById(req, res) {
  try {
    const { id } = req.params;

    const rows = await query(`
      SELECT 
        m.id, m.member_code, m.name, m.email, m.phone, m.tier_id, m.joined_at, m.expires_at, m.status,
        t.name AS tier_name, t.monthly_fee, t.court_discount_percent, t.shop_discount_percent, t.bar_discount_percent
      FROM members m
      JOIN membership_tiers t ON m.tier_id = t.id
      WHERE m.id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const member = formatMemberRow(rows[0]);

    // Fetch member's recent court bookings
    const bookingRows = await query(`
      SELECT 
        b.id, b.booking_date AS "bookingDate", b.start_time AS "startTime", b.end_time AS "endTime",
        b.final_fee AS "finalFee", c.name AS court_name
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE b.member_id = $1
      ORDER BY b.created_at DESC
      LIMIT 10
    `, [id]);

    member.bookings = bookingRows.map(b => ({
      ...b,
      finalFee: parseFloat(b.finalFee),
      court: { name: b.court_name }
    }));

    return res.json(member);
  } catch (error) {
    console.error('getMemberById Error:', error);
    return res.status(500).json({ error: 'Failed to fetch member details.' });
  }
}

export async function createMember(req, res) {
  try {
    const { name, email, phone = '', tierId, durationMonths = 12 } = req.body;

    if (!name || !email || !tierId) {
      return res.status(400).json({ error: 'Name, email, and membership tier are required.' });
    }

    const existing = await query('SELECT id FROM members WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Member with this email already exists.' });
    }

    const tierRows = await query('SELECT * FROM membership_tiers WHERE id = $1', [tierId]);
    if (tierRows.length === 0) {
      return res.status(404).json({ error: 'Selected membership tier not found.' });
    }
    const tier = tierRows[0];

    const countRes = await query('SELECT COUNT(*) FROM members');
    const memberCount = parseInt(countRes[0].count, 10) + 1;
    const prefix = tier.name.substring(0, 4).toUpperCase();
    const memberCode = `MEM-${prefix}-${String(memberCount).padStart(3, '0')}`;

    const newId = `mem-${Date.now()}`;
    const joinedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(joinedAt.getMonth() + parseInt(durationMonths, 10));

    await query(`
      INSERT INTO members (id, member_code, name, email, phone, tier_id, joined_at, expires_at, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
    `, [newId, memberCode, name, email, phone, tierId, joinedAt.toISOString(), expiresAt.toISOString()]);

    const createdRows = await query(`
      SELECT 
        m.id, m.member_code, m.name, m.email, m.phone, m.tier_id, m.joined_at, m.expires_at, m.status,
        t.name AS tier_name, t.monthly_fee, t.court_discount_percent, t.shop_discount_percent, t.bar_discount_percent
      FROM members m
      JOIN membership_tiers t ON m.tier_id = t.id
      WHERE m.id = $1
    `, [newId]);

    return res.status(201).json(formatMemberRow(createdRows[0]));
  } catch (error) {
    console.error('createMember Error:', error);
    return res.status(500).json({ error: 'Failed to register new member.' });
  }
}

export async function updateMemberPlan(req, res) {
  try {
    const { id } = req.params;
    const { tierId, extendMonths = 12 } = req.body;

    const tierRows = await query('SELECT * FROM membership_tiers WHERE id = $1', [tierId]);
    if (tierRows.length === 0) {
      return res.status(404).json({ error: 'Membership tier not found.' });
    }

    const memberRows = await query('SELECT * FROM members WHERE id = $1', [id]);
    if (memberRows.length === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const currentExpiry = new Date(memberRows[0].expires_at);
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    baseDate.setMonth(baseDate.getMonth() + parseInt(extendMonths, 10));

    await query(`
      UPDATE members
      SET tier_id = $1, expires_at = $2, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [tierId, baseDate.toISOString(), id]);

    const updatedRows = await query(`
      SELECT 
        m.id, m.member_code, m.name, m.email, m.phone, m.tier_id, m.joined_at, m.expires_at, m.status,
        t.name AS tier_name, t.monthly_fee, t.court_discount_percent, t.shop_discount_percent, t.bar_discount_percent
      FROM members m
      JOIN membership_tiers t ON m.tier_id = t.id
      WHERE m.id = $1
    `, [id]);

    return res.json(formatMemberRow(updatedRows[0]));
  } catch (error) {
    console.error('updateMemberPlan Error:', error);
    return res.status(500).json({ error: 'Failed to update member plan.' });
  }
}
