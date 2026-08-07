import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    orderBy: { companyName: "asc" },
    include: {
      _count: { select: { orders: true, invoices: true } },
      orders: {
        select: { id: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      invoices: {
        select: { total: true },
      },
    },
  });

  const result = customers.map((c) => ({
    id: c.id,
    companyName: c.companyName,
    contactName: c.contactName,
    email: c.email,
    phone: c.phone,
    portalToken: !!c.portalToken,
    lastOrder: c.orders[0] ?? null,
    orderCount: c._count.orders,
    invoiceCount: c._count.invoices,
    totalSpend: c.invoices.reduce((s, i) => s + i.total, 0),
  }));

  return NextResponse.json(result);
}
