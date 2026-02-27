"use client";

import { useState } from "react";
import { createTournament } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TOURNAMENT_STRUCTURES, GAME_TYPES, CURRENCIES } from "@/lib/constants";
import type { Location } from "@/types/database";

interface TournamentFormProps {
  locations: Location[];
  defaultCurrency?: string;
}

export function TournamentForm({ locations, defaultCurrency }: TournamentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const data: Record<string, unknown> = {
      tournament_name: form.get("tournament_name") || null,
      structure_type: form.get("structure_type"),
      buy_in_amount: parseFloat(form.get("buy_in_amount") as string),
      fee: parseFloat(form.get("fee") as string) || 0,
      rebuy_count: parseInt(form.get("rebuy_count") as string) || 0,
      rebuy_cost: parseFloat(form.get("rebuy_cost") as string) || 0,
      addon_count: parseInt(form.get("addon_count") as string) || 0,
      addon_cost: parseFloat(form.get("addon_cost") as string) || 0,
      total_entries: form.get("total_entries") ? parseInt(form.get("total_entries") as string) : null,
      finish_position: form.get("finish_position") ? parseInt(form.get("finish_position") as string) : null,
      prize_won: parseFloat(form.get("prize_won") as string) || 0,
      bounties_won: parseFloat(form.get("bounties_won") as string) || 0,
      is_bounty: form.get("is_bounty") === "true",
      game_type: form.get("game_type"),
      is_online: form.get("is_online") === "true",
      location_id: form.get("location_id") || null,
      currency: form.get("currency"),
    };

    const result = await createTournament(data);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader><CardTitle>Nouveau tournoi</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label>Nom du tournoi</Label>
            <Input name="tournament_name" placeholder="Main Event..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Structure</Label>
              <Select name="structure_type" required>
                {TOURNAMENT_STRUCTURES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type de jeu</Label>
              <Select name="game_type" defaultValue="nlhe">
                {GAME_TYPES.map((gt) => (
                  <option key={gt.value} value={gt.value}>{gt.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Buy-in</Label>
              <Input name="buy_in_amount" type="number" step="0.01" min="0.01" required />
            </div>
            <div className="space-y-2">
              <Label>Fee</Label>
              <Input name="fee" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rebuys</Label>
              <Input name="rebuy_count" type="number" min="0" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label>Coût rebuy</Label>
              <Input name="rebuy_cost" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Add-ons</Label>
              <Input name="addon_count" type="number" min="0" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label>Coût add-on</Label>
              <Input name="addon_cost" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entries totales</Label>
              <Input name="total_entries" type="number" min="1" />
            </div>
            <div className="space-y-2">
              <Label>Position finale</Label>
              <Input name="finish_position" type="number" min="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prize won</Label>
              <Input name="prize_won" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label>Bounties won</Label>
              <Input name="bounties_won" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select name="is_online" defaultValue="false">
                <option value="false">Live</option>
                <option value="true">Online</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <Select name="currency" defaultValue={defaultCurrency || "EUR"}>
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.symbol}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bounty ?</Label>
              <Select name="is_bounty" defaultValue="false">
                <option value="false">Non</option>
                <option value="true">Oui</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lieu</Label>
            <Select name="location_id" defaultValue="">
              <option value="">Aucun</option>
              {locations.filter((l) => !l.is_archived).map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </Select>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Enregistrer le tournoi
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
