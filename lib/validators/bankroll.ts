import { z } from "zod";

export const bankrollTransactionSchema = z.object({
  type: z.enum(["deposit", "withdrawal", "adjustment", "bonus"]),
  amount: z.number().positive("Le montant doit être positif"),
  currency: z.string().length(3).default("EUR"),
  description: z.string().max(500).nullable().optional(),
}).refine(
  (data) => {
    if (data.type === "adjustment") {
      return data.description != null && data.description.length > 0;
    }
    return true;
  },
  { message: "Description obligatoire pour un ajustement", path: ["description"] }
);

export type BankrollTransactionInput = z.infer<typeof bankrollTransactionSchema>;
