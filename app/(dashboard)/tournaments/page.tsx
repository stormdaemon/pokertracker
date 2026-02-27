import { createClient } from "@/lib/supabase/server";
import { getTournaments, getTournamentStats } from "@/features/tournaments/actions";
import { TournamentForm } from "@/features/tournaments/tournament-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import { Trophy, TrendingUp, Target, Award } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Tournois - Poker Tracker Pro" };

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const params = await searchParams;
  const showForm = params.new === "1";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("default_currency")
    .eq("id", user?.id)
    .single();
  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .eq("user_id", user?.id)
    .eq("is_archived", false);

  const tournaments = await getTournaments();
  const stats = await getTournamentStats();
  const currency = profile?.default_currency ?? "EUR";

  if (showForm) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Nouveau tournoi</h2>
        <TournamentForm locations={locations ?? []} defaultCurrency={currency} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tournois</h2>
        <Link
          href="/tournaments?new=1"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + Nouveau tournoi
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Profit total</p>
              <p className={`text-xl font-bold ${stats.profit >= 0 ? "text-profit" : "text-loss"}`}>
                {stats.profit >= 0 ? "+" : ""}{formatCurrency(stats.profit, currency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">ROI moyen</p>
              <p className={`text-xl font-bold ${stats.avgROI >= 0 ? "text-profit" : "text-loss"}`}>
                {stats.avgROI >= 0 ? "+" : ""}{formatPercent(stats.avgROI)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">ITM%</p>
              <p className="text-xl font-bold">{formatPercent(stats.itmRate)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Finish moyen</p>
              <p className="text-xl font-bold">{stats.avgFinish?.toFixed(0) ?? "-"}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tournament list */}
      {tournaments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-8 w-8 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun tournoi</h3>
            <p className="text-muted-foreground text-center">Enregistrez votre premier tournoi.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tournaments.map((t: any) => {
            const profit = t.prize_won + t.bounties_won - (t.total_invested ?? 0);
            return (
              <Card key={t.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.tournament_name || t.structure_type}</span>
                      <Badge variant="outline" className="text-xs">{t.structure_type}</Badge>
                      {t.itm && <Badge variant="profit" className="text-xs">ITM</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{new Date(t.session?.started_at).toLocaleDateString("fr-FR")}</span>
                      {t.finish_position && <span>#{t.finish_position}{t.total_entries ? `/${t.total_entries}` : ""}</span>}
                      <span>Buy-in: {formatCurrency(t.total_invested ?? 0, currency)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${profit >= 0 ? "text-profit" : "text-loss"}`}>
                      {profit >= 0 ? "+" : ""}{formatCurrency(profit, currency)}
                    </p>
                    <p className={`text-xs ${(t.roi_percent ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
                      ROI: {formatPercent(t.roi_percent ?? 0)}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
