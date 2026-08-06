import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_COLORS, type OrderStatus } from "@/lib/utils";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await prisma.workOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      property: true,
      crew: true,
      serviceType: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Work Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            {orders.length} orders total
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left font-medium text-slate-600">Order #</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">Customer</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">Property</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">Service</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">Crew</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-brand-700">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-900">
                      {order.customer.companyName}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {order.property.address}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {order.serviceType.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {order.crew?.name ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          order.status === "COMPLETED"
                            ? "success"
                            : order.status === "CANCELLED"
                            ? "danger"
                            : order.status === "PENDING"
                            ? "warning"
                            : "info"
                        }
                      >
                        {order.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-900">
                      ${order.price?.toFixed(2) ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
