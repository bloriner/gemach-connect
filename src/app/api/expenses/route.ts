import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    include: { createdBy: true, workOrder: { select: { orderNumber: true } } },
  });

  return NextResponse.json(expenses);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { description, category, amount, vendor, date } = body;

  if (!description || !category || !amount) {
    return NextResponse.json({ error: "description, category, and amount are required" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      description,
      category,
      amount: parseFloat(amount),
      vendor: vendor || null,
      date: date ? new Date(date) : new Date(),
      createdById: userId,
    },
    include: { createdBy: true },
  });

  return NextResponse.json(expense, { status: 201 });
}
