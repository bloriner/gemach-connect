import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Update crew location
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { lat, lng, crewId } = body;

  if (lat == null || lng == null) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  // If no crewId provided, find the crew the user belongs to
  let targetCrewId = crewId;
  if (!targetCrewId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { crewId: true },
    });
    targetCrewId = user?.crewId;
  }

  if (!targetCrewId) {
    return NextResponse.json({ error: "No crew associated with user" }, { status: 400 });
  }

  const crew = await prisma.crew.update({
    where: { id: targetCrewId },
    data: {
      lat,
      lng,
      lastLocationAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, crew });
}

// GET: Get all crew locations (for map)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const crews = await prisma.crew.findMany({
    where: {
      active: true,
      lat: { not: null },
      lng: { not: null },
    },
    select: {
      id: true,
      name: true,
      lat: true,
      lng: true,
      lastLocationAt: true,
      vehicleInfo: true,
      lead: { select: { id: true, name: true, phone: true } },
      _count: { select: { workOrders: true } },
    },
  });

  return NextResponse.json(crews);
}
