import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, contactName, email, password, phone } = body;

    if (!companyName || !email || !password) {
      return NextResponse.json(
        { error: "companyName, email, and password are required" },
        { status: 400 }
      );
    }

    // Check for existing customer by email
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const portalToken = randomUUID();

    const customer = await prisma.customer.create({
      data: {
        companyName,
        contactName: contactName || null,
        email,
        passwordHash,
        phone: phone || null,
        portalToken,
      },
    });

    return NextResponse.json(
      {
        portalToken: customer.portalToken,
        customer: {
          id: customer.id,
          companyName: customer.companyName,
          contactName: customer.contactName,
          email: customer.email,
          phone: customer.phone,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Portal signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
