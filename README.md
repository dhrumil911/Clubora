# 🏆 Clubora — Next-Gen Sports Club Operating System & Management Platform

**Clubora** is an end-to-end, enterprise-grade Sports Club & Facility Management System designed for racquet clubs, tennis/padel centers, multi-sport complexes, and athletic facilities. It unifies Court Scheduling, Pro Shop Inventory POS, Bar & Cafeteria POS, CRM Lead Conversion, Staff Scheduling, Corporate Invoicing, and Executive Financial Analytics into a seamless platform.

---

## 🌟 Key Features & Core Modules

### 👑 1. Executive Financial Analytics & Control (Club Owner)
* **Real-time Aggregated Metrics**: Financial overview across Courts, Gear Shop POS, Bar & Cafeteria, and Corporate Receivables.
* **Revenue Stream Distribution**: Interactive breakdowns showing percentage shares for court bookings, retail shop POS, bar tabs, and active subscriptions.
* **Corporate Invoices & Receivables**: Generate, issue, and track corporate client invoices with automated status updates (`PENDING`, `PAID`, `OVERDUE`).
* **PDF Financial Report Export**: Download executive financial summaries in PDF format with a single click.

### 🎾 2. Court Booking & Slot Scheduler Engine
* **Interactive Slot Matrix**: Real-time slot booking across Tennis, Padel, Badminton, and Pickleball courts.
* **Social Play & Matchmaking**: Option to mark court bookings as Social Play to allow player matching.
* **Dynamic Tier Discounts**: Automated discount application based on member tier (Platinum, Gold, Silver).
* **Instant Check-in & Cancellation**: Front desk management tools for member check-in and booking cancellations.

### 🛍️ 3. Pro Shop POS & Inventory Management Workflow
* **Role-Separated Workflows**: 
  * **Members**: Browse items, view tier-discounted pricing, validate stock availability, add to cart, checkout via Razorpay online or Cash, and download PDF receipts.
  * **Shop Staff**: Operational Stock Dashboard with status badges (`IN STOCK`, `LOW STOCK`, `OUT OF STOCK`), direct physical stock addition, and Inventory Purchase Requests to Owner.
* **Owner Inventory Request Approval Lifecycle**:
  * `PENDING` $\rightarrow$ `APPROVED` / `REJECTED` $\rightarrow$ `ORDERED` $\rightarrow$ `RECEIVED`
  * Stock increases in the database **only upon physical delivery receipt**.
* **Single Shared Inventory Pool**: Ensures live synchronization between online member purchases and counter POS sales.

### ☕ 4. Bar & Cafeteria POS
* **Member Open Tabs**: Open, update, and manage cafeteria tabs for members and guests.
* **Tab Settlement**: Cash, Card, or Online payment tab settlement with tier discount application.
* **Daily Bar Expense Tracking**: Log operational cafe expenses directly into the financial ledger.

### 🎯 5. CRM Lead Conversion & Quotation Engine
* **Visual Lead Funnel**: Track lead conversion pipeline (`NEW` $\rightarrow$ `CONTACTED` $\rightarrow$ `TRIAL_BOOKED` $\rightarrow$ `CONVERTED`).
* **Custom Quotation Builder**: Generate custom membership & court package quotes for prospective leads.

### 📅 6. Staff Roster & Leave Management
* **Shift Scheduling**: Assign and manage shifts across Front Desk, Shop POS, and Bar staff.
* **Leave Request Portal**: Staff leave submission with Owner review & approval workflow.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React Icons, Recharts, React Router v6, Axios, jsPDF, html2canvas |
| **Backend** | Node.js, Express.js (ES Modules), PostgreSQL (`pg`), JWT (`jsonwebtoken`), Bcrypt.js, Razorpay SDK |
| **Database** | PostgreSQL (Relational DB with auto-migration schema support) |
| **Styling** | Adaptive Dark & Light Theme with Tailwind CSS |

---

## 📁 Repository Structure

```
Clubora/
├── backend/                  # Express.js REST API & Database Control
│   ├── database/             # PostgreSQL Schema & Seed Scripts
│   │   ├── schema.sql        # Database Table Definitions
│   │   └── seed.js          # Demo Data Seeder
│   ├── src/
│   │   ├── config/           # Database Connection Pool (`db.js`)
│   │   ├── controllers/      # API Business Logic Handlers
│   │   ├── middleware/       # JWT Auth & Role Authorization
│   │   └── server.js         # Express Server Entrance
│   └── package.json
│
├── frontend/                 # React SPA (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/       # UI Components (Navbar, Modals, Trackers)
│   │   ├── context/          # ThemeContext & State Management
│   │   ├── pages/            # Feature & Module Views
│   │   │   ├── auth/         # Login & Registration Pages
│   │   │   └── dashboards/   # Role-based Dashboards (Owner, Front Desk, Staff, Member)
│   │   ├── utils/            # PDF Generator Utilities
│   │   ├── api.js            # Axios Interceptor & Base URL Config
│   │   ├── App.jsx           # Client-side Router & Guard Routes
│   │   └── main.jsx          # React Entrance
│   └── package.json
│
└── README.md                 # Documentation
```

---

## 🚀 Quick Start & Installation

### Prerequisites
* **Node.js** (v18.x or higher)
* **PostgreSQL** (v14.x or higher)

---

### 1. Database Setup
1. Create a PostgreSQL database named `Clubora`:
   ```sql
   CREATE DATABASE "Clubora";
   ```
2. Configure database credentials in `backend/.env`:
   ```env
   PORT=5000
   JWT_SECRET=clubora_secret_jwt_key_2026
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=Clubora
   PGUSER=postgres
   PGPASSWORD=your_postgres_password
   ```

---

### 2. Backend Setup
```bash
cd backend
npm install
npm run db:migrate   # Seed database schema & demo data
npm run dev          # Start backend server on http://localhost:5000
```

---

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev          # Start Vite dev server on http://localhost:3000
```

---

## 👥 Demo Access Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Club Owner** | `owner@clubora.com` | `Clubora@2026` | Full Access: Financials, Reports, Staff Roster, Invoices, Approvals |
| **Front Desk** | `frontdesk@clubora.com` | `Frontdesk@2026` | Court Scheduler, Member Management, CRM Leads & Quotes |
| **Bar / Shop Staff** | `barshop@clubora.com` | `Barshop@2026` | Gear Inventory POS, Stock Addition, Request Stock, Bar Cafeteria POS |
| **Club Member** | `member@clubora.com` | `Member@2026` | Court Slot Booking, Gear Shop Checkout, Bar Tabs, Membership Plans |

---

## 📄 License
This project is proprietary software for **Clubora Sports Club Management System**. All rights reserved.
