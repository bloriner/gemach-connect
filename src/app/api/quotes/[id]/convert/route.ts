import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateOrderNumber(): string {
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `WO-${seq}`;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      property: true,
      items: true,
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.status !== "APPROVED") {
    return NextResponse.json(
      { error: `Quote must be approved before converting. Current status: ${quote.status}` },
      { status: 400 }
    );
  }

  if (!quote.propertyId) {
    return NextResponse.json(
      { error: "Quote must have a property assigned to convert" },
      { status: 400 }
    );
  }

  // Find or create a default service type for the work order
  let serviceType = await prisma.serviceType.findFirst({
    where: { active: true },
  });
  if (!serviceType) {
    serviceType = await prisma.serviceType.create({
      data: { name: "General Service", active: true },
    });
  }

  // Use a transaction to create order + update quote atomically
  const result = await prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: quote.customerId,
        propertyId: quote.propertyId!,
        serviceTypeId: serviceType!.id,
        status: "PENDING",
        price: quote.total,
        notes: quote.notes ?? `Converted from quote ${quote.quoteNumber}`,
        createdById: (session.user as any).id,
        quoteId: quote.id,
      },
      include: {
        customer: { select: { companyName: true } },
        property: { select: { address: true } },
        serviceType: { select: { name: true } },
      },
    });

    // Copy quote line items as work order items
    for (const item of quote.items) {
      await tx.workOrderItem.create({
        data: {
          workOrderId: workOrder.id,
          serviceTypeId: serviceType!.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          addedById: (session.user as any).id,
        },
      });
    }

    const updatedQuote = await tx.quote.update({
      where: { id: params.id },
      data: { status: "CONVERTED", approvedAt: new Date() },
    });

    return { workOrder, quote: updatedQuote };
  });

  return NextResponse.json(result, { status: 201 });
}
