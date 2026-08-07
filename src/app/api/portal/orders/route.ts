import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json(order, { status: 201 });
}
