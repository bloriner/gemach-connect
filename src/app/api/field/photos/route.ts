import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadJobPhoto } from "@/lib/supabase-storage";

// GET /api/field/photos?workOrderId=xxx — list photos for an order
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workOrderId = searchParams.get("workOrderId");

  if (!workOrderId) {
    return NextResponse.json({ error: "workOrderId is required" }, { status: 400 });
  }

  const photos = await prisma.jobPhoto.findMany({
    where: { workOrderId },
    orderBy: { takenAt: "desc" },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(photos);
}

// POST /api/field/photos — upload a photo for a work order
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  // Handle multipart form data
  let workOrderId: string | null = null;
  let type = "GENERAL";
  let caption: string | null = null;
  let lat: number | null = null;
  let lng: number | null = null;
  let file: File | null = null;

  try {
    const formData = await request.formData();
    workOrderId = formData.get("workOrderId") as string;
    type = (formData.get("type") as string) || "GENERAL";
    caption = formData.get("caption") as string | null;
    const latStr = formData.get("lat") as string | null;
    const lngStr = formData.get("lng") as string | null;
    file = formData.get("file") as File | null;

    if (latStr) lat = parseFloat(latStr);
    if (lngStr) lng = parseFloat(lngStr);
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (!workOrderId || !file) {
    return NextResponse.json(
      { error: "workOrderId and file are required" },
      { status: 400 }
    );
  }

  // Validate work order exists
  const order = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { id: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  // Upload to Supabase Storage
  const { url, error: uploadError } = await uploadJobPhoto(file, workOrderId, userId, type);

  if (uploadError || !url) {
    console.error("[PHOTOS] Upload error:", uploadError);
    return NextResponse.json(
      { error: uploadError || "Upload failed" },
      { status: 500 }
    );
  }

  // Create database record
  const photo = await prisma.jobPhoto.create({
    data: {
      workOrderId,
      userId,
      url,
      thumbnailUrl: url,
      type,
      caption: caption || null,
      lat,
      lng,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
