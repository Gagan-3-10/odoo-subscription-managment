# Brightloop — Enterprise Subscription Management & Recurring Billing System

> **Hackathon Submission**: Complete, production-grade, full-stack subscription operations and automated billing cloud platform. Built with React (Vite, TypeScript, Tailwind CSS, Lucide icons, Recharts) and Node.js (Express, TypeScript, Prisma ORM, SQLite/PostgreSQL).

---

## 🌟 Key Capabilities & Architectural Highlights

1. **Role-Based Access Control (RBAC)**:
   - **ADMIN**: Full system access, staff provisioning, catalog/pricing, tax rules, discount coupons, automated billing engine, and financial reports.
   - **STAFF**: Customer management, quotations, subscription lifecycle actions, invoice generation, offline payment recording, and operational reports.
   - **CUSTOMER**: Dedicated Self-Service Portal with strict customer data isolation, subscription management (pause/resume/cancel where plan permits), online invoice payments via Razorpay test mode, and PDF invoice downloads.

2. **Automated Recurring Billing Engine**:
   - Background scheduler checks subscriptions every 60 seconds (also on-demand triggerable).
   - Atomic database transactions with duplicate billing prevention for identical billing periods.
   - Automatically advances `nextBillingDate`, creates itemized invoices and billing history logs, and triggers notifications.

3. **Product & Plan Management**:
   - Multi-variant pricing: brand, edition, capacity (e.g. Odoo brand edition adds ₹560).
   - Flexible billing cycles: Daily, Weekly, Monthly, and Yearly with plan availability date validation.

4. **1-Click Quotation to Subscription Conversion**:
   - Create sales proposals with multi-product line items, taxes, and discounts.
   - One-click instant conversion of accepted quotations into active subscriptions without re-entering data.

5. **Invoice Management & PDF Generation**:
   - Full invoice lifecycle: Draft, Confirmed, Partially Paid, Paid, Overdue, Cancelled.
   - Server-side PDF invoice generation via PDFKit with tax breakdown, payment instructions, and customer details.

6. **Payment Processing**:
   - Razorpay Test Mode checkout simulation with instant verification.
   - Manual/offline payment recording with partial payment support and duplicate transaction reference prevention.

7. **GST Tax & Discount Rules**:
   - Indian GST, CGST, SGST, IGST calculations.
   - Percentage and flat discounts with minimum purchase, minimum quantity, and usage limit validation.

8. **Executive Analytics Dashboard**:
   - 8 live KPI cards: MRR, ARR, Total Revenue, Active Subscriptions, Overdue Invoices, etc.
   - 5 interactive Recharts: Monthly revenue trends, subscription growth, status breakdown, revenue by product, and payment methods.

---

## 👥 Demo Login Credentials

You can use the **Quick Fill Demo Credentials** buttons directly on the login screen, or enter the credentials manually:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@brightloop.io` | `Brightloop@2026` | Full system access, staff, catalog, taxes, settings |
| **STAFF** | `rohan.mehra@brightloop.io` | `Brightloop@2026` | Customers, quotations, subscriptions, billing, reports |
| **CUSTOMER** | `customer@brightloop.io` | `Brightloop@2026` | Customer self-service portal, invoices, online payment |

*Note: You can also use the **Demo Role** switcher in the top navigation bar to switch personas instantly during testing.*

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **npm** v9+

### 2. Start the Backend API Server
```bash
cd backend
npm run dev
```
- Server URL: `http://localhost:5000`
- SQLite database (`backend/prisma/dev.db`) is already generated and pre-seeded with 20 customers, 5 staff, 10 products, 15 plans, 30 subscriptions, 20 invoices, and 15 payments.

### 3. Start the Frontend Application
In a separate terminal:
```bash
cd frontend
npm run dev
```
- Web Application URL: `http://localhost:5173`

---

## 🧪 Testing the Core Workflows

1. **Test Automated Billing Engine**:
   - Log in as **Admin** or **Staff**.
   - Click the **"Run Automated Billing"** button in the top navigation bar or on the dashboard.
   - The engine will scan active subscriptions, generate invoices for due periods, record billing history, and show a confirmation toast.

2. **Test 1-Click Quotation Conversion**:
   - Navigate to **Sales -> Quotations**.
   - Open any accepted quotation (or accept a draft quotation).
   - Click **"Convert to Sub"** — an active subscription with line items and recurring schedule is created immediately.

3. **Test Customer Portal & Online Payment**:
   - Switch persona to **Customer** using the top bar switcher.
   - Go to **My Invoices & Receipts**.
   - Click **"Pay Online"** on any unpaid invoice and simulate payment via UPI or Credit Card.
   - Click **"PDF"** to view and download the official PDF invoice.

4. **Test Financial Analytics & CSV Export**:
   - Switch to **Admin** or **Staff**.
   - Go to **Analytics -> Financial Reports**.
   - Toggle filters (`This Month`, `This Quarter`, `This Year`).
   - Click **"Export CSV Spreadsheet"** to download the CSV data.

---

## 📁 Modular Project Structure

```
hack/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema models & relations
│   │   ├── seed.ts             # Realistic seed data script
│   │   └── dev.db              # Pre-seeded SQLite database
│   ├── src/
│   │   ├── config/             # Prisma client & environmental config
│   │   ├── controllers/        # REST API controllers for all modules
│   │   ├── jobs/               # Background recurring scheduler
│   │   ├── middleware/         # JWT authentication & RBAC authorization
│   │   ├── routes/             # Express API route declarations
│   │   ├── services/           # Billing engine, PDF generator, notifications
│   │   ├── utils/              # Precision monetary and date calculations
│   │   └── server.ts           # Express server entrypoint
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Sidebar, Header, Modal, KPICard, StatusBadge
│   │   ├── contexts/           # AuthContext with demo role switcher
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register, Forgot Password
│   │   │   ├── dashboard/      # Executive KPIs & 5 Recharts charts
│   │   │   ├── customers/      # Customer directory & drawer
│   │   │   ├── products/       # Products & variant price calculator
│   │   │   ├── plans/          # Subscription plans & comparisons
│   │   │   ├── quotations/     # Quotation builder & templates
│   │   │   ├── subscriptions/  # Full subscription lifecycle & audit logs
│   │   │   ├── invoices/       # Invoices, PDF download & Razorpay checkout
│   │   │   ├── payments/       # Payment records & reconciliations
│   │   │   ├── taxes/          # GST, CGST, SGST, IGST rules
│   │   │   ├── discounts/      # Coupon codes & promotion rules
│   │   │   ├── reports/        # Financial reports & CSV export
│   │   │   ├── staff/          # Admin staff accounts management
│   │   │   ├── customer-portal/# Customer self-service portal
│   │   │   └── settings/       # Organization & gateway parameters
│   │   ├── services/           # Axios client with JWT interceptor
│   │   ├── types/              # Comprehensive TypeScript interfaces
│   │   ├── App.tsx             # Main routing and layout container
│   │   └── main.tsx            # React DOM bootstrap
│   └── package.json
└── README.md
```

---

## 🛡️ Security & Performance Highlights
- **Password Hashing**: `bcryptjs` with salt rounds.
- **JWT Protection**: Secure stateless bearer token authorization with expiration.
- **Strict Role-Based Access Control**: Prevents unauthorized privilege escalation.
- **Customer Data Isolation**: Customers can only view and mutate their own subscriptions, invoices, and payments.
- **Financial Calculations Precision**: Decimal rounding helpers ensure exact tax and discount totals without floating-point errors.
- **Duplicate Prevention**: DB constraints and transaction deduplication prevent double-billing and duplicate transaction recording.
