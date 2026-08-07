import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const docs = await prisma.signatureDocument.findMany({
    include: {
      sender: { select: { name: true, email: true } },
      signature: true,
      _count: { select: { auditEvents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(docs);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  let body: any;

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    // File upload
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const recipientName = formData.get("recipientName") as string;
    const recipientEmail = formData.get("recipientEmail") as string;
    const description = (formData.get("description") as string) || null;
    const documentType = (formData.get("documentType") as string) || "OTHER";
    const metadataStr = (formData.get("metadata") as string) || null;

    if (!title?.trim() || !recipientName?.trim() || !recipientEmail?.trim()) {
      return NextResponse.json(
        { error: "title, recipientName, and recipientEmail are required" },
        { status: 400 }
      );
    }

    let documentUrl: string | null = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = file.name.split(".").pop() ?? "pdf";
      const filename = `sigdoc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const fs = await import("fs/promises");
      const path = await import("path");
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "documents");
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(path.join(uploadsDir, filename), buffer);
      documentUrl = `/uploads/documents/${filename}`;
    }

    const doc = await prisma.signatureDocument.create({
      data: {
        title,
        description,
        documentType,
        documentUrl,
        recipientName,
        recipientEmail,
        metadata: metadataStr,
        senderId: userId,
      },
    });

    // Log CREATED audit event
    await prisma.signatureAuditEvent.create({
      data: {
        documentId: doc.id,
        event: "CREATED",
        details: `Document created by ${session.user.name || session.user.email}`,
      },
    });

    return NextResponse.json(doc, { status: 201 });
  }

  // JSON body (generated offer letter)
  body = await request.json();
  const { title, recipientName, recipientEmail, content, description, documentType, metadata } = body;

  if (!title?.trim() || !recipientName?.trim() || !recipientEmail?.trim()) {
    return NextResponse.json(
      { error: "title, recipientName, and recipientEmail are required" },
      { status: 400 }
    );
  }

  const doc = await prisma.signatureDocument.create({
    data: {
      title,
      description: description || null,
      documentType: documentType || "OFFER_LETTER",
      content: content || null,
      recipientName,
      recipientEmail,
      metadata: metadata ? (typeof metadata === "string" ? metadata : JSON.stringify(metadata)) : null,
      senderId: userId,
    },
  });

  await prisma.signatureAuditEvent.create({
    data: {
      documentId: doc.id,
      event: "CREATED",
      details: `Document created by ${session.user.name || session.user.email}`,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
