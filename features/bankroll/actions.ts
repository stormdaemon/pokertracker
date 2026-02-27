"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bankrollTransactionSchema } from "@/lib/validators/bankroll";

export async function getBankrollData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("bankroll_initial, default_currency")
    .eq("id", user.id)
    .single();

  const { data: transactions } = await supabase
    .from("bankroll_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const balance = transactions?.[0]?.balance_after ?? profile?.bankroll_initial ?? 0;

  // Calculate this month & week profit
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)).toISOString();

  const monthTxs = (transactions ?? []).filter(
    (t) => t.type === "session_result" && t.created_at >= startOfMonth
  );
  const weekTxs = (transactions ?? []).filter(
    (t) => t.type === "session_result" && t.created_at >= startOfWeek
  );

  const monthProfit = monthTxs.reduce((s, t) => s + t.amount, 0);
  const weekProfit = weekTxs.reduce((s, t) => s + t.amount, 0);

  // All-time high/low
  let allTimeHigh = profile?.bankroll_initial ?? 0;
  let allTimeLow = profile?.bankroll_initial ?? 0;
  for (const tx of (transactions ?? []).slice().reverse()) {
    if (tx.balance_after > allTimeHigh) allTimeHigh = tx.balance_after;
    if (tx.balance_after < allTimeLow) allTimeLow = tx.balance_after;
  }

  return {
    balance,
    currency: profile?.default_currency ?? "EUR",
    bankrollInitial: profile?.bankroll_initial ?? 0,
    transactions: transactions ?? [],
    monthProfit,
    weekProfit,
    allTimeHigh,
    allTimeLow,
  };
}

export async function addBankrollTransaction(data: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const parsed = bankrollTransactionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const input = parsed.data;

  // Get current balance
  const { data: lastTx } = await supabase
    .from("bankroll_transactions")
    .select("balance_after")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("bankroll_initial")
    .eq("id", user.id)
    .single();

  const currentBalance = lastTx?.balance_after ?? profile?.bankroll_initial ?? 0;
  const signedAmount = input.type === "withdrawal" ? -input.amount : input.amount;
  const newBalance = currentBalance + signedAmount;

  const { error } = await supabase.from("bankroll_transactions").insert({
    user_id: user.id,
    type: input.type,
    amount: signedAmount,
    balance_after: newBalance,
    currency: input.currency,
    description: input.description || null,
  });

  if (error) return { error: "Erreur lors de la transaction" };

  revalidatePath("/bankroll");
  revalidatePath("/dashboard");
  return { success: true };
}
