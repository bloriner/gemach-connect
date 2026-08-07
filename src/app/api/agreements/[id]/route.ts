import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agreement = await prisma.serviceAgreement.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { id: true, companyName: true, email: true, phone: true } },
      property: { select: { id: true, address: true, city: true, state: true, zipCode: true } },
      serviceType: { select: { id: true, name: true, basePrice: true } },
      generatedOrders: {
        orderBy: { scheduledDate: "desc" },
        take: 20,
        select: { id: true, orderNumber: true, status: true, scheduledDate: true, completedAt: true },
      },
    },
  });

  if (!agreement) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  return NextResponse.json(agreement);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    propertyId,
    frequency,
    price,
    endDate,
    autoInvoice,
    status,
    notes,
  } = body;

  const existing = await prisma.serviceAgreement.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  if (frequency) {
    const valid = ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY"];
    if (!valid.includes(frequency)) {
      return NextResponse.json({ error: `Invalid frequency` }, { status: 400 });
    }
  }

  const updated = await prisma.serviceAgreement.update({
    where: { id: params.id },
    data: {
      propertyId: propertyId !== undefined ? propertyId : undefined,
      frequency: frequency ?? undefined,
      price: price ?? undefined,
      endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
      autoInvoice: autoInvoice !== undefined ? autoInvoice : undefined,
      status: status ?? undefined,
      notes: notes !== undefined ? notes : undefined,
    },
    include: {
      customer: { select: { id: true, companyName: true } },
      property: { select: { id: true, address: true, city: true, state: true } },
      serviceType: { select: { id: true, name: true } },
      generatedOrders: {
        orderBy: { scheduledDate: "desc" },
        take: 5,
        select: { id: true, orderNumber: true, status: true },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.serviceAgreement.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  await prisma.serviceAgreement.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
