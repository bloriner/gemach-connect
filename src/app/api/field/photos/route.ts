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
  const { workOrderId, url, type, caption, lat, lng } = body;

  if (!workOrderId || !url) {
    return NextResponse.json({ error: "workOrderId and url are required" }, { status: 400 });
  }

  const photo = await prisma.jobPhoto.create({
    data: {
      workOrderId,
      userId,
      url,
      thumbnailUrl: url, // same URL for now; could add thumbnail generation later
      type: type || "GENERAL",
      caption: caption || null,
      lat: lat || null,
      lng: lng || null,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
