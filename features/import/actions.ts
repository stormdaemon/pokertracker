"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const GAME_TYPE_MAP: Record<string, string> = {
  "nlhe": "nlhe", "no-limit hold'em": "nlhe", "no limit holdem": "nlhe", "nl holdem": "nlhe",
  "plo": "plo", "pot-limit omaha": "plo", "omaha": "plo",
  "plo5": "plo5", "plo-5": "plo5",
  "stud": "stud", "razz": "razz", "horse": "horse", "mixed": "mixed", "other": "other",
};

function normalizeGameType(value: string): string {
  const normalized = value.toLowerCase().trim();
  return GAME_TYPE_MAP[normalized] ?? "nlhe";
}

function parseDate(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    // Try DD/MM/YYYY format
    const parts = value.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
    if (parts) {
      const [, day, month, year] = parts;
      const fullYear = year.length === 2 ? `20${year}` : year;
      const parsed = new Date(`${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }
    return null;
  }
  return d.toISOString();
}

function parseBool(value: string): boolean {
  const v = value.toLowerCase().trim();
  return ["true", "oui", "yes", "1", "online"].includes(v);
}

function parseNum(value: string): number | null {
  if (!value || value.trim() === "") return null;
  // Handle comma as decimal separator
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export async function importSessions(
  rows: string[][],
  headers: string[],
  mapping: Record<string, string>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  // Get user profile for defaults
  const { data: profile } = await supabase
    .from("profiles")
    .select("default_currency")
    .eq("id", user.id)
    .single();

  const defaultCurrency = profile?.default_currency ?? "EUR";

  // Pre-fetch existing locations
  const { data: existingLocations } = await supabase
    .from("locations")
    .select("id, name")
    .eq("user_id", user.id);

  const locationMap = new Map(
    (existingLocations ?? []).map((l) => [l.name.toLowerCase(), l.id])
  );

  function getCol(row: string[], field: string): string {
    const csvHeader = mapping[field];
    if (!csvHeader) return "";
    const idx = headers.indexOf(csvHeader);
    return idx >= 0 ? (row[idx] ?? "").trim() : "";
  }

  let imported = 0;
  let errors = 0;

  // Get last bankroll balance
  const { data: lastTx } = await supabase
    .from("bankroll_transactions")
    .select("balance_after")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let runningBalance = lastTx?.balance_after ?? 0;

  for (const row of rows) {
    try {
      const startedAt = parseDate(getCol(row, "started_at"));
      if (!startedAt) { errors++; continue; }

      const endedAt = parseDate(getCol(row, "ended_at")) || startedAt;
      const buyIn = parseNum(getCol(row, "buy_in_total"));
      if (buyIn === null || buyIn < 0) { errors++; continue; }

      const gameType = normalizeGameType(getCol(row, "game_type") || "nlhe");
      const cashOut = parseNum(getCol(row, "cash_out"));
      const tip = parseNum(getCol(row, "tip")) ?? 0;
      const expenses = parseNum(getCol(row, "expenses")) ?? 0;
      const currency = getCol(row, "currency") || defaultCurrency;
      const isOnline = getCol(row, "is_online") ? parseBool(getCol(row, "is_online")) : false;
      const notes = getCol(row, "notes") || null;
      const smallBlind = parseNum(getCol(row, "small_blind"));
      const bigBlind = parseNum(getCol(row, "big_blind"));

      // Resolve location
      let locationId: string | null = null;
      const locationName = getCol(row, "location_name");
      if (locationName) {
        const existingId = locationMap.get(locationName.toLowerCase());
        if (existingId) {
          locationId = existingId;
        } else {
          // Create the location
          const { data: newLoc } = await supabase
            .from("locations")
            .insert({
              user_id: user.id,
              name: locationName,
              type: isOnline ? "online" : "casino",
            })
            .select("id")
            .single();
          if (newLoc) {
            locationId = newLoc.id;
            locationMap.set(locationName.toLowerCase(), newLoc.id);
          }
        }
      }

      const { data: session, error: sessErr } = await supabase
        .from("sessions")
        .insert({
          user_id: user.id,
          started_at: startedAt,
          ended_at: endedAt,
          game_type: gameType,
          game_format: "cash_game",
          is_online: isOnline,
          small_blind: smallBlind,
          big_blind: bigBlind,
          currency,
          buy_in_total: buyIn,
          cash_out: cashOut,
          tip,
          expenses,
          location_id: locationId,
          notes,
          is_active: false,
        })
        .select("id, profit")
        .single();

      if (sessErr || !session) { errors++; continue; }

      // Bankroll transaction
      const profit = cashOut !== null ? cashOut - buyIn - tip - expenses : 0;
      runningBalance += profit;

      await supabase.from("bankroll_transactions").insert({
        user_id: user.id,
        type: "session_result",
        amount: profit,
        balance_after: runningBalance,
        session_id: session.id,
        currency,
        description: `Import CSV - Session ${new Date(startedAt).toLocaleDateString("fr-FR")}`,
      });

      imported++;
    } catch {
      errors++;
    }
  }

  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  revalidatePath("/bankroll");
  revalidatePath("/stats");

  return { imported, errors };
}
