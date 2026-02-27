import { z } from "zod";

export const createTournamentSchema = z.object({
  tournament_name: z.string().max(200).nullable().optional(),
  structure_type: z.enum(["freezeout", "rebuy", "bounty", "pko", "satellite", "hyper_turbo", "turbo", "deep_stack"]),
  buy_in_amount: z.number().positive("Le buy-in doit être positif"),
  fee: z.number().min(0).default(0),
  rebuy_count: z.number().int().min(0).default(0),
  rebuy_cost: z.number().min(0).default(0),
  addon_count: z.number().int().min(0).default(0),
  addon_cost: z.number().min(0).default(0),
  total_entries: z.number().int().positive().nullable().optional(),
  finish_position: z.number().int().positive().nullable().optional(),
  prize_won: z.number().min(0).default(0),
  bounties_won: z.number().min(0).default(0),
  is_bounty: z.boolean().default(false),
  guaranteed_prize: z.number().min(0).nullable().optional(),
  // Session fields
  game_type: z.enum(["nlhe", "plo", "plo5", "stud", "razz", "horse", "mixed", "other"]).default("nlhe"),
  is_online: z.boolean().default(false),
  location_id: z.string().uuid().nullable().optional(),
  currency: z.string().length(3).default("EUR"),
  started_at: z.string().datetime().optional(),
  ended_at: z.string().datetime().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string()).default([]),
  mood_before: z.number().int().min(1).max(5).nullable().optional(),
  mood_after: z.number().int().min(1).max(5).nullable().optional(),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
