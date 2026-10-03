import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateToken, authorizeRoles } from './middleware/auth.js';
import * as authController from './controllers/authController.js';
import * as memberController from './controllers/memberController.js';
import * as bookingController from './controllers/bookingController.js';
import * as shopController from './controllers/shopController.js';
import * as barController from './controllers/barController.js';
import * as crmController from './controllers/crmController.js';
import * as dashboardController from './controllers/dashboardController.js';

import { query } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5050', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Root Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Clubora API Backend is running',
    version: '1.0.0'
  });
});

// PostgreSQL Connection Test Endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await query('SELECT NOW()');
    const timeVal = result[0]?.now || result[0]?.NOW || new Date().toISOString();
    return res.json({
      success: true,
      message: 'PostgreSQL connected successfully',
      time: timeVal
    });
  } catch (error) {
    console.error('PostgreSQL Connection Test Error:', error);
    return res.status(500).json({
      success: false,
      message: 'PostgreSQL database connection failed',
      error: error.message
    });
  }
});

// Public Auth & Visitor Routes
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', authController.register);

// Public CRM Enquiry endpoint
app.post('/api/public/enquiry', crmController.createLead);
app.get('/api/public/courts', bookingController.getCourts);
app.get('/api/public/shop', shopController.getProducts);
app.get('/api/public/tiers', memberController.getTiers);

// Protected Routes (JWT required)
app.get('/api/auth/profile', authenticateToken, authController.getProfile);

// 1. Member Management Routes (Front Desk & Owner)
app.get('/api/members/tiers', authenticateToken, memberController.getTiers);
app.get('/api/members', authenticateToken, memberController.getMembers);
app.get('/api/members/:id', authenticateToken, memberController.getMemberById);
app.post('/api/members', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), memberController.createMember);
app.put('/api/members/:id/plan', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), memberController.updateMemberPlan);

// 2. Court Booking Engine Routes (Members, Front Desk & Owner)
app.get('/api/courts', authenticateToken, bookingController.getCourts);
app.get('/api/bookings', authenticateToken, bookingController.getBookings);
app.post('/api/bookings', authenticateToken, bookingController.createBooking);
app.delete('/api/bookings/:id', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), bookingController.cancelBooking);

// 3. Gear Shop & Inventory POS Routes (Bar/Shop Staff, Front Desk & Owner)
app.get('/api/shop/products', authenticateToken, shopController.getProducts);
app.post('/api/shop/checkout', authenticateToken, shopController.checkout);
app.post('/api/shop/products/:id/restock', authenticateToken, authorizeRoles('BAR_SHOP_STAFF', 'BAR', 'OWNER'), shopController.restockProduct);

// 4. Bar & Cafeteria POS Routes (Bar/Shop Staff, Front Desk & Owner)
app.get('/api/bar/menu', authenticateToken, barController.getBarItems);
app.get('/api/bar/tabs', authenticateToken, barController.getTabs);
app.post('/api/bar/tabs', authenticateToken, barController.createOrUpdateTab);
app.post('/api/bar/tabs/:id/settle', authenticateToken, barController.settleTab);

// 5. CRM Leads & Quote Engine Routes (Front Desk & Owner)
app.get('/api/crm/leads', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), crmController.getLeads);
app.put('/api/crm/leads/:id', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), crmController.updateLeadStatus);
app.post('/api/crm/quotes', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), crmController.generateQuote);

// 6. Owner Dashboard & Financial Reports Routes (Owner ONLY)
app.get('/api/dashboard/metrics', authenticateToken, authorizeRoles('OWNER'), dashboardController.getOwnerDashboardMetrics);

const server = app.listen(PORT, () => {
  console.log(`Clubora Backend Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Run this command in PowerShell to free it:\n`);
    console.error(`   Stop-Process -Name node -Force -ErrorAction SilentlyContinue\n`);
    process.exit(1);
  }
  throw err;
});
