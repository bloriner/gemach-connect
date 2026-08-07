import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSignedPdf } from "@/lib/pdf";

export async function GET(
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
    include: { signature: true },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.status !== "SIGNED") {
    return NextResponse.json(
      { error: "Document has not been signed yet" },
      { status: 400 }
    );
  }

  // If signed PDF already exists, redirect to it
  if (doc.signedDocumentUrl) {
    return NextResponse.redirect(
      new URL(doc.signedDocumentUrl, request.url)
    );
  }

  // Generate on-the-fly
  const signedAt = doc.signedAt?.toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit",
  }) || "Unknown";

  const pdfBuffer = await generateSignedPdf({
    documentTitle: doc.title,
    content: doc.content || `<p>${doc.title}</p>`,
    signatureSvg: doc.signature?.signatureSvg || "",
    signerName: doc.signature?.signerName || doc.recipientName,
    signedAt,
    signerIp: doc.signature?.signerIp || undefined,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="signed-${doc.title.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
