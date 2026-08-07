import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-06-01.basil" as any,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = request.headers.get("x-portal-token");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
  });
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { payments: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.customerId !== customer.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    return NextResponse.json({ error: "Invoice is not payable" }, { status: 400 });
  }

  const paidSoFar = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance = invoice.total - paidSoFar;

  if (balance <= 0) {
    return NextResponse.json({ error: "Invoice already paid in full" }, { status: 400 });
  }

  // Stripe expects amount in cents
  const amountInCents = Math.round(balance * 100);

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Invoice ${invoice.invoiceNumber}`,
            description: `Payment for invoice ${invoice.invoiceNumber}`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/portal/dashboard?paid=true`,
    cancel_url: `${baseUrl}/portal/dashboard?paid=false`,
    metadata: {
      invoiceId: invoice.id,
      customerId: customer.id,
    },
    customer_email: customer.email || undefined,
  });

  return NextResponse.json({ url: session.url });
}
