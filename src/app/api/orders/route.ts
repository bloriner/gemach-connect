import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statusFilter = request.nextUrl.searchParams.get("status");

  const orders = await prisma.workOrder.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      property: true,
      crew: true,
      serviceType: true,
    },
  });

  return NextResponse.json(orders);
}

function generateOrderNumber(): string {
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `WO-${seq}`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { customerId, serviceTypeId, propertyAddress, scheduledDate } = body;

  if (!customerId || !propertyAddress) {
    return NextResponse.json({ error: "customerId and propertyAddress are required" }, { status: 400 });
  }

  // Find or create property
  let property = await prisma.property.findFirst({
    where: { customerId, address: propertyAddress },
  });

  if (!property) {
    property = await prisma.property.create({
      data: {
        name: propertyAddress.split(",")[0]?.trim() ?? propertyAddress,
        address: propertyAddress,
        customerId,
      },
    });
  }

  // Determine service type
  let svcId = serviceTypeId;
  if (!svcId) {
    const defaultSvc = await prisma.serviceType.findFirst();
    if (!defaultSvc) {
      return NextResponse.json({ error: "No service types available" }, { status: 400 });
    }
    svcId = defaultSvc.id;
  }

  const order = await prisma.workOrder.create({
    data: {
      orderNumber: generateOrderNumber(),
      customerId,
      propertyId: property.id,
      serviceTypeId: svcId,
      status: "PENDING",
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      createdById: (session.user as any).id,
    },
    include: {
      customer: true,
      property: true,
      serviceType: true,
      crew: true,
    },
  });

  return NextResponse.json(order, { status: 201 });
}
