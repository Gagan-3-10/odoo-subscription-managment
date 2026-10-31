import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for Brightloop...');

  // 1. Clean existing records
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.billingHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.discountUsage.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.tax.deleteMany();
  await prisma.subscriptionLine.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.quotationLine.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.quotationTemplate.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // Password for demo accounts: Admin@Brightloop2026! or Brightloop@2026
  const commonPassword = await bcrypt.hash('Brightloop@2026', 10);

  // 2. Create 1 ADMIN User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@brightloop.io',
      password: commonPassword,
      name: 'Aditi Sharma',
      phone: '+91 98765 43210',
      role: 'ADMIN',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });
  console.log('✔ Admin account created: admin@brightloop.io');

  // 3. Create 5 STAFF Users & Records
  const staffData = [
    { name: 'Rohan Mehra', email: 'rohan.mehra@brightloop.io', department: 'Billing Operations', designation: 'Senior Billing Manager', employeeId: 'STF-1001' },
    { name: 'Priya Sundaram', email: 'priya.s@brightloop.io', department: 'Customer Success', designation: 'Account Executive', employeeId: 'STF-1002' },
    { name: 'Kunal Verma', email: 'kunal.v@brightloop.io', department: 'Sales', designation: 'Sales Specialist', employeeId: 'STF-1003' },
    { name: 'Ananya Rao', email: 'ananya.rao@brightloop.io', department: 'Finance & Compliance', designation: 'Financial Analyst', employeeId: 'STF-1004' },
    { name: 'Vikram Joshi', email: 'vikram.j@brightloop.io', department: 'Support', designation: 'Subscription Support Lead', employeeId: 'STF-1005' },
  ];

  const createdStaff = [];
  for (const s of staffData) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        password: commonPassword,
        name: s.name,
        phone: '+91 98111 ' + Math.floor(10000 + Math.random() * 90000),
        role: 'STAFF',
        status: 'ACTIVE',
      },
    });

    const staff = await prisma.staff.create({
      data: {
        userId: user.id,
        employeeId: s.employeeId,
        department: s.department,
        designation: s.designation,
        permissions: 'ALL',
      },
    });
    createdStaff.push(staff);
  }
  console.log(`✔ Created ${createdStaff.length} staff members.`);

  // 4. Create 20 CUSTOMERS with User Accounts
  const customersData = [
    { contactName: 'Rajesh Nair', companyName: 'Nair Logistics Ltd', email: 'rajesh@nairlogistics.com', phone: '+91 98200 11223', billingAddress: '402, Trade Tower, Bandra Kurla Complex, Mumbai 400051', taxId: '27AABCN1234F1Z1', currency: 'INR' },
    { contactName: 'Sneha Patel', companyName: 'Aura Cloud Technologies', email: 'sneha@auracloud.in', phone: '+91 98450 33445', billingAddress: '7th Floor, Cyber Gateway, Hitech City, Hyderabad 500081', taxId: '36AABCA9876C1Z2', currency: 'INR' },
    { contactName: 'Amitabh Sengupta', companyName: 'Kolkata Analytics Hub', email: 'amitabh@kolkataanalytics.com', phone: '+91 98300 55667', billingAddress: 'Salt Lake Sector V, Kolkata 700091', taxId: '19AABCK4567B1Z4', currency: 'INR' },
    { contactName: 'Divya Iyer', companyName: 'Iyer Fintech Labs', email: 'divya@iyerfintech.io', phone: '+91 98800 77889', billingAddress: '12, Indiranagar 100ft Road, Bengaluru 560038', taxId: '29AABCI5544D1Z5', currency: 'INR' },
    { contactName: 'Manish Agarwal', companyName: 'Apex Retail Solutions', email: 'manish@apexretail.co', phone: '+91 98100 99001', billingAddress: 'Plot 45, Udyog Vihar Phase IV, Gurugram 122015', taxId: '06AABCA3322E1Z8', currency: 'INR' },
    { contactName: 'Kavita Menon', companyName: 'Kerala Spice Global', email: 'kavita@keralaspice.org', phone: '+91 94470 12345', billingAddress: 'Marine Drive, Kochi 682031', taxId: '32AABCK8877K1Z3', currency: 'INR' },
    { contactName: 'Tarun Saxena', companyName: 'Zenith Health Systems', email: 'tarun@zenithhealth.in', phone: '+91 99100 23456', billingAddress: 'Barakhamba Road, Connaught Place, New Delhi 110001', taxId: '07AABCZ1122M1Z9', currency: 'INR' },
    { contactName: 'Pooja Bhatia', companyName: 'BrightEdge Media Corp', email: 'pooja@brightedgemedia.com', phone: '+91 97110 34567', billingAddress: 'Film City, Sector 16A, Noida 201301', taxId: '09AABCB6655P1Z1', currency: 'INR' },
    { contactName: 'Sanjay Deshmukh', companyName: 'Deccan Forge & Robotics', email: 'sanjay@deccanrobotics.com', phone: '+91 98220 45678', billingAddress: 'MIDC Bhosari, Pune 411026', taxId: '27AABCD4433R1Z7', currency: 'INR' },
    { contactName: 'Neha Kulkarni', companyName: 'Synthetix AI Studio', email: 'neha@synthetix.ai', phone: '+91 98900 56789', billingAddress: 'Koregaon Park, Pune 411001', taxId: '27AABCS9988S1Z0', currency: 'INR' },
    { contactName: 'Rahul Khanna', companyName: 'BlueSky Logistics', email: 'customer@brightloop.io', phone: '+91 99887 76655', billingAddress: '15 MG Road, Connaught Place, New Delhi 110001', taxId: '07AABCB9999K1Z4', currency: 'INR' },
    { contactName: 'Deepa Hegde', companyName: 'Canara Marine Exports', email: 'deepa@canaramarine.com', phone: '+91 98440 67890', billingAddress: 'Kuloor Ferry Road, Mangalore 575013', taxId: '29AABCD1133H1Z2', currency: 'INR' },
    { contactName: 'Nikhil Kapoor', companyName: 'UrbanStay Co-living', email: 'nikhil@urbanstay.in', phone: '+91 98180 78901', billingAddress: 'Golf Course Extension Road, Gurugram 122002', taxId: '06AABCU7766N1Z6', currency: 'INR' },
    { contactName: 'Meera Chidambaram', companyName: 'Thanjavur Solar Power', email: 'meera@thanjavursolar.com', phone: '+91 94440 89012', billingAddress: 'Anna Salai, Guindy, Chennai 600032', taxId: '33AABCT2211C1Z4', currency: 'INR' },
    { contactName: 'Harshwardhan Rathore', companyName: 'Heritage Textiles Jaipur', email: 'harsh@heritagetextiles.com', phone: '+91 94140 90123', billingAddress: 'Sitapura Industrial Area, Jaipur 302022', taxId: '08AABCH5544R1Z5', currency: 'INR' },
    { contactName: 'Bhavna Parekh', companyName: 'Navkar Pharma Solutions', email: 'bhavna@navkarpharma.com', phone: '+91 98250 01234', billingAddress: 'GIDC Estate, Ankleshwar 393002', taxId: '24AABCN6677P1Z8', currency: 'INR' },
    { contactName: 'Gaurav Singhal', companyName: 'Singhal Agro Industries', email: 'gaurav@singhalagro.com', phone: '+91 98970 12345', billingAddress: 'Transport Nagar, Meerut 250002', taxId: '09AABCS8899S1Z3', currency: 'INR' },
    { contactName: 'Swati Bansal', companyName: 'UrbanCart E-Commerce', email: 'swati@urbancart.in', phone: '+91 98710 23456', billingAddress: 'Okhla Industrial Estate Phase III, New Delhi 110020', taxId: '07AABCU4455B1Z9', currency: 'INR' },
    { contactName: 'Vinay Reddy', companyName: 'Telangana Fiber Networks', email: 'vinay@telangananetworks.com', phone: '+91 99490 34567', billingAddress: 'Madhapur, Hyderabad 500081', taxId: '36AABCT3344R1Z2', currency: 'INR' },
    { contactName: 'Ritu Ganguly', companyName: 'EastCoast Media House', email: 'ritu@eastcoastmedia.in', phone: '+91 98310 45678', billingAddress: 'Park Street, Kolkata 700016', taxId: '19AABCE1122G1Z7', currency: 'INR' },
  ];

  const createdCustomers = [];
  for (let i = 0; i < customersData.length; i++) {
    const c = customersData[i];
    const user = await prisma.user.create({
      data: {
        email: c.email,
        password: commonPassword,
        name: c.contactName,
        phone: c.phone,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    const custNumber = `CUST-${2000 + i + 1}`;
    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        customerNumber: custNumber,
        contactName: c.contactName,
        companyName: c.companyName,
        email: c.email,
        phone: c.phone,
        billingAddress: c.billingAddress,
        taxId: c.taxId,
        currency: c.currency,
      },
      include: { user: true },
    });
    createdCustomers.push(customer);
  }
  console.log(`✔ Created ${createdCustomers.length} customers.`);

  // 5. Taxes (GST, CGST, SGST, IGST)
  const taxesData = [
    { name: 'GST Standard (18%)', code: 'GST_18', percentage: 18.0, taxType: 'GST' },
    { name: 'CGST (9%)', code: 'CGST_9', percentage: 9.0, taxType: 'CGST' },
    { name: 'SGST (9%)', code: 'SGST_9', percentage: 9.0, taxType: 'SGST' },
    { name: 'IGST Inter-State (18%)', code: 'IGST_18', percentage: 18.0, taxType: 'IGST' },
    { name: 'GST Reduced (12%)', code: 'GST_12', percentage: 12.0, taxType: 'GST' },
  ];
  for (const t of taxesData) {
    await prisma.tax.create({ data: t });
  }
  console.log(`✔ Configured tax rules.`);

  // 6. Discounts
  const discountsData = [
    { name: 'Startup Growth Incentive', code: 'STARTUP10', discountType: 'PERCENTAGE', discountValue: 10, minPurchaseAmount: 2000, minQuantity: 1, maxUsageCount: 100 },
    { name: 'Enterprise Flat Waiver', code: 'ENTERPRISE5000', discountType: 'FIXED', discountValue: 5000, minPurchaseAmount: 25000, minQuantity: 1, maxUsageCount: 50 },
    { name: 'Annual Saver 15%', code: 'SAVER15', discountType: 'PERCENTAGE', discountValue: 15, minPurchaseAmount: 10000, minQuantity: 1, maxUsageCount: 200 },
    { name: 'Flash Deal 20%', code: 'FLASH20', discountType: 'PERCENTAGE', discountValue: 20, minPurchaseAmount: 5000, minQuantity: 2, maxUsageCount: 30 },
  ];
  for (const d of discountsData) {
    await prisma.discount.create({ data: d });
  }
  console.log(`✔ Configured discount rules.`);

  // 7. Create 10 PRODUCTS with VARIANTS
  const productsInput = [
    {
      name: 'Brightloop CRM Enterprise Cloud',
      code: 'PRD-CRM',
      type: 'SERVICE',
      salesPrice: 2499,
      costPrice: 900,
      description: 'Unified customer lifecycle, sales automation, AI pipeline tracker and deal analytics.',
      variants: [
        { name: 'Odoo Edition', variantType: 'Brand', variantValue: 'Odoo', additionalPrice: 560, sku: 'CRM-ODOO-01' },
        { name: 'Salesforce Edition', variantType: 'Brand', variantValue: 'Salesforce', additionalPrice: 1200, sku: 'CRM-SF-01' },
        { name: 'Standalone Edition', variantType: 'Edition', variantValue: 'Standalone', additionalPrice: 0, sku: 'CRM-STD-01' },
      ],
    },
    {
      name: 'Brightloop Automated Billing Engine',
      code: 'PRD-BILLING',
      type: 'SERVICE',
      salesPrice: 3999,
      costPrice: 1200,
      description: 'Scheduled multi-currency recurring invoice generator with transaction deduplication.',
      variants: [
        { name: 'Standard Edition', variantType: 'Edition', variantValue: 'Standard', additionalPrice: 0, sku: 'BIL-STD' },
        { name: 'Fintech Pro Suite', variantType: 'Edition', variantValue: 'Fintech Pro', additionalPrice: 1500, sku: 'BIL-PRO' },
      ],
    },
    {
      name: 'Omnichannel Support Desk',
      code: 'PRD-DESK',
      type: 'SERVICE',
      salesPrice: 1799,
      costPrice: 600,
      description: 'SLA ticketing, WhatsApp chat gateway, customer portal and agent KPI scoreboard.',
      variants: [
        { name: 'Zendesk Bridge', variantType: 'Brand', variantValue: 'Zendesk', additionalPrice: 750, sku: 'DSK-ZEN' },
        { name: 'Native Cloud', variantType: 'Brand', variantValue: 'Native', additionalPrice: 0, sku: 'DSK-NAT' },
      ],
    },
    {
      name: 'Brightloop ERP Inventory & Supply',
      code: 'PRD-ERP',
      type: 'SERVICE',
      salesPrice: 4999,
      costPrice: 1800,
      description: 'Warehouse tracking, batch numbering, reorder intelligence and GST dispatch invoices.',
      variants: [
        { name: 'SAP Connector', variantType: 'Brand', variantValue: 'SAP', additionalPrice: 2200, sku: 'ERP-SAP' },
        { name: 'Standard Edition', variantType: 'Brand', variantValue: 'Standard', additionalPrice: 0, sku: 'ERP-STD' },
      ],
    },
    {
      name: 'API Gateway & Webhook Relay',
      code: 'PRD-GATEWAY',
      type: 'DIGITAL',
      salesPrice: 1299,
      costPrice: 300,
      description: 'High throughput event dispatcher with payload encryption and HMAC authentication.',
      variants: [
        { name: 'High Throughput Tier', variantType: 'Capacity', variantValue: '1M Hits', additionalPrice: 800, sku: 'API-1M' },
      ],
    },
    {
      name: 'Dedicated Cloud Database Instance',
      code: 'PRD-DB-INSTANCE',
      type: 'DIGITAL',
      salesPrice: 3499,
      costPrice: 1500,
      description: 'Managed PostgreSQL cluster with automated WAL archiving, failover and monitoring.',
      variants: [
        { name: '8 vCPU / 32GB RAM', variantType: 'Capacity', variantValue: '32GB', additionalPrice: 2500, sku: 'DB-32GB' },
        { name: '4 vCPU / 16GB RAM', variantType: 'Capacity', variantValue: '16GB', additionalPrice: 1200, sku: 'DB-16GB' },
      ],
    },
    {
      name: 'Automated Tax & GST Filing Assistant',
      code: 'PRD-TAX-BOT',
      type: 'SERVICE',
      salesPrice: 1499,
      costPrice: 400,
      description: 'GSTR-1, GSTR-3B reconciliation, HSN auto-classification and portal e-Way bill sync.',
      variants: [
        { name: 'Multi-State License', variantType: 'Edition', variantValue: 'Multi-State', additionalPrice: 950, sku: 'TAX-MULTI' },
      ],
    },
    {
      name: 'Hardware Biometric Time & Attendance',
      code: 'PRD-BIO-DEVICE',
      type: 'PHYSICAL',
      salesPrice: 8999,
      costPrice: 4500,
      description: 'Wi-Fi enabled facial recognition terminal with tamper proof battery backup.',
      variants: [
        { name: 'Fingerprint + Face', variantType: 'Model', variantValue: 'Dual Sensor', additionalPrice: 1500, sku: 'BIO-DUAL' },
      ],
    },
    {
      name: 'Enterprise Security & Audit Vault',
      code: 'PRD-SEC-VAULT',
      type: 'DIGITAL',
      salesPrice: 2999,
      costPrice: 800,
      description: 'SOC2 compliant immutable audit logs, field-level encryption and SSO enforcement.',
      variants: [
        { name: 'Okta / Azure AD Sync', variantType: 'Feature', variantValue: 'SSO Bundle', additionalPrice: 600, sku: 'SEC-SSO' },
      ],
    },
    {
      name: 'Executive AI Revenue Insights',
      code: 'PRD-AI-REV',
      type: 'SERVICE',
      salesPrice: 1999,
      costPrice: 500,
      description: 'Predictive churn modeling, MRR trajectory forecasting and automated cohort analysis.',
      variants: [
        { name: 'GPT-4 Powered Tier', variantType: 'AI Model', variantValue: 'GPT-4', additionalPrice: 999, sku: 'AI-GPT4' },
      ],
    },
  ];

  const createdProducts = [];
  for (const p of productsInput) {
    const prod = await prisma.product.create({
      data: {
        name: p.name,
        code: p.code,
        type: p.type,
        salesPrice: p.salesPrice,
        costPrice: p.costPrice,
        description: p.description,
        status: 'ACTIVE',
        variants: {
          create: p.variants.map((v) => ({
            name: v.name,
            variantType: v.variantType,
            variantValue: v.variantValue,
            additionalPrice: v.additionalPrice,
            sku: v.sku,
            status: 'ACTIVE',
          })),
        },
      },
      include: { variants: true },
    });
    createdProducts.push(prod);
  }
  console.log(`✔ Created ${createdProducts.length} products with variants.`);

  // 8. Create 15 SUBSCRIPTION PLANS linked to products
  const plansInput = [
    { productId: createdProducts[0].id, name: 'CRM Starter Monthly', code: 'PLAN-CRM-M', basePrice: 2499, billingFrequency: 'MONTHLY', pauseAllowed: true, earlyCancellation: true },
    { productId: createdProducts[0].id, name: 'CRM Enterprise Annual', code: 'PLAN-CRM-A', basePrice: 24990, billingFrequency: 'YEARLY', pauseAllowed: true, earlyCancellation: false },
    { productId: createdProducts[1].id, name: 'Billing Engine Monthly', code: 'PLAN-BIL-M', basePrice: 3999, billingFrequency: 'MONTHLY', pauseAllowed: true, earlyCancellation: true },
    { productId: createdProducts[1].id, name: 'Billing Engine Annual Saver', code: 'PLAN-BIL-A', basePrice: 39990, billingFrequency: 'YEARLY', pauseAllowed: true, earlyCancellation: false },
    { productId: createdProducts[2].id, name: 'Support Desk Weekly Sprint', code: 'PLAN-DSK-W', basePrice: 499, billingFrequency: 'WEEKLY', pauseAllowed: false, earlyCancellation: true },
    { productId: createdProducts[2].id, name: 'Support Desk Monthly', code: 'PLAN-DSK-M', basePrice: 1799, billingFrequency: 'MONTHLY', pauseAllowed: true, earlyCancellation: true },
    { productId: createdProducts[3].id, name: 'ERP Cloud Growth Monthly', code: 'PLAN-ERP-M', basePrice: 4999, billingFrequency: 'MONTHLY', pauseAllowed: true, earlyCancellation: true },
    { productId: createdProducts[3].id, name: 'ERP Enterprise Annual Tier', code: 'PLAN-ERP-A', basePrice: 49990, billingFrequency: 'YEARLY', pauseAllowed: true, earlyCancellation: false },
    { productId: createdProducts[4].id, name: 'API Gateway Daily Metered', code: 'PLAN-API-D', basePrice: 79, billingFrequency: 'DAILY', pauseAllowed: false, earlyCancellation: true },
    { productId: createdProducts[4].id, name: 'API Gateway Monthly Pro', code: 'PLAN-API-M', basePrice: 1299, billingFrequency: 'MONTHLY', pauseAllowed: true, earlyCancellation: true },
    { productId: createdProducts[5].id, name: 'Dedicated Postgres Monthly', code: 'PLAN-DB-M', basePrice: 3499, billingFrequency: 'MONTHLY', pauseAllowed: false, earlyCancellation: true },
    { productId: createdProducts[6].id, name: 'Tax Compliance Bot Monthly', code: 'PLAN-TAX-M', basePrice: 1499, billingFrequency: 'MONTHLY', pauseAllowed: true, earlyCancellation: true },
    { productId: createdProducts[7].id, name: 'Biometric Cloud Sync Monthly', code: 'PLAN-BIO-M', basePrice: 899, billingFrequency: 'MONTHLY', pauseAllowed: true, earlyCancellation: true },
    { productId: createdProducts[8].id, name: 'Security Audit Vault Annual', code: 'PLAN-SEC-A', basePrice: 29990, billingFrequency: 'YEARLY', pauseAllowed: false, earlyCancellation: false },
    { productId: createdProducts[9].id, name: 'AI Revenue Forecast Monthly', code: 'PLAN-AI-M', basePrice: 1999, billingFrequency: 'MONTHLY', pauseAllowed: true, earlyCancellation: true },
  ];

  const createdPlans = [];
  for (const pl of plansInput) {
    const plan = await prisma.plan.create({
      data: {
        productId: pl.productId,
        name: pl.name,
        code: pl.code,
        basePrice: pl.basePrice,
        billingFrequency: pl.billingFrequency,
        minQuantity: 1,
        autoClose: false,
        earlyCancellation: pl.earlyCancellation,
        pauseAllowed: pl.pauseAllowed,
        renewalAllowed: true,
        status: 'ACTIVE',
      },
      include: { product: { include: { variants: true } } },
    });
    createdPlans.push(plan);
  }
  console.log(`✔ Created ${createdPlans.length} subscription plans.`);

  // 9. Create Quotation Template
  await prisma.quotationTemplate.create({
    data: {
      name: 'Standard SaaS Onboarding Bundle',
      description: 'Includes CRM Enterprise Cloud + Billing Engine + 18% GST',
      validityDays: 30,
      defaultNotes: 'Special hackathon introductory pricing valid for 30 days.',
      defaultTerms: 'Payment due on receipt of first invoice.',
      linesJson: JSON.stringify([
        { productId: createdProducts[0].id, quantity: 1, unitPrice: 2499, taxRate: 18, discountRate: 10 },
        { productId: createdProducts[1].id, quantity: 1, unitPrice: 3999, taxRate: 18, discountRate: 10 },
      ]),
    },
  });

  // 10. Create 30 SUBSCRIPTIONS in different states:
  // Active (18), Paused (4), Expiring (3), Cancelled (3), Closed (2)
  const now = new Date();
  const subStatuses = [
    'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE',
    'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE',
    'PAUSED', 'PAUSED', 'PAUSED', 'PAUSED',
    'ACTIVE', 'ACTIVE', 'ACTIVE', // Expiring soon
    'CANCELLED', 'CANCELLED', 'CANCELLED',
    'CLOSED', 'CLOSED',
  ];

  const createdSubscriptions = [];
  for (let i = 0; i < 30; i++) {
    const customer = createdCustomers[i % createdCustomers.length];
    const plan = createdPlans[i % createdPlans.length];
    const status = subStatuses[i];

    // Dates
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 5));

    let expiryDate = new Date(startDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // If marked as expiring soon (indices 22, 23, 24)
    if (i >= 22 && i <= 24) {
      expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + 12 + (i - 22) * 5); // expires in 12-22 days!
    }

    const nextBillingDate = new Date(now);
    nextBillingDate.setDate(nextBillingDate.getDate() + (i % 2 === 0 ? 3 : 15));

    const unitPrice = plan.basePrice;
    const taxRate = 18;
    const discountRate = (i % 4 === 0) ? 10 : 0;
    const baseSubtotal = unitPrice;
    const discAmount = baseSubtotal * (discountRate / 100);
    const taxable = baseSubtotal - discAmount;
    const taxAmount = Math.round(taxable * (taxRate / 100) * 100) / 100;
    const totalAmount = Math.round((taxable + taxAmount) * 100) / 100;

    const subNumber = `SUB-2026-${3000 + i + 1}`;

    const sub = await prisma.subscription.create({
      data: {
        subscriptionNumber: subNumber,
        customerId: customer.id,
        planId: plan.id,
        status,
        billingFrequency: plan.billingFrequency,
        paymentTerms: i % 3 === 0 ? 'NET_30' : 'IMMEDIATE',
        startDate,
        expiryDate,
        nextBillingDate: status === 'ACTIVE' ? nextBillingDate : null,
        pausedAt: status === 'PAUSED' ? new Date() : null,
        autoRenew: true,
        autoClose: false,
        subtotal: baseSubtotal,
        discountAmount: discAmount,
        taxAmount,
        totalAmount,
        notes: `Enterprise tier subscription for ${customer.companyName || customer.contactName}`,
        lines: {
          create: [
            {
              productId: plan.productId,
              variantId: plan.product?.variants?.[0]?.id || null,
              description: `${plan.name} Primary Service`,
              quantity: 1,
              unitPrice,
              taxRate,
              discountRate,
              lineTotal: totalAmount,
            },
          ],
        },
      },
      include: { lines: true, customer: true, plan: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        subscriptionId: sub.id,
        action: `SUBSCRIPTION_${status}`,
        details: `Subscription ${subNumber} initialized with status ${status}`,
      },
    });

    createdSubscriptions.push(sub);
  }
  console.log(`✔ Created ${createdSubscriptions.length} subscriptions in various states.`);

  // 11. Create 20 INVOICES
  const invoiceStatuses = [
    'PAID', 'PAID', 'PAID', 'PAID', 'PAID', 'PAID', 'PAID', 'PAID', 'PAID', 'PAID',
    'PARTIALLY_PAID', 'PARTIALLY_PAID', 'PARTIALLY_PAID',
    'CONFIRMED', 'CONFIRMED', 'CONFIRMED',
    'OVERDUE', 'OVERDUE', 'OVERDUE', 'CANCELLED',
  ];

  const createdInvoices = [];
  for (let i = 0; i < 20; i++) {
    const sub = createdSubscriptions[i % createdSubscriptions.length];
    const status = invoiceStatuses[i];

    const issueDate = new Date(now);
    issueDate.setDate(issueDate.getDate() - (i * 4 + 2));

    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 15);

    // If status is OVERDUE, make dueDate in the past
    if (status === 'OVERDUE') {
      dueDate.setDate(issueDate.getDate() + 5);
      dueDate.setMonth(now.getMonth() - 1);
    }

    const totalAmount = sub.totalAmount;
    let amountPaid = 0;
    if (status === 'PAID') {
      amountPaid = totalAmount;
    } else if (status === 'PARTIALLY_PAID') {
      amountPaid = Math.round(totalAmount * 0.5 * 100) / 100;
    }

    const balanceDue = Math.round(Math.max(0, totalAmount - amountPaid) * 100) / 100;
    const invNumber = `INV-2026-${4000 + i + 1}`;

    const inv = await prisma.invoice.create({
      data: {
        invoiceNumber: invNumber,
        customerId: sub.customerId,
        subscriptionId: sub.id,
        status,
        issueDate,
        dueDate,
        billingPeriodStart: issueDate,
        billingPeriodEnd: dueDate,
        subtotal: sub.subtotal,
        discountAmount: sub.discountAmount,
        taxAmount: sub.taxAmount,
        totalAmount,
        amountPaid,
        balanceDue,
        currency: 'INR',
        notes: `Invoice for subscription ${sub.subscriptionNumber}`,
        terms: `Payment term: ${sub.paymentTerms}. Thank you for your business.`,
        lines: {
          create: [
            {
              productId: sub.lines[0].productId,
              variantId: sub.lines[0].variantId,
              description: sub.lines[0].description,
              quantity: sub.lines[0].quantity,
              unitPrice: sub.lines[0].unitPrice,
              taxRate: sub.lines[0].taxRate,
              discountRate: sub.lines[0].discountRate,
              lineTotal: sub.lines[0].lineTotal,
            },
          ],
        },
      },
      include: { lines: true, customer: true, subscription: true },
    });

    createdInvoices.push(inv);
  }
  console.log(`✔ Created ${createdInvoices.length} invoices.`);

  // 12. Create 15 PAYMENTS linked to Invoices
  const paymentMethods = ['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'BANK_TRANSFER'];
  for (let i = 0; i < 15; i++) {
    const inv = createdInvoices[i];
    const payAmount = inv.status === 'PAID' ? inv.totalAmount : inv.status === 'PARTIALLY_PAID' ? inv.amountPaid : Math.round(inv.totalAmount * 0.3 * 100) / 100;

    if (payAmount > 0) {
      const payNumber = `PAY-2026-${5000 + i + 1}`;
      const method = paymentMethods[i % paymentMethods.length];
      const pDate = new Date(inv.issueDate);
      pDate.setDate(pDate.getDate() + 2);

      await prisma.payment.create({
        data: {
          paymentNumber: payNumber,
          invoiceId: inv.id,
          customerId: inv.customerId,
          recordedById: adminUser.id,
          amount: payAmount,
          paymentDate: pDate,
          paymentMethod: method,
          transactionRef: `TXN-RZP-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: `Settled via ${method} for invoice ${inv.invoiceNumber}`,
          status: 'SUCCESS',
        },
      });
    }
  }
  console.log(`✔ Created 15 payment records.`);

  // 13. Create in-app notifications
  await prisma.notification.create({
    data: {
      userId: adminUser.id,
      title: 'Automated Billing Cycle Executed',
      message: '30 subscriptions evaluated. All eligible invoices generated successfully.',
      type: 'SUCCESS',
    },
  });

  await prisma.notification.create({
    data: {
      userId: adminUser.id,
      title: '3 Subscriptions Expiring in Next 30 Days',
      message: 'BlueSky Logistics, Iyer Fintech and Nair Logistics have subscriptions expiring soon.',
      type: 'WARNING',
    },
  });

  console.log('✅ Demo seed data generation completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
