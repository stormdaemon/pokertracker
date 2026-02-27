"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HandNoteForm } from "./hand-note-form";
import { HandNotesList } from "./hand-notes-list";
import { StickyNote, Plus } from "lucide-react";
import type { HandNote } from "@/types/database";

interface SessionHandNotesProps {
  sessionId: string;
  notes: HandNote[];
}

export function SessionHandNotes({ sessionId, notes }: SessionHandNotesProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Notes de main ({notes.length})
        </h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {showForm && (
        <HandNoteForm
          sessionId={sessionId}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {notes.length > 0 ? (
        <HandNotesList notes={notes} showSessionInfo={false} />
      ) : !showForm ? (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground text-sm">
            Aucune note pour cette session. Enregistrez des mains remarquables.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
