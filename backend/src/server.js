import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateToken, authorizeRoles, optionalAuthenticateToken } from './middleware/auth.js';
import * as authController from './controllers/authController.js';
import * as memberController from './controllers/memberController.js';
import * as bookingController from './controllers/bookingController.js';
import * as shopController from './controllers/shopController.js';
import * as barController from './controllers/barController.js';
import * as crmController from './controllers/crmController.js';
import * as dashboardController from './controllers/dashboardController.js';
import * as invoiceController from './controllers/invoiceController.js';
import * as shiftController from './controllers/shiftController.js';
import * as reportController from './controllers/reportController.js';
import * as paymentController from './controllers/paymentController.js';

import { query } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5050', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Root Route Endpoint
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
app.put('/api/members/:id/plan', authenticateToken, authorizeRoles('MEMBER', 'FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), memberController.updateMemberPlan);

// 2. Court Booking Engine Routes (Members, Front Desk & Owner)
app.get('/api/courts', authenticateToken, bookingController.getCourts);
app.get('/api/bookings', authenticateToken, bookingController.getBookings);
app.post('/api/bookings', authenticateToken, bookingController.createBooking);
app.delete('/api/bookings/:id', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), bookingController.cancelBooking);
app.post('/api/bookings/:id/check-in', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), bookingController.checkInBooking);
app.get('/api/front-desk/stats', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), bookingController.getFrontDeskStats);

// 2b. Razorpay Online & Offline Payment Routes
app.post('/api/payments/razorpay/create-order', authenticateToken, paymentController.createRazorpayOrder);
app.post('/api/payments/razorpay/verify', authenticateToken, paymentController.verifyRazorpayPayment);
app.post('/api/payments/razorpay/cancel', authenticateToken, paymentController.cancelPendingBooking);
app.post('/api/payments/cash', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), paymentController.recordCashPayment);

// Membership Plan Razorpay Routes (New Registration & Renewal/Upgrade)
app.post('/api/payments/razorpay/plan-order', optionalAuthenticateToken, paymentController.createRazorpayPlanOrder);
app.post('/api/payments/razorpay/verify-plan', optionalAuthenticateToken, paymentController.verifyRazorpayPlanPayment);

// Shop Razorpay Online Payment Routes
app.post('/api/payments/razorpay/shop-order', authenticateToken, paymentController.createRazorpayShopOrder);
app.post('/api/payments/razorpay/verify-shop', authenticateToken, paymentController.verifyRazorpayShopPayment);

// Bar & Cafeteria Razorpay Online Payment Routes
app.post('/api/payments/razorpay/bar-order', authenticateToken, paymentController.createRazorpayBarOrder);
app.post('/api/payments/razorpay/verify-bar', authenticateToken, paymentController.verifyRazorpayBarPayment);

// 3. Gear Shop & Inventory POS Routes (Bar/Shop Staff, Shop Staff, Front Desk & Owner)
app.get('/api/shop/products', authenticateToken, shopController.getProducts);
app.get('/api/shop/inventory', authenticateToken, shopController.getProducts);
app.get('/api/shop/inventory/history', authenticateToken, shopController.getInventoryHistory);
app.post('/api/shop/checkout', authenticateToken, shopController.checkout);
app.post('/api/shop/products', authenticateToken, authorizeRoles('BAR_SHOP_STAFF', 'SHOP_STAFF', 'SHOP', 'BAR', 'OWNER'), shopController.createProduct);
app.put('/api/shop/products/:id', authenticateToken, authorizeRoles('BAR_SHOP_STAFF', 'SHOP_STAFF', 'SHOP', 'BAR', 'OWNER'), shopController.updateProduct);
app.delete('/api/shop/products/:id', authenticateToken, authorizeRoles('BAR_SHOP_STAFF', 'SHOP_STAFF', 'SHOP', 'BAR', 'OWNER'), shopController.deleteProduct);
app.post('/api/shop/products/:id/restock', authenticateToken, authorizeRoles('BAR_SHOP_STAFF', 'SHOP_STAFF', 'SHOP', 'BAR', 'OWNER'), shopController.restockProduct);
app.post('/api/shop/products/:id/add-stock', authenticateToken, authorizeRoles('BAR_SHOP_STAFF', 'SHOP_STAFF', 'SHOP', 'BAR', 'OWNER'), shopController.addStockToProduct);
app.get('/api/shop/inventory-requests', authenticateToken, shopController.getInventoryRequests);
app.post('/api/shop/inventory-requests', authenticateToken, authorizeRoles('BAR_SHOP_STAFF', 'SHOP_STAFF', 'SHOP', 'BAR', 'OWNER'), shopController.createInventoryRequest);
app.put('/api/shop/inventory-requests/:id/approve', authenticateToken, authorizeRoles('OWNER'), shopController.approveInventoryRequest);
app.put('/api/shop/inventory-requests/:id/reject', authenticateToken, authorizeRoles('OWNER'), shopController.rejectInventoryRequest);
app.put('/api/shop/inventory-requests/:id/ordered', authenticateToken, authorizeRoles('BAR_SHOP_STAFF', 'SHOP_STAFF', 'SHOP', 'BAR', 'OWNER'), shopController.orderedInventoryRequest);
app.put('/api/shop/inventory-requests/:id/receive', authenticateToken, authorizeRoles('BAR_SHOP_STAFF', 'SHOP_STAFF', 'SHOP', 'BAR', 'OWNER'), shopController.receiveInventoryRequest);
app.get('/api/shop/purchase-requests', authenticateToken, shopController.getPurchaseRequests);
app.post('/api/shop/purchase-requests', authenticateToken, authorizeRoles('BAR_SHOP_STAFF', 'SHOP_STAFF', 'SHOP', 'BAR', 'OWNER'), shopController.createPurchaseRequest);
app.put('/api/shop/purchase-requests/:id/review', authenticateToken, authorizeRoles('OWNER'), shopController.reviewPurchaseRequest);


