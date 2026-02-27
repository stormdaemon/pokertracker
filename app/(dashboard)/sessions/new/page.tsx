import { createClient } from "@/lib/supabase/server";
import { SessionForm } from "@/features/sessions/session-form";

export const metadata = { title: "Nouvelle session - Poker Tracker Pro" };

export default async function NewSessionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_game_type, default_currency")
    .eq("id", user?.id)
    .single();

  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .eq("user_id", user?.id)
    .eq("is_archived", false)
    .order("is_favorite", { ascending: false });

  return (
    <SessionForm
      locations={locations ?? []}
      defaultGameType={profile?.default_game_type ?? undefined}
      defaultCurrency={profile?.default_currency ?? undefined}
    />
  );
}
