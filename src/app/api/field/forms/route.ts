import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — fetch forms for an order
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workOrderId = request.nextUrl.searchParams.get("workOrderId");
  if (!workOrderId) {
    return NextResponse.json({ error: "workOrderId is required" }, { status: 400 });
  }

  const forms = await prisma.jobForm.findMany({
    where: { workOrderId },
    orderBy: { createdAt: "desc" },
    include: {
      submittedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(forms);
}

// POST — submit a job form
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { workOrderId, formType, title, data } = body;

  if (!workOrderId || !formType || !title) {
    return NextResponse.json(
      { error: "workOrderId, formType, and title are required" },
      { status: 400 }
    );
  }

  const form = await prisma.jobForm.create({
    data: {
      workOrderId,
      formType,
      title,
      data: typeof data === "string" ? data : JSON.stringify(data),
      submittedById: userId,
      submittedAt: new Date(),
    },
    include: {
      submittedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(form, { status: 201 });
}
