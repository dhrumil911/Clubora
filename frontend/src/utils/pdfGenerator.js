import { jsPDF } from 'jspdf';

/**
 * Format a number as currency Rs. XX.XX
 */
const fmt = (num) => `Rs. ${Number(num || 0).toFixed(2)}`;

/**
 * Common Clubora header drawer
 */
function drawHeader(doc, title, subtitle) {
  // Top decorative header bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 38, 'F');

  // Accent bar
  doc.setFillColor(14, 165, 233); // sky-500
  doc.rect(0, 38, 210, 2, 'F');

  // Clubora Logo Icon Box
  doc.setFillColor(14, 165, 233);
  doc.roundedRect(14, 8, 22, 22, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('C', 25, 23, { align: 'center' });

  // Brand Name & Tagline
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CLUBORA SPORTS CLUB', 42, 17);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Premier Racquet, Athletics & Hospitality Club • contact@clubora.com', 42, 24);

  // Document Title / Type Banner on the right
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text(title.toUpperCase(), 196, 18, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(subtitle || new Date().toLocaleDateString(), 196, 25, { align: 'right' });
}

/**
 * Common Clubora footer drawer
 */
function drawFooter(doc, pageNumber = 1) {
  const pageHeight = 297;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 18, 196, pageHeight - 18);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Clubora Club Management System • Official Computer Generated Document • Valid without physical signature', 14, pageHeight - 11);
  doc.text(`Page ${pageNumber} of 1`, 196, pageHeight - 11, { align: 'right' });
}

/**
 * 1. DOWNLOAD INVOICE PDF
 * Generates an official, beautifully formatted corporate/membership invoice.
 */
