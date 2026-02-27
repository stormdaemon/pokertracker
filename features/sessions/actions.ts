"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSessionSchema, cashOutSchema } from "@/lib/validators/session";

export async function createSession(data: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const parsed = createSessionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const input = parsed.data;
  const startedAt = input.started_at || new Date().toISOString();

  // Create the session
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      game_type: input.game_type,
      game_format: input.game_format,
      is_online: input.is_online,
      location_id: input.location_id || null,
      started_at: startedAt,
      small_blind: input.small_blind || null,
      big_blind: input.big_blind || null,
      ante: input.ante || null,
      straddle: input.straddle,
      max_buyin_bb: input.max_buyin_bb || null,
      currency: input.currency,
      buy_in_total: input.buy_in_amount,
      table_size: input.table_size || null,
      mood_before: input.mood_before || null,
      notes: input.notes || null,
      tags: input.tags,
      is_active: true,
    })
    .select()
    .single();

  if (sessionError) {
    return { error: "Erreur lors de la création de la session" };
  }

  // Create the first buy-in
  await supabase.from("buy_ins").insert({
    session_id: session.id,
    user_id: user.id,
    amount: input.buy_in_amount,
  });

  revalidatePath("/dashboard");
  revalidatePath("/sessions");
  redirect(`/sessions/${session.id}`);
}

export async function cashOutSession(sessionId: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const parsed = cashOutSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const input = parsed.data;

  // Update the session
  const { data: session, error } = await supabase
    .from("sessions")
    .update({
      cash_out: input.cash_out,
      ended_at: new Date().toISOString(),
      is_active: false,
      mood_after: input.mood_after || null,
      focus_level: input.focus_level || null,
      tip: input.tip,
      expenses: input.expenses,
      rake_paid: input.rake_paid || null,
      notes: input.notes || undefined,
    })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !session) {
    return { error: "Erreur lors de la clôture" };
  }

  // Create bankroll transaction
  const netProfit = input.cash_out - session.buy_in_total - input.tip - input.expenses;
  const { data: lastTx } = await supabase
    .from("bankroll_transactions")
    .select("balance_after")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const previousBalance = lastTx?.balance_after ?? 0;

  await supabase.from("bankroll_transactions").insert({
    user_id: user.id,
    type: "session_result",
    amount: netProfit,
    balance_after: previousBalance + netProfit,
    session_id: sessionId,
    currency: session.currency,
    description: `Session ${session.game_type.toUpperCase()} - ${netProfit >= 0 ? "Gain" : "Perte"}`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/sessions");
  revalidatePath("/bankroll");
  return { success: true, profit: netProfit };
}

export async function addRebuy(sessionId: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  if (amount <= 0) return { error: "Montant invalide" };

  const { error } = await supabase.from("buy_ins").insert({
    session_id: sessionId,
    user_id: user.id,
    amount,
  });

  if (error) return { error: "Erreur lors de l'ajout du rebuy" };

  revalidatePath(`/sessions/${sessionId}`);
  return { success: true };
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) return { error: "Erreur lors de la suppression" };

  revalidatePath("/dashboard");
  revalidatePath("/sessions");
  redirect("/sessions");
}

export async function getSessions(filters?: {
  game_type?: string;
  is_online?: boolean;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], count: 0 };

  let query = supabase
    .from("sessions")
    .select("*, location:locations(*)", { count: "exact" })
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (filters?.game_type) {
    query = query.eq("game_type", filters.game_type);
  }
  if (filters?.is_online !== undefined) {
    query = query.eq("is_online", filters.is_online);
  }

  const limit = filters?.limit ?? 20;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return { data: [], count: 0 };

  return { data: data ?? [], count: count ?? 0 };
}

export async function getSession(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("sessions")
    .select("*, location:locations(*), buy_ins(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return data;
}
