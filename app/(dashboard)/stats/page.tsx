import { getStats } from "@/features/stats/actions";
import { StatsDashboard } from "@/features/stats/stats-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export const metadata = { title: "Statistiques - Poker Tracker Pro" };

export default async function StatsPage() {
  const stats = await getStats();

  if (!stats || stats.sessionCount === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Statistiques</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-8 w-8 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Pas encore de données</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Jouez quelques sessions pour voir vos statistiques détaillées.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Statistiques</h2>
      <StatsDashboard stats={stats} />
    </div>
  );
}
