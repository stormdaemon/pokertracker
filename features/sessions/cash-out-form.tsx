"use client";

import { useState } from "react";
import { cashOutSession } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOODS } from "@/lib/constants";

interface CashOutFormProps {
  sessionId: string;
  buyInTotal: number;
  onSuccess?: (profit: number) => void;
}

export function CashOutForm({ sessionId, buyInTotal, onSuccess }: CashOutFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cashOut, setCashOut] = useState("");

  const cashOutNum = parseFloat(cashOut) || 0;
  const estimatedProfit = cashOutNum - buyInTotal;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const data = {
      cash_out: parseFloat(form.get("cash_out") as string),
      tip: parseFloat(form.get("tip") as string) || 0,
      expenses: parseFloat(form.get("expenses") as string) || 0,
      mood_after: form.get("mood_after") ? parseInt(form.get("mood_after") as string) : null,
      focus_level: form.get("focus_level") ? parseInt(form.get("focus_level") as string) : null,
    };

    const result = await cashOutSession(sessionId, data);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      onSuccess?.(result.profit);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="cash_out">Cash Out</Label>
        <Input
          name="cash_out"
          type="number"
          step="0.01"
          min="0"
          placeholder="350"
          required
          value={cashOut}
          onChange={(e) => setCashOut(e.target.value)}
        />
        {cashOut && (
          <p className={`text-sm font-medium ${estimatedProfit >= 0 ? "text-profit" : "text-loss"}`}>
            {estimatedProfit >= 0 ? "+" : ""}{estimatedProfit.toFixed(2)} &euro;
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tip">Pourboire</Label>
          <Input name="tip" type="number" step="0.01" min="0" placeholder="0" defaultValue="0" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expenses">Frais</Label>
          <Input name="expenses" type="number" step="0.01" min="0" placeholder="0" defaultValue="0" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Humeur après</Label>
        <div className="flex gap-2">
          {MOODS.map((mood) => (
            <label key={mood.value} className="cursor-pointer">
              <input type="radio" name="mood_after" value={mood.value} className="sr-only peer" />
              <span className="text-2xl opacity-40 peer-checked:opacity-100 transition-opacity block text-center">
                {mood.emoji}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Niveau de focus</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <label key={level} className="cursor-pointer">
              <input type="radio" name="focus_level" value={level} className="sr-only peer" />
              <span className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-sm font-medium opacity-40 peer-checked:opacity-100 peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary transition-all">
                {level}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Terminer la session
      </Button>
    </form>
  );
}
