"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createLocationSchema } from "@/lib/validators/location";

export async function getLocations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("locations")
    .select("*")
    .eq("user_id", user.id)
    .order("is_favorite", { ascending: false })
    .order("name");

  return data ?? [];
}

export async function createLocation(data: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const parsed = createLocationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { error } = await supabase.from("locations").insert({
    user_id: user.id,
    ...parsed.data,
  });

  if (error) return { error: "Erreur lors de la création" };

  revalidatePath("/locations");
  revalidatePath("/sessions/new");
  return { success: true };
}

export async function updateLocation(id: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("locations")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Erreur lors de la mise à jour" };

  revalidatePath("/locations");
  return { success: true };
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
  return updateLocation(id, { is_favorite: isFavorite });
}

export async function archiveLocation(id: string) {
  return updateLocation(id, { is_archived: true });
}
