import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, category, unit, unitPrice, taxable, active } = body;

  const existing = await prisma.priceItem.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Price item not found" }, { status: 404 });
  }

  if (category) {
    const valid = ["CARPET", "PAD", "LABOR", "REMOVAL", "REPAIR", "TREATMENT", "OTHER"];
    if (!valid.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
  }

  const item = await prisma.priceItem.update({
    where: { id: params.id },
    data: {
      name: name ?? undefined,
      description: description !== undefined ? description : undefined,
      category: category ?? undefined,
      unit: unit ?? undefined,
      unitPrice: unitPrice ?? undefined,
      taxable: taxable !== undefined ? taxable : undefined,
      active: active !== undefined ? active : undefined,
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.priceItem.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Price item not found" }, { status: 404 });
  }

  await prisma.priceItem.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
