import { describe, it, expect } from "bun:test";

// Test the CSV parsing logic (client-side)
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

describe("CSV parsing", () => {
  it("parses simple CSV", () => {
    const csv = "Date,Buy-in,Cash Out\n2024-01-15,200,350\n2024-01-16,100,0";
    const { headers, rows } = parseCSV(csv);
    expect(headers).toEqual(["Date", "Buy-in", "Cash Out"]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(["2024-01-15", "200", "350"]);
  });

  it("handles quoted fields with commas", () => {
    const csv = 'Name,Notes\nSession 1,"Good session, very profitable"';
    const { headers, rows } = parseCSV(csv);
    expect(rows[0][1]).toBe("Good session, very profitable");
  });

  it("handles escaped quotes", () => {
    const csv = 'Name,Notes\nSession 1,"He said ""fold"""';
    const { headers, rows } = parseCSV(csv);
    expect(rows[0][1]).toBe('He said "fold"');
  });

  it("handles empty CSV", () => {
    const { headers, rows } = parseCSV("");
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });

  it("handles header-only CSV", () => {
    const { headers, rows } = parseCSV("Date,Amount");
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });

  it("handles Windows-style line endings", () => {
    const csv = "Date,Amount\r\n2024-01-15,200\r\n2024-01-16,100";
    const { headers, rows } = parseCSV(csv);
    expect(headers).toEqual(["Date", "Amount"]);
    expect(rows).toHaveLength(2);
  });

  it("trims whitespace from values", () => {
    const csv = "Date , Amount \n 2024-01-15 , 200 ";
    const { headers, rows } = parseCSV(csv);
    expect(headers).toEqual(["Date", "Amount"]);
    expect(rows[0]).toEqual(["2024-01-15", "200"]);
  });
});

describe("Auto-mapping", () => {
  function autoMapHeaders(csvHeaders: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const normalized = csvHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, "_"));

    const aliases: Record<string, string[]> = {
      started_at: ["date", "start", "started", "started_at", "date_debut"],
      buy_in_total: ["buy_in", "buyin", "buy_in_total", "buy_in_amount", "cost"],
      cash_out: ["cash_out", "cashout", "winnings", "payout"],
      game_type: ["game_type", "game", "type_jeu", "type"],
      currency: ["currency", "devise", "cur"],
      location_name: ["location", "lieu", "casino", "venue"],
    };

    for (const [field, alts] of Object.entries(aliases)) {
      const idx = normalized.findIndex((h) => alts.includes(h));
      if (idx !== -1) {
        mapping[field] = csvHeaders[idx];
      }
    }
    return mapping;
  }

  it("maps common header names", () => {
    const map = autoMapHeaders(["Date", "Buy-in", "Cash Out", "Game Type"]);
    expect(map.started_at).toBe("Date");
    expect(map.buy_in_total).toBe("Buy-in");
    expect(map.cash_out).toBe("Cash Out");
    expect(map.game_type).toBe("Game Type");
  });

  it("maps French header names", () => {
    const map = autoMapHeaders(["Lieu", "Devise"]);
    expect(map.location_name).toBe("Lieu");
    expect(map.currency).toBe("Devise");
  });

  it("maps date_debut header", () => {
    const map = autoMapHeaders(["date_debut", "buyin"]);
    expect(map.started_at).toBe("date_debut");
    expect(map.buy_in_total).toBe("buyin");
  });

  it("returns empty mapping for unknown headers", () => {
    const map = autoMapHeaders(["Foo", "Bar", "Baz"]);
    expect(Object.keys(map)).toHaveLength(0);
  });
});
