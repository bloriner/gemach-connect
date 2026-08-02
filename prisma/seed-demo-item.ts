import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const demo = await prisma.user.findUnique({ where: { email: "demo@gemach.app" } });
  if (!demo) { console.log("No demo user found"); return; }

  const gemach = await prisma.gemach.findFirst({ where: { ownerId: demo.id } });
  if (!gemach) { console.log("No gemach for demo user"); return; }

  let item = await prisma.item.findFirst({ where: { gemachId: gemach.id } });
  if (item) {
    console.log("Demo item already exists");
    console.log("QR Code:", item.qrCode);
    console.log("Scan URL: https://gemach-connect.vercel.app/scan/" + item.qrCode);
    console.log("Gemach:", gemach.name);
    return;
  }

  const qrCode = crypto.randomUUID();
  item = await prisma.item.create({
    data: {
      name: "Baby Crib (Demo)",
      description: "Graco Pack n Play — gently used, clean condition",
      qrCode,
      gemachId: gemach.id,
    },
  });

  console.log("Created demo item");
  console.log("QR Code:", qrCode);
  console.log("Scan URL: https://gemach-connect.vercel.app/scan/" + qrCode);
  console.log("Gemach:", gemach.name);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); });
