import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — route stops for a vehicle
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vehicleId = request.nextUrl.searchParams.get("vehicleId");
  const date = request.nextUrl.searchParams.get("date");

  const where: any = {};
  if (vehicleId) where.vehicleId = vehicleId;
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    where.createdAt = { gte: startOfDay, lte: endOfDay };
  }

  const stops = await prisma.routeStop.findMany({
    where,
    orderBy: { order: "asc" },
    include: {
      vehicle: { select: { id: true, name: true, licensePlate: true } },
      workOrder: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          priority: true,
          customer: { select: { id: true, companyName: true, phone: true } },
          property: { select: { id: true, address: true, lat: true, lng: true } },
          serviceType: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(stops);
}

// POST — create route stops for a vehicle
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { vehicleId, stops } = body;

  if (!vehicleId || !stops || !Array.isArray(stops)) {
    return NextResponse.json({ error: "vehicleId and stops array are required" }, { status: 400 });
  }

  // Delete existing stops for this vehicle today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.routeStop.deleteMany({
    where: {
      vehicleId,
      createdAt: { gte: today },
    },
  });

  // Create new stops
  const created = await prisma.$transaction(
    stops.map((stop: { workOrderId: string }, idx: number) =>
      prisma.routeStop.create({
        data: {
          vehicleId,
          workOrderId: stop.workOrderId,
          order: idx,
        },
      })
    )
  );

  return NextResponse.json(created, { status: 201 });
}
