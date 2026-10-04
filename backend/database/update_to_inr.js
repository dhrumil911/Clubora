import { query } from '../src/config/db.js';

async function updateDatabaseToINR() {
  console.log('--- Updating Clubora Database to Indian Rupees (INR) with Satisfactory Pricing ---');

  try {
    // 1. Membership Tiers
    await query(`
      UPDATE membership_tiers SET monthly_fee = 2499.00, description = 'Premium full access tier with free courts and 20% discount on shop & bar.' WHERE LOWER(name) = 'gold';
      UPDATE membership_tiers SET monthly_fee = 1299.00, description = 'Standard tier with 50% off courts and 10% discount on shop & bar.' WHERE LOWER(name) = 'silver';
      UPDATE membership_tiers SET monthly_fee = 699.00, description = 'Under-18 junior tier with special court rates and equipment discounts.' WHERE LOWER(name) = 'junior';
      UPDATE membership_tiers SET monthly_fee = 0.00, description = 'Non-member walk-in standard pricing.' WHERE LOWER(name) = 'walk-in' OR LOWER(name) = 'walkin';
    `);
    console.log('✓ Membership Tiers updated (Gold: ₹2499, Silver: ₹1299, Junior: ₹699)');

    // 2. Courts Hourly Rates
    await query(`
      UPDATE courts SET hourly_rate = 800.00 WHERE id = 'crt-1' OR LOWER(name) LIKE '%tennis court 1%';
      UPDATE courts SET hourly_rate = 700.00 WHERE id = 'crt-2' OR LOWER(name) LIKE '%tennis court 2%';
      UPDATE courts SET hourly_rate = 600.00 WHERE id = 'crt-3' OR LOWER(name) LIKE '%cricket nets 1%';
      UPDATE courts SET hourly_rate = 600.00 WHERE id = 'crt-4' OR LOWER(name) LIKE '%cricket nets 2%';
      UPDATE courts SET hourly_rate = 900.00 WHERE id = 'crt-5' OR LOWER(name) LIKE '%padel court%';
      UPDATE courts SET hourly_rate = 450.00 WHERE id = 'crt-6' OR LOWER(name) LIKE '%badminton court%';
    `);
    console.log('✓ Court Hourly Rates updated (₹450 - ₹900 / hr)');

    // 3. Pro Gear Shop Products
    await query(`
      UPDATE products SET price = 8999.00 WHERE id = 'prd-1' OR LOWER(name) LIKE '%pro tennis racket%';
      UPDATE products SET price = 2499.00 WHERE id = 'prd-2' OR LOWER(name) LIKE '%junior tennis racket%';
      UPDATE products SET price = 499.00 WHERE id = 'prd-3' OR LOWER(name) LIKE '%tennis balls%';
      UPDATE products SET price = 599.00 WHERE id = 'prd-4' OR LOWER(name) LIKE '%padel balls%';
      UPDATE products SET price = 4499.00 WHERE id = 'prd-5' OR LOWER(name) LIKE '%court tennis shoes%';
      UPDATE products SET price = 299.00 WHERE id = 'prd-6' OR LOWER(name) LIKE '%sweatband%';
      UPDATE products SET price = 1299.00 WHERE id = 'prd-7' OR LOWER(name) LIKE '%polo shirt%';
    `);
    console.log('✓ Pro Shop Gear Products updated (₹299 - ₹8,999)');

    // 4. Bar & Cafeteria Items
    await query(`
      UPDATE bar_items SET price = 180.00 WHERE id = 'bar-1' OR LOWER(name) LIKE '%protein shake%';
      UPDATE bar_items SET price = 90.00 WHERE id = 'bar-2' OR LOWER(name) LIKE '%energy drink%';
      UPDATE bar_items SET price = 120.00 WHERE id = 'bar-3' OR LOWER(name) LIKE '%espresso%';
      UPDATE bar_items SET price = 280.00 WHERE id = 'bar-4' OR LOWER(name) LIKE '%beer%';
      UPDATE bar_items SET price = 220.00 WHERE id = 'bar-5' OR LOWER(name) LIKE '%avocado toast%';
      UPDATE bar_items SET price = 280.00 WHERE id = 'bar-6' OR LOWER(name) LIKE '%grilled chicken%';
      UPDATE bar_items SET price = 260.00 WHERE id = 'bar-7' OR LOWER(name) LIKE '%burger%';
    `);
    console.log('✓ Bar & Cafeteria Items updated (₹90 - ₹280)');

    // 5. Bar Expenses
    await query(`
      UPDATE bar_expenses SET amount = 2500.00 WHERE id = 'exp-1';
      UPDATE bar_expenses SET amount = 8500.00 WHERE id = 'exp-2';
      UPDATE bar_expenses SET amount = 1200.00 WHERE id = 'exp-3';
      UPDATE bar_expenses SET amount = 4500.00 WHERE id = 'exp-4';
    `);
    console.log('✓ Bar Expenses updated');

    // 6. Corporate Invoices
    await query(`
      UPDATE invoices SET amount = 45000.00 WHERE id = 'inv-1';
    `);
    console.log('✓ Invoices updated');

    // 7. Quotes
    await query(`
      UPDATE quotes SET total_price = 32000.00 WHERE id = 'q-1';
    `);
    console.log('✓ CRM Quotes updated');

    console.log('\n[SUCCESS] All database pricing successfully updated to INR!');
    process.exit(0);
  } catch (err) {
    console.error('Error updating database to INR:', err);
    process.exit(1);
  }
}

updateDatabaseToINR();
