import { Card, CardContent } from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import { getSessions } from "@/features/sessions/actions";
import { SessionsList } from "@/features/sessions/sessions-list";
import Link from "next/link";

export const metadata = { title: "Sessions - Poker Tracker Pro" };

export default async function SessionsPage() {
  const { data: sessions, count } = await getSessions({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sessions</h2>
          {count > 0 && <p className="text-sm text-muted-foreground">{count} session{count > 1 ? "s" : ""}</p>}
        </div>
        <Link
          href="/sessions/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + Nouvelle session
        </Link>
      </div>

      {sessions.length > 0 ? (
        <SessionsList sessions={sessions} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ListChecks className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune session</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Vos sessions apparaîtront ici une fois créées.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
