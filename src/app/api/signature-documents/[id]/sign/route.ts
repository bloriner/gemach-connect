import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, documentSignedTemplate, signedConfirmationTemplate } from "@/lib/email";
import { generateSignedPdf, overlaySignatureOnPdf } from "@/lib/pdf";
import fs from "fs/promises";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();
  const { signatureSvg, signerName } = body;

  if (!signatureSvg || !signerName) {
    return NextResponse.json(
      { error: "signatureSvg and signerName are required" },
      { status: 400 }
    );
  }

  const doc = await prisma.signatureDocument.findUnique({
    where: { id },
    include: { sender: true },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.status !== "SENT" && doc.status !== "VIEWED") {
    return NextResponse.json(
      { error: "Document is not available for signing" },
      { status: 400 }
    );
  }

  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const now = new Date();
  const signedAtStr = now.toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit",
    timeZoneName: "short",
  });

  // Store signature data
  await prisma.signatureData.create({
    data: {
      documentId: id,
      signatureSvg,
      signerName,
      signerIp: ip,
      signerUserAgent: userAgent,
      timestamp: now,
    },
  });

  // Generate signed PDF
  let signedPdfBuffer: Buffer;
  let signedDocUrl: string | null = null;

  try {
    if (doc.documentUrl) {
      // Uploaded PDF — read and overlay signature
      const filePath = path.join(process.cwd(), "public", doc.documentUrl);
      const pdfBuffer = await fs.readFile(filePath);
      signedPdfBuffer = await overlaySignatureOnPdf({
        pdfBuffer,
        signatureSvg,
        signerName,
        signedAt: signedAtStr,
        signerIp: ip,
      });
    } else if (doc.content) {
      // HTML content — generate signed PDF
      signedPdfBuffer = await generateSignedPdf({
        documentTitle: doc.title,
        content: doc.content,
        signatureSvg,
        signerName,
        signedAt: signedAtStr,
        signerIp: ip,
      });
    } else {
      signedPdfBuffer = await generateSignedPdf({
        documentTitle: doc.title,
        content: `<p>Document: ${doc.title}</p>`,
        signatureSvg,
        signerName,
        signedAt: signedAtStr,
        signerIp: ip,
      });
    }

    // Save signed PDF
    const filename = `signed-${doc.id}-${Date.now()}.pdf`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "signed");
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, filename), signedPdfBuffer);
    signedDocUrl = `/uploads/signed/${filename}`;
  } catch (err) {
    console.error("[SIGN] PDF generation failed:", err);
    // Continue without PDF — signing still succeeds
  }

  // Update document
  await prisma.signatureDocument.update({
    where: { id },
    data: {
      status: "SIGNED",
      signedAt: now,
      signedDocumentUrl: signedDocUrl,
    },
  });

  // Log audit
  await prisma.signatureAuditEvent.create({
    data: {
      documentId: id,
      event: "SIGNED",
      ipAddress: ip,
      userAgent,
      details: `Signed by ${signerName}`,
    },
  });

  // Send notification to sender
  await sendEmail({
    to: doc.sender.email,
    ...documentSignedTemplate({
      senderName: doc.sender.name || "Admin",
      recipientName: signerName,
      documentTitle: doc.title,
      signedAt: signedAtStr,
      signingIp: ip,
    }),
  });

  // Send confirmation to signer
  await sendEmail({
    to: doc.recipientEmail,
    ...signedConfirmationTemplate({
      recipientName: signerName,
      documentTitle: doc.title,
    }),
  });

  return NextResponse.json({
    success: true,
    signedAt: now.toISOString(),
    signedDocumentUrl: signedDocUrl,
    message: "Document signed successfully",
  });
}
