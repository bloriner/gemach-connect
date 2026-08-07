import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          serviceType: { select: { name: true } },
          crew: { select: { name: true } },
          property: { select: { address: true } },
        },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          payments: true,
          workOrder: { select: { orderNumber: true } },
        },
      },
      properties: true,
      _count: { select: { orders: true, invoices: true } },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const totalSpend = customer.invoices.reduce((s, i) => s + i.total, 0);

  return NextResponse.json({
    ...customer,
    totalSpend,
    portalEnabled: !!customer.portalToken,
  });
}
