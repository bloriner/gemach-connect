import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public endpoint: returns document details for the signing page.
 * No authentication required — access controlled by unique signToken.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  const doc = await prisma.signatureDocument.findUnique({
    where: { signToken: token },
    include: {
      sender: { select: { name: true, email: true } },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  if (doc.expiresAt && new Date() > doc.expiresAt) {
    // Mark as expired
    await prisma.signatureDocument.update({
      where: { id: doc.id },
      data: { status: "EXPIRED" },
    });
    await prisma.signatureAuditEvent.create({
      data: {
        documentId: doc.id,
        event: "EXPIRED",
        details: "Document link expired",
      },
    });
    return NextResponse.json({ error: "This document link has expired" }, { status: 410 });
  }

  if (doc.status === "SIGNED") {
    return NextResponse.json({
      ...doc,
      message: "This document has already been signed.",
      alreadySigned: true,
    });
  }

  if (doc.status === "DECLINED") {
    return NextResponse.json({
      ...doc,
      message: "This document has been declined.",
      alreadyDeclined: true,
    });
  }

  // Mark as VIEWED if first view
  if (doc.status === "SENT") {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await prisma.signatureDocument.update({
      where: { id: doc.id },
      data: { status: "VIEWED", viewedAt: new Date() },
    });

    await prisma.signatureAuditEvent.create({
      data: {
        documentId: doc.id,
        event: "VIEWED",
        ipAddress: ip,
        userAgent,
        details: `Document viewed by ${doc.recipientName}`,
      },
    });

    // Notify sender that document was viewed
    const { sendEmail, viewedDocumentTemplate } = await import("@/lib/email");
    await sendEmail({
      to: (doc.sender as any).email,
      subject: `Viewed: ${doc.title}`,
      html: viewedDocumentTemplate({
        senderName: (doc.sender as any).name || "Admin",
        recipientName: doc.recipientName,
        documentTitle: doc.title,
        viewedAt: new Date().toLocaleString("en-US", {
          year: "numeric", month: "long", day: "numeric",
          hour: "numeric", minute: "2-digit",
        }),
      }),
    });
  }

  // Return only the fields needed for the signing page
  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    description: doc.description,
    content: doc.content,
    documentUrl: doc.documentUrl,
    documentType: doc.documentType,
    recipientName: doc.recipientName,
    senderName: (doc.sender as any)?.name || "Premier Pro Services",
    status: doc.status,
    metadata: doc.metadata,
  });
}
