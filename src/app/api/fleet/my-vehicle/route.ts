import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — returns the vehicle assigned to the current user's crew
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      crewId: true,
      crew: {
        select: {
          id: true,
          name: true,
          vehicle: {
            select: {
              id: true,
              name: true,
              make: true,
              model: true,
              licensePlate: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!user?.crewId || !user?.crew?.vehicle) {
    return NextResponse.json({ error: "No vehicle assigned to your crew" }, { status: 404 });
  }

  return NextResponse.json(user.crew.vehicle);
}
