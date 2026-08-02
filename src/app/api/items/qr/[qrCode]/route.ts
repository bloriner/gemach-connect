import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

// GET — public lookup by QR code (no auth needed)
export async function GET(_req: Request, { params }: { params: { qrCode: string } }) {
  const item = await prisma.item.findUnique({
    where: { qrCode: params.qrCode },
    include: {
      gemach: {
        select: { id: true, name: true, phone: true, email: true, city: true, state: true, owner: { select: { email: true, name: true } } },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found. This QR code may be invalid." }, { status: 404 });
  }

  return NextResponse.json({ item });
}

// POST — borrow or return (public, no auth — like Dockly)
export async function POST(req: Request, { params }: { params: { qrCode: string } }) {
  const item = await prisma.item.findUnique({
    where: { qrCode: params.qrCode },
    include: { gemach: { include: { owner: { select: { email: true, name: true, phone: true } } } } },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const { action, borrowerName, borrowerPhone, borrowerEmail } = await req.json();

  // Support both "borrow" and "lend" (backward compat)
  if (action === "borrow" || action === "lend") {
    if (item.status !== "available") {
      return NextResponse.json({ error: "This item is not currently available." }, { status: 400 });
    }

    if (!borrowerName) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
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
      include: { gemach: { select: { id: true, name: true, owner: { select: { email: true, name: true } } } } },
    });

    // Send email notification to gemach owner
    notifyOwner(updated.gemach.owner.email || "", updated.gemach.owner.name, "borrowed", updated.name, borrowerName.trim(), borrowerPhone?.trim(), borrowerEmail?.trim());

    return NextResponse.json({
      item: updated,
      message: `You've successfully borrowed "${updated.name}". The gemach owner has been notified.`,
    });
  }

  if (action === "return") {
    if (item.status !== "lent") {
      return NextResponse.json({ error: "This item is not currently borrowed." }, { status: 400 });
    }

    const updated = await prisma.item.update({
      where: { id: item.id },
      data: {
        status: "returned",
        returnedAt: new Date(),
      },
      include: { gemach: { select: { id: true, name: true, owner: { select: { email: true, name: true } } } } },
    });

    // Send email notification to gemach owner
    notifyOwner(updated.gemach.owner.email || "", updated.gemach.owner.name, "returned", updated.name, item.borrowerName || "Unknown", item.borrowerPhone || undefined, item.borrowerEmail || undefined);

    return NextResponse.json({
      item: updated,
      message: `"${updated.name}" has been returned. Thank you! The gemach owner has been notified.`,
    });
  }

  return NextResponse.json({ error: "Invalid action. Use 'borrow' or 'return'." }, { status: 400 });
}

async function notifyOwner(
  ownerEmail: string,
  ownerName: string,
  action: "borrowed" | "returned",
  itemName: string,
  borrowerName: string,
  borrowerPhone?: string,
  borrowerEmail?: string,
) {
  if (!ownerEmail) return;

  const actionText = action === "borrowed" ? "borrowed" : "returned";
  const emoji = action === "borrowed" ? "📦" : "✅";
  const color = action === "borrowed" ? "#f97316" : "#22c55e";

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Gemach Connect <onboarding@resend.dev>",
      to: ownerEmail,
      subject: `${emoji} Item ${actionText}: "${itemName}"`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="background: ${color}; height: 4px; border-radius: 2px 2px 0 0;"></div>
          <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 24px;">
            <h2 style="margin: 0 0 8px; font-size: 18px; color: #111827;">
              ${emoji} Item ${actionText}
            </h2>
            <p style="margin: 0 0 16px; color: #6b7280;">
              <strong style="color: #111827;">"${itemName}"</strong> was ${actionText} by <strong>${borrowerName}</strong>${action === "borrowed" ? ` on ${new Date().toLocaleDateString()}` : ""}.
            </p>
            ${borrowerPhone || borrowerEmail ? `
            <div style="background: #f9fafb; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
              <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #374151;">Borrower Details</p>
              ${borrowerPhone ? `<p style="margin: 0; font-size: 13px; color: #6b7280;">📞 ${borrowerPhone}</p>` : ""}
              ${borrowerEmail ? `<p style="margin: 0; font-size: 13px; color: #6b7280;">✉️ ${borrowerEmail}</p>` : ""}
            </div>
            ` : ""}
            <a href="https://gemach-connect.vercel.app/dashboard/items" style="display: inline-block; background: ${color}; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              View Your Items →
            </a>
            <p style="margin: 12px 0 0; font-size: 12px; color: #9ca3af;">
              Gemach Connect — Powered by Dockly
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send notification email:", err);
    // Don't fail the request
  }
}
