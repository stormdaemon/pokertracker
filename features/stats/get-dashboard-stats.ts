"use server";

import { createClient } from "@/lib/supabase/server";

export interface DashboardStats {
  totalProfit: number;
  hourlyRate: number;
  winRate: number;
  sessionCount: number;
  bankrollBalance: number;
  activeSession: {
    id: string;
    started_at: string;
    game_type: string;
    buy_in_total: number;
  } | null;
  recentSessions: Array<{
    id: string;
    started_at: string;
    game_type: string;
    net_profit: number | null;
    is_active: boolean;
    currency: string;
    duration_minutes: number | null;
    location?: { name: string } | null;
  }>;
  streak: { type: "winning" | "losing" | "none"; count: number };
  bestSession: number | null;
  worstSession: number | null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const defaults: DashboardStats = {
    totalProfit: 0,
    hourlyRate: 0,
    winRate: 0,
    sessionCount: 0,
    bankrollBalance: 0,
    activeSession: null,
    recentSessions: [],
    streak: { type: "none", count: 0 },
    bestSession: null,
    worstSession: null,
  };

  if (!user) return defaults;

  // Get all completed sessions
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, net_profit, duration_minutes, is_active, started_at, game_type, buy_in_total, currency")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (!sessions || sessions.length === 0) {
    // Check for bankroll initial
    const { data: profile } = await supabase
      .from("profiles")
      .select("bankroll_initial")
      .eq("id", user.id)
      .single();
    defaults.bankrollBalance = profile?.bankroll_initial ?? 0;
    return defaults;
  }

  // Active session
  const active = sessions.find((s) => s.is_active);

  // Completed sessions only
  const completed = sessions.filter((s) => !s.is_active && s.net_profit !== null);

  const totalProfit = completed.reduce((sum, s) => sum + (s.net_profit ?? 0), 0);
  const totalMinutes = completed.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const winningCount = completed.filter((s) => (s.net_profit ?? 0) >= 0).length;

  // Streak
  let streakType: "winning" | "losing" | "none" = "none";
  let streakCount = 0;
  if (completed.length > 0) {
    const firstProfit = completed[0].net_profit ?? 0;
    streakType = firstProfit >= 0 ? "winning" : "losing";
    for (const s of completed) {
      const p = s.net_profit ?? 0;
      if ((streakType === "winning" && p >= 0) || (streakType === "losing" && p < 0)) {
        streakCount++;
      } else {
        break;
      }
    }
  }

  // Bankroll
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

  // Recent sessions with location
  const { data: recent } = await supabase
    .from("sessions")
    .select("id, started_at, game_type, net_profit, is_active, currency, duration_minutes, location:locations(name)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(5);

  const profits = completed.map((s) => s.net_profit ?? 0);

  return {
    totalProfit,
    hourlyRate: totalMinutes > 0 ? totalProfit / (totalMinutes / 60) : 0,
    winRate: completed.length > 0 ? (winningCount / completed.length) * 100 : 0,
    sessionCount: sessions.length,
    bankrollBalance: lastTx?.balance_after ?? profile?.bankroll_initial ?? 0,
    activeSession: active ? {
      id: active.id,
      started_at: active.started_at,
      game_type: active.game_type,
      buy_in_total: active.buy_in_total,
    } : null,
    recentSessions: (recent ?? []).map((s: any) => ({
      id: s.id,
      started_at: s.started_at,
      game_type: s.game_type,
      net_profit: s.net_profit,
      is_active: s.is_active,
      currency: s.currency,
      duration_minutes: s.duration_minutes,
      location: Array.isArray(s.location) ? s.location[0] ?? null : s.location ?? null,
    })),
    streak: { type: streakType, count: streakCount },
    bestSession: profits.length > 0 ? Math.max(...profits) : null,
    worstSession: profits.length > 0 ? Math.min(...profits) : null,
  };
}
