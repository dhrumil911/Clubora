import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import { query } from '../src/config/db.js';
import * as paymentController from '../src/controllers/paymentController.js';

async function runTests() {
  console.log('\n--- 1. Testing Environment Variables & Razorpay SDK ---');
  const hasKeyId = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.length > 0);
  const hasSecret = Boolean(process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET.length > 0);
  console.log('RAZORPAY_KEY_ID present:', hasKeyId);
  console.log('RAZORPAY_KEY_SECRET present:', hasSecret);

  if (!hasKeyId || !hasSecret) {
    throw new Error('Razorpay credentials missing from backend/.env');
  }

  // 2. Fetch court and member for test
  console.log('\n--- 2. Fetching Test Court & Member ---');
  const courts = await query('SELECT * FROM courts LIMIT 1');
  if (courts.length === 0) {
    throw new Error('No courts found in database.');
  }
  const testCourt = courts[0];
  console.log('Test Court:', testCourt.name, 'Rate:', testCourt.hourly_rate);

  const testDate = '2026-11-20'; // Future test date to avoid conflicts
  const testTime = '10:00';

  // Clean any previous test data on this date/court
  await query('DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE booking_date = $1)', [testDate]);
  await query('DELETE FROM bookings WHERE booking_date = $1', [testDate]);

  // 3. Test Backend Order Creation
  console.log('\n--- 3. Testing Backend Order Creation ---');
  let orderData = null;
  const mockReq = {
    body: {
      courtId: testCourt.id,
      bookingDate: testDate,
      startTime: testTime,
      durationMinutes: 60,
      customerName: 'Razorpay Test Player',
      isSocialPlay: false,
      playersCount: 1
    },
    user: { role: 'MEMBER', email: 'test@razorpay.test' }
  };

  const mockRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };

  await paymentController.createRazorpayOrder(mockReq, mockRes);
  console.log('Create Order Status Code:', mockRes.statusCode);
  if (mockRes.statusCode !== 200 || !mockRes.data?.orderId) {
    throw new Error('Order creation failed: ' + JSON.stringify(mockRes.data));
  }

  orderData = mockRes.data;
  console.log('Order Created Successfully:', {
    bookingId: orderData.bookingId,
    orderId: orderData.orderId,
    amountInPaise: orderData.amount,
    currency: orderData.currency,
    finalFee: orderData.finalFee,
    hasKeyId: Boolean(orderData.keyId)
  });

  // Verify booking created as PENDING_PAYMENT
  const pendingBooking = await query('SELECT status, payment_status FROM bookings WHERE id = $1', [orderData.bookingId]);
  console.log('Pending Booking in DB:', pendingBooking[0]);
  if (pendingBooking[0].status !== 'PENDING_PAYMENT') {
    throw new Error('Expected status to be PENDING_PAYMENT');
  }

  // 4. Test Invalid Signature Verification (Failure Flow)
  console.log('\n--- 4. Testing Invalid Signature Rejection ---');
  const mockVerifyFailRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };

  await paymentController.verifyRazorpayPayment({
    body: {
      bookingId: orderData.bookingId,
      razorpay_order_id: orderData.orderId,
      razorpay_payment_id: 'pay_fake_test_123',
      razorpay_signature: 'invalid_signature_hash_test',
      method: 'ONLINE'
    }
  }, mockVerifyFailRes);

  console.log('Invalid Signature Status Code:', mockVerifyFailRes.statusCode);
  console.log('Invalid Signature Result Message:', mockVerifyFailRes.data);
  if (mockVerifyFailRes.statusCode !== 400) {
    throw new Error('Expected invalid signature to return 400 error');
  }

  // 5. Test Valid Signature Verification (Successful Payment Flow)
  console.log('\n--- 5. Testing Valid Signature Verification ---');
  // Re-create order for valid verification
  await query('DELETE FROM payments WHERE booking_id = $1', [orderData.bookingId]);
  await query('DELETE FROM bookings WHERE id = $1', [orderData.bookingId]);

  const mockRes2 = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };
  await paymentController.createRazorpayOrder(mockReq, mockRes2);
  const validOrderData = mockRes2.data;

  const mockPaymentId = `pay_test_${Date.now()}`;
  const validSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${validOrderData.orderId}|${mockPaymentId}`)
    .digest('hex');

  const mockVerifySuccessRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };

  await paymentController.verifyRazorpayPayment({
    body: {
      bookingId: validOrderData.bookingId,
      razorpay_order_id: validOrderData.orderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: validSignature,
      method: 'UPI'
    }
  }, mockVerifySuccessRes);

  console.log('Valid Signature Status Code:', mockVerifySuccessRes.statusCode);
  console.log('Verification Success Response:', mockVerifySuccessRes.data.message);

  const confirmedBooking = await query('SELECT status, payment_status FROM bookings WHERE id = $1', [validOrderData.bookingId]);
  const paymentRecord = await query('SELECT * FROM payments WHERE booking_id = $1', [validOrderData.bookingId]);

  console.log('Confirmed Booking DB State:', confirmedBooking[0]);
  console.log('Payment DB Record State:', {
    id: paymentRecord[0].id,
    method: paymentRecord[0].method,
    status: paymentRecord[0].status,
    amount: paymentRecord[0].amount,
    currency: paymentRecord[0].currency,
    razorpay_order_id: paymentRecord[0].razorpay_order_id
  });

  if (confirmedBooking[0].status !== 'CONFIRMED' || paymentRecord[0].status !== 'SUCCESS') {
    throw new Error('Booking or Payment did not transition to confirmed/success state.');
  }

  // 6. Test Idempotency / Duplicate Payment Protection
  console.log('\n--- 6. Testing Idempotency / Duplicate Verification ---');
  const mockDuplicateRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };

  await paymentController.verifyRazorpayPayment({
    body: {
      bookingId: validOrderData.bookingId,
      razorpay_order_id: validOrderData.orderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: validSignature,
      method: 'UPI'
    }
  }, mockDuplicateRes);

  console.log('Duplicate Verification Status Code:', mockDuplicateRes.statusCode);
  console.log('Duplicate Verification Message:', mockDuplicateRes.data.message);
  if (mockDuplicateRes.statusCode !== 200) {
    throw new Error('Expected duplicate verification to be handled idempotently with 200 OK');
  }

  // 7. Test Offline Cash Payment Flow
  console.log('\n--- 7. Testing Offline Cash Payment Path ---');
  const cashBookingId = `bk-cash-${Date.now()}`;
  await query(`
    INSERT INTO bookings (
      id, court_id, customer_name, booking_date, start_time, end_time,
      is_social_play, players_count, original_fee, discount_fee, final_fee, payment_status, status
    ) VALUES ($1, $2, 'Cash Guest', $3, '14:00', '15:00', false, 1, 30.00, 0.00, 30.00, 'PAID', 'CONFIRMED')
  `, [cashBookingId, testCourt.id, testDate]);

  const mockCashRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };

  await paymentController.recordCashPayment({
    body: {
      bookingId: cashBookingId,
      amount: 30.00
    }
  }, mockCashRes);

  const cashPayment = await query('SELECT * FROM payments WHERE booking_id = $1', [cashBookingId]);
  console.log('Cash Payment DB Record:', {
    id: cashPayment[0].id,
    method: cashPayment[0].method,
    status: cashPayment[0].status,
    amount: cashPayment[0].amount
  });
  if (cashPayment[0].method !== 'CASH' || cashPayment[0].status !== 'SUCCESS') {
    throw new Error('Cash payment recording failed');
  }

  // Clean up test data
  await query('DELETE FROM payments WHERE booking_id IN ($1, $2)', [validOrderData.bookingId, cashBookingId]);
  await query('DELETE FROM bookings WHERE id IN ($1, $2)', [validOrderData.bookingId, cashBookingId]);

  console.log('\n✅ ALL BACKEND RAZORPAY INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
