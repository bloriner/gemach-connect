import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return false;
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  return admins.includes(session.user.email.toLowerCase());
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  if (!admins.includes(session.user.email.toLowerCase())) return null;
  return session;
}
