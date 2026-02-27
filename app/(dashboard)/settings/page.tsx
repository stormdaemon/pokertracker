import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/features/auth/profile-form";
import { ExportPanel } from "@/features/export/export-panel";
import { ImportCSV } from "@/features/import/import-csv";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Paramètres - Poker Tracker Pro" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Paramètres</h2>
      {profile ? (
        <ProfileForm profile={profile} />
      ) : (
        <Card>
          <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Impossible de charger le profil.</p>
          </CardContent>
        </Card>
      )}

      <ExportPanel />
      <ImportCSV />
    </div>
  );
}
