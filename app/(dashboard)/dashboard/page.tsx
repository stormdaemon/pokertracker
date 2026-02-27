import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Target, Wallet, Flame, Trophy, AlertTriangle } from "lucide-react";
import { getDashboardStats } from "@/features/stats/get-dashboard-stats";
import { formatCurrency, formatDuration } from "@/lib/utils/format";
import { SessionTimer } from "@/features/sessions/session-timer";
import { GAME_TYPES } from "@/lib/constants";
import Link from "next/link";

export const metadata = { title: "Dashboard - Poker Tracker Pro" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const stats = await getDashboardStats();
  const currency = profile?.default_currency ?? "EUR";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Bonjour{profile?.display_name ? `, ${profile.display_name}` : ""} !
        </h2>
        <p className="text-muted-foreground">Voici un aperçu de vos performances.</p>
      </div>

      {/* Active Session Banner */}
      {stats.activeSession && (
        <Link href={`/sessions/${stats.activeSession.id}`}>
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <Badge variant="default" className="mb-1">Session en cours</Badge>
                <p className="font-medium">
                  {GAME_TYPES.find((g) => g.value === stats.activeSession!.game_type)?.label} - Buy-in: {formatCurrency(stats.activeSession!.buy_in_total, currency)}
                </p>
              </div>
              <SessionTimer startedAt={stats.activeSession.started_at} />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? "text-profit" : "text-loss"}`}>
              {stats.totalProfit >= 0 ? "+" : ""}{formatCurrency(stats.totalProfit, currency)}
            </div>
            <p className="text-xs text-muted-foreground">{stats.sessionCount} sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux horaire</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.hourlyRate >= 0 ? "text-profit" : "text-loss"}`}>
              {stats.hourlyRate >= 0 ? "+" : ""}{formatCurrency(stats.hourlyRate, currency)}/h
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bankroll</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.bankrollBalance, currency)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Streak + Best/Worst */}
      {stats.sessionCount > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {stats.streak.type !== "none" && (
            <Card>
              <CardContent className="py-4 flex items-center gap-3">
                <Flame className={`h-5 w-5 ${stats.streak.type === "winning" ? "text-profit" : "text-loss"}`} />
                <div>
                  <p className="text-sm text-muted-foreground">Série en cours</p>
                  <p className={`font-bold ${stats.streak.type === "winning" ? "text-profit" : "text-loss"}`}>
                    {stats.streak.count} {stats.streak.type === "winning" ? "victoire" : "défaite"}{stats.streak.count > 1 ? "s" : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.bestSession !== null && (
            <Card>
              <CardContent className="py-4 flex items-center gap-3">
                <Trophy className="h-5 w-5 text-profit" />
                <div>
                  <p className="text-sm text-muted-foreground">Meilleure session</p>
                  <p className="font-bold text-profit">+{formatCurrency(stats.bestSession, currency)}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.worstSession !== null && (
            <Card>
              <CardContent className="py-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-loss" />
                <div>
                  <p className="text-sm text-muted-foreground">Pire session</p>
                  <p className="font-bold text-loss">{formatCurrency(stats.worstSession, currency)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Sessions */}
      {stats.recentSessions.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dernières sessions</CardTitle>
              <Link href="/sessions" className="text-sm text-primary hover:underline">Tout voir</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentSessions.map((s) => (
                <Link key={s.id} href={`/sessions/${s.id}`} className="flex items-center justify-between py-2 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {GAME_TYPES.find((g) => g.value === s.game_type)?.label}
                      {s.is_active && <Badge className="ml-2 text-xs">En cours</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.started_at).toLocaleDateString("fr-FR")}
                      {s.duration_minutes ? ` - ${formatDuration(s.duration_minutes)}` : ""}
                    </p>
                  </div>
                  {s.net_profit !== null && (
                    <span className={`font-bold text-sm ${s.net_profit >= 0 ? "text-profit" : "text-loss"}`}>
                      {s.net_profit >= 0 ? "+" : ""}{formatCurrency(s.net_profit, s.currency)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Commencez à tracker</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Créez votre première session pour voir vos statistiques.
            </p>
            <Link
              href="/sessions/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Nouvelle session
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
