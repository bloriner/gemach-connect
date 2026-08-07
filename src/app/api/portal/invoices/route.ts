import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-portal-token");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
  });
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: {
      workOrder: { include: { serviceType: true, property: true } },
      payments: true,
    },
  });

  return NextResponse.json(invoices);
}
