import { z } from "zod";

const sessionBaseSchema = z.object({
  game_type: z.enum(["nlhe", "plo", "plo5", "stud", "razz", "horse", "mixed", "other"]),
  game_format: z.enum(["cash_game", "tournament", "sit_and_go"]).default("cash_game"),
  is_online: z.boolean().default(false),
  location_id: z.string().uuid().nullable().optional(),
  buy_in_amount: z.number().positive("Le buy-in doit être positif"),
  small_blind: z.number().positive().nullable().optional(),
  big_blind: z.number().positive().nullable().optional(),
  ante: z.number().min(0).nullable().optional(),
  straddle: z.boolean().default(false),
  max_buyin_bb: z.number().int().min(20).max(500).nullable().optional(),
  currency: z.string().length(3).default("EUR"),
  started_at: z.string().datetime().optional(),
  table_size: z.number().int().min(2).max(10).nullable().optional(),
  mood_before: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string()).default([]),
});

function addStakesRefinements(schema: z.ZodObject<any, any, any>) {
  return schema.refine(
    (data) => {
      if (data.small_blind != null && data.big_blind != null) {
        return data.big_blind > data.small_blind;
      }
      return true;
    },
    { message: "Le big blind doit être supérieur au small blind", path: ["big_blind"] }
  ).refine(
    (data) => {
      if (data.ante != null && data.big_blind != null) {
        return data.ante <= data.big_blind;
      }
      return true;
    },
    { message: "L'ante ne peut pas dépasser le big blind", path: ["ante"] }
  );
}

export const createSessionSchema = addStakesRefinements(sessionBaseSchema);

export const cashOutSchema = z.object({
  cash_out: z.number().min(0, "Le cash out ne peut pas être négatif"),
  mood_after: z.number().int().min(1).max(5).nullable().optional(),
  focus_level: z.number().int().min(1).max(5).nullable().optional(),
  tip: z.number().min(0).default(0),
  expenses: z.number().min(0).default(0),
  rake_paid: z.number().min(0).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const retroSessionSchema = addStakesRefinements(
  sessionBaseSchema.extend({
    started_at: z.string().datetime(),
    ended_at: z.string().datetime(),
    cash_out: z.number().min(0, "Le cash out ne peut pas être négatif"),
    mood_after: z.number().int().min(1).max(5).nullable().optional(),
    focus_level: z.number().int().min(1).max(5).nullable().optional(),
    tip: z.number().min(0).default(0),
    expenses: z.number().min(0).default(0),
  })
).refine(
  (data) => new Date(data.ended_at) > new Date(data.started_at),
  { message: "La fin doit être après le début", path: ["ended_at"] }
);

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type CashOutInput = z.infer<typeof cashOutSchema>;
export type RetroSessionInput = z.infer<typeof retroSessionSchema>;
