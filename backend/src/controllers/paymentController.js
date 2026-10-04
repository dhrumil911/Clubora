import Razorpay from 'razorpay';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';
import { query, getClient } from '../config/db.js';

// Initialize Razorpay SDK with backend environment credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

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

/**
 * 1. Create Razorpay Order for Court Booking
 * Securely calculates fees on backend and generates Razorpay Order
 */
export async function createRazorpayOrder(req, res) {
  try {
    const {
      courtId,
      memberId,
      customerName,
      bookingDate,
      startTime,
      durationMinutes = 60,
      isSocialPlay = false,
      playersCount = 1
    } = req.body;

    // 1. Basic Field Validation
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
      return res.status(400).json({ error: 'Start time must be on a 30-minute boundary (e.g., 08:00, 08:30).' });
    }

    // 3. Enforce Exactly 60-Minute Session Duration
    const newStartMins = timeToMinutes(startTime);
    const newEndMins = newStartMins + 60;
    const endTime = minutesToTime(newEndMins);

    // 4. Validate Court Existence
    const courtRows = await query('SELECT * FROM courts WHERE id = $1', [courtId]);
    if (courtRows.length === 0) {
      return res.status(404).json({ error: 'Selected court not found.' });
    }
    const court = courtRows[0];

    // Derive Member ID if logged in as MEMBER
    let targetMemberId = memberId;
    if (req.user && req.user.role === 'MEMBER' && !targetMemberId) {
      const memberLookup = await query('SELECT id FROM members WHERE email = $1', [req.user.email]);
      if (memberLookup.length > 0) {
        targetMemberId = memberLookup[0].id;
      }
    }

    // 5. Member Daily Limit Check (Max 2 active bookings per member per day)
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
        WHERE member_id = $1 AND booking_date = $2 
          AND (status = 'CONFIRMED' OR (status = 'PENDING_PAYMENT' AND created_at > NOW() - INTERVAL '15 minutes'))
      `, [targetMemberId, bookingDate]);

      if (parseInt(dailyCountRes[0].count, 10) >= 2) {
        return res.status(400).json({
          error: `Member "${displayName}" has already reached the maximum limit of 2 bookings for ${bookingDate}.`
        });
      }
    }

    // 6. Overlapping Booking Check (excluding cancelled bookings)
    if (!isSocialPlay) {
      const existingBookings = await query(`
        SELECT id, start_time, end_time FROM bookings
        WHERE court_id = $1 AND booking_date = $2 
          AND (status = 'CONFIRMED' OR (status = 'PENDING_PAYMENT' AND created_at > NOW() - INTERVAL '15 minutes'))
          AND is_social_play = false
      `, [courtId, bookingDate]);

      for (const b of existingBookings) {
        const existStart = timeToMinutes(b.start_time);
        const existEnd = timeToMinutes(b.end_time);

        if (newStartMins < existEnd && newEndMins > existStart) {
          return res.status(400).json({
            error: `Court "${court.name}" is already booked from ${b.start_time} to ${b.end_time} on ${bookingDate}.`
          });
        }
      }
    }

    // 7. Backend Fee Calculation (Never trust client-supplied fee)
    const originalFee = parseFloat(court.hourly_rate);
    const discountFee = (originalFee * discountPercent) / 100;
    const finalFee = Math.max(0, originalFee - discountFee);

    // If 100% discount (e.g. Gold tier member free booking)
    if (finalFee === 0) {
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

      const paymentId = `pay-${Date.now()}`;
      await query(`
        INSERT INTO payments (
          id, booking_id, amount, currency, method, status
        ) VALUES ($1, $2, $3, 'INR', 'MEMBERSHIP_TIER_FREE', 'SUCCESS')
      `, [paymentId, bookingId, 0]);

      return res.status(201).json({
        success: true,
        isFree: true,
        bookingId,
        finalFee: 0,
        message: 'Court session booked successfully with 100% Membership Tier discount!'
      });
    }

    // 8. Create Pending Booking in Database
    const bookingId = `bk-${Date.now()}`;
    await query(`
      INSERT INTO bookings (
        id, court_id, member_id, customer_name, booking_date, start_time, end_time,
        is_social_play, players_count, original_fee, discount_fee, final_fee, payment_status, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING', 'PENDING_PAYMENT')
    `, [
      bookingId, courtId, targetMemberId || null, displayName, bookingDate, startTime, endTime,
      Boolean(isSocialPlay), parseInt(playersCount, 10) || 1, originalFee, discountFee, finalFee
    ]);

    // 9. Create Razorpay Order (Amount converted to Paise: 1 INR = 100 paise)
    const amountInPaise = Math.round(finalFee * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: bookingId,
      notes: {
        bookingId,
        courtId,
        customerName: displayName,
        bookingDate,
        startTime
      }
    });

    // 10. Record Pending Payment
    const paymentId = `pay-${Date.now()}`;
    await query(`
      INSERT INTO payments (
        id, booking_id, amount, currency, method, status, razorpay_order_id
      ) VALUES ($1, $2, $3, 'INR', 'ONLINE', 'PENDING', $4)
    `, [paymentId, bookingId, finalFee, razorpayOrder.id]);

    // 11. Return checkout payload to frontend (KEY_ID only, NEVER KEY_SECRET)
    return res.status(200).json({
      success: true,
      bookingId,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      finalFee,
      keyId: process.env.RAZORPAY_KEY_ID,
      courtName: court.name,
      customerName: displayName
    });

  } catch (error) {
    console.error('createRazorpayOrder Error:', error);
    return res.status(500).json({ error: 'Failed to create payment order. Please try again.' });
  }
}

/**
 * 2. Verify Razorpay Payment Signature and Confirm Booking
 * Verifies razorpay_order_id, razorpay_payment_id, and razorpay_signature using HMAC SHA256
 */
export async function verifyRazorpayPayment(req, res) {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      method = 'ONLINE'
    } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment verification parameters.' });
    }

    // 1. Check Existing Payment Record
    const paymentRows = await query(`
      SELECT * FROM payments WHERE booking_id = $1 AND razorpay_order_id = $2
    `, [bookingId, razorpay_order_id]);

    if (paymentRows.length === 0) {
      return res.status(404).json({ error: 'Payment record not found for this order.' });
    }

    const payment = paymentRows[0];

    // 2. Idempotency Check: Already Confirmed Payment
    if (payment.status === 'SUCCESS') {
      const bookingRows = await query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and booking confirmed.',
        booking: bookingRows[0] || null
      });
    }

    // 3. Recommended Razorpay Signature Verification
    // HMAC-SHA256 of "order_id|payment_id" with RAZORPAY_KEY_SECRET
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      // Record failed signature verification
      await query(`
        UPDATE payments 
        SET status = 'FAILED', 
            error_code = 'SIGNATURE_VERIFICATION_FAILED', 
            error_description = 'Generated signature did not match Razorpay signature',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [payment.id]);

      await query(`
        UPDATE bookings 
        SET status = 'CANCELLED', payment_status = 'FAILED'
        WHERE id = $1
      `, [bookingId]);

      return res.status(400).json({ error: 'Payment signature verification failed. Booking not confirmed.' });
    }

    // 4. Update Database in Safe Transaction: Payment -> SUCCESS, Booking -> CONFIRMED
    const client = await getClient();
    try {
      await client.query('BEGIN');

      await client.query(`
        UPDATE payments 
        SET status = 'SUCCESS',
            razorpay_payment_id = $1,
            razorpay_signature = $2,
            method = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [razorpay_payment_id, razorpay_signature, method, payment.id]);

      const bookingUpdateRes = await client.query(`
        UPDATE bookings 
        SET status = 'CONFIRMED',
            payment_status = 'PAID'
        WHERE id = $1
        RETURNING *
      `, [bookingId]);

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: 'Payment verified and booking confirmed successfully!',
        booking: bookingUpdateRes.rows[0]
      });
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('verifyRazorpayPayment Error:', error);
    return res.status(500).json({ error: 'Failed to verify payment. Please contact support.' });
  }
}

/**
 * 3. Handle Payment Cancellation or Modal Dismissal
 * Frees slot by updating booking status from PENDING_PAYMENT to CANCELLED
 */
export async function cancelPendingBooking(req, res) {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required.' });
    }

    // Only cancel if still pending payment
    await query(`
      UPDATE payments 
      SET status = 'FAILED', error_description = 'User dismissed checkout modal or cancelled payment', updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $1 AND status = 'PENDING'
    `, [bookingId]);

    const result = await query(`
      UPDATE bookings 
      SET status = 'CANCELLED', payment_status = 'CANCELLED'
      WHERE id = $1 AND status = 'PENDING_PAYMENT'
      RETURNING id
    `, [bookingId]);

    return res.json({
      success: true,
      message: 'Pending booking cancelled and slot released.',
      cancelled: result.length > 0
    });
  } catch (error) {
    console.error('cancelPendingBooking Error:', error);
    return res.status(500).json({ error: 'Failed to cancel pending booking.' });
  }
}

/**
 * 4. Record Offline Cash Payment (Staff only)
 * Directly records payment in DB without interacting with Razorpay
 */
export async function recordCashPayment(req, res) {
  try {
    const { bookingId, amount } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required.' });
    }

    const paymentId = `pay-${Date.now()}`;
    await query(`
      INSERT INTO payments (
        id, booking_id, amount, currency, method, status
      ) VALUES ($1, $2, $3, 'INR', 'CASH', 'SUCCESS')
    `, [paymentId, bookingId, parseFloat(amount || 0)]);

    await query(`
      UPDATE bookings 
      SET status = 'CONFIRMED', payment_status = 'PAID'
      WHERE id = $1
    `, [bookingId]);

    return res.json({
      success: true,
      message: 'Cash payment recorded and booking confirmed successfully!'
    });
  } catch (error) {
    console.error('recordCashPayment Error:', error);
    return res.status(500).json({ error: 'Failed to record cash payment.' });
  }
}

/**
 * Reusable Razorpay HMAC SHA256 Signature Verification Helper
 */
function verifySignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');
  return expectedSignature === signature;
}

/**
 * 5. Create Razorpay Order for Membership Plan (Gold, Silver, Junior)
 * Supports new member registration & existing member renewal/upgrade
 */
export async function createRazorpayPlanOrder(req, res) {
  try {
    const { name, email, phone, tierName = 'Gold', durationMonths = 12, memberId } = req.body;

    // Validate tier exists
    const tierRows = await query(
      'SELECT * FROM membership_tiers WHERE LOWER(name) = LOWER($1)',
      [tierName]
    );
    if (tierRows.length === 0) {
      return res.status(400).json({ error: `Invalid membership tier: ${tierName}` });
    }
    const tier = tierRows[0];

    // If new signup (no memberId and no logged-in member), check email uniqueness
    if (!memberId && (!req.user || req.user.role !== 'MEMBER')) {
      if (!email) {
        return res.status(400).json({ error: 'Email is required for new registration.' });
      }
      const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [email.trim().toLowerCase()]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please login instead.' });
      }
    }

    const duration = parseInt(durationMonths, 10);
    if (![3, 6, 12].includes(duration)) {
      return res.status(400).json({ error: 'Duration must be 3, 6, or 12 months.' });
    }

    // Backend calculates fee strictly: 3m (0% off), 6m (5% off), 12m (10% off)
    const baseMonthlyFee = parseFloat(tier.monthly_fee);
    const discountPercent = duration === 12 ? 10 : (duration === 6 ? 5 : 0);
    const effectiveMonthly = baseMonthlyFee * (1 - discountPercent / 100);
    const totalAmount = parseFloat((effectiveMonthly * duration).toFixed(2));

    const amountInPaise = Math.round(totalAmount * 100);
    const planRefId = `plan-${Date.now()}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: planRefId.substring(0, 40),
      notes: {
        type: 'PLAN',
        tierName: tier.name,
        durationMonths: duration,
        email: email ? email.trim().toLowerCase() : ''
      }
    });

    const paymentId = `pay-${Date.now()}`;
    await query(`
      INSERT INTO payments (
        id, reference_type, reference_id, amount, currency, method, status, razorpay_order_id
      ) VALUES ($1, 'PLAN', $2, $3, 'INR', 'ONLINE', 'PENDING', $4)
    `, [paymentId, planRefId, totalAmount, razorpayOrder.id]);

    return res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      planRefId,
      amount: razorpayOrder.amount,
      currency: 'INR',
      finalFee: totalAmount,
      keyId: process.env.RAZORPAY_KEY_ID,
      tierName: tier.name,
      durationMonths: duration
    });
  } catch (error) {
    console.error('createRazorpayPlanOrder Error:', error);
    return res.status(500).json({ error: 'Failed to create plan payment order.' });
  }
}

