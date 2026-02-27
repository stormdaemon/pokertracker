import { getHandNotes } from "@/features/hand-notes/actions";
import { HandNotesList } from "@/features/hand-notes/hand-notes-list";
import { StickyNote } from "lucide-react";

export const metadata = { title: "Notes de main - Poker Tracker Pro" };

export default async function HandNotesPage() {
  const notes = await getHandNotes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notes de main</h2>
      </div>
      <HandNotesList notes={notes} />
    </div>
  );
}
