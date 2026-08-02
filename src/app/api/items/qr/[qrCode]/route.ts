import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — public lookup by QR code (no auth needed)
export async function GET(_req: Request, { params }: { params: { qrCode: string } }) {
  const item = await prisma.item.findUnique({
    where: { qrCode: params.qrCode },
    include: {
      gemach: {
        select: { id: true, name: true, phone: true, email: true, city: true, state: true },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found. This QR code may be invalid." }, { status: 404 });
  }

  return NextResponse.json({ item });
}

// POST — perform a lend or return action (public, like Dockly)
export async function POST(req: Request, { params }: { params: { qrCode: string } }) {
  const item = await prisma.item.findUnique({ where: { qrCode: params.qrCode } });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const { action, borrowerName, borrowerPhone, borrowerEmail } = await req.json();

  if (action === "lend") {
    if (item.status !== "available") {
      return NextResponse.json({ error: "Item is not available" }, { status: 400 });
    }

    if (!borrowerName) {
      return NextResponse.json({ error: "Borrower name is required" }, { status: 400 });
    }

    const updated = await prisma.item.update({
      where: { id: item.id },
      data: {
        status: "lent",
        borrowerName: borrowerName.trim(),
        borrowerPhone: borrowerPhone?.trim() || null,
        borrowerEmail: borrowerEmail?.trim() || null,
        lentAt: new Date(),
        returnedAt: null,
      },
      include: { gemach: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ item: updated, message: `"${updated.name}" has been lent to ${updated.borrowerName}.` });
  }

  if (action === "return") {
    if (item.status !== "lent") {
      return NextResponse.json({ error: "Item is not currently lent out" }, { status: 400 });
    }

    const updated = await prisma.item.update({
      where: { id: item.id },
      data: {
        status: "returned",
        returnedAt: new Date(),
      },
      include: { gemach: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ item: updated, message: `"${updated.name}" has been returned. Thank you!` });
  }

  return NextResponse.json({ error: "Invalid action. Use 'lend' or 'return'." }, { status: 400 });
}
