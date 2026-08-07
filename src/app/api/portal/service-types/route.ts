import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const types = await prisma.serviceType.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(types);
}
