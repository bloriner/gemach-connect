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

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { id: true, companyName: true, email: true, phone: true, billingAddress: true } },
      property: { select: { id: true, address: true, city: true, state: true, zipCode: true } },
      createdBy: { select: { id: true, name: true } },
      items: true,
      convertedToOrder: { select: { id: true, orderNumber: true } },
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  return NextResponse.json(quote);
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
  const { customerId, propertyId, notes, validUntil, items, status } = body;

  const existing = await prisma.quote.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (existing.status !== "DRAFT") {
    return NextResponse.json(
      { error: `Cannot edit a quote with status: ${existing.status}` },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // If items provided, recalculate totals and replace items
    let updateData: any = {
      customerId: customerId ?? existing.customerId,
      propertyId: propertyId !== undefined ? propertyId : existing.propertyId,
      notes: notes !== undefined ? notes : existing.notes,
      validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : existing.validUntil,
      status: status ?? existing.status,
    };

    if (items !== undefined) {
      const subtotal = items.reduce(
        (sum: number, item: any) => sum + (item.quantity || 1) * (item.unitPrice || 0),
        0
      );
      const taxAmount = subtotal * (existing.taxRate / 100);
      updateData.subtotal = subtotal;
      updateData.taxAmount = Math.round(taxAmount * 100) / 100;
      updateData.total = Math.round((subtotal + taxAmount) * 100) / 100;

      // Delete and recreate items
      await tx.quoteItem.deleteMany({ where: { quoteId: params.id } });
      await tx.quoteItem.createMany({
        data: items.map((item: any) => ({
          quoteId: params.id,
          description: item.description,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? 0,
          total: (item.quantity ?? 1) * (item.unitPrice ?? 0),
          optional: item.optional ?? false,
          category: item.category ?? null,
        })),
      });
    }

    return tx.quote.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: { select: { id: true, companyName: true } },
        property: { select: { id: true, address: true, city: true, state: true } },
        createdBy: { select: { id: true, name: true } },
        items: true,
      },
    });
  });

  return NextResponse.json(result);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.quote.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (existing.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft quotes can be deleted" },
      { status: 400 }
    );
  }

  await prisma.quote.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
