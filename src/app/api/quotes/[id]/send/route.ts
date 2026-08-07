import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { companyName: true, email: true } },
      property: { select: { address: true, city: true, state: true } },
      items: true,
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.status !== "DRAFT") {
    return NextResponse.json(
      { error: `Cannot send a quote with status: ${quote.status}` },
      { status: 400 }
    );
  }

  const updated = await prisma.quote.update({
    where: { id: params.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      validUntil: quote.validUntil ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    include: {
      customer: { select: { id: true, companyName: true, email: true } },
      property: { select: { id: true, address: true, city: true, state: true } },
      items: true,
      createdBy: { select: { name: true } },
    },
  });

  // TODO: Send email when email integration is ready
  // if (updated.customer.email) { ... send email with quote link ... }

  return NextResponse.json(updated);
}
