"use client";

import { useState } from "react";
import { createSession } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GAME_TYPES, GAME_FORMATS, MOODS, CURRENCIES } from "@/lib/constants";
import type { Location } from "@/types/database";

interface SessionFormProps {
  locations: Location[];
  defaultGameType?: string;
  defaultCurrency?: string;
}

export function SessionForm({ locations, defaultGameType, defaultCurrency }: SessionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameFormat, setGameFormat] = useState("cash_game");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {
      game_type: form.get("game_type"),
      game_format: form.get("game_format"),
      is_online: form.get("is_online") === "true",
      location_id: form.get("location_id") || null,
      buy_in_amount: parseFloat(form.get("buy_in_amount") as string),
      currency: form.get("currency"),
      mood_before: form.get("mood_before") ? parseInt(form.get("mood_before") as string) : null,
      notes: form.get("notes") || null,
      tags: [],
    };

    const sb = form.get("small_blind");
    const bb = form.get("big_blind");
    if (sb) data.small_blind = parseFloat(sb as string);
    if (bb) data.big_blind = parseFloat(bb as string);

    const tableSize = form.get("table_size");
    if (tableSize) data.table_size = parseInt(tableSize as string);

    const result = await createSession(data);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Nouvelle session</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="game_type">Type de jeu</Label>
              <Select name="game_type" defaultValue={defaultGameType || "nlhe"}>
                {GAME_TYPES.map((gt) => (
                  <option key={gt.value} value={gt.value}>{gt.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="game_format">Format</Label>
              <Select name="game_format" value={gameFormat} onChange={(e) => setGameFormat(e.target.value)}>
                {GAME_FORMATS.map((gf) => (
                  <option key={gf.value} value={gf.value}>{gf.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buy_in_amount">Buy-in</Label>
            <Input
              name="buy_in_amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="small_blind">Small Blind</Label>
              <Input name="small_blind" type="number" step="0.01" min="0.01" placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="big_blind">Big Blind</Label>
              <Input name="big_blind" type="number" step="0.01" min="0.01" placeholder="2" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_id">Lieu</Label>
            <Select name="location_id" defaultValue="">
              <option value="">Aucun lieu</option>
              {locations
                .filter((l) => !l.is_archived)
                .sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0))
                .map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.is_favorite ? "★ " : ""}{loc.name}
                  </option>
                ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="is_online">Mode</Label>
              <Select name="is_online" defaultValue="false">
                <option value="false">Live</option>
                <option value="true">Online</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select name="currency" defaultValue={defaultCurrency || "EUR"}>
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.symbol} {c.value}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Humeur</Label>
            <div className="flex gap-2">
              {MOODS.map((mood) => (
                <label key={mood.value} className="cursor-pointer">
                  <input type="radio" name="mood_before" value={mood.value} className="sr-only peer" />
                  <span className="text-2xl opacity-40 peer-checked:opacity-100 transition-opacity block text-center">
                    {mood.emoji}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea name="notes" placeholder="Notes sur la session..." rows={2} />
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Démarrer la session
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
