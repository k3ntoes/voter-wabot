import { CheckCircle, Clock, Users, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStats } from "@/lib/dal/voters";

export async function StatsCards() {
  const stats = await getStats();

  const statsMap = stats.reduce(
    (acc, stat) => {
      acc[stat.status] = stat._count._all;
      return acc;
    },
    { pending: 0, verified: 0, rejected: 0 } as Record<string, number>,
  );

  const total = stats.reduce((sum, stat) => sum + stat._count._all, 0);

  const cards = [
    {
      title: "Total Registered",
      value: total,
      description: "All voter registrations",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Verified",
      value: statsMap.verified || 0,
      description: "Approved voters",
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Pending",
      value: statsMap.pending || 0,
      description: "Awaiting review",
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      title: "Rejected",
      value: statsMap.rejected || 0,
      description: "Declined registrations",
      icon: XCircle,
      color: "text-red-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
