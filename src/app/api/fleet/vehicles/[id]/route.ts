import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — vehicle details with recent location history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: params.id },
    include: {
      crew: {
        select: {
          id: true,
          name: true,
          lead: { select: { id: true, name: true, phone: true } },
        },
      },
      routeStops: {
        orderBy: { order: "asc" },
        include: {
          workOrder: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              customer: { select: { companyName: true, phone: true } },
              property: { select: { address: true, lat: true, lng: true } },
              serviceType: { select: { name: true } },
            },
          },
        },
      },
      locationLogs: {
        orderBy: { timestamp: "desc" },
        take: 100,
      },
    },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  return NextResponse.json(vehicle);
}

// PATCH — update vehicle details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, make, model, year, licensePlate, vin, color, status, crewId } = body;

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (make !== undefined) data.make = make;
  if (model !== undefined) data.model = model;
  if (year !== undefined) data.year = year;
  if (licensePlate !== undefined) data.licensePlate = licensePlate;
  if (vin !== undefined) data.vin = vin;
  if (color !== undefined) data.color = color;
  if (status !== undefined) data.status = status;
  if (crewId !== undefined) data.crewId = crewId;

  const vehicle = await prisma.vehicle.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(vehicle);
}
