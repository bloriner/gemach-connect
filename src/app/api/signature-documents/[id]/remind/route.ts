import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, reminderTemplate } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const doc = await prisma.signatureDocument.findUnique({ where: { id } });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.status !== "SENT" && doc.status !== "VIEWED") {
    return NextResponse.json(
      { error: "Can only remind for sent or viewed documents" },
      { status: 400 }
    );
  }

  if (!doc.signToken) {
    return NextResponse.json({ error: "Document has no signing token" }, { status: 400 });
  }

  const origin = request.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const signingLink = `${origin}/sign/${doc.signToken}`;

  const emailSent = await sendEmail({
    to: doc.recipientEmail,
    subject: `Reminder: Please Sign — ${doc.title}`,
    html: reminderTemplate({
      recipientName: doc.recipientName,
      documentTitle: doc.title,
      signingLink,
    }),
  });

  // Update reminder tracking
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "internal";
  await prisma.signatureDocument.update({
    where: { id },
    data: {
      reminderSentAt: new Date(),
      reminderCount: { increment: 1 },
    },
  });

  // Log audit
  await prisma.signatureAuditEvent.create({
    data: {
      documentId: id,
      event: "REMINDER_SENT",
      ipAddress: ip,
      details: `Reminder #${doc.reminderCount + 1} sent to ${doc.recipientEmail}`,
    },
  });

  return NextResponse.json({
    success: true,
    emailSent,
    message: `Reminder sent to ${doc.recipientEmail}`,
  });
}
