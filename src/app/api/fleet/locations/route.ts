import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — all vehicle current locations
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vehicles = await prisma.vehicle.findMany({
    where: {
      status: { not: "OUT_OF_SERVICE" },
      currentLat: { not: null },
      currentLng: { not: null },
    },
    select: {
      id: true,
      name: true,
      make: true,
      model: true,
      color: true,
      licensePlate: true,
      status: true,
      currentLat: true,
      currentLng: true,
      lastLocationAt: true,
      crew: {
        select: {
          id: true,
          name: true,
          lead: { select: { id: true, name: true, phone: true } },
        },
      },
      _count: { select: { routeStops: true } },
    },
  });

  return NextResponse.json(vehicles);
}
