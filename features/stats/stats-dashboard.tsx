"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDuration, formatPercent } from "@/lib/utils/format";
import { GAME_TYPES } from "@/lib/constants";
import { TrendingUp, Clock, Target, Zap, BarChart3, Activity } from "lucide-react";
import type { StatsData } from "./actions";

interface StatsDashboardProps {
  stats: StatsData;
}

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function StatsDashboard({ stats }: StatsDashboardProps) {
  const { currency } = stats;

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Profit total"
          value={`${stats.totalProfit >= 0 ? "+" : ""}${formatCurrency(stats.totalProfit, currency)}`}
          valueClass={stats.totalProfit >= 0 ? "text-profit" : "text-loss"}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Taux horaire"
          value={`${formatCurrency(stats.hourlyRate, currency)}/h`}
          valueClass={stats.hourlyRate >= 0 ? "text-profit" : "text-loss"}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Win rate"
          value={formatPercent(stats.winRate)}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          label="Sessions"
          value={stats.sessionCount.toString()}
          sub={`${formatDuration(Math.round(stats.totalHours * 60))} total`}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* Detailed stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Session moyenne" value={formatCurrency(stats.avgSession, currency)} valueClass={stats.avgSession >= 0 ? "text-profit" : "text-loss"} />
        <StatCard label="Durée moyenne" value={formatDuration(Math.round(stats.avgDuration))} />
        <StatCard label="Meilleure session" value={`+${formatCurrency(stats.bestSession, currency)}`} valueClass="text-profit" />
        <StatCard label="Pire session" value={formatCurrency(stats.worstSession, currency)} valueClass="text-loss" />
        <StatCard label="Ecart-type" value={formatCurrency(stats.stdDev, currency)} icon={<Zap className="h-4 w-4" />} />
        {stats.bbPerHour !== null && (
          <StatCard label="BB/h" value={`${stats.bbPerHour.toFixed(2)} BB/h`} valueClass={stats.bbPerHour >= 0 ? "text-profit" : "text-loss"} />
        )}
      </div>

      {/* By Game Type */}
      {stats.profitByGameType.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Par type de jeu</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.profitByGameType.map((gt) => (
                <div key={gt.game_type} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{GAME_TYPES.find((g) => g.value === gt.game_type)?.label ?? gt.game_type}</p>
                    <p className="text-xs text-muted-foreground">{gt.sessions} sessions</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${gt.profit >= 0 ? "text-profit" : "text-loss"}`}>
                      {gt.profit >= 0 ? "+" : ""}{formatCurrency(gt.profit, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(gt.hourly, currency)}/h</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Location */}
      {stats.profitByLocation.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Par lieu</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.profitByLocation
                .sort((a, b) => b.profit - a.profit)
                .map((loc) => (
                  <div key={loc.location_name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{loc.location_name}</p>
                      <p className="text-xs text-muted-foreground">{loc.sessions} sessions</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${loc.profit >= 0 ? "text-profit" : "text-loss"}`}>
                        {loc.profit >= 0 ? "+" : ""}{formatCurrency(loc.profit, currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(loc.hourly, currency)}/h</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Day of Week */}
      {stats.sessionsByDayOfWeek.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Par jour de la semaine</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {stats.sessionsByDayOfWeek.map((d) => (
                <div key={d.day} className="text-center p-2 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">{DAY_NAMES[d.day]}</p>
                  <p className={`font-bold text-sm ${d.avgProfit >= 0 ? "text-profit" : "text-loss"}`}>
                    {d.avgProfit >= 0 ? "+" : ""}{formatCurrency(d.avgProfit, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">{d.sessions}s</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Month */}
      {stats.profitByMonth.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Par mois</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.profitByMonth.slice(-12).map((m) => (
                <div key={m.month} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-sm">{m.month}</span>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-xs">{m.sessions}s</Badge>
                    <span className={`font-bold text-sm ${m.profit >= 0 ? "text-profit" : "text-loss"}`}>
                      {m.profit >= 0 ? "+" : ""}{formatCurrency(m.profit, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, valueClass, sub, icon }: {
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <p className={`text-xl font-bold ${valueClass ?? ""}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
