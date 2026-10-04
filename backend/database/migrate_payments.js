import { query } from '../src/config/db.js';

export async function migratePayments() {
  console.log('[Migration] Creating payments table if not exists...');
  
  await query(`
    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(36) PRIMARY KEY,
      booking_id VARCHAR(36) REFERENCES bookings(id) ON DELETE CASCADE,
      amount NUMERIC(10,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      method VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      razorpay_order_id VARCHAR(255),
      razorpay_payment_id VARCHAR(255),
      razorpay_signature VARCHAR(255),
      error_code VARCHAR(255),
      error_description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);`);

  await query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50) DEFAULT 'BOOKING';`);
  await query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_id VARCHAR(255);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(reference_type, reference_id);`);

  console.log('[Migration] Payments table, reference columns, and indices ensured successfully.');
}

if (process.argv[1] && process.argv[1].endsWith('migrate_payments.js')) {
  migratePayments()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration Error]', err);
      process.exit(1);
    });
}
