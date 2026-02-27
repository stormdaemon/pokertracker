"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTournamentSchema } from "@/lib/validators/tournament";

export async function createTournament(data: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const parsed = createTournamentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const input = parsed.data;
  const totalInvested = input.buy_in_amount + input.fee + (input.rebuy_count * input.rebuy_cost) + (input.addon_count * input.addon_cost);
  const profit = input.prize_won + input.bounties_won - totalInvested;

  // Create session
  const { data: session, error: sessError } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      game_type: input.game_type,
      game_format: "tournament",
      is_online: input.is_online,
      location_id: input.location_id || null,
      started_at: input.started_at || new Date().toISOString(),
      ended_at: input.ended_at || new Date().toISOString(),
      currency: input.currency,
      buy_in_total: totalInvested,
      cash_out: input.prize_won + input.bounties_won,
      is_active: false,
      mood_before: input.mood_before || null,
      mood_after: input.mood_after || null,
      notes: input.notes || null,
      tags: input.tags,
    })
    .select()
    .single();

  if (sessError || !session) return { error: "Erreur création session" };

  // Create tournament
  const { error: tournError } = await supabase.from("tournaments").insert({
    session_id: session.id,
    user_id: user.id,
    tournament_name: input.tournament_name || null,
    structure_type: input.structure_type,
    buy_in_amount: input.buy_in_amount,
    fee: input.fee,
    rebuy_count: input.rebuy_count,
    rebuy_cost: input.rebuy_cost,
    addon_count: input.addon_count,
    addon_cost: input.addon_cost,
    total_entries: input.total_entries || null,
    finish_position: input.finish_position || null,
    prize_won: input.prize_won,
    bounties_won: input.bounties_won,
    is_bounty: input.is_bounty,
    guaranteed_prize: input.guaranteed_prize || null,
  });

  if (tournError) return { error: "Erreur création tournoi" };

  // Bankroll transaction
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
    amount: profit,
    balance_after: previousBalance + profit,
    session_id: session.id,
    currency: input.currency,
    description: `Tournoi ${input.tournament_name || input.structure_type} - ${profit >= 0 ? "Gain" : "Perte"}`,
  });

  revalidatePath("/tournaments");
  revalidatePath("/dashboard");
  revalidatePath("/bankroll");
  redirect("/tournaments");
}

export async function getTournaments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("tournaments")
    .select("*, session:sessions(started_at, ended_at, currency, game_type, is_online, location:locations(name))")
    .eq("user_id", user.id)
    .order("session(started_at)", { ascending: false });

  return data ?? [];
}

export async function getTournamentStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .eq("user_id", user.id);

  if (!tournaments || tournaments.length === 0) return null;

  const totalInvested = tournaments.reduce((s, t) => s + (t.total_invested ?? 0), 0);
  const totalWon = tournaments.reduce((s, t) => s + t.prize_won + t.bounties_won, 0);
  const itmCount = tournaments.filter((t) => t.itm).length;
  const avgROI = tournaments.reduce((s, t) => s + (t.roi_percent ?? 0), 0) / tournaments.length;
  const positions = tournaments.filter((t) => t.finish_position).map((t) => t.finish_position!);
  const avgFinish = positions.length > 0 ? positions.reduce((a, b) => a + b, 0) / positions.length : null;

  return {
    count: tournaments.length,
    totalInvested,
    totalWon,
    profit: totalWon - totalInvested,
    itmRate: (itmCount / tournaments.length) * 100,
    avgROI,
    avgFinish,
  };
}
