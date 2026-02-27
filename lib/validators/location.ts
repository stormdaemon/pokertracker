import { z } from "zod";

export const createLocationSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  type: z.enum(["casino", "club", "home_game", "online"]),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  platform_url: z.string().url().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  is_favorite: z.boolean().default(false),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
