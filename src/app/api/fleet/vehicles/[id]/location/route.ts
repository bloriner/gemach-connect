import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — log vehicle location from mobile app
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { lat, lng, speed, heading, accuracy } = body;

  if (lat == null || lng == null) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  // Log the location
  const log = await prisma.vehicleLocationLog.create({
    data: {
      vehicleId: params.id,
      lat,
      lng,
      speed: speed ?? null,
      heading: heading ?? null,
      accuracy: accuracy ?? null,
    },
  });

  // Update vehicle current position
  await prisma.vehicle.update({
    where: { id: params.id },
    data: {
      currentLat: lat,
      currentLng: lng,
      lastLocationAt: new Date(),
    },
  });

  // Also update the associated crew's lat/lng for backward compat
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: params.id },
    select: { crewId: true },
  });

  if (vehicle?.crewId) {
    await prisma.crew.update({
      where: { id: vehicle.crewId },
      data: { lat, lng, lastLocationAt: new Date() },
    });
  }

  return NextResponse.json(log, { status: 201 });
}
