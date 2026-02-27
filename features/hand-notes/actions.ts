"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createHandNoteSchema, updateHandNoteSchema } from "@/lib/validators/hand-note";

export async function getHandNotes(sessionId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("hand_notes")
    .select("*, session:sessions(started_at, game_type, location:locations(name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getHandNote(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("hand_notes")
    .select("*, session:sessions(started_at, game_type, location:locations(name))")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return data;
}

export async function createHandNote(data: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const parsed = createHandNoteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const input = parsed.data;
  const { error } = await supabase.from("hand_notes").insert({
    user_id: user.id,
    session_id: input.session_id,
    hand_number: input.hand_number ?? null,
    hero_position: input.hero_position ?? null,
    hero_cards: input.hero_cards ?? null,
    board: input.board ?? null,
    pot_size: input.pot_size ?? null,
    result: input.result ?? null,
    action_summary: input.action_summary ?? null,
    villain_description: input.villain_description ?? null,
    lesson_learned: input.lesson_learned ?? null,
    tags: input.tags,
  });

  if (error) return { error: "Erreur création note" };

  revalidatePath("/hand-notes");
  revalidatePath(`/sessions/${input.session_id}`);
  return { success: true };
}

export async function updateHandNote(id: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const parsed = updateHandNoteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { error } = await supabase
    .from("hand_notes")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Erreur mise à jour note" };

  revalidatePath("/hand-notes");
  return { success: true };
}

export async function deleteHandNote(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("hand_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Erreur suppression note" };

  revalidatePath("/hand-notes");
  return { success: true };
}

export async function searchHandNotes(query: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("hand_notes")
    .select("*, session:sessions(started_at, game_type, location:locations(name))")
    .eq("user_id", user.id)
    .or(
      `action_summary.ilike.%${query}%,villain_description.ilike.%${query}%,lesson_learned.ilike.%${query}%`
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}
