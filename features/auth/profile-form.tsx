"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENCIES, GAME_TYPES } from "@/lib/constants";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const form = new FormData(e.currentTarget);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.get("display_name") as string,
        default_currency: form.get("default_currency") as string,
        timezone: form.get("timezone") as string,
        default_game_type: (form.get("default_game_type") as string) || null,
        default_stake: (form.get("default_stake") as string) || null,
        bankroll_initial: parseFloat(form.get("bankroll_initial") as string) || 0,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Profil mis à jour");
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Pseudo</Label>
            <Input name="display_name" defaultValue={profile.display_name} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default_currency">Devise par défaut</Label>
              <Select name="default_currency" defaultValue={profile.default_currency}>
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.symbol} {c.value}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Input name="timezone" defaultValue={profile.timezone} placeholder="Europe/Paris" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default_game_type">Jeu par défaut</Label>
              <Select name="default_game_type" defaultValue={profile.default_game_type || ""}>
                <option value="">Aucun</option>
                {GAME_TYPES.map((gt) => (
                  <option key={gt.value} value={gt.value}>{gt.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_stake">Stakes par défaut</Label>
              <Input name="default_stake" defaultValue={profile.default_stake || ""} placeholder="1/2" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankroll_initial">Bankroll initiale</Label>
            <Input name="bankroll_initial" type="number" step="0.01" defaultValue={profile.bankroll_initial} />
          </div>

          <Button type="submit" loading={loading}>Sauvegarder</Button>
        </form>
      </CardContent>
    </Card>
  );
}
