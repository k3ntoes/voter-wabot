import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { BotStatusPanel } from "@/components/dashboard/bot-status-panel";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import WhatsAppQR from "@/components/WhatsAppQR";
import { getAll } from "@/lib/dal/voters";

async function RecentVoters() {
  const voters = await getAll();
  const recentVoters = voters.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="default">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {recentVoters.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No recent registrations
        </p>
      ) : (
        recentVoters.map((voter) => (
          <div
            key={voter.id}
            className="flex items-center justify-between border-b pb-3 last:border-0"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">{voter.name}</p>
              <p className="text-xs text-muted-foreground">
                {voter.phone} · {voter.organization}
              </p>
            </div>
            {getStatusBadge(voter.status)}
          </div>
        ))
      )}
    </div>
  );
}

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Voter registration system overview
        </p>
      </div>

      <Suspense fallback={<div>Loading statistics...</div>}>
        <StatsCards />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* <BotStatusPanel /> */}
        <WhatsAppQR />
        <BotStatusPanel />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Registrations</CardTitle>
              <CardDescription>
                Latest voter registration submissions
              </CardDescription>
            </div>
            <Link href="/dashboard/voters">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <RecentVoters />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
