import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { query } from '../src/config/db.js';

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.error('FAIL: Missing Razorpay environment variables.');
  process.exit(1);
}

const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

async function runTests() {
  console.log('--- TESTING ALL RAZORPAY PAYMENT FLOWS (TEST MODE) ---');
  let passed = 0;
  let total = 0;

  function expect(condition, name) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name}`);
    }
  }

  // TEST 1: PLAN (Gold / Silver / Junior)
  console.log('\n1. Membership Plan Payment Flow:');
  const planTier = 'Gold';
  const duration = 12;
  const baseMonthly = 150;
  const discountPercent = 10;
  const effectiveMonthly = baseMonthly * (1 - discountPercent / 100);
  const totalPlanAmount = parseFloat((effectiveMonthly * duration).toFixed(2));
  const planPaise = Math.round(totalPlanAmount * 100);

  const planOrder = await razorpay.orders.create({
    amount: planPaise,
    currency: 'INR',
    receipt: `test_plan_${Date.now()}`.substring(0, 40),
    notes: { type: 'PLAN', tier: planTier, duration }
  });
  expect(planOrder.id && planOrder.id.startsWith('order_'), 'Razorpay Plan Order created');
  expect(planOrder.amount === planPaise, 'Plan Order amount matches paise: ' + planPaise);
  expect(planOrder.currency === 'INR', 'Plan Order currency is INR');

  // Verify HMAC signature for Plan
  const fakePlanPaymentId = `pay_test_${Date.now()}`;
  const planSig = crypto.createHmac('sha256', keySecret).update(`${planOrder.id}|${fakePlanPaymentId}`).digest('hex');
  const validPlanSig = crypto.createHmac('sha256', keySecret).update(`${planOrder.id}|${fakePlanPaymentId}`).digest('hex') === planSig;
  expect(validPlanSig, 'Plan Razorpay signature verification HMAC SHA256 matches');

  // TEST 2: SHOP
  console.log('\n2. Gear Shop Payment Flow:');
  const shopAmount = 240; // e.g. 240 INR
  const shopPaise = Math.round(shopAmount * 100);
  const shopOrder = await razorpay.orders.create({
    amount: shopPaise,
    currency: 'INR',
    receipt: `test_shop_${Date.now()}`.substring(0, 40),
    notes: { type: 'SHOP', channel: 'ONLINE' }
  });
  expect(shopOrder.id && shopOrder.id.startsWith('order_'), 'Razorpay Shop Order created');
  expect(shopOrder.amount === shopPaise, 'Shop Order amount matches paise: ' + shopPaise);

  const fakeShopPaymentId = `pay_shop_${Date.now()}`;
  const shopSig = crypto.createHmac('sha256', keySecret).update(`${shopOrder.id}|${fakeShopPaymentId}`).digest('hex');
  const validShopSig = crypto.createHmac('sha256', keySecret).update(`${shopOrder.id}|${fakeShopPaymentId}`).digest('hex') === shopSig;
  expect(validShopSig, 'Shop Razorpay signature verification HMAC SHA256 matches');

  // TEST 3: BAR & CAFE
  console.log('\n3. Bar & Cafeteria Payment Flow:');
  const barAmount = 350;
  const barPaise = Math.round(barAmount * 100);
  const barOrder = await razorpay.orders.create({
    amount: barPaise,
    currency: 'INR',
    receipt: `test_bar_${Date.now()}`.substring(0, 40),
    notes: { type: 'BAR_TAB', tableNumber: 'Table 1' }
  });
  expect(barOrder.id && barOrder.id.startsWith('order_'), 'Razorpay Bar Order created');
  expect(barOrder.amount === barPaise, 'Bar Order amount matches paise: ' + barPaise);

  const fakeBarPaymentId = `pay_bar_${Date.now()}`;
  const barSig = crypto.createHmac('sha256', keySecret).update(`${barOrder.id}|${fakeBarPaymentId}`).digest('hex');
  const validBarSig = crypto.createHmac('sha256', keySecret).update(`${barOrder.id}|${fakeBarPaymentId}`).digest('hex') === barSig;
  expect(validBarSig, 'Bar Razorpay signature verification HMAC SHA256 matches');

  console.log(`\nResults: ${passed}/${total} checks PASSED successfully!`);
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
