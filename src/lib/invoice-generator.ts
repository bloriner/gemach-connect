import { prisma } from "@/lib/prisma";

function generateInvoiceNumber(): string {
  const seq = Math.floor(Math.random() * 90000) + 10000;
  return `INV-${seq}`;
}

interface InvoiceSplit {
  id: string;
  partyName: string;
  splitPercent: number;
}

interface GenerateInvoicesParams {
  workOrderId: string;
  price: number;
  serviceTypeName: string;
  customerId: string;
  billingType: string;
  billingSplits: InvoiceSplit[];
}

/**
 * Creates invoice(s) for a completed work order.
 * Handles both SINGLE and SPLIT billing types.
 * Caller should ensure the order is marked COMPLETED first.
 */
export async function createInvoicesForOrder(params: GenerateInvoicesParams) {
  const { workOrderId, price, serviceTypeName, customerId, billingType, billingSplits } = params;
  const taxRate = 6.0;

  if (billingType === "SPLIT" && billingSplits.length > 0) {
    const invoices = [];
    for (const split of billingSplits) {
      const splitPrice = price * (split.splitPercent / 100);
      const taxAmount = splitPrice * (taxRate / 100);
      const total = splitPrice + taxAmount;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          workOrderId,
          customerId,
          status: "DRAFT",
          subtotal: splitPrice,
          taxRate,
          taxAmount,
          total,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: {
            create: {
              description: `${serviceTypeName} (${split.partyName} — ${split.splitPercent}%)`,
              quantity: 1,
              unitPrice: splitPrice,
              total: splitPrice,
            },
          },
        },
        include: { items: true },
      });

      await prisma.billingSplit.update({
        where: { id: split.id },
        data: { invoiceId: invoice.id },
      });

      invoices.push(invoice);
    }
    return { invoices, billingType: "SPLIT" } as const;
  }

  // Single invoice
  const taxAmount = price * (taxRate / 100);
  const total = price + taxAmount;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      workOrderId,
      customerId,
      status: "DRAFT",
      subtotal: price,
      taxRate,
      taxAmount,
      total,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: {
        create: {
          description: serviceTypeName,
          quantity: 1,
          unitPrice: price,
          total: price,
        },
      },
    },
    include: { items: true },
  });

  return { invoice, billingType: "SINGLE" } as const;
}
