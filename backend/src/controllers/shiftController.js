import { query } from '../config/db.js';

// ======================== SHIFTS ========================

/**
 * GET /api/shifts - List all shifts with optional date filter
 */
export async function getShifts(req, res) {
  try {
    const { date, staffName } = req.query;
    let sql = `
      SELECT id, staff_name AS "staffName", role, date, start_time AS "startTime",
             end_time AS "endTime", status
      FROM shifts
    `;
    const conditions = [];
    const params = [];

    if (date) {
      params.push(date);
      conditions.push(`date = $${params.length}`);
    }
    if (staffName) {
      params.push(`%${staffName}%`);
      conditions.push(`staff_name ILIKE $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY date DESC, start_time ASC';

    const rows = await query(sql, params);
    return res.json(rows);
  } catch (error) {
    console.error('getShifts Error:', error);
    return res.status(500).json({ error: 'Failed to fetch shifts.' });
  }
}

/**
 * POST /api/shifts - Create a new shift
 */
export async function createShift(req, res) {
  try {
    const { staffName, role, date, startTime, endTime } = req.body;

    if (!staffName || !role || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'staffName, role, date, startTime, and endTime are required.' });
    }

    const id = `sh-${Date.now()}`;

    await query(`
      INSERT INTO shifts (id, staff_name, role, date, start_time, end_time, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'SCHEDULED')
    `, [id, staffName, role, date, startTime, endTime]);

    return res.status(201).json({
      id, staffName, role, date, startTime, endTime, status: 'SCHEDULED'
    });
  } catch (error) {
    console.error('createShift Error:', error);
    return res.status(500).json({ error: 'Failed to create shift.' });
  }
}

/**
 * PUT /api/shifts/:id - Update a shift
 */
export async function updateShift(req, res) {
  try {
    const { id } = req.params;
    const { staffName, role, date, startTime, endTime, status } = req.body;

    const existing = await query('SELECT id FROM shifts WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Shift not found.' });
    }

    await query(`
      UPDATE shifts SET
        staff_name = COALESCE($1, staff_name),
        role = COALESCE($2, role),
        date = COALESCE($3, date),
        start_time = COALESCE($4, start_time),
        end_time = COALESCE($5, end_time),
        status = COALESCE($6, status)
      WHERE id = $7
    `, [staffName, role, date, startTime, endTime, status, id]);

    return res.json({ message: 'Shift updated.', id });
  } catch (error) {
    console.error('updateShift Error:', error);
    return res.status(500).json({ error: 'Failed to update shift.' });
  }
}

/**
 * DELETE /api/shifts/:id - Delete a shift
 */
export async function deleteShift(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM shifts WHERE id = $1', [id]);
    return res.json({ message: 'Shift deleted.', id });
  } catch (error) {
    console.error('deleteShift Error:', error);
    return res.status(500).json({ error: 'Failed to delete shift.' });
  }
}

// ======================== LEAVE REQUESTS ========================

/**
 * GET /api/leaves - List all leave requests
 */
export async function getLeaveRequests(req, res) {
  try {
    const { status } = req.query;
    let sql = `
      SELECT id, staff_name AS "staffName", role, leave_type AS "leaveType",
             start_date AS "startDate", end_date AS "endDate", reason,
             status, reviewed_by AS "reviewedBy", reviewed_at AS "reviewedAt",
             created_at AS "createdAt"
      FROM leave_requests
    `;
    const params = [];

    if (status) {
      params.push(status);
      sql += ` WHERE status = $1`;
    }
    sql += ' ORDER BY created_at DESC';

    const rows = await query(sql, params);
    return res.json(rows);
  } catch (error) {
    console.error('getLeaveRequests Error:', error);
    return res.status(500).json({ error: 'Failed to fetch leave requests.' });
  }
}

/**
 * POST /api/leaves - Create a leave request
 */
export async function createLeaveRequest(req, res) {
  try {
    const { staffName, role, leaveType = 'CASUAL', startDate, endDate, reason = '' } = req.body;

    if (!staffName || !role || !startDate || !endDate) {
      return res.status(400).json({ error: 'staffName, role, startDate, and endDate are required.' });
    }

    const id = `lv-${Date.now()}`;

    await query(`
      INSERT INTO leave_requests (id, staff_name, role, leave_type, start_date, end_date, reason, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
    `, [id, staffName, role, leaveType, startDate, endDate, reason]);

    return res.status(201).json({
      id, staffName, role, leaveType, startDate, endDate, reason, status: 'PENDING'
    });
  } catch (error) {
    console.error('createLeaveRequest Error:', error);
    return res.status(500).json({ error: 'Failed to create leave request.' });
  }
}

/**
 * PUT /api/leaves/:id/review - Approve or deny a leave request
 */
export async function reviewLeaveRequest(req, res) {
  try {
    const { id } = req.params;
    const { status, reviewedBy } = req.body;

    if (!status || !['APPROVED', 'DENIED'].includes(status)) {
      return res.status(400).json({ error: 'status must be APPROVED or DENIED.' });
    }

    const existing = await query('SELECT id FROM leave_requests WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    await query(`
      UPDATE leave_requests SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [status, reviewedBy || 'Owner', id]);

    return res.json({ message: `Leave request ${status.toLowerCase()}.`, id, status });
  } catch (error) {
    console.error('reviewLeaveRequest Error:', error);
    return res.status(500).json({ error: 'Failed to review leave request.' });
  }
}
