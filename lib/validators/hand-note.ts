import { z } from "zod";

export const createHandNoteSchema = z.object({
  session_id: z.string().uuid("Session ID invalide"),
  hand_number: z.number().int().positive().nullable().optional(),
  hero_position: z
    .enum(["UTG", "UTG1", "UTG2", "MP", "MP1", "LJ", "HJ", "CO", "BTN", "SB", "BB"])
    .nullable()
    .optional(),
  hero_cards: z.string().max(20).nullable().optional(),
  board: z.string().max(30).nullable().optional(),
  pot_size: z.number().min(0).nullable().optional(),
  result: z.number().nullable().optional(),
  action_summary: z.string().max(2000).nullable().optional(),
  villain_description: z.string().max(1000).nullable().optional(),
  lesson_learned: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export const updateHandNoteSchema = createHandNoteSchema.partial().omit({ session_id: true });

export type CreateHandNoteInput = z.infer<typeof createHandNoteSchema>;
export type UpdateHandNoteInput = z.infer<typeof updateHandNoteSchema>;
