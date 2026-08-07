import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, password } = body;

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
  });

  if (!customer) {
    return NextResponse.json({ error: "Invalid or expired invitation link" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Generate a new portal token for login (so the invite link can't be reused for login)
  await prisma.customer.update({
    where: { id: customer.id },
    data: { passwordHash },
  });

  return NextResponse.json({
    success: true,
    portalToken: token,
    customer: {
      id: customer.id,
      companyName: customer.companyName,
      contactName: customer.contactName,
      email: customer.email,
      phone: customer.phone,
    },
  });
}