/**
 * 6. Verify Razorpay Payment for Membership Plan (Gold, Silver, Junior)
 * Activates or upgrades member plan upon authentic signature verification
 */
export async function verifyRazorpayPlanPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      name,
      email,
      phone,
      password,
      tierName = 'Gold',
      durationMonths = 12,
      memberId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment signature verification parameters.' });
    }

    const paymentRows = await query(
      'SELECT * FROM payments WHERE razorpay_order_id = $1',
      [razorpay_order_id]
    );
    if (paymentRows.length === 0) {
      return res.status(404).json({ error: 'Payment record not found for this order.' });
    }
    const payment = paymentRows[0];

    // Idempotency check
    if (payment.status === 'SUCCESS') {
      return res.status(200).json({
        success: true,
        message: 'Plan payment already verified and membership active.'
      });
    }

    // Verify signature
    const isAuthentic = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isAuthentic) {
      await query(`
        UPDATE payments 
        SET status = 'FAILED', error_code = 'SIGNATURE_VERIFICATION_FAILED', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [payment.id]);
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    const duration = parseInt(durationMonths, 10) || 12;

    const tierRows = await query(
      'SELECT * FROM membership_tiers WHERE LOWER(name) = LOWER($1)',
      [tierName]
    );
    const selectedTier = tierRows.length > 0 ? tierRows[0] : { id: 'tier-gold', name: 'Gold' };

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Check if existing member renewing/upgrading
      let targetMemberId = memberId;
      if (!targetMemberId && req.user && req.user.role === 'MEMBER') {
        const memLookup = await client.query('SELECT id FROM members WHERE email = $1', [req.user.email]);
        if (memLookup.rows.length > 0) targetMemberId = memLookup.rows[0].id;
      }

      if (targetMemberId) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + duration);

        await client.query(`
          UPDATE members
          SET tier_id = $1, expires_at = $2, status = 'ACTIVE'
          WHERE id = $3
        `, [selectedTier.id, expiresAt.toISOString(), targetMemberId]);

        await client.query(`
          UPDATE payments
          SET status = 'SUCCESS', razorpay_payment_id = $1, razorpay_signature = $2,
              reference_id = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [razorpay_payment_id, razorpay_signature, targetMemberId, payment.id]);

        await client.query('COMMIT');
        return res.status(200).json({
          success: true,
          message: `Membership upgraded to ${selectedTier.name} for ${duration} months successfully!`,
          tierName: selectedTier.name,
          expiresAt: expiresAt.toISOString()
        });
      }

      // New Member Registration
      const cleanEmail = (email || '').trim().toLowerCase();
      const existingUser = await client.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      let userId;

      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
      } else {
        const passwordHash = await bcrypt.hash(password || 'Clubora@123', 10);
        userId = `usr-mem-${Date.now()}`;
        await client.query(
          `INSERT INTO users (id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'MEMBER')`,
          [userId, cleanEmail, passwordHash, name ? name.trim() : 'New Member']
        );
      }

      const countRes = await client.query('SELECT COUNT(*) FROM members');
      const memberCount = parseInt(countRes.rows[0].count, 10) + 1;
      const tierCode = selectedTier.name.substring(0, 4).toUpperCase();
      const memberCode = `MEM-${tierCode}-${String(memberCount).padStart(3, '0')}`;
      const newMemberId = `mem-${Date.now()}`;

      const joinedAt = new Date();
      const expiresAt = new Date();
      expiresAt.setMonth(joinedAt.getMonth() + duration);

      await client.query(
        `INSERT INTO members (id, member_code, name, email, phone, tier_id, joined_at, expires_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
         ON CONFLICT (email) DO UPDATE 
         SET tier_id = $6, expires_at = $8, status = 'ACTIVE'`,
        [newMemberId, memberCode, name ? name.trim() : 'New Member', cleanEmail, (phone || '').trim(), selectedTier.id, joinedAt.toISOString(), expiresAt.toISOString()]
      );

      await client.query(`
        UPDATE payments
        SET status = 'SUCCESS', razorpay_payment_id = $1, razorpay_signature = $2,
            reference_id = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [razorpay_payment_id, razorpay_signature, newMemberId, payment.id]);

      await client.query('COMMIT');

      const token = generateToken({
        id: userId,
        email: cleanEmail,
        name: name ? name.trim() : 'New Member',
        role: 'MEMBER'
      });

      return res.status(200).json({
        success: true,
        message: `Welcome to Clubora! ${selectedTier.name} membership activated for ${duration} months.`,
        token,
        user: {
          id: userId,
          email: cleanEmail,
          name: name ? name.trim() : 'New Member',
          role: 'MEMBER'
        }
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('verifyRazorpayPlanPayment Error:', error);
    return res.status(500).json({ error: 'Failed to verify plan payment.' });
  }
}

/**
 * 7. Create Razorpay Order for Shop Purchase
 * Validates stock and computes final INR fee on backend with member discount
 */
export async function createRazorpayShopOrder(req, res) {
  try {
    const { items, memberId, channel = 'ONLINE' } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    let discountPercent = 0;
    let memberName = 'Customer';
    if (memberId) {
      const memberRes = await query(`
        SELECT m.name, t.shop_discount_percent 
        FROM members m
        JOIN membership_tiers t ON m.tier_id = t.id
        WHERE m.id = $1
      `, [memberId]);
      if (memberRes.length > 0) {
        memberName = memberRes[0].name;
        discountPercent = parseFloat(memberRes[0].shop_discount_percent || 0);
      }
    }

    let subtotal = 0;
    for (const item of items) {
      const prdRes = await query('SELECT * FROM products WHERE id = $1', [item.productId]);
      if (prdRes.length === 0) {
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }
      const product = prdRes[0];
      if (parseInt(product.stock_quantity, 10) < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${product.name}".` });
      }
      subtotal += parseFloat(product.price) * item.quantity;
    }

    const discountAmount = (subtotal * discountPercent) / 100;
    const finalTotal = Math.max(0, subtotal - discountAmount);
    const amountInPaise = Math.round(finalTotal * 100);

    const shopRefId = `shop-${Date.now()}`;
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: shopRefId.substring(0, 40),
      notes: {
        type: 'SHOP',
        channel,
        memberId: memberId || ''
      }
    });

    const paymentId = `pay-${Date.now()}`;
    await query(`
      INSERT INTO payments (
        id, reference_type, reference_id, amount, currency, method, status, razorpay_order_id
      ) VALUES ($1, 'SHOP', $2, $3, 'INR', 'ONLINE', 'PENDING', $4)
    `, [paymentId, shopRefId, finalTotal, razorpayOrder.id]);

    return res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      shopRefId,
      amount: razorpayOrder.amount,
      currency: 'INR',
      finalTotal,
      keyId: process.env.RAZORPAY_KEY_ID,
      customerName: memberName
    });
  } catch (error) {
    console.error('createRazorpayShopOrder Error:', error);
    return res.status(500).json({ error: 'Failed to create shop payment order.' });
  }
}

