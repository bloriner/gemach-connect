import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";


export default async function FieldPage() {
  const activeOrders = await prisma.workOrder.findMany({
    where: {
      status: {
        in: ["DISPATCHED", "EN_ROUTE", "ON_SITE"],
      },
    },
    include: {
      customer: true,
      property: true,
      crew: {
        include: { lead: true },
      },
      serviceType: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Field Tracking</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live view of all crews in the field ({activeOrders.length} active)
        </p>
      </div>

      {activeOrders.length === 0 ? (
        <p className="text-slate-500">No crews currently in the field.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {activeOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">
                    {order.customer.companyName}
                  </h3>
                  <Badge
                    variant={order.status === "ON_SITE" ? "success" : "info"}
                  >
                    {order.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {order.property.address}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Crew</span>
                  <span className="font-medium text-slate-900">
                    {order.crew?.name} — {order.crew?.lead?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Service</span>
                  <span className="font-medium text-slate-900">
                    {order.serviceType.name}
                  </span>
                </div>
                <Button size="sm" variant="primary" disabled title="Coming soon">
                  Complete Job
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
