"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDuration, formatStakes } from "@/lib/utils/format";
import { GAME_TYPES } from "@/lib/constants";
import { MapPin, Clock, TrendingUp, TrendingDown } from "lucide-react";
import type { Session, Location } from "@/types/database";

interface SessionsListProps {
  sessions: (Session & { location?: Location | null })[];
}

export function SessionsList({ sessions }: SessionsListProps) {
  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const gameLabel = GAME_TYPES.find((g) => g.value === session.game_type)?.label ?? session.game_type;
        const isWinning = session.net_profit !== null && session.net_profit >= 0;

        return (
          <Link key={session.id} href={`/sessions/${session.id}`}>
            <Card className="p-4 hover:bg-card/80 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{gameLabel}</span>
                    {session.small_blind && session.big_blind && (
                      <Badge variant="outline" className="text-xs">
                        {formatStakes(session.small_blind, session.big_blind)}
                      </Badge>
                    )}
                    <Badge variant={session.is_online ? "secondary" : "outline"} className="text-xs">
                      {session.is_online ? "Online" : "Live"}
                    </Badge>
                    {session.is_active && <Badge className="text-xs">En cours</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(session.started_at).toLocaleDateString("fr-FR")}</span>
                    {session.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {session.location.name}
                      </span>
                    )}
                    {session.duration_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatDuration(session.duration_minutes)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {session.net_profit !== null ? (
                    <div className="flex items-center gap-1">
                      {isWinning ? (
                        <TrendingUp className="h-4 w-4 text-profit" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-loss" />
                      )}
                      <span className={`font-bold ${isWinning ? "text-profit" : "text-loss"}`}>
                        {isWinning ? "+" : ""}{formatCurrency(session.net_profit, session.currency)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">En cours</span>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Buy-in: {formatCurrency(session.buy_in_total, session.currency)}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
