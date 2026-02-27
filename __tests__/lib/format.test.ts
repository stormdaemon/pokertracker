import { describe, it, expect } from "bun:test";
import {
  formatCurrency,
  formatDuration,
  formatProfit,
  formatStakes,
  formatPercent,
  calculateHourlyRate,
} from "@/lib/utils/format";

describe("formatCurrency", () => {
  it("formats EUR correctly", () => {
    const result = formatCurrency(1234.56, "EUR", "fr-FR");
    expect(result).toContain("1");
    expect(result).toContain("234");
    expect(result).toContain("56");
  });

  it("formats USD correctly", () => {
    const result = formatCurrency(1234.56, "USD", "en-US");
    expect(result).toContain("$");
    expect(result).toContain("1,234.56");
  });

  it("handles zero", () => {
    const result = formatCurrency(0, "EUR", "fr-FR");
    expect(result).toContain("0");
  });

  it("handles negative amounts", () => {
    const result = formatCurrency(-500, "EUR", "fr-FR");
    expect(result).toContain("500");
  });
});

describe("formatDuration", () => {
  it("formats minutes only", () => {
    expect(formatDuration(45)).toBe("45min");
  });

  it("formats hours only", () => {
    expect(formatDuration(120)).toBe("2h");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(150)).toBe("2h30");
  });

  it("pads single digit minutes", () => {
    expect(formatDuration(65)).toBe("1h05");
  });
});

describe("formatProfit", () => {
  it("formats positive profit with + sign", () => {
    const result = formatProfit(500, "EUR", "fr-FR");
    expect(result.text).toContain("+");
    expect(result.isPositive).toBe(true);
    expect(result.className).toBe("text-profit");
  });

  it("formats negative profit with - sign", () => {
    const result = formatProfit(-200, "EUR", "fr-FR");
    expect(result.text).toContain("-");
    expect(result.isPositive).toBe(false);
    expect(result.className).toBe("text-loss");
  });

  it("treats zero as positive", () => {
    const result = formatProfit(0, "EUR", "fr-FR");
    expect(result.isPositive).toBe(true);
  });
});

describe("formatStakes", () => {
  it("formats stakes correctly", () => {
    expect(formatStakes(1, 2)).toBe("1/2");
    expect(formatStakes(2, 5)).toBe("2/5");
    expect(formatStakes(5, 10)).toBe("5/10");
  });
});

describe("formatPercent", () => {
  it("formats with default decimals", () => {
    expect(formatPercent(55.5)).toBe("55.5%");
  });

  it("formats with custom decimals", () => {
    expect(formatPercent(33.333, 2)).toBe("33.33%");
  });
});

describe("calculateHourlyRate", () => {
  it("calculates correctly", () => {
    expect(calculateHourlyRate(100, 60)).toBe(100);
    expect(calculateHourlyRate(200, 120)).toBe(100);
    expect(calculateHourlyRate(50, 30)).toBeCloseTo(100);
  });

  it("returns 0 for zero duration", () => {
    expect(calculateHourlyRate(100, 0)).toBe(0);
  });

  it("returns 0 for negative duration", () => {
    expect(calculateHourlyRate(100, -60)).toBe(0);
  });

  it("handles negative profit", () => {
    expect(calculateHourlyRate(-100, 60)).toBe(-100);
  });
});
