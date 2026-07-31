import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, phone, city, state, bio } = await req.json();

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(city !== undefined && { city: city || null }),
      ...(state !== undefined && { state: state || null }),
      ...(bio !== undefined && { bio: bio || null }),
    },
    select: { id: true, name: true, email: true, phone: true, city: true, state: true, bio: true },
  });

  return NextResponse.json({ user: updated });
}
