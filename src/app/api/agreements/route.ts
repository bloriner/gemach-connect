import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, addMonths, addQuarters, addYears } from "date-fns";

export const dynamic = "force-dynamic";

function calcNextServiceDate(startDate: Date, frequency: string, fromDate?: Date): Date {
  const base = fromDate ?? new Date();
  switch (frequency) {
    case "WEEKLY":
      return addWeeks(base, 1);
    case "BIWEEKLY":
      return addWeeks(base, 2);
    case "MONTHLY":
      return addMonths(base, 1);
    case "QUARTERLY":
      return addQuarters(base, 1);
    case "ANNUALLY":
      return addYears(base, 1);
    default:
      return addMonths(base, 1);
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statusFilter = request.nextUrl.searchParams.get("status");

  const agreements = await prisma.serviceAgreement.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { nextServiceDate: "asc" },
    include: {
      customer: { select: { id: true, companyName: true } },
      property: { select: { id: true, address: true, city: true, state: true } },
      serviceType: { select: { id: true, name: true } },
      generatedOrders: { select: { id: true, orderNumber: true, status: true, scheduledDate: true } },
    },
  });

  return NextResponse.json(agreements);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    customerId,
    propertyId,
    serviceTypeId,
    frequency,
    price,
    startDate,
    endDate,
    autoInvoice,
    notes,
  } = body;

  if (!customerId || !serviceTypeId || !frequency || !startDate || price == null) {
    return NextResponse.json(
      { error: "customerId, serviceTypeId, frequency, startDate, and price are required" },
      { status: 400 }
    );
  }

  const validFrequencies = ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY"];
  if (!validFrequencies.includes(frequency)) {
    return NextResponse.json(
      { error: `Invalid frequency. Must be: ${validFrequencies.join(", ")}` },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  const nextServiceDate = calcNextServiceDate(start, frequency, start);

  const agreement = await prisma.serviceAgreement.create({
    data: {
      customerId,
      propertyId: propertyId ?? null,
      serviceTypeId,
      frequency,
      price,
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      nextServiceDate,
      autoInvoice: autoInvoice ?? true,
      status: "ACTIVE",
      notes: notes ?? null,
    },
    include: {
      customer: { select: { id: true, companyName: true } },
      property: { select: { id: true, address: true, city: true, state: true } },
      serviceType: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(agreement, { status: 201 });
}
