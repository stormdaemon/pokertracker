"use server";

import { createClient } from "@/lib/supabase/server";

export async function exportSessionsCSV() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, location:locations(name)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (!sessions || sessions.length === 0) {
    return { error: "Aucune session à exporter" };
  }

  const headers = [
    "Date", "Fin", "Durée (min)", "Type de jeu", "Format", "En ligne",
    "Small Blind", "Big Blind", "Lieu", "Devise", "Buy-in", "Cash Out",
    "Profit", "Net Profit", "Pourboire", "Rake", "Dépenses",
    "Taille table", "Humeur avant", "Humeur après", "Focus", "Notes", "Tags",
  ];

  const rows = sessions.map((s: any) => [
    s.started_at,
    s.ended_at ?? "",
    s.duration_minutes ?? "",
    s.game_type,
    s.game_format,
    s.is_online ? "Oui" : "Non",
    s.small_blind ?? "",
    s.big_blind ?? "",
    s.location?.name ?? "",
    s.currency,
    s.buy_in_total,
    s.cash_out ?? "",
    s.profit ?? "",
    s.net_profit ?? "",
    s.tip ?? 0,
    s.rake_paid ?? "",
    s.expenses ?? 0,
    s.table_size ?? "",
    s.mood_before ?? "",
    s.mood_after ?? "",
    s.focus_level ?? "",
    (s.notes ?? "").replace(/"/g, '""'),
    (s.tags ?? []).join(";"),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row: any[]) =>
      row.map((cell: any) => {
        const str = String(cell);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str}"`
          : str;
      }).join(",")
    ),
  ].join("\n");

  return { csv: csvContent, filename: `poker-sessions-${new Date().toISOString().slice(0, 10)}.csv` };
}

export async function exportTournamentsCSV() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*, session:sessions(started_at, currency, is_online, location:locations(name))")
    .eq("user_id", user.id)
    .order("session(started_at)", { ascending: false });

  if (!tournaments || tournaments.length === 0) {
    return { error: "Aucun tournoi à exporter" };
  }

  const headers = [
    "Date", "Nom", "Structure", "Buy-in", "Fee", "Rebuys", "Coût Rebuy",
    "Add-ons", "Coût Add-on", "Total investi", "Entries", "Position",
    "Prize Won", "Bounties Won", "ROI%", "ITM", "Bounty?", "En ligne", "Lieu",
  ];

  const rows = tournaments.map((t: any) => [
    t.session?.started_at ?? "",
    t.tournament_name ?? "",
    t.structure_type,
    t.buy_in_amount,
    t.fee,
    t.rebuy_count,
    t.rebuy_cost,
    t.addon_count,
    t.addon_cost,
    t.total_invested ?? "",
    t.total_entries ?? "",
    t.finish_position ?? "",
    t.prize_won,
    t.bounties_won,
    t.roi_percent ?? "",
    t.itm ? "Oui" : "Non",
    t.is_bounty ? "Oui" : "Non",
    t.session?.is_online ? "Oui" : "Non",
    t.session?.location?.name ?? "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row: any[]) =>
      row.map((cell: any) => {
        const str = String(cell);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str}"`
          : str;
      }).join(",")
    ),
  ].join("\n");

  return { csv: csvContent, filename: `poker-tournaments-${new Date().toISOString().slice(0, 10)}.csv` };
}

export async function exportAllDataJSON() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const [
    { data: profile },
    { data: sessions },
    { data: tournaments },
    { data: bankroll },
    { data: locations },
    { data: handNotes },
    { data: buyIns },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("sessions").select("*").eq("user_id", user.id).order("started_at", { ascending: false }),
    supabase.from("tournaments").select("*").eq("user_id", user.id),
    supabase.from("bankroll_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("locations").select("*").eq("user_id", user.id),
    supabase.from("hand_notes").select("*").eq("user_id", user.id),
    supabase.from("buy_ins").select("*").eq("user_id", user.id),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    profile,
    sessions: sessions ?? [],
    tournaments: tournaments ?? [],
    bankroll_transactions: bankroll ?? [],
    locations: locations ?? [],
    hand_notes: handNotes ?? [],
    buy_ins: buyIns ?? [],
  };

  return {
    json: JSON.stringify(exportData, null, 2),
    filename: `poker-tracker-export-${new Date().toISOString().slice(0, 10)}.json`,
  };
}
