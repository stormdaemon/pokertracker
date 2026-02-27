"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SessionTimer } from "./session-timer";
import { CashOutForm } from "./cash-out-form";
import { addRebuy, deleteSession } from "./actions";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDuration, formatStakes } from "@/lib/utils/format";
import { GAME_TYPES, MOODS } from "@/lib/constants";
import { Clock, MapPin, DollarSign, Plus, Trash2 } from "lucide-react";
import type { Session, Location, BuyIn } from "@/types/database";

interface SessionDetailProps {
  session: Session & { location?: Location | null; buy_ins?: BuyIn[] };
}

export function SessionDetail({ session }: SessionDetailProps) {
  const [showCashOut, setShowCashOut] = useState(false);
  const [rebuyAmount, setRebuyAmount] = useState("");
  const [showRebuy, setShowRebuy] = useState(false);

  const gameLabel = GAME_TYPES.find((g) => g.value === session.game_type)?.label ?? session.game_type;

  async function handleRebuy() {
    const amount = parseFloat(rebuyAmount);
    if (amount > 0) {
      await addRebuy(session.id, amount);
      setRebuyAmount("");
      setShowRebuy(false);
    }
  }

  async function handleDelete() {
    if (confirm("Supprimer cette session ? Cette action est irréversible.")) {
      await deleteSession(session.id);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{gameLabel}</CardTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {session.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {session.location.name}
                  </span>
                )}
                <Badge variant={session.is_online ? "secondary" : "outline"}>
                  {session.is_online ? "Online" : "Live"}
                </Badge>
                {session.small_blind && session.big_blind && (
                  <Badge variant="outline">{formatStakes(session.small_blind, session.big_blind)}</Badge>
                )}
              </div>
            </div>
            {session.is_active && <Badge variant="default">En cours</Badge>}
            {!session.is_active && session.net_profit !== null && (
              <span className={`text-2xl font-bold ${session.net_profit >= 0 ? "text-profit" : "text-loss"}`}>
                {session.net_profit >= 0 ? "+" : ""}{formatCurrency(session.net_profit, session.currency)}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Timer for active session */}
      {session.is_active && (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Durée de session</p>
            <SessionTimer startedAt={session.started_at} />
            <p className="text-lg font-semibold mt-4">
              Buy-in total : {formatCurrency(session.buy_in_total, session.currency)}
            </p>

            <div className="flex gap-2 mt-6 justify-center">
              {showRebuy ? (
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Montant"
                    value={rebuyAmount}
                    onChange={(e) => setRebuyAmount(e.target.value)}
                    className="w-32"
                  />
                  <Button onClick={handleRebuy} size="sm">OK</Button>
                  <Button onClick={() => setShowRebuy(false)} variant="ghost" size="sm">Annuler</Button>
                </div>
              ) : (
                <Button onClick={() => setShowRebuy(true)} variant="outline">
                  <Plus className="h-4 w-4" /> Rebuy
                </Button>
              )}
              <Button onClick={() => setShowCashOut(true)} variant="default">
                <DollarSign className="h-4 w-4" /> Cash Out
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Out Form */}
      {showCashOut && session.is_active && (
        <Card>
          <CardHeader><CardTitle>Cash Out</CardTitle></CardHeader>
          <CardContent>
            <CashOutForm sessionId={session.id} buyInTotal={session.buy_in_total} />
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <Card>
        <CardHeader><CardTitle>Détails</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Début</span>
              <p className="font-medium">{new Date(session.started_at).toLocaleString("fr-FR")}</p>
            </div>
            {session.ended_at && (
              <div>
                <span className="text-muted-foreground">Fin</span>
                <p className="font-medium">{new Date(session.ended_at).toLocaleString("fr-FR")}</p>
              </div>
            )}
            {session.duration_minutes && (
              <div>
                <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Durée</span>
                <p className="font-medium">{formatDuration(session.duration_minutes)}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Buy-in total</span>
              <p className="font-medium">{formatCurrency(session.buy_in_total, session.currency)}</p>
            </div>
            {session.cash_out !== null && (
              <div>
                <span className="text-muted-foreground">Cash out</span>
                <p className="font-medium">{formatCurrency(session.cash_out, session.currency)}</p>
              </div>
            )}
            {session.tip > 0 && (
              <div>
                <span className="text-muted-foreground">Pourboire</span>
                <p className="font-medium">{formatCurrency(session.tip, session.currency)}</p>
              </div>
            )}
            {session.mood_before && (
              <div>
                <span className="text-muted-foreground">Humeur avant</span>
                <p className="text-xl">{MOODS.find((m) => m.value === session.mood_before)?.emoji}</p>
              </div>
            )}
            {session.mood_after && (
              <div>
                <span className="text-muted-foreground">Humeur après</span>
                <p className="text-xl">{MOODS.find((m) => m.value === session.mood_after)?.emoji}</p>
              </div>
            )}
          </div>
          {session.notes && (
            <div>
              <span className="text-sm text-muted-foreground">Notes</span>
              <p className="text-sm mt-1">{session.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buy-ins list */}
      {session.buy_ins && session.buy_ins.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Buy-ins ({session.buy_ins.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {session.buy_ins.map((bi, i) => (
                <div key={bi.id} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                  <span className="text-muted-foreground">Buy-in #{i + 1}</span>
                  <span className="font-medium">{formatCurrency(bi.amount, session.currency)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" /> Supprimer
        </Button>
      </div>
    </div>
  );
}
