import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, newOrderCustomerTemplate, newOrderInternalTemplate } from "@/lib/email";

function getPortalToken(request: NextRequest): string | null {
  return request.headers.get("x-portal-token");
}

async function authenticatePortal(token: string | null) {
  if (!token) return null;
  return prisma.customer.findUnique({ where: { portalToken: token } });
}

export async function GET(request: NextRequest) {
  const customer = await authenticatePortal(getPortalToken(request));
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.workOrder.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: {
      serviceType: true,
      property: true,
      crew: { include: { lead: true } },
    },
  });

  return NextResponse.json(orders);
}

function generateOrderNumber(): string {
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `WO-${seq}`;
}

export async function POST(request: NextRequest) {
  const customer = await authenticatePortal(getPortalToken(request));
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { serviceTypeId, propertyAddress, scheduledDate } = body;

  if (!propertyAddress) {
    return NextResponse.json(
      { error: "propertyAddress is required" },
      { status: 400 }
    );
  }

  // Find or create property
  let property = await prisma.property.findFirst({
    where: { customerId: customer.id, address: propertyAddress },
  });

  if (!property) {
    property = await prisma.property.create({
      data: {
        name: propertyAddress.split(",")[0]?.trim() ?? propertyAddress,
        address: propertyAddress,
        customerId: customer.id,
      },
    });
  }

  // Determine service type
  let svcId = serviceTypeId;
  if (!svcId) {
    const defaultSvc = await prisma.serviceType.findFirst();
    if (!defaultSvc) {
      return NextResponse.json(
        { error: "No service types available" },
        { status: 400 }
      );
    }
    svcId = defaultSvc.id;
  }

  const order = await prisma.workOrder.create({
    data: {
      orderNumber: generateOrderNumber(),
      customerId: customer.id,
      propertyId: property.id,
      serviceTypeId: svcId,
      status: "PENDING",
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
    },
    include: {
      customer: true,
      property: true,
      serviceType: true,
    },
  });

  // Send confirmation emails (fire-and-forget — don't block response)
  const scheduledStr = scheduledDate
    ? new Date(scheduledDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : undefined;

  // 1. Confirmation to customer
  if (customer.email) {
    sendEmail({
      to: customer.email,
      subject: `Order Confirmation — ${order.orderNumber}`,
      html: newOrderCustomerTemplate({
        customerName: customer.contactName || customer.companyName,
        orderNumber: order.orderNumber,
        propertyAddress: property.address,
        serviceName: order.serviceType.name,
        scheduledDate: scheduledStr,
      }),
    }).catch((err) => console.error("[EMAIL] Customer confirmation failed:", err));
  }

  // 2. Notification to all admin/office staff
  prisma.user.findMany({
    where: { role: { in: ["ADMIN", "OFFICE_STAFF"] }, active: true },
    select: { email: true, name: true },
  }).then((staff) => {
    staff.forEach((user) => {
      sendEmail({
        to: user.email,
        subject: `New Order — ${order.orderNumber} from ${customer.companyName}`,
        html: newOrderInternalTemplate({
          customerName: customer.companyName,
          orderNumber: order.orderNumber,
          propertyAddress: property.address,
          serviceName: order.serviceType.name,
          scheduledDate: scheduledStr,
        }),
      }).catch((err) => console.error("[EMAIL] Staff notification failed:", err));
    });
  }).catch((err) => console.error("[EMAIL] Staff lookup failed:", err));

  return NextResponse.json(order, { status: 201 });
}
