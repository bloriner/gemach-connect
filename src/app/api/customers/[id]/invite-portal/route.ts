import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, portalToken: true },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Generate or reuse portal token
  const portalToken = customer.portalToken || randomUUID();

  await prisma.customer.update({
    where: { id: params.id },
    data: { portalToken },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const inviteLink = `${baseUrl}/portal/set-password?token=${portalToken}`;

  return NextResponse.json({
    portalToken,
    inviteLink,
    alreadyInvited: !!customer.portalToken,
  });
}
