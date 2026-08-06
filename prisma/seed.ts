import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.expense.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.fieldNote.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.property.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.serviceType.deleteMany();
  await prisma.user.deleteMany();
  await prisma.crew.deleteMany();

  const password = await bcrypt.hash("admin123", 10);
  const techPassword = await bcrypt.hash("tech123", 10);

  // Create office team (4 office folks + 1 ops manager)
  const admin = await prisma.user.create({
    data: { email: "admin@premierpro.com", name: "Boruch Loriner", password, role: "ADMIN", phone: "555-0100" },
  });
  const opsMgr = await prisma.user.create({
    data: { email: "ops@premierpro.com", name: "David Morgan", password, role: "OFFICE_STAFF", phone: "555-0101" },
  });
  const billing1 = await prisma.user.create({
    data: { email: "billing@premierpro.com", name: "Rachel Stein", password, role: "OFFICE_STAFF", phone: "555-0102" },
  });
  const office1 = await prisma.user.create({
    data: { email: "scheduling@premierpro.com", name: "Karen Wells", password, role: "OFFICE_STAFF", phone: "555-0103" },
  });
  const office2 = await prisma.user.create({
    data: { email: "support@premierpro.com", name: "Tom Bradley", password, role: "OFFICE_STAFF", phone: "555-0104" },
  });

  // Create 13 technicians as individual crews
  const techNames = [
    { name: "James Mitchell", vehicle: "Van 1 — Ford Transit" },
    { name: "Kevin Lawrence", vehicle: "Van 2 — Ford Transit" },
    { name: "Tony Richards", vehicle: "Van 3 — Ram ProMaster" },
    { name: "Brian Nelson", vehicle: "Van 4 — Ram ProMaster" },
    { name: "Chris Daniels", vehicle: "Van 5 — Ford Transit" },
    { name: "Marcus Johnson", vehicle: "Van 6 — Mercedes Sprinter" },
    { name: "Derek Williams", vehicle: "Van 7 — Ford Transit" },
    { name: "Paul Anderson", vehicle: "Van 8 — Ram ProMaster" },
    { name: "Steve Martinez", vehicle: "Van 9 — Ford Transit" },
    { name: "Anthony Davis", vehicle: "Van 10 — Nissan NV2500" },
    { name: "Robert Taylor", vehicle: "Van 11 — Ford Transit" },
    { name: "Daniel Brown", vehicle: "Van 12 — Mercedes Sprinter" },
    { name: "Michael Wilson", vehicle: "Van 13 — Ram ProMaster" },
  ];

  const crews: { id: string }[] = [];
  for (let i = 0; i < techNames.length; i++) {
    const tech = techNames[i];
    const user = await prisma.user.create({
      data: {
        email: `${tech.name.toLowerCase().replace(" ", ".")}@premierpro.com`,
        name: tech.name,
        password: techPassword,
        role: "CREW_LEAD",
        phone: `555-${String(200 + i).padStart(4, "0")}`,
      },
    });
    const crew = await prisma.crew.create({
      data: {
        name: tech.name,
        leadId: user.id,
        vehicleInfo: tech.vehicle,
      },
    });
    await prisma.user.update({ where: { id: user.id }, data: { crewId: crew.id } });
    crews.push(crew);
  }

  // Service types (carpet & commercial real estate focus)
  const services = await Promise.all([
    prisma.serviceType.create({
      data: {
        name: "Carpet Cleaning",
        description: "Deep steam cleaning and stain removal for commercial carpets",
        basePrice: 450,
        checklistTemplate: JSON.stringify([
          "Pre-inspect carpet condition",
          "Pre-treat stains and high-traffic areas",
          "Hot water extraction cleaning",
          "Deodorize and sanitize",
          "Post-cleaning inspection",
          "Place 'wet floor' signs if needed",
        ]),
      },
    }),
    prisma.serviceType.create({
      data: {
        name: "Carpet Installation",
        description: "Full commercial carpet removal and installation",
        basePrice: 2800,
        checklistTemplate: JSON.stringify([
          "Measure and verify square footage",
          "Remove and dispose old carpet",
          "Prepare subfloor",
          "Install new carpet and padding",
          "Stretch and trim edges",
          "Final inspection and cleanup",
        ]),
      },
    }),
    prisma.serviceType.create({
      data: {
        name: "Carpet Repair",
        description: "Patch, seam repair, and stretching for damaged commercial carpet",
        basePrice: 350,
        checklistTemplate: JSON.stringify([
          "Assess damage area",
          "Match carpet type and color",
          "Cut and patch damaged section",
          "Seam sealing",
          "Stretch if needed",
          "Final inspection",
        ]),
      },
    }),
    prisma.serviceType.create({
      data: {
        name: "Janitorial Service",
        description: "Regular commercial janitorial and floor maintenance",
        basePrice: 600,
      },
    }),
    prisma.serviceType.create({
      data: {
        name: "Tile & Grout Cleaning",
        description: "Professional tile and grout deep cleaning for commercial floors",
        basePrice: 375,
      },
    }),
    prisma.serviceType.create({
      data: {
        name: "Upholstery Cleaning",
        description: "Commercial furniture and upholstery steam cleaning",
        basePrice: 250,
      },
    }),
    prisma.serviceType.create({
      data: {
        name: "Water Damage Restoration",
        description: "Emergency water extraction and carpet restoration",
        basePrice: 1200,
      },
    }),
  ]);

  // Customers (commercial real estate companies)
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        companyName: "Great Lakes Realty Group",
        contactName: "Tom Wilson",
        email: "tom@greatlakes.com",
        phone: "555-3000",
        portalToken: "portal-greatlakes-2026",
        billingAddress: "100 Commerce Blvd\nSuite 200\nAnn Arbor, MI 48104",
      },
    }),
    prisma.customer.create({
      data: {
        companyName: "Michigan Commercial Properties",
        contactName: "Jane Cooper",
        email: "jane@michcommercial.com",
        phone: "555-3001",
        portalToken: "portal-michcom-2026",
        billingAddress: "250 Woodward Ave\nDetroit, MI 48201",
      },
    }),
    prisma.customer.create({
      data: {
        companyName: "Lakefront Office Parks",
        contactName: "Bob Smith",
        email: "bob@lakefrontparks.com",
        phone: "555-3002",
        portalToken: "portal-lakefront-2026",
        billingAddress: "15 Front Street\nTraverse City, MI 49684",
      },
    }),
    prisma.customer.create({
      data: {
        companyName: "Metro Detroit Office Spaces",
        contactName: "Alice Johnson",
        email: "alice@metrodetroit.com",
        phone: "555-3003",
        portalToken: "portal-metrodetroit-2026",
        billingAddress: "500 Griswold St\nSuite 100\nDetroit, MI 48226",
      },
    }),
    prisma.customer.create({
      data: {
        companyName: "Ann Arbor Corporate Center",
        contactName: "Mark Stevens",
        email: "mark@annarborcorp.com",
        phone: "555-3004",
        portalToken: "portal-a2corp-2026",
        billingAddress: "777 E Eisenhower Pkwy\nAnn Arbor, MI 48108",
      },
    }),
  ]);

  // Properties
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        customerId: customers[0].id,
        name: "Commerce Blvd Office",
        address: "100 Commerce Blvd",
        city: "Ann Arbor",
        state: "MI",
        zipCode: "48104",
        accessNotes: "Loading dock access on south side",
      },
    }),
    prisma.property.create({
      data: {
        customerId: customers[0].id,
        name: "State Street Plaza",
        address: "3500 State Street",
        city: "Ann Arbor",
        state: "MI",
        zipCode: "48108",
        accessNotes: "Service elevator code: 4422",
      },
    }),
    prisma.property.create({
      data: {
        customerId: customers[1].id,
        name: "Woodward Office Tower",
        address: "250 Woodward Ave",
        city: "Detroit",
        state: "MI",
        zipCode: "48201",
        accessNotes: "Check in at security desk, 3rd floor",
      },
    }),
    prisma.property.create({
      data: {
        customerId: customers[2].id,
        name: "Front Street Business Park",
        address: "15 Front Street",
        city: "Traverse City",
        state: "MI",
        zipCode: "49684",
      },
    }),
    prisma.property.create({
      data: {
        customerId: customers[3].id,
        name: "Griswold Executive Suites",
        address: "500 Griswold St",
        city: "Detroit",
        state: "MI",
        zipCode: "48226",
      },
    }),
    prisma.property.create({
      data: {
        customerId: customers[4].id,
        name: "Eisenhower Corporate Center",
        address: "777 E Eisenhower Pkwy",
        city: "Ann Arbor",
        state: "MI",
        zipCode: "48108",
        accessNotes: "Gate code: #7734",
      },
    }),
  ]);

  // Sample work orders
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const wo1 = await prisma.workOrder.create({
    data: {
      orderNumber: "PPS-2026-0001",
      status: "COMPLETED",
      priority: "NORMAL",
      customerId: customers[0].id,
      propertyId: properties[0].id,
      serviceTypeId: services[0].id,
      crewId: crews[0].id,
      createdById: opsMgr.id,
      price: 450,
      scheduledDate: new Date("2026-08-04"),
      dueDate: new Date("2026-08-05"),
      completedAt: new Date("2026-08-04"),
    },
  });

  const wo2 = await prisma.workOrder.create({
    data: {
      orderNumber: "PPS-2026-0002",
      status: "COMPLETED",
      priority: "HIGH",
      customerId: customers[1].id,
      propertyId: properties[2].id,
      serviceTypeId: services[1].id,
      crewId: crews[2].id,
      createdById: opsMgr.id,
      price: 2800,
      scheduledDate: new Date("2026-08-01"),
      dueDate: new Date("2026-08-04"),
      completedAt: new Date("2026-08-03"),
    },
  });

  const wo3 = await prisma.workOrder.create({
    data: {
      orderNumber: "PPS-2026-0003",
      status: "ON_SITE",
      priority: "URGENT",
      customerId: customers[2].id,
      propertyId: properties[3].id,
      serviceTypeId: services[6].id,
      crewId: crews[4].id,
      createdById: office1.id,
      price: 1200,
      scheduledDate: today,
      dueDate: new Date(today.getTime() + 86400000),
    },
  });

  const wo4 = await prisma.workOrder.create({
    data: {
      orderNumber: "PPS-2026-0004",
      status: "COMPLETED",
      priority: "NORMAL",
      customerId: customers[3].id,
      propertyId: properties[4].id,
      serviceTypeId: services[3].id,
      crewId: crews[6].id,
      createdById: office1.id,
      price: 600,
      scheduledDate: new Date("2026-08-02"),
      dueDate: new Date("2026-08-03"),
      completedAt: new Date("2026-08-02"),
    },
  });

  const wo5 = await prisma.workOrder.create({
    data: {
      orderNumber: "PPS-2026-0005",
      status: "PENDING",
      priority: "NORMAL",
      customerId: customers[4].id,
      propertyId: properties[5].id,
      serviceTypeId: services[0].id,
      createdById: opsMgr.id,
      price: 450,
      scheduledDate: new Date(today.getTime() + 2 * 86400000),
      dueDate: new Date(today.getTime() + 3 * 86400000),
    },
  });

  const wo6 = await prisma.workOrder.create({
    data: {
      orderNumber: "PPS-2026-0006",
      status: "DISPATCHED",
      priority: "HIGH",
      customerId: customers[0].id,
      propertyId: properties[1].id,
      serviceTypeId: services[2].id,
      crewId: crews[1].id,
      createdById: opsMgr.id,
      price: 350,
      scheduledDate: new Date(today.getTime() + 86400000),
      dueDate: new Date(today.getTime() + 2 * 86400000),
    },
  });

  // Invoices
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-PPS-2026-001",
      workOrderId: wo1.id,
      customerId: customers[0].id,
      status: "PAID",
      subtotal: 450,
      taxRate: 6.0,
      taxAmount: 27.00,
      total: 477.00,
      notes: "Carpet cleaning — Commerce Blvd Office. All carpets refreshed.",
      dueDate: new Date("2026-08-18"),
      sentAt: new Date("2026-08-05"),
      paidAt: new Date("2026-08-10"),
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: inv1.id, description: "Commercial carpet cleaning — 2,500 sq ft", quantity: 1, unitPrice: 350, total: 350 },
      { invoiceId: inv1.id, description: "Stain treatment (high traffic areas)", quantity: 1, unitPrice: 100, total: 100 },
    ],
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv1.id,
      amount: 477.00,
      method: "CHECK",
      reference: "CHK#4521",
      receivedAt: new Date("2026-08-10"),
    },
  });

  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-PPS-2026-002",
      workOrderId: wo2.id,
      customerId: customers[1].id,
      status: "SENT",
      subtotal: 2800,
      taxRate: 6.0,
      taxAmount: 168.00,
      total: 2968.00,
      dueDate: new Date(today.getTime() + 30 * 86400000),
      sentAt: new Date("2026-08-04"),
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: inv2.id, description: "Carpet installation — Woodward Office Tower, 3rd floor", quantity: 1, unitPrice: 2600, total: 2600 },
      { invoiceId: inv2.id, description: "Old carpet disposal fee", quantity: 1, unitPrice: 200, total: 200 },
    ],
  });

  const inv3 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-PPS-2026-003",
      workOrderId: wo4.id,
      customerId: customers[3].id,
      status: "OVERDUE",
      subtotal: 600,
      taxRate: 6.0,
      taxAmount: 36.00,
      total: 636.00,
      dueDate: new Date("2026-08-04"),
      sentAt: new Date("2026-08-02"),
    },
  });

  await prisma.invoiceItem.create({
    data: {
      invoiceId: inv3.id,
      description: "Monthly janitorial service — Griswold Executive Suites",
      quantity: 1,
      unitPrice: 600,
      total: 600,
    },
  });

  // Expenses
  await prisma.expense.createMany({
    data: [
      { description: "Carpet cleaning solution (bulk)", category: "MATERIALS", amount: 425.00, vendor: "SupplyPro", createdById: opsMgr.id, date: new Date("2026-08-02") },
      { description: "Carpet padding rolls (6x)", category: "MATERIALS", amount: 780.00, vendor: "Carpet Wholesale Inc", createdById: opsMgr.id, date: new Date("2026-08-01") },
      { description: "Fuel — Van 1 (Ford Transit)", category: "FUEL", amount: 87.30, vendor: "Shell", createdById: opsMgr.id, date: new Date("2026-08-05") },
      { description: "Fuel — Van 4 (Ram ProMaster)", category: "FUEL", amount: 92.15, vendor: "BP", createdById: opsMgr.id, date: new Date("2026-08-04") },
      { description: "Fuel — Van 7 (Ford Transit)", category: "FUEL", amount: 78.50, vendor: "Shell", createdById: opsMgr.id, date: new Date("2026-08-03") },
      { description: "New steam cleaner unit", category: "EQUIPMENT", amount: 1899.99, vendor: "Home Depot Pro", createdById: admin.id, date: new Date("2026-07-28") },
      { description: "QuickBooks subscription (monthly)", category: "SOFTWARE", amount: 35.00, vendor: "Intuit", createdById: billing1.id, date: new Date("2026-08-01") },
      { description: "Mileage — Traverse City site visit", category: "TRAVEL", amount: 142.00, vendor: null, createdById: opsMgr.id, date: new Date("2026-08-02"), workOrderId: wo3.id },
    ],
  });

  console.log("✅ Premier Pro Services — Seed Complete!");
  console.log(`   👤 ${await prisma.user.count()} users (5 office + 13 technicians)`);
  console.log(`   🚐 ${await prisma.crew.count()} crews/vans`);
  console.log(`   🏢 ${await prisma.customer.count()} commercial clients`);
  console.log(`   🏠 ${await prisma.property.count()} properties`);
  console.log(`   🧹 ${await prisma.serviceType.count()} service types`);
  console.log(`   📋 ${await prisma.workOrder.count()} work orders`);
  console.log(`   💰 ${await prisma.invoice.count()} invoices`);
  console.log(`   💸 ${await prisma.expense.count()} expenses`);
  console.log("\n   🔑 Demo login: admin@premierpro.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
