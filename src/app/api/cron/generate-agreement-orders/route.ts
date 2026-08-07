import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, addWeeks, addMonths, addQuarters, addYears } from "date-fns";

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

// Protected by a simple cron secret — set CRON_SECRET in your env
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  // Find all active agreements due today (or overdue)
  const dueAgreements = await prisma.serviceAgreement.findMany({
    where: {
      status: "ACTIVE",
      nextServiceDate: { lte: todayEnd },
      OR: [
        { endDate: null },
        { endDate: { gte: today } },
      ],
    },
    include: {
      customer: true,
      property: true,
      serviceType: true,
    },
  });

  const results: { agreementId: string; orderNumber?: string; error?: string }[] = [];

  for (const agreement of dueAgreements) {
    if (!agreement.propertyId) {
      results.push({ agreementId: agreement.id, error: "No property assigned" });
      continue;
    }

    try {
      const scheduledDate = agreement.nextServiceDate ?? today;

      await prisma.$transaction(async (tx) => {
        const order = await tx.workOrder.create({
          data: {
            orderNumber: generateOrderNumber(),
            customerId: agreement.customerId,
            propertyId: agreement.propertyId!,
            serviceTypeId: agreement.serviceTypeId,
            status: "PENDING",
            price: agreement.price,
            scheduledDate,
            notes: `Auto-generated from ${agreement.frequency.toLowerCase()} recurring agreement`,
            serviceAgreementId: agreement.id,
          },
        });

        const nextDate = calcNextServiceDate(
          agreement.nextServiceDate ?? today,
          agreement.frequency
        );

        await tx.serviceAgreement.update({
          where: { id: agreement.id },
          data: { nextServiceDate: nextDate },
        });

        results.push({ agreementId: agreement.id, orderNumber: order.orderNumber });
      });
    } catch (err: any) {
      results.push({ agreementId: agreement.id, error: err.message });
    }
  }

  return NextResponse.json({
    generated: results.filter((r) => r.orderNumber).length,
    failed: results.filter((r) => r.error).length,
    total: dueAgreements.length,
    results,
  });
}
