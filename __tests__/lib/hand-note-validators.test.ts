import { describe, it, expect } from "bun:test";
import { createHandNoteSchema, updateHandNoteSchema } from "@/lib/validators/hand-note";

describe("createHandNoteSchema", () => {
  it("validates a minimal hand note", () => {
    const result = createHandNoteSchema.safeParse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("validates a full hand note", () => {
    const result = createHandNoteSchema.safeParse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      hand_number: 42,
      hero_position: "BTN",
      hero_cards: "AhKs",
      board: "Ah 7c 2d Ks 9h",
      pot_size: 250,
      result: 120,
      action_summary: "Hero raises UTG, villain 3-bets, hero calls.",
      villain_description: "Tight aggressive regular",
      lesson_learned: "Don't bluff calling stations",
      tags: ["bluff", "3-bet"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid session_id", () => {
    const result = createHandNoteSchema.safeParse({
      session_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid hero_position", () => {
    const result = createHandNoteSchema.safeParse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      hero_position: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many tags", () => {
    const result = createHandNoteSchema.safeParse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      tags: Array(11).fill("tag"),
    });
    expect(result.success).toBe(false);
  });

  it("allows all valid positions", () => {
    const positions = ["UTG", "UTG1", "UTG2", "MP", "MP1", "LJ", "HJ", "CO", "BTN", "SB", "BB"];
    for (const pos of positions) {
      const result = createHandNoteSchema.safeParse({
        session_id: "550e8400-e29b-41d4-a716-446655440000",
        hero_position: pos,
      });
      expect(result.success).toBe(true);
    }
  });

  it("allows null optional fields", () => {
    const result = createHandNoteSchema.safeParse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      hand_number: null,
      hero_position: null,
      hero_cards: null,
      board: null,
      pot_size: null,
      result: null,
      action_summary: null,
      villain_description: null,
      lesson_learned: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts negative result (loss on hand)", () => {
    const result = createHandNoteSchema.safeParse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      result: -85.50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.result).toBe(-85.50);
    }
  });
});

describe("updateHandNoteSchema", () => {
  it("validates a partial update", () => {
    const result = updateHandNoteSchema.safeParse({
      lesson_learned: "Updated lesson",
    });
    expect(result.success).toBe(true);
  });

  it("validates empty update", () => {
    const result = updateHandNoteSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("does not require session_id", () => {
    const result = updateHandNoteSchema.safeParse({
      hero_cards: "QhQd",
    });
    expect(result.success).toBe(true);
  });
});
