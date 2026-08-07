import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { workOrderId, signatureSvg, signerName } = body;

  if (!workOrderId || !signatureSvg) {
    return NextResponse.json(
      { error: "workOrderId and signatureSvg are required" },
      { status: 400 }
    );
  }

  const note = await prisma.fieldNote.create({
    data: {
      workOrderId,
      userId,
      type: "SIGNATURE",
      content: JSON.stringify({
        signatureSvg,
        signerName: signerName || "Customer",
        signedAt: new Date().toISOString(),
      }),
    },
  });

  return NextResponse.json(note, { status: 201 });
}
