import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-06-01.basil" as any,
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error("[STRIPE-WEBHOOK] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { invoiceId } = session.metadata || {};

    if (!invoiceId) {
      console.error("[STRIPE-WEBHOOK] No invoiceId in session metadata");
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

    const amount = (session.amount_total || 0) / 100; // convert cents to dollars

    try {
      // Record the payment
      await prisma.payment.create({
        data: {
          invoiceId,
          amount,
          method: "CREDIT_CARD",
          reference: session.id,
          notes: `Stripe payment — ${session.payment_intent}`,
          receivedAt: new Date(),
        },
      });

      // Check if fully paid and update invoice status
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true },
      });

      if (invoice) {
        const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
        if (totalPaid >= invoice.total) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: "PAID" },
          });
        }
      }

      console.log(`[STRIPE-WEBHOOK] Payment of $${amount.toFixed(2)} recorded for invoice ${invoiceId}`);
    } catch (err) {
      console.error("[STRIPE-WEBHOOK] Failed to record payment:", err);
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
