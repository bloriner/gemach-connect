import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { Users, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CrewsPage() {
  const crews = await prisma.crew.findMany({
    include: {
      lead: true,
      members: true,
      workOrders: {
        where: { status: { in: ["DISPATCHED", "EN_ROUTE", "ON_SITE"] } },
        include: { property: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Crews</h1>
        <p className="mt-1 text-sm text-slate-500">
          {crews.length} crews — manage assignments and track status
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {crews.map((crew) => {
          const isActive = crew.workOrders.length > 0;
          return (
            <Card key={crew.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {crew.name}
                  </h3>
                  <Badge variant={isActive ? "success" : "default"}>
                    {isActive ? "Active" : "Idle"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="h-4 w-4" />
                  <span>
                    Lead: {crew.lead?.name ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="font-medium">Members:</span>
                  {crew.members.map((m) => m.name).join(", ") || "None"}
                </div>
                {crew.vehicleInfo && (
                  <p className="text-sm text-slate-500">
                    Vehicle: {crew.vehicleInfo}
                  </p>
                )}
                {isActive && (
                  <div className="mt-3 rounded-lg bg-blue-50 p-3">
                    <p className="text-xs font-medium text-blue-700">
                      Current Job:
                    </p>
                    <p className="text-sm text-blue-900">
                      {crew.workOrders[0].property.address}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