export function downloadInvoicePDF(invoice) {
  if (!invoice) return;
  const doc = new jsPDF('p', 'mm', 'a4');

  const invNum = invoice.invoiceNumber || 'INV-000';
  const invDate = invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  const dueDate = invoice.dueDate || 'Upon Receipt';
  const status = (invoice.status || 'PENDING').toUpperCase();

  drawHeader(doc, 'Commercial Invoice', `Invoice #${invNum}`);

  let y = 48;

  // Invoice Overview Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 32, 3, 3, 'FD');

  // Left side: Billed To
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO (CLIENT DETAILS):', 20, y + 8);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.clientName || 'Corporate Client', 20, y + 15);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Email: ${invoice.clientEmail || 'N/A'}`, 20, y + 21);
  doc.text(`Account Type: ${invoice.type || 'CORPORATE'}`, 20, y + 26);

  // Right side: Invoice Details
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('INVOICE METADATA:', 130, y + 8);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Issue Date: ${invDate}`, 130, y + 14);
  doc.text(`Due Date: ${dueDate}`, 130, y + 20);

  // Status Badge
  doc.text('Status:', 130, y + 26);
  if (status === 'PAID') {
    doc.setFillColor(220, 252, 231);
    doc.setTextColor(22, 101, 52);
    doc.roundedRect(150, y + 21, 24, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('PAID', 162, y + 26, { align: 'center' });
  } else if (status === 'OVERDUE') {
    doc.setFillColor(254, 226, 226);
    doc.setTextColor(153, 27, 27);
    doc.roundedRect(150, y + 21, 26, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('OVERDUE', 163, y + 26, { align: 'center' });
  } else {
    doc.setFillColor(254, 243, 199);
    doc.setTextColor(146, 64, 14);
    doc.roundedRect(150, y + 21, 24, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('PENDING', 162, y + 26, { align: 'center' });
  }

  y += 42;

  // Line Items Table Header
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, 182, 9, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('DESCRIPTION & SERVICE DETAILS', 20, y + 6);
  doc.text('TYPE', 115, y + 6);
  doc.text('QTY', 145, y + 6, { align: 'center' });
  doc.text('AMOUNT (INR)', 188, y + 6, { align: 'right' });

  y += 9;

  // Line Item Row
  const amount = parseFloat(invoice.amount || 0);
  doc.setFillColor(255, 255, 255);
  doc.rect(14, y, 182, 16, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.notes || `${invoice.type || 'Corporate'} Club Services & Facility Retainer`, 20, y + 7);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Authorized Clubora Facility Access • Due: ${dueDate}`, 20, y + 12);

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(invoice.type || 'CORPORATE', 115, y + 9);
  doc.text('1', 145, y + 9, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text(fmt(amount), 188, y + 9, { align: 'right' });

  y += 24;

  // Calculation Breakdown Box on the Right
  const subY = y;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(110, subY, 86, 36, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', 116, subY + 9);
  doc.text(fmt(amount), 188, subY + 9, { align: 'right' });

  doc.text('Applicable Taxes (0% Inc.):', 116, subY + 17);
  doc.text('Rs. 0.00', 188, subY + 17, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(116, subY + 22, 188, subY + 22);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Total Balance Due:', 116, subY + 30);
  doc.setTextColor(14, 165, 233);
  doc.text(fmt(amount), 188, subY + 30, { align: 'right' });

  // Payment Instructions Box on Left
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, subY, 90, 36, 2, 2, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('SETTLEMENT INSTRUCTIONS:', 18, subY + 8);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Payment Methods: Direct Bank Wire, Corporate UPI, or Card', 18, subY + 15);
  doc.text('Account Name: Clubora Sports & Recreation Private Ltd', 18, subY + 21);
  doc.text('Bank Reference: Please quote invoice number upon transfer.', 18, subY + 27);
  doc.text('Billing Inquiries: billing@clubora.com', 18, subY + 33);

  // Signature Block
  y = subY + 50;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, 70, y);
  doc.line(136, y, 192, y);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Finance Signatory', 14, y + 5);
  doc.text('Club Executive Seal & Verification', 136, y + 5);

  drawFooter(doc, 1);
  doc.save(`Clubora_Invoice_${invNum}.pdf`);
}

/**
 * 2. DOWNLOAD EXECUTIVE FINANCE REPORT PDF
 * Generates comprehensive end-of-period financial statement for the Owner.
 */
export function downloadFinanceReportPDF(data, period = 'all') {
  if (!data) return;
  const doc = new jsPDF('p', 'mm', 'a4');

  const periodLabel = {
    all: 'All Time Historical',
    today: 'Today Only',
    week: 'Current Week',
    month: 'Current Month'
  }[period] || 'Consolidated Report';

  drawHeader(doc, 'Financial Analytics', `${periodLabel} • ${new Date().toLocaleDateString()}`);

  const m = data.metrics || {};
  const totalRev = parseFloat(m.totalEarned || 0);
  const courtRev = parseFloat(m.courtRevenue || 0);
  const shopRev = parseFloat(m.shopRevenue || 0);
  const barRev = parseFloat(m.barRevenue || 0);
  const memRev = parseFloat(m.membershipRevenue || 0);
  const totalOwed = parseFloat(m.totalOwed || 0);

  let y = 48;

  // Executive Summary Banner
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, y, 182, 28, 3, 3, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 189, 248);
  doc.text('EXECUTIVE REVENUE AGGREGATION', 20, y + 8);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(fmt(totalRev), 20, y + 19);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Active Members: ${m.activeMembersCount || 4} / ${m.totalMembersCount || 4}  •  Today Court Bookings: ${m.todayBookings || 0}  •  Corporate Receivables: ${fmt(totalOwed)}`, 20, y + 24);

  y += 34;

  // Section 1: Revenue Channels Breakdown
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. Revenue Streams & Financial Breakdown', 14, y);

  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('STREAM / CHANNEL', 20, y + 5.5);
  doc.text('DESCRIPTION', 75, y + 5.5);
  doc.text('SHARE %', 140, y + 5.5, { align: 'center' });
  doc.text('REVENUE (INR)', 188, y + 5.5, { align: 'right' });

  y += 8;

  const streams = [
    { name: 'Court Bookings', desc: 'Tennis, Cricket & Padel staggered slots', amt: courtRev },
    { name: 'Gear Shop POS', desc: 'Equipment, rackets, balls & apparel sales', amt: shopRev },
    { name: 'Bar & Cafeteria', desc: 'Post-match settled tabs & refreshments', amt: barRev },
    { name: 'Member Dues', desc: 'Active membership tier recurring monthly dues', amt: memRev },
  ];

  streams.forEach((s, idx) => {
    const pct = totalRev > 0 ? ((s.amt / totalRev) * 100).toFixed(1) : '0.0';
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
    doc.rect(14, y, 182, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(s.name, 20, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(s.desc, 75, y + 5.5);

    doc.setTextColor(51, 65, 85);
    doc.text(`${pct}%`, 140, y + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 165, 233);
    doc.text(fmt(s.amt), 188, y + 5.5, { align: 'right' });

    y += 8;
  });

  y += 8;

  // Section 2: Payment Distribution Channels
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Settlement Distribution by Payment Method', 14, y);

  y += 4;
  const pm = data.paymentMethods || {};
  const upi = parseFloat(pm.UPI || 0);
  const card = parseFloat(pm.CARD || 0);
  const cash = parseFloat(pm.CASH || 0);
  const online = parseFloat(pm.ONLINE || 0);

  const pmBoxes = [
    { label: 'UPI / QR Payment', amt: upi, bg: [240, 253, 250] },
    { label: 'Card Swipe (POS)', amt: card, bg: [238, 242, 255] },
    { label: 'Cash at Counter', amt: cash, bg: [254, 252, 232] },
    { label: 'Online Web Portal', amt: online, bg: [240, 249, 255] }
  ];

  const boxW = 42;
  pmBoxes.forEach((b, idx) => {
    const x = 14 + (idx * 46);
    doc.setFillColor(b.bg[0], b.bg[1], b.bg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, boxW, 18, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(b.label.toUpperCase(), x + 3, y + 6);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(fmt(b.amt), x + 3, y + 14);
  });

  y += 26;

  // Section 3: Corporate Invoices & Receivables
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. Corporate Client Invoices & Receivables', 14, y);

  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('INVOICE #', 20, y + 5.5);
  doc.text('CLIENT NAME', 60, y + 5.5);
  doc.text('DUE DATE', 120, y + 5.5);
  doc.text('STATUS', 150, y + 5.5);
  doc.text('AMOUNT (INR)', 188, y + 5.5, { align: 'right' });

  y += 8;

  const invoices = data.invoices || [];
  if (invoices.length === 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('No corporate invoices on record for this period.', 20, y + 6);
    y += 10;
  } else {
    invoices.slice(0, 5).forEach((inv, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(14, y, 182, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(inv.invoiceNumber || 'INV-001', 20, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(inv.clientName || 'N/A', 60, y + 5.5);
      doc.text(inv.dueDate || 'N/A', 120, y + 5.5);

      const st = inv.status || 'PENDING';
      doc.setFont('helvetica', 'bold');
      if (st === 'PAID') doc.setTextColor(22, 101, 52);
      else if (st === 'OVERDUE') doc.setTextColor(153, 27, 27);
      else doc.setTextColor(180, 83, 9);
      doc.text(st, 150, y + 5.5);

      doc.setTextColor(15, 23, 42);
      doc.text(fmt(inv.amount), 188, y + 5.5, { align: 'right' });

      y += 8;
    });
  }

  y += 6;

  // Section 4: Operational Staff Shifts Overview
  const shifts = data.shifts || [];
  if (shifts.length > 0 && y < 240) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('4. Scheduled Staff Operational Roster', 14, y);

    y += 4;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('STAFF MEMBER', 20, y + 5.5);
    doc.text('DEPARTMENT / ROLE', 75, y + 5.5);
    doc.text('DATE & SHIFT TIME', 130, y + 5.5);
    doc.text('STATUS', 188, y + 5.5, { align: 'right' });

    y += 8;
    shifts.slice(0, 3).forEach((sh, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(14, y, 182, 7.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(sh.staffName || 'Staff', 20, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(sh.role || 'General', 75, y + 5);
      doc.text(`${sh.date || ''} (${sh.startTime || ''} - ${sh.endTime || ''})`, 130, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(sh.status || 'SCHEDULED', 188, y + 5, { align: 'right' });

      y += 7.5;
    });
  }

  drawFooter(doc, 1);
  const safeDate = new Date().toISOString().split('T')[0];
  doc.save(`Clubora_Executive_Financial_Report_${period}_${safeDate}.pdf`);
}

/**
 * 3. DOWNLOAD MEMBER PURCHASE RECEIPT PDF
 * Generates an official POS gear purchase receipt for members and counter walk-ins.
 */
export function downloadReceiptPDF(receipt) {
  if (!receipt) return;
  const doc = new jsPDF('p', 'mm', 'a5'); // A5 size is standard receipt format

  const recNum = receipt.receiptNumber || `REC-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = receipt.timestamp ? new Date(receipt.timestamp).toLocaleString() : new Date().toLocaleString();
  const customerName = receipt.customerName || 'Club Member';
  const memberCode = receipt.memberCode || 'N/A';
  const tierName = receipt.tierName || 'Standard';
  const channel = receipt.channel || 'COUNTER_POS';

  // Receipt Header Band
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 148, 30, 'F');
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 30, 148, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CLUBORA SPORTS CLUB', 74, 13, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Official Pro Shop Purchase Receipt • Contact: proshop@clubora.com', 74, 19, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 189, 248);
  doc.text(`RECEIPT #: ${recNum}`, 74, 26, { align: 'center' });

  let y = 38;

  // Customer & Order Information Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, y, 128, 24, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Customer Name:', 14, y + 6);
  doc.text('Member ID / Tier:', 14, y + 12);
  doc.text('Order Channel:', 14, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(customerName, 50, y + 6);
  doc.text(`${memberCode} (${tierName})`, 50, y + 12);
  doc.text(channel === 'ONLINE' ? 'Online Club App' : 'Pro Shop Counter POS', 50, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Date & Time:', 85, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(new Date(receipt.timestamp || Date.now()).toLocaleDateString(), 105, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Payment Status:', 85, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('PAID (CONFIRMED)', 105, y + 12);

  y += 30;

  // Purchased Items Table Header
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, y, 128, 7, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('ITEM DESCRIPTION', 14, y + 5);
  doc.text('QTY', 82, y + 5, { align: 'center' });
  doc.text('PRICE', 104, y + 5, { align: 'right' });
  doc.text('TOTAL', 134, y + 5, { align: 'right' });

  y += 7;

  // Line items
  const items = receipt.items || [];
  if (items.length === 0) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Pro Shop Merchandise Purchase', 14, y + 5);
    doc.text(fmt(receipt.finalTotal), 134, y + 5, { align: 'right' });
    y += 8;
  } else {
    items.forEach((item, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(10, y, 128, 7, 'F');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(item.productName || 'Gear Item', 14, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(String(item.quantity || 1), 82, y + 5, { align: 'center' });
      doc.text(fmt(item.unitPrice), 104, y + 5, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.text(fmt(item.totalPrice || (item.unitPrice * item.quantity)), 134, y + 5, { align: 'right' });

      y += 7;
    });
  }

  y += 4;

  // Financial Summary Breakdown Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(68, y, 70, 28, 2, 2, 'FD');

  const sub = parseFloat(receipt.subtotal || receipt.finalTotal || 0);
  const discAmt = parseFloat(receipt.discountAmount || 0);
  const discPct = parseFloat(receipt.discountPercent || 0);
  const finalTot = parseFloat(receipt.finalTotal || sub);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', 72, y + 6);
  doc.text(fmt(sub), 134, y + 6, { align: 'right' });

  if (discAmt > 0 || discPct > 0) {
    doc.setTextColor(22, 101, 52);
    doc.text(`Member Discount (${discPct}%):`, 72, y + 12);
    doc.text(`-${fmt(discAmt)}`, 134, y + 12, { align: 'right' });
  } else {
    doc.text('Member Discount (0%):', 72, y + 12);
    doc.text('Rs. 0.00', 134, y + 12, { align: 'right' });
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(72, y + 16, 134, y + 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Final Total Paid:', 72, y + 23);
  doc.setTextColor(14, 165, 233);
  doc.text(fmt(finalTot), 134, y + 23, { align: 'right' });

  // Thank You & Footer
  y += 38;
  doc.setDrawColor(226, 232, 240);
  doc.line(10, y, 138, y);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Thank you for choosing Clubora Sports Club!', 74, y + 6, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Gear items may be exchanged within 7 days with original receipt.', 74, y + 11, { align: 'center' });
  doc.text(`Generated: ${dateStr} • Computer Issued Receipt`, 74, y + 16, { align: 'center' });

  doc.save(`Clubora_Receipt_${recNum}.pdf`);
}
