import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function generateQuoteNumber(): string {
  const seq = Math.floor(Math.random() * 90000) + 10000;
  return `Q-${seq}`;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statusFilter = request.nextUrl.searchParams.get("status");

  const quotes = await prisma.quote.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, companyName: true } },
      property: { select: { id: true, address: true, city: true, state: true } },
      createdBy: { select: { id: true, name: true } },
      items: true,
      convertedToOrder: { select: { id: true, orderNumber: true } },
    },
  });

  return NextResponse.json(quotes);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { customerId, propertyId, items, notes, validUntil } = body;

  if (!customerId) {
    return NextResponse.json({ error: "customerId is required" }, { status: 400 });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });
  }

  // Calculate totals
  const subtotal = items.reduce(
    (sum: number, item: any) => sum + (item.quantity || 1) * (item.unitPrice || 0),
    0
  );
  const taxRate = 6.0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const quote = await prisma.quote.create({
    data: {
      quoteNumber: generateQuoteNumber(),
      customerId,
      propertyId: propertyId ?? null,
      status: "DRAFT",
      subtotal,
      taxRate,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      notes: notes ?? null,
      validUntil: validUntil ? new Date(validUntil) : null,
      createdById: userId,
      items: {
        create: items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? 0,
          total: (item.quantity ?? 1) * (item.unitPrice ?? 0),
          optional: item.optional ?? false,
          category: item.category ?? null,
        })),
      },
    },
    include: {
      customer: { select: { id: true, companyName: true } },
      property: { select: { id: true, address: true, city: true, state: true } },
      createdBy: { select: { id: true, name: true } },
      items: true,
    },
  });

  return NextResponse.json(quote, { status: 201 });
}
