import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const equipment = await prisma.equipment.findUnique({ where: { id } });

  if (!equipment) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  // Generate QR code as SVG data URL
  const qrData = JSON.stringify({
    id: equipment.id,
    qrCode: equipment.qrCode,
    name: equipment.name,
    type: equipment.type,
  });

  const svg = await QRCode.toString(qrData, {
    type: "svg",
    width: 300,
    margin: 2,
    color: { dark: "#1e293b", light: "#ffffff" },
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
