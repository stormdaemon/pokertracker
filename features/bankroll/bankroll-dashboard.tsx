"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils/format";
import { addBankrollTransaction } from "./actions";
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import type { BankrollTransaction } from "@/types/database";

interface BankrollDashboardProps {
  balance: number;
  currency: string;
  monthProfit: number;
  weekProfit: number;
  allTimeHigh: number;
  allTimeLow: number;
  transactions: BankrollTransaction[];
}

export function BankrollDashboard({
  balance, currency, monthProfit, weekProfit, allTimeHigh, allTimeLow, transactions,
}: BankrollDashboardProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleTransaction(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const result = await addBankrollTransaction({
      type: form.get("type"),
      amount: parseFloat(form.get("amount") as string),
      description: form.get("description") || null,
    });
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Transaction enregistrée");
      setShowForm(false);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Balance */}
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-1">Bankroll actuelle</p>
          <p className="text-4xl font-bold">{formatCurrency(balance, currency)}</p>
          <div className="flex gap-4 justify-center mt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Cette semaine</p>
              <p className={`font-semibold ${weekProfit >= 0 ? "text-profit" : "text-loss"}`}>
                {weekProfit >= 0 ? "+" : ""}{formatCurrency(weekProfit, currency)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ce mois</p>
              <p className={`font-semibold ${monthProfit >= 0 ? "text-profit" : "text-loss"}`}>
                {monthProfit >= 0 ? "+" : ""}{formatCurrency(monthProfit, currency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ATH / ATL */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <ArrowUpCircle className="h-5 w-5 text-profit" />
            <div>
              <p className="text-xs text-muted-foreground">All-Time High</p>
              <p className="font-bold text-profit">{formatCurrency(allTimeHigh, currency)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <ArrowDownCircle className="h-5 w-5 text-loss" />
            <div>
              <p className="text-xs text-muted-foreground">All-Time Low</p>
              <p className="font-bold text-loss">{formatCurrency(allTimeLow, currency)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add transaction */}
      <div>
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
            <Plus className="h-4 w-4" /> Ajouter un mouvement
          </Button>
        ) : (
          <Card>
            <CardHeader><CardTitle>Nouveau mouvement</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select name="type" required>
                      <option value="deposit">Dépôt</option>
                      <option value="withdrawal">Retrait</option>
                      <option value="adjustment">Ajustement</option>
                      <option value="bonus">Bonus</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Montant</Label>
                    <Input name="amount" type="number" step="0.01" min="0.01" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea name="description" placeholder="Description (obligatoire pour ajustement)" rows={2} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" loading={loading}>Enregistrer</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction history */}
      <Card>
        <CardHeader><CardTitle>Historique</CardTitle></CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucune transaction</p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 20).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    {tx.amount >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-profit" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-loss" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        <Badge variant="outline" className="text-xs mr-2">{tx.type}</Badge>
                        {tx.description || ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${tx.amount >= 0 ? "text-profit" : "text-loss"}`}>
                      {tx.amount >= 0 ? "+" : ""}{formatCurrency(tx.amount, tx.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(tx.balance_after, tx.currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
