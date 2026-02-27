"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteHandNote, searchHandNotes } from "./actions";
import { POSITIONS } from "@/lib/constants";
import { Trash2, Search, StickyNote } from "lucide-react";
import type { HandNote } from "@/types/database";

interface HandNotesListProps {
  notes: (HandNote & { session?: { started_at: string; game_type: string; location?: { name: string } | null } })[];
  showSessionInfo?: boolean;
}

const SUIT_COLORS: Record<string, string> = {
  h: "text-red-500",
  d: "text-blue-400",
  c: "text-green-500",
  s: "text-foreground",
};

function formatCards(cards: string | null) {
  if (!cards) return null;
  return cards.split("").map((char, i) => {
    const color = SUIT_COLORS[char.toLowerCase()];
    return color ? (
      <span key={i} className={color}>{char}</span>
    ) : (
      <span key={i} className="font-bold">{char}</span>
    );
  });
}

export function HandNotesList({ notes: initialNotes, showSessionInfo = true }: HandNotesListProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.length < 2) {
      setNotes(initialNotes);
      return;
    }
    setSearching(true);
    const results = await searchHandNotes(query);
    setNotes(results as typeof notes);
    setSearching(false);
  }

  async function handleDelete(id: string) {
    if (confirm("Supprimer cette note ?")) {
      await deleteHandNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  }

  if (initialNotes.length === 0 && !searchQuery) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <StickyNote className="h-8 w-8 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune note de main</h3>
          <p className="text-muted-foreground text-center">
            Enregistrez des mains remarquables pour analyser votre jeu.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans les notes..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {searching && <p className="text-sm text-muted-foreground">Recherche...</p>}

      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id} className="p-4">
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {note.hand_number && (
                    <span className="text-sm font-medium">Main #{note.hand_number}</span>
                  )}
                  {note.hero_position && (
                    <Badge variant="outline" className="text-xs">{note.hero_position}</Badge>
                  )}
                  {note.hero_cards && (
                    <span className="font-mono text-sm font-bold">
                      {formatCards(note.hero_cards)}
                    </span>
                  )}
                  {note.result !== null && (
                    <Badge variant={note.result >= 0 ? "profit" : "loss"} className="text-xs">
                      {note.result >= 0 ? "+" : ""}{note.result}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                  onClick={() => handleDelete(note.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Board */}
              {note.board && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Board: </span>
                  <span className="font-mono">{formatCards(note.board)}</span>
                  {note.pot_size && (
                    <span className="text-muted-foreground ml-2">(pot: {note.pot_size})</span>
                  )}
                </div>
              )}

              {/* Action summary */}
              {note.action_summary && (
                <p className="text-sm">{note.action_summary}</p>
              )}

              {/* Villain */}
              {note.villain_description && (
                <p className="text-xs text-muted-foreground">
                  Vilain: {note.villain_description}
                </p>
              )}

              {/* Lesson */}
              {note.lesson_learned && (
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-2">
                  <p className="text-xs font-medium text-primary">Leçon apprise</p>
                  <p className="text-sm">{note.lesson_learned}</p>
                </div>
              )}

              {/* Tags + meta */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                {showSessionInfo && note.session && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.session.started_at).toLocaleDateString("fr-FR")}
                    {note.session.location && ` - ${note.session.location.name}`}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {notes.length === 0 && searchQuery && (
        <p className="text-center text-muted-foreground py-8">
          Aucun résultat pour &quot;{searchQuery}&quot;
        </p>
      )}
    </div>
  );
}
