import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const equipment = await prisma.equipment.findMany({
    include: {
      workOrder: { select: { orderNumber: true } },
      property: { select: { name: true, address: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(equipment);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, type, serialNumber, location, notes, workOrderId, propertyId } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "name and type are required" }, { status: 400 });
  }

  const validTypes = ["EXTRACTOR", "FAN", "DEHUMIDIFIER", "AIR_SCRUBBER", "SPRAYER", "OTHER"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(", ")}` }, { status: 400 });
  }

  // Generate unique QR code identifier
  const qrCode = `EQ-${randomBytes(6).toString("hex").toUpperCase()}`;

  const equipment = await prisma.equipment.create({
    data: {
      name,
      type,
      serialNumber: serialNumber ?? null,
      status: workOrderId || propertyId ? "DEPLOYED" : "AVAILABLE",
      location: location ?? null,
      qrCode,
      workOrderId: workOrderId ?? null,
      propertyId: propertyId ?? null,
      notes: notes ?? null,
      deployedAt: workOrderId || propertyId ? new Date() : null,
    },
    include: {
      workOrder: { select: { orderNumber: true } },
      property: { select: { name: true, address: true } },
    },
  });

  return NextResponse.json(equipment, { status: 201 });
}