// 4. Bar & Cafeteria POS Routes (Bar Staff, Bar/Shop Staff, Front Desk & Owner)
app.get('/api/bar/menu', authenticateToken, barController.getBarItems);
app.post('/api/bar/menu', authenticateToken, authorizeRoles('BAR_STAFF', 'BAR', 'BAR_SHOP_STAFF', 'OWNER'), barController.createBarItem);
app.put('/api/bar/menu/:id', authenticateToken, authorizeRoles('BAR_STAFF', 'BAR', 'BAR_SHOP_STAFF', 'OWNER'), barController.updateBarItem);
app.delete('/api/bar/menu/:id', authenticateToken, authorizeRoles('BAR_STAFF', 'BAR', 'BAR_SHOP_STAFF', 'OWNER'), barController.deleteBarItem);
app.get('/api/bar/tabs', authenticateToken, barController.getTabs);
app.post('/api/bar/tabs', authenticateToken, barController.createOrUpdateTab);
app.post('/api/bar/tabs/:id/settle', authenticateToken, barController.settleTab);

// 4b. Bar Expenses Routes (Bar Staff & Owner)
app.get('/api/bar/expenses', authenticateToken, authorizeRoles('BAR_STAFF', 'BAR', 'BAR_SHOP_STAFF', 'OWNER'), barController.getBarExpenses);
app.post('/api/bar/expenses', authenticateToken, authorizeRoles('BAR_STAFF', 'BAR', 'BAR_SHOP_STAFF', 'OWNER'), barController.addBarExpense);
app.delete('/api/bar/expenses/:id', authenticateToken, authorizeRoles('BAR_STAFF', 'BAR', 'BAR_SHOP_STAFF', 'OWNER'), barController.deleteBarExpense);

// 5. CRM Leads & Quote Engine Routes (Front Desk & Owner)
app.get('/api/crm/leads', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), crmController.getLeads);
app.post('/api/crm/leads', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), crmController.createLead);
app.put('/api/crm/leads/:id', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), crmController.updateLeadStatus);
app.post('/api/crm/quotes', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), crmController.generateQuote);

// 6. Owner Dashboard & Financial Reports Routes (Owner ONLY)
app.get('/api/dashboard/metrics', authenticateToken, authorizeRoles('OWNER'), dashboardController.getOwnerDashboardMetrics);

// 7. Invoice Management Routes (Owner ONLY)
app.get('/api/invoices', authenticateToken, authorizeRoles('OWNER'), invoiceController.getInvoices);
app.get('/api/invoices/summary', authenticateToken, authorizeRoles('OWNER'), invoiceController.getInvoiceSummary);
app.post('/api/invoices', authenticateToken, authorizeRoles('OWNER'), invoiceController.createInvoice);
app.put('/api/invoices/:id', authenticateToken, authorizeRoles('OWNER'), invoiceController.updateInvoice);
app.put('/api/invoices/:id/pay', authenticateToken, authorizeRoles('OWNER'), invoiceController.markInvoicePaid);
app.put('/api/invoices/:id/overdue', authenticateToken, authorizeRoles('OWNER'), invoiceController.markInvoiceOverdue);
app.delete('/api/invoices/:id', authenticateToken, authorizeRoles('OWNER'), invoiceController.deleteInvoice);

// 8. Staff Shifts & Leave Management Routes
app.get('/api/shifts', authenticateToken, authorizeRoles('FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER'), shiftController.getShifts);
app.post('/api/shifts', authenticateToken, authorizeRoles('OWNER'), shiftController.createShift);
app.put('/api/shifts/:id', authenticateToken, authorizeRoles('OWNER'), shiftController.updateShift);
app.delete('/api/shifts/:id', authenticateToken, authorizeRoles('OWNER'), shiftController.deleteShift);
app.get('/api/leaves', authenticateToken, authorizeRoles('OWNER'), shiftController.getLeaveRequests);
app.post('/api/leaves', authenticateToken, authorizeRoles('OWNER'), shiftController.createLeaveRequest);
app.put('/api/leaves/:id/review', authenticateToken, authorizeRoles('OWNER'), shiftController.reviewLeaveRequest);

// 9. Tax Reports & Export Routes (Owner ONLY)
app.get('/api/reports/revenue', authenticateToken, authorizeRoles('OWNER'), reportController.getRevenueReport);
app.get('/api/reports/tax', authenticateToken, authorizeRoles('OWNER'), reportController.getTaxReport);
app.get('/api/reports/export', authenticateToken, authorizeRoles('OWNER'), reportController.getExportData);

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
