import { query } from '../config/db.js';

function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMins) {
  const endH = Math.floor(totalMins / 60);
  const endM = totalMins % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export async function getCourts(req, res) {
  try {
    const rows = await query(`
      SELECT 
        id, 
        name, 
        sport, 
        hourly_rate AS "hourlyRate", 
        is_available AS "isAvailable"
      FROM courts
      ORDER BY name ASC
    `);
    const courts = rows.map(c => ({
      ...c,
      hourlyRate: parseFloat(c.hourlyRate)
    }));
    return res.json(courts);
  } catch (error) {
    console.error('getCourts Error:', error);
    return res.status(500).json({ error: 'Failed to fetch courts.' });
  }
}

export async function getBookings(req, res) {
  try {
    const { date, courtId } = req.query;

    let sql = `
      SELECT 
        b.id, b.court_id AS "courtId", b.member_id AS "memberId", b.customer_name AS "customerName",
        b.booking_date AS "bookingDate", b.start_time AS "startTime", b.end_time AS "endTime",
        b.is_social_play AS "isSocialPlay", b.players_count AS "playersCount",
        b.original_fee AS "originalFee", b.discount_fee AS "discountFee", b.final_fee AS "finalFee",
        b.payment_status AS "paymentStatus", b.status,
        c.name AS court_name, c.sport AS court_sport, c.hourly_rate AS court_rate,
        m.name AS member_name, m.member_code, t.name AS tier_name
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      LEFT JOIN members m ON b.member_id = m.id
      LEFT JOIN membership_tiers t ON m.tier_id = t.id
      WHERE b.status = 'CONFIRMED'
    `;

    const params = [];
    if (date) {
      params.push(date);
      sql += ` AND b.booking_date = $${params.length}`;
    }
    if (courtId) {
      params.push(courtId);
      sql += ` AND b.court_id = $${params.length}`;
    }

    sql += ` ORDER BY b.start_time ASC`;

    const rows = await query(sql, params);
    const bookings = rows.map(b => ({
      id: b.id,
      courtId: b.courtId,
      memberId: b.memberId,
      customerName: b.customerName,
      bookingDate: b.bookingDate,
      startTime: b.startTime,
      endTime: b.endTime,
      isSocialPlay: Boolean(b.isSocialPlay),
      playersCount: b.playersCount,
      originalFee: parseFloat(b.originalFee),
      discountFee: parseFloat(b.discountFee),
      finalFee: parseFloat(b.finalFee),
      paymentStatus: b.paymentStatus,
      status: b.status,
      court: { id: b.courtId, name: b.court_name, sport: b.court_sport, hourlyRate: parseFloat(b.court_rate) },
      member: b.memberId ? { id: b.memberId, name: b.member_name, memberCode: b.member_code, tier: { name: b.tier_name } } : null
    }));

    return res.json(bookings);
  } catch (error) {
    console.error('getBookings Error:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
}

export async function createBooking(req, res) {
  try {
    let {
      courtId,
      memberId,
      customerName,
      bookingDate,
      startTime,
      durationMinutes = 60,
      isSocialPlay = false,
      playersCount = 1
    } = req.body;

    // 1. Basic Field Presence
    if (!courtId || !bookingDate || !startTime) {
      return res.status(400).json({ error: 'Court, booking date, and start time are required.' });
    }

    // 2. Validate 30-Minute Start Time Boundary
    const timeParts = startTime.split(':').map(Number);
    if (timeParts.length !== 2 || isNaN(timeParts[0]) || isNaN(timeParts[1])) {
      return res.status(400).json({ error: 'Invalid start time format. Use HH:MM format.' });
    }
    const [startH, startM] = timeParts;
    if (startM !== 0 && startM !== 30) {
      return res.status(400).json({ error: 'Start time must be on a 30-minute boundary (e.g., 06:00, 06:30, 07:00).' });
    }

    // 3. Enforce Session Duration = 60 Minutes (1 Hour)
    if (parseInt(durationMinutes, 10) !== 60 && req.body.endTime) {
      const requestedDuration = timeToMinutes(req.body.endTime) - timeToMinutes(startTime);
      if (requestedDuration !== 60) {
        return res.status(400).json({ error: 'Session duration must be exactly 1 hour (60 minutes).' });
      }
    }

    const newStartMins = timeToMinutes(startTime);
    const newEndMins = newStartMins + 60; // Exactly 1 hour
    const endTime = minutesToTime(newEndMins);

    // 4. Validate Court Existence
    const courtRows = await query('SELECT * FROM courts WHERE id = $1', [courtId]);
    if (courtRows.length === 0) {
      return res.status(404).json({ error: 'Court not found.' });
    }
    const court = courtRows[0];

    // Derive Member ID from JWT if logged in as MEMBER and memberId not provided
    let targetMemberId = memberId;
    if (req.user && req.user.role === 'MEMBER' && !targetMemberId) {
      const memberLookup = await query('SELECT id FROM members WHERE email = $1', [req.user.email]);
      if (memberLookup.length > 0) {
        targetMemberId = memberLookup[0].id;
      }
    }

    // 5. Member Daily Limit Check (Maximum 2 bookings per member per day)
    let discountPercent = 0;
    let displayName = customerName || 'Walk-in Customer';

    if (targetMemberId) {
      const memberRows = await query(`
        SELECT m.name, t.court_discount_percent 
        FROM members m
        JOIN membership_tiers t ON m.tier_id = t.id
        WHERE m.id = $1
      `, [targetMemberId]);

      if (memberRows.length === 0) {
        return res.status(404).json({ error: 'Selected member not found.' });
      }

      displayName = memberRows[0].name;
      discountPercent = parseFloat(memberRows[0].court_discount_percent || 0);

      const dailyCountRes = await query(`
        SELECT COUNT(*) FROM bookings
        WHERE member_id = $1 AND booking_date = $2 AND status = 'CONFIRMED'
      `, [targetMemberId, bookingDate]);

      if (parseInt(dailyCountRes[0].count, 10) >= 2) {
        return res.status(400).json({
          error: `Member "${displayName}" has already reached the maximum limit of 2 bookings for ${bookingDate}.`
        });
      }
    }

    // 6. Overlapping Booking Check (requested_start < existing_end AND requested_end > existing_start)
    if (!isSocialPlay) {
      const existingBookings = await query(`
        SELECT start_time, end_time FROM bookings
        WHERE court_id = $1 AND booking_date = $2 AND status = 'CONFIRMED' AND is_social_play = false
      `, [courtId, bookingDate]);

      for (const b of existingBookings) {
        const existStart = timeToMinutes(b.start_time);
        const existEnd = timeToMinutes(b.end_time);

        if (newStartMins < existEnd && newEndMins > existStart) {
          return res.status(400).json({
            error: `Court "${court.name}" is already booked from ${b.start_time} to ${b.end_time} on ${bookingDate}. Overlapping booking is not allowed!`
          });
        }
      }
    }

    // 7. Fee Calculation (Exactly 1 Hour = 1.0 * hourly_rate)
    const originalFee = parseFloat(court.hourly_rate); // 1 hour session
    const discountFee = (originalFee * discountPercent) / 100;
    const finalFee = Math.max(0, originalFee - discountFee);

    const bookingId = `bk-${Date.now()}`;

    await query(`
      INSERT INTO bookings (
        id, court_id, member_id, customer_name, booking_date, start_time, end_time,
        is_social_play, players_count, original_fee, discount_fee, final_fee, payment_status, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PAID', 'CONFIRMED')
    `, [
      bookingId, courtId, targetMemberId || null, displayName, bookingDate, startTime, endTime,
      Boolean(isSocialPlay), parseInt(playersCount, 10) || 1, originalFee, discountFee, finalFee
    ]);

    return res.status(201).json({
      id: bookingId,
      courtId,
      memberId: targetMemberId || null,
      customerName: displayName,
      bookingDate,
      startTime,
      endTime,
      isSocialPlay: Boolean(isSocialPlay),
      playersCount,
      originalFee,
      discountFee,
      finalFee,
      status: 'CONFIRMED'
    });
  } catch (error) {
    console.error('createBooking Error:', error);
    return res.status(500).json({ error: 'Failed to complete court booking.' });
  }
}

export async function cancelBooking(req, res) {
  try {
    const { id } = req.params;
    await query(`UPDATE bookings SET status = 'CANCELLED' WHERE id = $1`, [id]);
    return res.json({ message: 'Booking cancelled successfully.', id });
  } catch (error) {
    console.error('cancelBooking Error:', error);
    return res.status(500).json({ error: 'Failed to cancel booking.' });
  }
}
