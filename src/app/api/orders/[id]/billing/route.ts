import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.workOrder.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      orderNumber: true,
      billingType: true,
      billingNotes: true,
      price: true,
      customer: { select: { companyName: true } },
      billingSplits: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { billingType, billingNotes, splits } = body;

  const order = await prisma.workOrder.findUnique({
    where: { id: params.id },
  });
  if (!order) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  if (order.status === "INVOICED") {
    return NextResponse.json(
      { error: "Cannot modify billing on an invoiced order" },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update billing type and notes
    await tx.workOrder.update({
      where: { id: params.id },
      data: {
        billingType: billingType ?? "SINGLE",
        billingNotes: billingNotes ?? null,
      },
    });

    // If splits are provided, replace all existing splits
    if (splits !== undefined) {
      // Delete existing splits
      await tx.billingSplit.deleteMany({
        where: { workOrderId: params.id },
      });

      // Create new splits
      if (splits.length > 0) {
        await tx.billingSplit.createMany({
          data: splits.map((s: any) => ({
            workOrderId: params.id,
            partyName: s.partyName,
            partyType: s.partyType ?? "TENANT",
            splitPercent: s.splitPercent,
            splitAmount: s.splitAmount ?? null,
            contactName: s.contactName ?? null,
            contactEmail: s.contactEmail ?? null,
            contactPhone: s.contactPhone ?? null,
            billingAddress: s.billingAddress ?? null,
            notes: s.notes ?? null,
          })),
        });
      }
    }

    // Return updated order with billing splits
    return tx.workOrder.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        orderNumber: true,
        billingType: true,
        billingNotes: true,
        price: true,
        customer: { select: { companyName: true } },
        billingSplits: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  });

  return NextResponse.json(result);
}
