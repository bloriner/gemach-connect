import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, sentForSignatureTemplate } from "@/lib/email";
import { randomUUID } from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const doc = await prisma.signatureDocument.findUnique({
    where: { id },
    include: { sender: true },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft documents can be sent" }, { status: 400 });
  }

  // Generate unique signing token
  const signToken = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30-day expiry

  const origin = request.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const signingLink = `${origin}/sign/${signToken}`;

  // Update document
  const updated = await prisma.signatureDocument.update({
    where: { id },
    data: {
      status: "SENT",
      signToken,
      sentAt: new Date(),
      expiresAt: expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    },
  });

  // Log audit
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "internal";
  await prisma.signatureAuditEvent.create({
    data: {
      documentId: id,
      event: "SENT",
      ipAddress: ip,
      details: `Sent to ${doc.recipientEmail} by ${session.user.name || session.user.email}`,
    },
  });

  // Send email to recipient
  const emailSent = await sendEmail({
    to: doc.recipientEmail,
    ...sentForSignatureTemplate({
      recipientName: doc.recipientName,
      documentTitle: doc.title,
      signingLink,
      expiresAt: expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    }),
  });

  return NextResponse.json({
    success: true,
    signToken,
    signingLink,
    emailSent,
    message: `Document sent to ${doc.recipientEmail}`,
  });
}
