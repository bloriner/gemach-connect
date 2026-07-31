import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body, category } = await req.json();

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
  }

  // Save to database
  const suggestion = await prisma.suggestion.create({
    data: {
      title: title.trim(),
      body: body.trim(),
      category: category || "general",
      userId: session.user.id,
      userName: session.user.name || "Unknown",
      userEmail: session.user.email || "",
    },
  });

  // Send email notification
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM || "bloriner@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Gemach Connect" <${process.env.EMAIL_FROM || "bloriner@gmail.com"}>`,
      to: process.env.EMAIL_TO || "bloriner@gmail.com",
      subject: `[Gemach Connect] ${title.trim()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Gemach Connect — New Suggestion</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <tr><td style="padding: 8px; background: #f3f4f6; font-weight: bold; width: 100px;">From:</td><td style="padding: 8px;">${session.user.name || "Unknown"} (${session.user.email})</td></tr>
            <tr><td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Category:</td><td style="padding: 8px; text-transform: capitalize;">${category || "general"}</td></tr>
          </table>
          <h3 style="color: #374151;">${title.trim()}</h3>
          <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${body.trim()}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">View all suggestions in the Admin panel on Gemach Connect.</p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error("Failed to send email:", emailErr);
    // Don't fail the request — suggestion was still saved
  }

  return NextResponse.json(suggestion, { status: 201 });
}
