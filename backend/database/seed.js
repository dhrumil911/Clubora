import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { query } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrationsAndSeed() {
  console.log('📦 Starting PostgreSQL schema migration & seeding...');

  try {
    // 1. Run schema DDL
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await query(schemaSql);
    console.log('✅ PostgreSQL database tables created successfully.');

    // 2. Seed Default Staff Users
    const passwordHash = await bcrypt.hash('password123', 10);
    const usersCount = await query('SELECT COUNT(*) FROM users');
    
    if (parseInt(usersCount[0].count, 10) === 0) {
      await query(
        `INSERT INTO users (id, email, password_hash, name, role) VALUES 
        ('usr-owner', 'owner@championsclub.com', $1, 'Owner (Alex Morgan)', 'OWNER'),
        ('usr-front', 'frontdesk@championsclub.com', $1, 'Sarah Front Desk', 'FRONT_DESK'),
        ('usr-bar', 'bar@championsclub.com', $1, 'Mike Bar Lead', 'BAR')`,
        [passwordHash]
      );
      console.log('✅ Seeded default staff users.');
    }

    // 3. Seed Membership Tiers
    const tiersCount = await query('SELECT COUNT(*) FROM membership_tiers');
    if (parseInt(tiersCount[0].count, 10) === 0) {
      await query(
        `INSERT INTO membership_tiers (id, name, monthly_fee, court_discount_percent, shop_discount_percent, bar_discount_percent, description) VALUES
        ('tier-gold', 'Gold', 150.00, 100.00, 20.00, 20.00, 'Premium full access tier with free courts and 20% discount on shop & bar.'),
        ('tier-silver', 'Silver', 80.00, 50.00, 10.00, 10.00, 'Standard tier with 50% off courts and 10% discount on shop & bar.'),
        ('tier-junior', 'Junior', 45.00, 50.00, 15.00, 15.00, 'Under 18 tier with special court rates and equipment discounts.'),
        ('tier-walkin', 'Walk-in', 0.00, 0.00, 0.00, 0.00, 'Non-member standard pricing.')`
      );
      console.log('✅ Seeded membership tiers.');
    }

    // 4. Seed Members
    const membersCount = await query('SELECT COUNT(*) FROM members');
    if (parseInt(membersCount[0].count, 10) === 0) {
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(now.getMonth() + 1);

      await query(
        `INSERT INTO members (id, member_code, name, email, phone, tier_id, expires_at, status) VALUES
        ('mem-1', 'MEM-GOLD-001', 'David Beckham', 'david.gold@example.com', '+1 555-0192', 'tier-gold', $1, 'ACTIVE'),
        ('mem-2', 'MEM-SILV-002', 'Serena Williams', 'serena.silver@example.com', '+1 555-0188', 'tier-silver', $1, 'ACTIVE'),
        ('mem-3', 'MEM-JUN-003', 'Leo Messi (Junior)', 'leo.junior@example.com', '+1 555-0144', 'tier-junior', $1, 'ACTIVE')`,
        [nextMonth.toISOString()]
      );
      console.log('✅ Seeded members.');
    }

    // 5. Seed Courts
    const courtsCount = await query('SELECT COUNT(*) FROM courts');
    if (parseInt(courtsCount[0].count, 10) === 0) {
      await query(
        `INSERT INTO courts (id, name, sport, hourly_rate, is_available) VALUES
        ('crt-1', 'Tennis Court 1 (Center)', 'TENNIS', 40.00, true),
        ('crt-2', 'Tennis Court 2 (Outer)', 'TENNIS', 35.00, true),
        ('crt-3', 'Cricket Nets 1', 'CRICKET', 50.00, true),
        ('crt-4', 'Cricket Nets 2', 'CRICKET', 50.00, true),
        ('crt-5', 'Padel Court 1', 'PADEL', 45.00, true),
        ('crt-6', 'Badminton Court 1', 'BADMINTON', 30.00, true)`
      );
      console.log('✅ Seeded courts.');
    }

    // 6. Seed Gear Shop Products
    const productsCount = await query('SELECT COUNT(*) FROM products');
    if (parseInt(productsCount[0].count, 10) === 0) {
      await query(
        `INSERT INTO products (id, name, category, price, stock_quantity, low_stock_threshold) VALUES
        ('prd-1', 'Pro Tennis Racket (Wilson Pro Staff)', 'RACKET', 220.00, 8, 3),
        ('prd-2', 'Junior Tennis Racket', 'RACKET', 65.00, 3, 4),
        ('prd-3', 'Tennis Balls Can (3-pack)', 'BALLS', 12.00, 45, 10),
        ('prd-4', 'Padel Balls Can (3-pack)', 'BALLS', 14.00, 30, 8),
        ('prd-5', 'Court Tennis Shoes (White)', 'SHOES', 110.00, 12, 5),
        ('prd-6', 'Absorbent Sweatband Set', 'ACCESSORIES', 15.00, 25, 5),
        ('prd-7', 'Club Premium Polo Shirt', 'APPAREL', 45.00, 2, 5)`
      );
      console.log('✅ Seeded gear shop products.');
    }

    // 7. Seed Bar & Cafeteria Items
    const barItemsCount = await query('SELECT COUNT(*) FROM bar_items');
    if (parseInt(barItemsCount[0].count, 10) === 0) {
      await query(
        `INSERT INTO bar_items (id, name, category, price, is_available) VALUES
        ('bar-1', 'Fresh Protein Shake (Berry/Vanilla)', 'BEVERAGE', 8.50, true),
        ('bar-2', 'Iced Electrolyte Energy Drink', 'BEVERAGE', 4.50, true),
        ('bar-3', 'Espresso / Cappuccino', 'BEVERAGE', 4.00, true),
        ('bar-4', 'Craft Draft Beer (Pint)', 'BEVERAGE', 7.50, true),
        ('bar-5', 'Avocado Toast & Poached Egg', 'SNACK', 11.00, true),
        ('bar-6', 'Grilled Chicken & Quinoa Bowl', 'MEAL', 14.50, true),
        ('bar-7', 'Post-Match Burger & Fries', 'MEAL', 16.00, true)`
      );
      console.log('✅ Seeded bar items.');
    }

    // 8. Seed Bookings
    const bookingsCount = await query('SELECT COUNT(*) FROM bookings');
    if (parseInt(bookingsCount[0].count, 10) === 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      await query(
        `INSERT INTO bookings (id, court_id, member_id, customer_name, booking_date, start_time, end_time, is_social_play, players_count, original_fee, discount_fee, final_fee, payment_status, status) VALUES
        ('bk-1', 'crt-1', 'mem-1', 'David Beckham', $1, '16:00', '17:00', false, 2, 40.00, 40.00, 0.00, 'PAID', 'CONFIRMED'),
        ('bk-2', 'crt-1', 'mem-2', 'Serena Williams', $1, '18:00', '19:00', false, 2, 40.00, 20.00, 20.00, 'PAID', 'CONFIRMED')`,
        [todayStr]
      );
      console.log('✅ Seeded sample bookings.');
    }

    // 9. Seed Bar Tab & Order Line Items
    const tabsCount = await query('SELECT COUNT(*) FROM bar_tabs');
    if (parseInt(tabsCount[0].count, 10) === 0) {
      await query(
        `INSERT INTO bar_tabs (id, tab_number, member_id, customer_name, table_number, status, total_amount, discount_percent, discount_amount, final_amount) VALUES
        ('tab-1', 'TAB-101', 'mem-1', 'David Beckham', 'Table 4 (Patio)', 'OPEN', 24.50, 20.00, 4.90, 19.60)`
      );
      await query(
        `INSERT INTO bar_order_items (id, tab_id, bar_item_id, quantity, unit_price, total_price) VALUES
        ('toi-1', 'tab-1', 'bar-1', 2, 8.50, 17.00),
        ('toi-2', 'tab-1', 'bar-4', 1, 7.50, 7.50)`
      );
      console.log('✅ Seeded bar tabs.');
    }

    // 10. Seed Leads, Quotes, Shifts & Invoices
    const leadsCount = await query('SELECT COUNT(*) FROM leads');
    if (parseInt(leadsCount[0].count, 10) === 0) {
      await query(
        `INSERT INTO leads (id, name, phone, email, interest, status, notes) VALUES
        ('lead-1', 'Robert Vance', '+1 555-0711', 'robert.vance@techcorp.com', 'Corporate Membership & Court Rental', 'QUOTED', 'Interested in booking 2 courts every Tuesday evening.')`
      );
      await query(
        `INSERT INTO quotes (id, lead_id, tier_name, court_hours, total_price, valid_until, status) VALUES
        ('q-1', 'lead-1', 'Gold Corporate', 8, 480.00, '2026-10-31', 'SENT')`
      );
    }

    const shiftsCount = await query('SELECT COUNT(*) FROM shifts');
    if (parseInt(shiftsCount[0].count, 10) === 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      await query(
        `INSERT INTO shifts (id, staff_name, role, date, start_time, end_time, status) VALUES
        ('sh-1', 'Sarah Front Desk', 'Front Desk', $1, '08:00', '16:00', 'SCHEDULED'),
        ('sh-2', 'Mike Bar Lead', 'Bar/Kitchen', $1, '15:00', '23:00', 'SCHEDULED')`,
        [todayStr]
      );
      await query(
        `INSERT INTO invoices (id, invoice_number, client_name, client_email, type, amount, due_date, status) VALUES
        ('inv-1', 'INV-2026-001', 'TechCorp Solutions', 'billing@techcorp.com', 'CORPORATE', 1200.00, '2026-10-25', 'PENDING')`
      );
      console.log('✅ Seeded shifts & invoices.');
    }

    console.log('🎉 PostgreSQL database initialization completed cleanly!');
  } catch (error) {
    console.error('❌ PostgreSQL Database Migration Error:', error);
    throw error;
  }
}

// Auto-run if executed directly via node
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runMigrationsAndSeed().then(() => process.exit(0)).catch(() => process.exit(1));
}
