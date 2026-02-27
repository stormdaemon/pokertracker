"use server";

import { createClient } from "@/lib/supabase/server";

export interface StatsData {
  totalProfit: number;
  sessionCount: number;
  winRate: number;
  hourlyRate: number;
  bbPerHour: number | null;
  avgSession: number;
  avgDuration: number;
  bestSession: number;
  worstSession: number;
  stdDev: number;
  totalHours: number;
  currency: string;
  profitByMonth: Array<{ month: string; profit: number; sessions: number }>;
  profitByGameType: Array<{ game_type: string; profit: number; sessions: number; hourly: number }>;
  profitByLocation: Array<{ location_name: string; profit: number; sessions: number; hourly: number }>;
  profitByDay: Array<{ date: string; profit: number; cumulative: number }>;
  sessionsByDayOfWeek: Array<{ day: number; sessions: number; avgProfit: number }>;
}

export async function getStats(filters?: {
  dateFrom?: string;
  dateTo?: string;
  gameType?: string;
  isOnline?: boolean;
}): Promise<StatsData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_currency")
    .eq("id", user.id)
    .single();

  let query = supabase
    .from("sessions")
    .select("*, location:locations(name)")
    .eq("user_id", user.id)
    .not("cash_out", "is", null)
    .order("started_at", { ascending: true });

  if (filters?.dateFrom) query = query.gte("started_at", filters.dateFrom);
  if (filters?.dateTo) query = query.lte("started_at", filters.dateTo);
  if (filters?.gameType) query = query.eq("game_type", filters.gameType);
  if (filters?.isOnline !== undefined) query = query.eq("is_online", filters.isOnline);

  const { data: sessions } = await query;

  if (!sessions || sessions.length === 0) {
    return {
      totalProfit: 0, sessionCount: 0, winRate: 0, hourlyRate: 0,
      bbPerHour: null, avgSession: 0, avgDuration: 0, bestSession: 0,
      worstSession: 0, stdDev: 0, totalHours: 0,
      currency: profile?.default_currency ?? "EUR",
      profitByMonth: [], profitByGameType: [], profitByLocation: [],
      profitByDay: [], sessionsByDayOfWeek: [],
    };
  }

  const profits = sessions.map((s) => s.net_profit ?? 0);
  const durations = sessions.map((s) => s.duration_minutes ?? 0);
  const totalProfit = profits.reduce((a, b) => a + b, 0);
  const totalMinutes = durations.reduce((a, b) => a + b, 0);
  const winningCount = profits.filter((p) => p >= 0).length;

  const mean = totalProfit / sessions.length;
  const variance = profits.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / sessions.length;
  const stdDev = Math.sqrt(variance);

  // BB/h if stakes available
  let bbPerHour: number | null = null;
  const sessionsWithBB = sessions.filter((s) => s.big_blind && s.duration_minutes && s.duration_minutes > 0);
  if (sessionsWithBB.length > 0) {
    const totalBB = sessionsWithBB.reduce((sum, s) => sum + ((s.net_profit ?? 0) / s.big_blind!), 0);
    const totalHrsBB = sessionsWithBB.reduce((sum, s) => sum + (s.duration_minutes! / 60), 0);
    bbPerHour = totalHrsBB > 0 ? totalBB / totalHrsBB : null;
  }

  // Profit by month
  const byMonth = new Map<string, { profit: number; sessions: number }>();
  for (const s of sessions) {
    const month = s.started_at.slice(0, 7);
    const entry = byMonth.get(month) ?? { profit: 0, sessions: 0 };
    entry.profit += s.net_profit ?? 0;
    entry.sessions++;
    byMonth.set(month, entry);
  }

  // Profit by game type
  const byGameType = new Map<string, { profit: number; sessions: number; minutes: number }>();
  for (const s of sessions) {
    const entry = byGameType.get(s.game_type) ?? { profit: 0, sessions: 0, minutes: 0 };
    entry.profit += s.net_profit ?? 0;
    entry.sessions++;
    entry.minutes += s.duration_minutes ?? 0;
    byGameType.set(s.game_type, entry);
  }

  // Profit by location
  const byLocation = new Map<string, { profit: number; sessions: number; minutes: number }>();
  for (const s of sessions) {
    const name = (s.location as any)?.name ?? "Sans lieu";
    const entry = byLocation.get(name) ?? { profit: 0, sessions: 0, minutes: 0 };
    entry.profit += s.net_profit ?? 0;
    entry.sessions++;
    entry.minutes += s.duration_minutes ?? 0;
    byLocation.set(name, entry);
  }

  // Cumulative profit by day
  let cumulative = 0;
  const profitByDay = sessions.map((s) => {
    cumulative += s.net_profit ?? 0;
    return { date: s.started_at.slice(0, 10), profit: s.net_profit ?? 0, cumulative };
  });

  // By day of week
  const byDayOfWeek = new Map<number, { sessions: number; totalProfit: number }>();
  for (const s of sessions) {
    const day = new Date(s.started_at).getDay();
    const entry = byDayOfWeek.get(day) ?? { sessions: 0, totalProfit: 0 };
    entry.sessions++;
    entry.totalProfit += s.net_profit ?? 0;
    byDayOfWeek.set(day, entry);
  }

  return {
    totalProfit,
    sessionCount: sessions.length,
    winRate: (winningCount / sessions.length) * 100,
    hourlyRate: totalMinutes > 0 ? totalProfit / (totalMinutes / 60) : 0,
    bbPerHour,
    avgSession: mean,
    avgDuration: totalMinutes / sessions.length,
    bestSession: Math.max(...profits),
    worstSession: Math.min(...profits),
    stdDev,
    totalHours: totalMinutes / 60,
    currency: profile?.default_currency ?? "EUR",
    profitByMonth: Array.from(byMonth.entries()).map(([month, v]) => ({ month, ...v })),
    profitByGameType: Array.from(byGameType.entries()).map(([game_type, v]) => ({
      game_type,
      profit: v.profit,
      sessions: v.sessions,
      hourly: v.minutes > 0 ? v.profit / (v.minutes / 60) : 0,
    })),
    profitByLocation: Array.from(byLocation.entries()).map(([location_name, v]) => ({
      location_name,
      profit: v.profit,
      sessions: v.sessions,
      hourly: v.minutes > 0 ? v.profit / (v.minutes / 60) : 0,
    })),
    profitByDay,
    sessionsByDayOfWeek: Array.from(byDayOfWeek.entries()).map(([day, v]) => ({
      day,
      sessions: v.sessions,
      avgProfit: v.totalProfit / v.sessions,
    })).sort((a, b) => a.day - b.day),
  };
}
