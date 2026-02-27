import { describe, it, expect } from "bun:test";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import { createSessionSchema, cashOutSchema } from "@/lib/validators/session";
import { bankrollTransactionSchema } from "@/lib/validators/bankroll";
import { createLocationSchema } from "@/lib/validators/location";

describe("Auth Validators", () => {
  describe("loginSchema", () => {
    it("accepts valid input", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("accepts valid input", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Password1",
        confirmPassword: "Password1",
        display_name: "John",
      });
      expect(result.success).toBe(true);
    });

    it("rejects password without uppercase", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "password1",
        confirmPassword: "password1",
        display_name: "John",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password without digit", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Password",
        confirmPassword: "Password",
        display_name: "John",
      });
      expect(result.success).toBe(false);
    });

    it("rejects mismatched passwords", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Password1",
        confirmPassword: "Password2",
        display_name: "John",
      });
      expect(result.success).toBe(false);
    });

    it("rejects short password", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Pass1",
        confirmPassword: "Pass1",
        display_name: "John",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Session Validators", () => {
  describe("createSessionSchema", () => {
    it("accepts valid minimal input", () => {
      const result = createSessionSchema.safeParse({
        game_type: "nlhe",
        game_format: "cash_game",
        buy_in_amount: 200,
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative buy-in", () => {
      const result = createSessionSchema.safeParse({
        game_type: "nlhe",
        game_format: "cash_game",
        buy_in_amount: -100,
      });
      expect(result.success).toBe(false);
    });

    it("rejects zero buy-in", () => {
      const result = createSessionSchema.safeParse({
        game_type: "nlhe",
        game_format: "cash_game",
        buy_in_amount: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid game_type", () => {
      const result = createSessionSchema.safeParse({
        game_type: "invalid",
        game_format: "cash_game",
        buy_in_amount: 200,
      });
      expect(result.success).toBe(false);
    });

    it("validates big_blind > small_blind", () => {
      const result = createSessionSchema.safeParse({
        game_type: "nlhe",
        game_format: "cash_game",
        buy_in_amount: 200,
        small_blind: 5,
        big_blind: 2,
      });
      expect(result.success).toBe(false);
    });

    it("validates ante <= big_blind", () => {
      const result = createSessionSchema.safeParse({
        game_type: "nlhe",
        game_format: "cash_game",
        buy_in_amount: 200,
        small_blind: 1,
        big_blind: 2,
        ante: 5,
      });
      expect(result.success).toBe(false);
    });

    it("validates table_size range", () => {
      const result = createSessionSchema.safeParse({
        game_type: "nlhe",
        game_format: "cash_game",
        buy_in_amount: 200,
        table_size: 11,
      });
      expect(result.success).toBe(false);
    });

    it("validates mood range", () => {
      const result = createSessionSchema.safeParse({
        game_type: "nlhe",
        game_format: "cash_game",
        buy_in_amount: 200,
        mood_before: 6,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("cashOutSchema", () => {
    it("accepts valid input", () => {
      const result = cashOutSchema.safeParse({
        cash_out: 350,
        mood_after: 4,
        focus_level: 3,
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative cash_out", () => {
      const result = cashOutSchema.safeParse({ cash_out: -100 });
      expect(result.success).toBe(false);
    });

    it("accepts zero cash_out (busted)", () => {
      const result = cashOutSchema.safeParse({ cash_out: 0 });
      expect(result.success).toBe(true);
    });
  });
});

describe("Bankroll Validators", () => {
  it("accepts valid deposit", () => {
    const result = bankrollTransactionSchema.safeParse({
      type: "deposit",
      amount: 500,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative amount", () => {
    const result = bankrollTransactionSchema.safeParse({
      type: "deposit",
      amount: -100,
    });
    expect(result.success).toBe(false);
  });

  it("requires description for adjustments", () => {
    const result = bankrollTransactionSchema.safeParse({
      type: "adjustment",
      amount: 50,
    });
    expect(result.success).toBe(false);
  });

  it("accepts adjustment with description", () => {
    const result = bankrollTransactionSchema.safeParse({
      type: "adjustment",
      amount: 50,
      description: "Correction erreur saisie",
    });
    expect(result.success).toBe(true);
  });
});

describe("Location Validators", () => {
  it("accepts valid input", () => {
    const result = createLocationSchema.safeParse({
      name: "Casino Barrière",
      type: "casino",
      city: "Toulouse",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createLocationSchema.safeParse({
      name: "",
      type: "casino",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = createLocationSchema.safeParse({
      name: "Test",
      type: "invalid",
    });
    expect(result.success).toBe(false);
  });
});
