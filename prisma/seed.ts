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

  const password = await bcrypt.hash("password123", 10);

  // Create users
  const admin = await prisma.user.create({
    data: { email: "admin@fieldservice.pro", name: "Admin User", password, role: "ADMIN", phone: "555-0100" },
  });
  const office1 = await prisma.user.create({
    data: { email: "sarah@fieldservice.pro", name: "Sarah Office", password, role: "OFFICE_STAFF", phone: "555-0101" },
  });
  const office2 = await prisma.user.create({
    data: { email: "mike@fieldservice.pro", name: "Mike Office", password, role: "OFFICE_STAFF", phone: "555-0102" },
  });
  const office3 = await prisma.user.create({
    data: { email: "lisa@fieldservice.pro", name: "Lisa Office", password, role: "OFFICE_STAFF", phone: "555-0103" },
  });

  // Create crews with leads and members
  const crews = [];
  const crewNames = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India"];
  
  for (let i = 0; i < 9; i++) {
    const lead = await prisma.user.create({
      data: {
        email: `lead${i + 1}@fieldservice.pro`,
        name: `Crew Lead ${crewNames[i]}`,
        password,
        role: "CREW_LEAD",
        phone: `555-${String(100 + i)}`,
      },
    });
    const member = await prisma.user.create({
      data: {
        email: `member${i + 1}@fieldservice.pro`,
        name: `Crew Member ${crewNames[i]}`,
        password,
        role: "CREW_MEMBER",
        phone: `555-${String(200 + i)}`,
      },
    });
    const crew = await prisma.crew.create({
      data: {
        name: `Crew ${crewNames[i]}`,
        leadId: lead.id,
        vehicleInfo: `Truck ${i + 1}`,
      },
    });
    // Assign users to crew
    await prisma.user.update({ where: { id: lead.id }, data: { crewId: crew.id } });
    await prisma.user.update({ where: { id: member.id }, data: { crewId: crew.id } });
    crews.push(crew);
  }

  // Service types
  const services = await Promise.all([
    prisma.serviceType.create({ data: { name: "Final Clean", description: "Post-construction final cleaning", basePrice: 350, checklistTemplate: JSON.stringify(["Dust all surfaces", "Vacuum carpets", "Mop floors", "Clean windows", "Clean bathrooms", "Remove debris"]) } }),
    prisma.serviceType.create({ data: { name: "Debris Removal", description: "Construction debris hauling", basePrice: 500 } }),
    prisma.serviceType.create({ data: { name: "Lawn Care", description: "Lawn mowing and maintenance", basePrice: 150 } }),
    prisma.serviceType.create({ data: { name: "Property Inspection", description: "Pre-listing inspection", basePrice: 200 } }),
    prisma.serviceType.create({ data: { name: "Maintenance Repair", description: "General property repairs", basePrice: 250 } }),
    prisma.serviceType.create({ data: { name: "Snow Removal", description: "Winter snow clearing", basePrice: 175 } }),
  ]);

  // Customers (with portal tokens for customer portal access)
  const customers = await Promise.all([
    prisma.customer.create({ data: { companyName: "Great Lakes Realty", contactName: "Tom Wilson", email: "tom@greatlakes.com", phone: "555-3000", portalToken: "portal-greatlakes-2026", billingAddress: "100 Commerce Blvd\nSuite 200\nAnn Arbor, MI 48104" } }),
    prisma.customer.create({ data: { companyName: "Michigan Home Sales", contactName: "Jane Cooper", email: "jane@mihomes.com", phone: "555-3001", portalToken: "portal-mihomes-2026", billingAddress: "250 Woodward Ave\nDetroit, MI 48201" } }),
    prisma.customer.create({ data: { companyName: "Lakefront Properties", contactName: "Bob Smith", email: "bob@lakefront.com", phone: "555-3002", portalToken: "portal-lakefront-2026", billingAddress: "15 Front Street\nTraverse City, MI 49684" } }),
    prisma.customer.create({ data: { companyName: "Metro Detroit Real Estate", contactName: "Alice Johnson", email: "alice@metrodetroit.com", phone: "555-3003", portalToken: "portal-metrodetroit-2026", billingAddress: "500 Griswold St\nSuite 100\nDetroit, MI 48226" } }),
  ]);

  // Properties
  const properties = await Promise.all([
    prisma.property.create({ data: { customerId: customers[0].id, name: "Oak Street House", address: "123 Oak Street", city: "Ann Arbor", state: "MI", zipCode: "48104", accessNotes: "Key under mat" } }),
    prisma.property.create({ data: { customerId: customers[0].id, name: "Maple Ave Condo", address: "456 Maple Ave", city: "Detroit", state: "MI", zipCode: "48201" } }),
    prisma.property.create({ data: { customerId: customers[1].id, name: "Lakeview Estate", address: "789 Lakeshore Dr", city: "Traverse City", state: "MI", zipCode: "49684" } }),
    prisma.property.create({ data: { customerId: customers[2].id, name: "Downtown Office", address: "321 Main St", city: "Grand Rapids", state: "MI", zipCode: "49503" } }),
    prisma.property.create({ data: { customerId: customers[3].id, name: "Pine Ridge Home", address: "555 Pine Ridge Rd", city: "Lansing", state: "MI", zipCode: "48906" } }),
  ]);

  // Sample work orders (with scheduled and due dates for calendar)
  const now = new Date();
  const wo1 = await prisma.workOrder.create({
    data: {
      orderNumber: "WO-2026-0001",
      status: "COMPLETED",
      priority: "NORMAL",
      customerId: customers[0].id,
      propertyId: properties[0].id,
      serviceTypeId: services[0].id,
      crewId: crews[0].id,
      createdById: admin.id,
      price: 350,
      scheduledDate: new Date("2026-07-13"),
      dueDate: new Date("2026-07-14"),
      completedAt: new Date("2026-07-13"),
    },
  });

  const wo2 = await prisma.workOrder.create({
    data: {
      orderNumber: "WO-2026-0002",
      status: "COMPLETED",
      priority: "HIGH",
      customerId: customers[1].id,
      propertyId: properties[2].id,
      serviceTypeId: services[2].id,
      crewId: crews[1].id,
      createdById: office1.id,
      price: 150,
      scheduledDate: new Date("2026-07-12"),
      dueDate: new Date("2026-07-13"),
      completedAt: new Date("2026-07-12"),
    },
  });

  const wo3 = await prisma.workOrder.create({
    data: {
      orderNumber: "WO-2026-0003",
      status: "ON_SITE",
      priority: "URGENT",
      customerId: customers[2].id,
      propertyId: properties[3].id,
      serviceTypeId: services[4].id,
      crewId: crews[2].id,
      createdById: office2.id,
      price: 250,
      scheduledDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    },
  });

  const wo4 = await prisma.workOrder.create({
    data: {
      orderNumber: "WO-2026-0004",
      status: "COMPLETED",
      priority: "NORMAL",
      customerId: customers[3].id,
      propertyId: properties[4].id,
      serviceTypeId: services[5].id,
      crewId: crews[5].id,
      createdById: office3.id,
      price: 175,
      scheduledDate: new Date("2026-07-10"),
      dueDate: new Date("2026-07-11"),
      completedAt: new Date("2026-07-10"),
    },
  });

  const wo5 = await prisma.workOrder.create({
    data: {
      orderNumber: "WO-2026-0005",
      status: "PENDING",
      priority: "LOW",
      customerId: customers[0].id,
      propertyId: properties[1].id,
      serviceTypeId: services[0].id,
      createdById: office1.id,
      price: 350,
      scheduledDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2),
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
    },
  });

  const wo6 = await prisma.workOrder.create({
    data: {
      orderNumber: "WO-2026-0006",
      status: "DISPATCHED",
      priority: "HIGH",
      customerId: customers[1].id,
      propertyId: properties[0].id,
      serviceTypeId: services[3].id,
      crewId: crews[3].id,
      createdById: office2.id,
      price: 200,
      scheduledDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2),
    },
  });

  // Invoices for completed orders
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-001",
      workOrderId: wo1.id,
      customerId: customers[0].id,
      status: "PAID",
      subtotal: 330,
      taxRate: 6.0,
      taxAmount: 19.80,
      total: 349.80,
      notes: "Final clean completed ahead of schedule.",
      dueDate: new Date("2026-07-28"),
      sentAt: new Date("2026-07-14"),
      paidAt: new Date("2026-07-20"),
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: inv1.id, description: "Final clean — Oak Street House", quantity: 1, unitPrice: 250, total: 250 },
      { invoiceId: inv1.id, description: "Window cleaning (exterior)", quantity: 1, unitPrice: 80, total: 80 },
    ],
  });

  await prisma.payment.create({
    data: { invoiceId: inv1.id, amount: 349.80, method: "CHECK", reference: "CHK#4521", receivedAt: new Date("2026-07-20") },
  });

  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-002",
      workOrderId: wo2.id,
      customerId: customers[1].id,
      status: "SENT",
      subtotal: 140,
      taxRate: 6.0,
      taxAmount: 8.40,
      total: 148.40,
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30),
      sentAt: new Date("2026-07-13"),
    },
  });

  await prisma.invoiceItem.create({
    data: { invoiceId: inv2.id, description: "Lawn care — Lakeview Estate", quantity: 1, unitPrice: 140, total: 140 },
  });

  const inv3 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-003",
      workOrderId: wo4.id,
      customerId: customers[3].id,
      status: "OVERDUE",
      subtotal: 165,
      taxRate: 6.0,
      taxAmount: 9.90,
      total: 174.90,
      dueDate: new Date("2026-07-11"),
      sentAt: new Date("2026-07-10"),
    },
  });

  await prisma.invoiceItem.create({
    data: { invoiceId: inv3.id, description: "Snow removal — Pine Ridge Home", quantity: 1, unitPrice: 165, total: 165 },
  });

  // Expenses across categories
  await prisma.expense.createMany({
    data: [
      { description: "Cleaning supplies restock", category: "MATERIALS", amount: 245.50, vendor: "SupplyPro", createdById: office1.id, date: new Date("2026-07-08") },
      { description: "Part-time labor — weekend cleanup", category: "LABOR", amount: 480.00, vendor: "TempWorkers Inc", createdById: office2.id, date: new Date("2026-07-05") },
      { description: "Fuel — Truck 1 refuel", category: "FUEL", amount: 87.30, vendor: "Shell", createdById: office1.id, date: new Date("2026-07-10") },
      { description: "Fuel — Truck 3 refuel", category: "FUEL", amount: 92.15, vendor: "BP", createdById: office1.id, date: new Date("2026-07-12") },
      { description: "New pressure washer", category: "EQUIPMENT", amount: 899.99, vendor: "Home Depot", createdById: admin.id, date: new Date("2026-07-01") },
      { description: "QuickBooks subscription (monthly)", category: "SOFTWARE", amount: 35.00, vendor: "Intuit", createdById: office3.id, date: new Date("2026-07-01") },
      { description: "Mileage — site visit to Traverse City", category: "TRAVEL", amount: 142.00, vendor: null, createdById: office2.id, date: new Date("2026-07-09"), workOrderId: wo2.id },
      { description: "Disposal fees — construction debris", category: "OTHER", amount: 175.00, vendor: "Waste Management", createdById: office1.id, date: new Date("2026-07-06") },
    ],
  });

  console.log("Seed complete! Created:");
  console.log(`  - ${await prisma.user.count()} users (4 office + 18 crew)`);
  console.log(`  - ${await prisma.crew.count()} crews`);
  console.log(`  - ${await prisma.customer.count()} customers (with portal tokens)`);
  console.log(`  - ${await prisma.property.count()} properties`);
  console.log(`  - ${await prisma.serviceType.count()} service types`);
  console.log(`  - ${await prisma.workOrder.count()} work orders`);
  console.log(`  - ${await prisma.invoice.count()} invoices`);
  console.log(`  - ${await prisma.expense.count()} expenses`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