/**
 * 8. Verify Razorpay Payment for Shop Purchase
 * Decrements stock and issues official receipt upon verified signature
 */
export async function verifyRazorpayShopPayment(req, res) {
  const client = await getClient();
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      memberId,
      channel = 'ONLINE'
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment signature verification parameters.' });
    }

    const paymentRows = await query('SELECT * FROM payments WHERE razorpay_order_id = $1', [razorpay_order_id]);
    if (paymentRows.length === 0) {
      return res.status(404).json({ error: 'Payment record not found.' });
    }
    const payment = paymentRows[0];

    if (payment.status === 'SUCCESS') {
      return res.status(200).json({ success: true, message: 'Payment already processed.' });
    }

    const isAuthentic = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isAuthentic) {
      await query(`
        UPDATE payments SET status = 'FAILED', error_code = 'SIGNATURE_VERIFICATION_FAILED', updated_at = CURRENT_TIMESTAMP WHERE id = $1
      `, [payment.id]);
      return res.status(400).json({ error: 'Payment signature verification failed.' });
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
          error: `Insufficient stock for "${product.name}". Available: ${availableStock}.`
        });
      }

      await client.query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [
        cartItem.quantity, product.id
      ]);

      const unitPrice = parseFloat(product.price);
      const itemGrossTotal = unitPrice * cartItem.quantity;
      subtotal += itemGrossTotal;
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

    const discountAmount = (subtotal * discountPercent) / 100;
    const finalTotal = Math.max(0, subtotal - discountAmount);
    const receiptNumber = `REC-ONLINE-${Date.now().toString().slice(-6)}`;

    await client.query(`
      UPDATE payments
      SET status = 'SUCCESS', razorpay_payment_id = $1, razorpay_signature = $2,
          reference_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [razorpay_payment_id, razorpay_signature, receiptNumber, payment.id]);

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Shop payment verified and order completed!',
      receipt: {
        receiptNumber,
        customerName: memberName,
        memberCode,
        tierName,
        discountPercent,
        subtotal,
        discountAmount,
        finalTotal,
        paymentMethod: 'ONLINE_RAZORPAY',
        channel,
        items: processedItems,
        timestamp: new Date()
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('verifyRazorpayShopPayment Error:', error);
    return res.status(500).json({ error: 'Failed to verify shop payment.' });
  } finally {
    client.release();
  }
}

/**
 * 9. Create Razorpay Order for Bar & Cafeteria
 * Handles tab settlement or direct sofa order with Razorpay
 */
export async function createRazorpayBarOrder(req, res) {
  try {
    const { tabId, items, memberId, customerName, tableNumber } = req.body;

    // Mode A: Settling an open tab
    if (tabId) {
      const tabRows = await query('SELECT * FROM bar_tabs WHERE id = $1', [tabId]);
      if (tabRows.length === 0) {
        return res.status(404).json({ error: 'Bar tab not found.' });
      }
      const tab = tabRows[0];
      if (tab.status === 'SETTLED') {
        return res.status(400).json({ error: 'Tab is already settled.' });
      }

      const finalAmount = parseFloat(tab.final_amount || tab.total_amount || 0);
      const amountInPaise = Math.round(finalAmount * 100);

      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `bar_${tab.tab_number || Date.now()}`.substring(0, 40),
        notes: {
          type: 'BAR_TAB',
          tabId: tab.id,
          tabNumber: tab.tab_number,
          tableNumber: tab.table_number
        }
      });

      const paymentId = `pay-${Date.now()}`;
      await query(`
        INSERT INTO payments (
          id, reference_type, reference_id, amount, currency, method, status, razorpay_order_id
        ) VALUES ($1, 'BAR', $2, $3, 'INR', 'ONLINE', 'PENDING', $4)
      `, [paymentId, tab.id, finalAmount, razorpayOrder.id]);

      return res.status(200).json({
        success: true,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: 'INR',
        finalAmount,
        tabId: tab.id,
        tabNumber: tab.tab_number,
        tableNumber: tab.table_number,
        keyId: process.env.RAZORPAY_KEY_ID
      });
    }

    // Mode B: Direct member table/sofa order with immediate Razorpay payment
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required.' });
    }

    let discountPercent = 0;
    let displayName = customerName || 'Member';
    if (memberId) {
      const memRes = await query(`
        SELECT m.name, t.bar_discount_percent 
        FROM members m
        JOIN membership_tiers t ON m.tier_id = t.id
        WHERE m.id = $1
      `, [memberId]);
      if (memRes.length > 0) {
        displayName = memRes[0].name;
        discountPercent = parseFloat(memRes[0].bar_discount_percent || 0);
      }
    }

    let subtotal = 0;
    for (const item of items) {
      const itemRes = await query('SELECT price FROM bar_items WHERE id = $1', [item.barItemId]);
      if (itemRes.length > 0) {
        subtotal += parseFloat(itemRes[0].price) * item.quantity;
      }
    }

    const discountAmount = (subtotal * discountPercent) / 100;
    const finalAmount = Math.max(0, subtotal - discountAmount);
    const amountInPaise = Math.round(finalAmount * 100);

    const barRefId = `bar-${Date.now()}`;
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: barRefId.substring(0, 40),
      notes: {
        type: 'BAR_DIRECT',
        tableNumber: tableNumber || 'Sofa / Patio',
        customerName: displayName
      }
    });

    const paymentId = `pay-${Date.now()}`;
    await query(`
      INSERT INTO payments (
        id, reference_type, reference_id, amount, currency, method, status, razorpay_order_id
      ) VALUES ($1, 'BAR', $2, $3, 'INR', 'ONLINE', 'PENDING', $4)
    `, [paymentId, barRefId, finalAmount, razorpayOrder.id]);

    return res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      barRefId,
      amount: razorpayOrder.amount,
      currency: 'INR',
      finalAmount,
      tableNumber: tableNumber || 'Sofa / Patio',
      keyId: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('createRazorpayBarOrder Error:', error);
    return res.status(500).json({ error: 'Failed to create bar payment order.' });
  }
}

/**
 * 10. Verify Razorpay Payment for Bar & Cafeteria
 * Closes tab or registers direct paid order
 */
export async function verifyRazorpayBarPayment(req, res) {
  const client = await getClient();
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      tabId,
      items,
      memberId,
      customerName,
      tableNumber
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment signature verification parameters.' });
    }

    const paymentRows = await query('SELECT * FROM payments WHERE razorpay_order_id = $1', [razorpay_order_id]);
    if (paymentRows.length === 0) {
      return res.status(404).json({ error: 'Payment record not found.' });
    }
    const payment = paymentRows[0];

    if (payment.status === 'SUCCESS') {
      return res.status(200).json({ success: true, message: 'Tab payment already confirmed.' });
    }

    const isAuthentic = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isAuthentic) {
      await query(`
        UPDATE payments SET status = 'FAILED', error_code = 'SIGNATURE_VERIFICATION_FAILED', updated_at = CURRENT_TIMESTAMP WHERE id = $1
      `, [payment.id]);
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    await client.query('BEGIN');

    // Case A: Settle existing tab
    if (tabId) {
      await client.query(`
        UPDATE bar_tabs 
        SET status = 'SETTLED', payment_method = 'ONLINE_RAZORPAY', settled_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [tabId]);

      await client.query(`
        UPDATE payments
        SET status = 'SUCCESS', razorpay_payment_id = $1, razorpay_signature = $2,
            reference_id = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [razorpay_payment_id, razorpay_signature, tabId, payment.id]);

      await client.query('COMMIT');
      return res.status(200).json({
        success: true,
        message: 'Bar tab settled successfully via Razorpay!',
        tabId
      });
    }

    // Case B: Create new tab and immediately settle as paid order
    const countRes = await client.query('SELECT COUNT(*) FROM bar_tabs');
    const tabNum = `TAB-${String(parseInt(countRes.rows[0].count, 10) + 101).padStart(3, '0')}`;
    const newTabId = `tab-${Date.now()}`;

    let discountPercent = 0;
    let displayName = customerName || 'Member';
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

    let subtotal = 0;
    const orderLines = [];
    if (items && Array.isArray(items)) {
      for (const it of items) {
        const itemRes = await client.query('SELECT price FROM bar_items WHERE id = $1', [it.barItemId]);
        if (itemRes.rows.length > 0) {
          const unitPrice = parseFloat(itemRes.rows[0].price);
          const totalLine = unitPrice * it.quantity;
          subtotal += totalLine;
          orderLines.push({
            barItemId: it.barItemId,
            quantity: it.quantity,
            unitPrice,
            totalPrice: totalLine
          });
        }
      }
    }

    const discountAmount = (subtotal * discountPercent) / 100;
    const finalAmount = Math.max(0, subtotal - discountAmount);

    await client.query(`
      INSERT INTO bar_tabs (
        id, tab_number, member_id, customer_name, table_number,
        status, total_amount, discount_percent, discount_amount, final_amount,
        payment_method, opened_at, settled_at
      ) VALUES ($1, $2, $3, $4, $5, 'SETTLED', $6, $7, $8, $9, 'ONLINE_RAZORPAY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      newTabId, tabNum, memberId || null, displayName, tableNumber || 'Sofa / Patio',
      subtotal, discountPercent, discountAmount, finalAmount
    ]);

    for (const ol of orderLines) {
      const lineId = `toi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await client.query(`
        INSERT INTO bar_order_items (id, tab_id, bar_item_id, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [lineId, newTabId, ol.barItemId, ol.quantity, ol.unitPrice, ol.totalPrice]);
    }

    await client.query(`
      UPDATE payments
      SET status = 'SUCCESS', razorpay_payment_id = $1, razorpay_signature = $2,
          reference_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [razorpay_payment_id, razorpay_signature, newTabId, payment.id]);

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Bar order paid and confirmed via Razorpay!',
      tabId: newTabId,
      tabNumber: tabNum
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('verifyRazorpayBarPayment Error:', error);
    return res.status(500).json({ error: 'Failed to verify bar payment.' });
  } finally {
    client.release();
  }
}

