import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveTable } from "@/components/ui/responsive-table";
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

  const statusVariant = (status: string) => {
    const map: Record<string, "warning" | "info" | "success" | "danger"> = {
      PENDING: "warning",
      DISPATCHED: "info",
      EN_ROUTE: "info",
      ON_SITE: "info",
      COMPLETED: "success",
      CANCELLED: "danger",
    };
    return map[status] ?? "default";
  };

  const columns = [
    {
      header: "Order #",
      accessor: (o: typeof orders[0]) => (
        <span className="font-mono text-xs font-medium">{o.orderNumber}</span>
      ),
    },
    {
      header: "Customer",
      accessor: (o: typeof orders[0]) => o.customer.companyName,
    },
    {
      header: "Property",
      accessor: (o: typeof orders[0]) => (
        <span className="text-slate-600">{o.property.address}</span>
      ),
      hideOnMobile: true,
    },
    {
      header: "Service",
      accessor: (o: typeof orders[0]) => o.serviceType.name,
    },
    {
      header: "Tech",
      accessor: (o: typeof orders[0]) => (
        <span className="text-slate-600">{o.crew?.name ?? "—"}</span>
      ),
      hideOnMobile: true,
    },
    {
      header: "Status",
      accessor: (o: typeof orders[0]) => (
        <Badge variant={statusVariant(o.status)}>{o.status.replace("_", " ")}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            {orders.length} work order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="w-full sm:w-auto" size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Order
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ResponsiveTable
            data={orders}
            columns={columns}
            keyField={(o) => o.id}
            emptyMessage="No work orders yet. Create your first order to get started."
            mobileLabel={(o) => (
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-500">{o.orderNumber}</span>
                <Badge variant={statusVariant(o.status)} className="text-[10px]">
                  {o.status.replace("_", " ")}
                </Badge>
              </span>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
