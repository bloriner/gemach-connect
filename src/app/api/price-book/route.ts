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

  const category = request.nextUrl.searchParams.get("category");
  const search = request.nextUrl.searchParams.get("search");
  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";

  const where: any = {};
  if (!includeInactive) where.active = true;
  if (category) where.category = category;
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const items = await prisma.priceItem.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, category, unit, unitPrice, taxable, active } = body;

  if (!name || unitPrice == null) {
    return NextResponse.json(
      { error: "name and unitPrice are required" },
      { status: 400 }
    );
  }

  const validCategories = ["CARPET", "PAD", "LABOR", "REMOVAL", "REPAIR", "TREATMENT", "OTHER"];
  if (category && !validCategories.includes(category)) {
    return NextResponse.json(
      { error: `Invalid category. Must be: ${validCategories.join(", ")}` },
      { status: 400 }
    );
  }

  const item = await prisma.priceItem.create({
    data: {
      name,
      description: description ?? null,
      category: category ?? "LABOR",
      unit: unit ?? "SQFT",
      unitPrice,
      taxable: taxable ?? true,
      active: active ?? true,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
