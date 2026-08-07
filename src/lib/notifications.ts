import { prisma } from "@/lib/prisma";

type NotificationType =
  | "ORDER_CREATED"
  | "ORDER_DISPATCHED"
  | "ORDER_COMPLETED"
  | "INVOICE_GENERATED"
  | "PAYMENT_RECEIVED"
  | "DOCUMENT_SENT"
  | "DOCUMENT_SIGNED"
  | "QUOTE_APPROVED"
  | "TECH_ARRIVED";

export async function createNotification(params: {
  userIds?: string[];
  role?: string; // send to all users with this role
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}) {
  try {
    let userIds = params.userIds || [];

    if (params.role) {
      const roleUsers = await prisma.user.findMany({
        where: { role: params.role, active: true },
        select: { id: true },
      });
      userIds = [...userIds, ...roleUsers.map((u) => u.id)];
    }

    // Deduplicate
    userIds = Array.from(new Set(userIds));

    if (userIds.length === 0) return;

    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link || null,
      })),
    });
  } catch (err) {
    console.error("[NOTIFICATION] Failed to create:", err);
  }
}

export async function createOrderActivity(params: {
  workOrderId: string;
  userId?: string;
  action: string;
  detail?: string;
  fromValue?: string | null;
  toValue?: string | null;
}) {
  try {
    await prisma.orderActivity.create({
      data: {
        workOrderId: params.workOrderId,
        userId: params.userId || null,
        action: params.action,
        detail: params.detail || null,
        fromValue: params.fromValue || null,
        toValue: params.toValue || null,
      },
    });
  } catch (err) {
    console.error("[ACTIVITY] Failed to log:", err);
  }
}
