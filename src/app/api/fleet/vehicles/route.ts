import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — list all vehicles
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { name: "asc" },
    include: {
      crew: {
        select: {
          id: true,
          name: true,
          lead: { select: { id: true, name: true, phone: true } },
        },
      },
      _count: { select: { routeStops: true, locationLogs: true } },
    },
  });

  return NextResponse.json(vehicles);
}

// POST — create a new vehicle
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, make, model, year, licensePlate, vin, color, crewId } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      name,
      make: make || null,
      model: model || null,
      year: year || null,
      licensePlate: licensePlate || null,
      vin: vin || null,
      color: color || null,
      crewId: crewId || null,
      status: "ACTIVE",
    },
    include: {
      crew: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
