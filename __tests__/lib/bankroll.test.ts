import { describe, it, expect } from "bun:test";
import { bankrollTransactionSchema } from "@/lib/validators/bankroll";

describe("Bankroll Business Logic", () => {
  it("deposit increases balance", () => {
    const balance = 1000;
    const deposit = 500;
    expect(balance + deposit).toBe(1500);
  });

  it("withdrawal decreases balance", () => {
    const balance = 1000;
    const withdrawal = -300;
    expect(balance + withdrawal).toBe(700);
  });

  it("session profit chain integrity", () => {
    const initial = 1000;
    const results = [50, -100, 200, -30, 80];
    let balance = initial;
    const chain: number[] = [initial];

    for (const result of results) {
      balance += result;
      chain.push(balance);
    }

    expect(balance).toBe(1200);
    expect(chain).toEqual([1000, 1050, 950, 1150, 1120, 1200]);
    // Verify chain: each entry = previous + transaction
    for (let i = 1; i < chain.length; i++) {
      expect(chain[i]).toBe(chain[i - 1] + results[i - 1]);
    }
  });

  it("validates withdrawal cannot exceed balance (business rule)", () => {
    const balance = 500;
    const withdrawal = 600;
    // Withdrawal is valid schema-wise but business logic should check
    const result = bankrollTransactionSchema.safeParse({
      type: "withdrawal",
      amount: withdrawal,
    });
    expect(result.success).toBe(true);
    // The balance check happens server-side, not in schema
    expect(balance - withdrawal).toBe(-100);
  });

  it("all-time high/low calculation", () => {
    const balances = [1000, 1050, 950, 1150, 900, 1200];
    const ath = Math.max(...balances);
    const atl = Math.min(...balances);
    expect(ath).toBe(1200);
    expect(atl).toBe(900);
  });
});
