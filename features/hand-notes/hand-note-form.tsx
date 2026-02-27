"use client";

import { useState } from "react";
import { createHandNote } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POSITIONS } from "@/lib/constants";

interface HandNoteFormProps {
  sessionId: string;
  onSuccess?: () => void;
}

const HAND_TAGS = [
  "bluff", "value bet", "hero call", "bad beat", "cooler",
  "squeeze", "3-bet", "4-bet", "check-raise", "slow play",
  "overbet", "fold equity", "ICM", "bubble",
];

export function HandNoteForm({ sessionId, onSuccess }: HandNoteFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const data: Record<string, unknown> = {
      session_id: sessionId,
      hand_number: form.get("hand_number") ? parseInt(form.get("hand_number") as string) : null,
      hero_position: form.get("hero_position") || null,
      hero_cards: form.get("hero_cards") || null,
      board: form.get("board") || null,
      pot_size: form.get("pot_size") ? parseFloat(form.get("pot_size") as string) : null,
      result: form.get("result") ? parseFloat(form.get("result") as string) : null,
      action_summary: form.get("action_summary") || null,
      villain_description: form.get("villain_description") || null,
      lesson_learned: form.get("lesson_learned") || null,
      tags: selectedTags,
    };

    const result = await createHandNote(data);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onSuccess?.();
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Nouvelle note de main</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Main #</Label>
              <Input name="hand_number" type="number" min="1" placeholder="42" />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Select name="hero_position" defaultValue="">
                <option value="">-</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cartes</Label>
              <Input name="hero_cards" placeholder="AhKs" maxLength={20} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Board</Label>
              <Input name="board" placeholder="Ah 7c 2d Ks 9h" maxLength={30} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pot</Label>
                <Input name="pot_size" type="number" step="0.01" min="0" />
              </div>
              <div className="space-y-2">
                <Label>Résultat</Label>
                <Input name="result" type="number" step="0.01" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Action / Résumé de la main</Label>
            <Textarea name="action_summary" rows={3} placeholder="Hero raise UTG, villain 3-bet..." />
          </div>

          <div className="space-y-2">
            <Label>Description du vilain</Label>
            <Input name="villain_description" placeholder="Régulier TAG, joue serré..." />
          </div>

          <div className="space-y-2">
            <Label>Leçon apprise</Label>
            <Textarea name="lesson_learned" rows={2} placeholder="Ne pas bluffer les calling stations..." />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {HAND_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/30 text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Enregistrer la note
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
