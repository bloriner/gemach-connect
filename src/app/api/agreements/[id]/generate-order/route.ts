import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, addMonths, addQuarters, addYears, startOfDay } from "date-fns";

function generateOrderNumber(): string {
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `WO-${seq}`;
}

function calcNextServiceDate(fromDate: Date, frequency: string): Date {
  switch (frequency) {
    case "WEEKLY":
      return addWeeks(fromDate, 1);
    case "BIWEEKLY":
      return addWeeks(fromDate, 2);
    case "MONTHLY":
      return addMonths(fromDate, 1);
    case "QUARTERLY":
      return addQuarters(fromDate, 1);
    case "ANNUALLY":
      return addYears(fromDate, 1);
    default:
      return addMonths(fromDate, 1);
  }
}

export async function POST(
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
      customer: true,
      property: true,
      serviceType: true,
    },
  });

  if (!agreement) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  if (agreement.status !== "ACTIVE") {
    return NextResponse.json(
      { error: `Cannot generate order for ${agreement.status} agreement` },
      { status: 400 }
    );
  }

  if (!agreement.propertyId) {
    return NextResponse.json(
      { error: "Agreement must have a property assigned" },
      { status: 400 }
    );
  }

  const today = startOfDay(new Date());
  const scheduledDate = agreement.nextServiceDate && agreement.nextServiceDate > today
    ? agreement.nextServiceDate
    : today;

  // Build crew assignment note
  const notes = [
    `Recurring ${agreement.frequency.toLowerCase()} service`,
    agreement.notes,
  ].filter(Boolean).join(" | ");

  const result = await prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: agreement.customerId,
        propertyId: agreement.propertyId!,
        serviceTypeId: agreement.serviceTypeId,
        status: "PENDING",
        price: agreement.price,
        scheduledDate,
        notes,
        serviceAgreementId: agreement.id,
      },
      include: {
        customer: { select: { companyName: true } },
        property: { select: { address: true } },
        serviceType: { select: { name: true } },
      },
    });

    // Advance next service date
    const nextDate = calcNextServiceDate(scheduledDate, agreement.frequency);
    await tx.serviceAgreement.update({
      where: { id: params.id },
      data: { nextServiceDate: nextDate },
    });

    return workOrder;
  });

  return NextResponse.json(result, { status: 201 });
}
