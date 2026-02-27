import { notFound } from "next/navigation";
import { getSession } from "@/features/sessions/actions";
import { SessionDetail } from "@/features/sessions/session-detail";
import { getHandNotes } from "@/features/hand-notes/actions";
import { SessionHandNotes } from "@/features/hand-notes/session-hand-notes";

export const metadata = { title: "Détail session - Poker Tracker Pro" };

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, handNotes] = await Promise.all([
    getSession(id),
    getHandNotes(id),
  ]);

  if (!session) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <SessionDetail session={session} />
      <SessionHandNotes sessionId={id} notes={handNotes} />
    </div>
  );
}
