import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results: { name: string; status: "pass" | "fail" | "warn"; detail: string; ms?: number }[] = [];

  // 1. Database connectivity
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    results.push({ name: "Database Connectivity", status: "pass", detail: "Connected to PostgreSQL", ms: Date.now() - start });
  } catch (e: any) {
    results.push({ name: "Database Connectivity", status: "fail", detail: e.message });
    return NextResponse.json({ results, summary: { pass: 0, fail: 1, warn: 0 } });
  }

  // 2. Table counts
  try {
    const [users, gemachs, offers, threads, messages, favorites] = await Promise.all([
      prisma.user.count(),
      prisma.gemach.count(),
      prisma.offer.count(),
      prisma.thread.count(),
      prisma.message.count(),
      prisma.favorite.count(),
    ]);
    const detail = `Users: ${users}, Gemachs: ${gemachs}, Offers: ${offers}, Threads: ${threads}, Messages: ${messages}, Favorites: ${favorites}`;
    const allPopulated = users > 0 && gemachs > 0;
    results.push({
      name: "Table Counts",
      status: allPopulated ? "pass" : "warn",
      detail,
    });
  } catch (e: any) {
    results.push({ name: "Table Counts", status: "fail", detail: e.message });
  }

  // 3. Auth check
  results.push({
    name: "Authentication",
    status: "pass",
    detail: `Signed in as ${session.user.email} (admin)`,
  });

  // 4. NextAuth config
  results.push({
    name: "NextAuth Secret",
    status: process.env.NEXTAUTH_SECRET ? "pass" : "fail",
    detail: process.env.NEXTAUTH_SECRET ? "NEXTAUTH_SECRET is set" : "NEXTAUTH_SECRET is missing",
  });

  // 5. API self-test (internal fetch to gemachs endpoint)
  try {
    const start = Date.now();
    const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/gemachs`);
    const data = await res.json();
    results.push({
      name: "GET /api/gemachs",
      status: res.ok && Array.isArray(data.gemachs) ? "pass" : "fail",
      detail: `Status ${res.status}, returned ${data.gemachs?.length || 0} gemachs`,
      ms: Date.now() - start,
    });
  } catch (e: any) {
    results.push({ name: "GET /api/gemachs", status: "fail", detail: e.message });
  }

  // 6. Check demo user exists
  try {
    const demoUser = await prisma.user.findUnique({ where: { email: "demo@gemach.app" } });
    results.push({
      name: "Demo User Exists",
      status: demoUser ? "pass" : "fail",
      detail: demoUser ? `Found: ${demoUser.name}` : "demo@gemach.app not found",
    });
  } catch (e: any) {
    results.push({ name: "Demo User Exists", status: "fail", detail: e.message });
  }

  // 7. Categories coverage
  try {
    const categories = await prisma.gemach.groupBy({ by: ["category"], _count: true });
    const unique = categories.length;
    results.push({
      name: "Category Coverage",
      status: unique >= 8 ? "pass" : "warn",
      detail: `${unique} unique categories across all gemachs`,
    });
  } catch (e: any) {
    results.push({ name: "Category Coverage", status: "fail", detail: e.message });
  }

  // 8. Offer statuses
  try {
    const statuses = await prisma.offer.groupBy({ by: ["status"], _count: true });
    results.push({
      name: "Offer Statuses",
      status: "pass",
      detail: statuses.map((s: any) => `${s.status}: ${s._count}`).join(", "),
    });
  } catch (e: any) {
    results.push({ name: "Offer Statuses", status: "fail", detail: e.message });
  }

  const pass = results.filter((r) => r.status === "pass").length;
  const fail = results.filter((r) => r.status === "fail").length;
  const warn = results.filter((r) => r.status === "warn").length;

  return NextResponse.json({
    results,
    summary: { pass, fail, warn, total: results.length },
    timestamp: new Date().toISOString(),
  });
}
