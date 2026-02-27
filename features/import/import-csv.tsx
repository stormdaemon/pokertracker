"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { importSessions } from "./actions";
import { Upload, FileUp, Check, AlertTriangle } from "lucide-react";

const EXPECTED_FIELDS = [
  { key: "started_at", label: "Date début", required: true },
  { key: "ended_at", label: "Date fin", required: false },
  { key: "game_type", label: "Type de jeu", required: true },
  { key: "game_format", label: "Format", required: false },
  { key: "is_online", label: "En ligne", required: false },
  { key: "small_blind", label: "Small Blind", required: false },
  { key: "big_blind", label: "Big Blind", required: false },
  { key: "currency", label: "Devise", required: false },
  { key: "buy_in_total", label: "Buy-in", required: true },
  { key: "cash_out", label: "Cash Out", required: false },
  { key: "tip", label: "Pourboire", required: false },
  { key: "expenses", label: "Dépenses", required: false },
  { key: "notes", label: "Notes", required: false },
  { key: "location_name", label: "Lieu", required: false },
];

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

function autoMapHeaders(csvHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const normalized = csvHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, "_"));

  const aliases: Record<string, string[]> = {
    started_at: ["date", "start", "started", "started_at", "date_debut", "date_start"],
    ended_at: ["end", "ended", "ended_at", "date_fin", "date_end"],
    game_type: ["game_type", "game", "type_jeu", "type"],
    buy_in_total: ["buy_in", "buyin", "buy_in_total", "buy_in_amount", "cost"],
    cash_out: ["cash_out", "cashout", "winnings", "payout", "result"],
    small_blind: ["small_blind", "sb", "small"],
    big_blind: ["big_blind", "bb", "big"],
    currency: ["currency", "devise", "cur"],
    tip: ["tip", "pourboire", "tips"],
    notes: ["notes", "note", "comment", "comments"],
    location_name: ["location", "lieu", "casino", "venue", "place"],
    is_online: ["online", "is_online", "en_ligne"],
  };

  for (const [field, alts] of Object.entries(aliases)) {
    const idx = normalized.findIndex((h) => alts.includes(h));
    if (idx !== -1) {
      mapping[field] = csvHeaders[idx];
    }
  }

  return mapping;
}

export function ImportCSV() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [csvData, setCSVData] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.headers.length === 0) {
        setError("Fichier CSV invalide");
        return;
      }
      setCSVData(parsed);
      setMapping(autoMapHeaders(parsed.headers));
      setStep("map");
      setError(null);
    };
    reader.readAsText(file);
  }

  function updateMapping(field: string, csvHeader: string) {
    setMapping((prev) => {
      const next = { ...prev };
      if (csvHeader) {
        next[field] = csvHeader;
      } else {
        delete next[field];
      }
      return next;
    });
  }

  function handlePreview() {
    const required = EXPECTED_FIELDS.filter((f) => f.required);
    const missing = required.filter((f) => !mapping[f.key]);
    if (missing.length > 0) {
      setError(`Champs requis manquants : ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    setError(null);
    setStep("preview");
  }

  async function handleImport() {
    setLoading(true);
    setError(null);
    const res = await importSessions(csvData.rows, csvData.headers, mapping);
    if (res.error) {
      setError(res.error);
    } else {
      setResult({ imported: res.imported ?? 0, errors: res.errors ?? 0 });
      setStep("done");
    }
    setLoading(false);
  }

  if (step === "done" && result) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <Check className="h-12 w-12 text-profit mb-4" />
          <h3 className="text-lg font-semibold mb-2">Import terminé</h3>
          <p className="text-muted-foreground">
            {result.imported} sessions importées
            {result.errors > 0 && `, ${result.errors} erreurs`}
          </p>
          <Button className="mt-4" onClick={() => { setStep("upload"); setResult(null); }}>
            Nouvel import
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importer des sessions (CSV)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {step === "upload" && (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <FileUp className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Glissez un fichier CSV ou cliquez pour sélectionner
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Choisir un fichier
            </Button>
          </div>
        )}

        {step === "map" && (
          <>
            <p className="text-sm text-muted-foreground">
              {csvData.rows.length} lignes détectées. Mappez les colonnes :
            </p>
            <div className="space-y-3">
              {EXPECTED_FIELDS.map((field) => (
                <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                  <Label className="text-sm">
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={mapping[field.key] ?? ""}
                    onChange={(e) => updateMapping(field.key, e.target.value)}
                  >
                    <option value="">— Ignorer —</option>
                    {csvData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>Retour</Button>
              <Button onClick={handlePreview}>Aperçu</Button>
            </div>
          </>
        )}

        {step === "preview" && (
          <>
            <p className="text-sm text-muted-foreground">
              Aperçu des {Math.min(5, csvData.rows.length)} premières lignes :
            </p>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b border-border">
                    {EXPECTED_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                      <th key={f.key} className="py-2 px-2 text-left font-medium text-muted-foreground">{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {EXPECTED_FIELDS.filter((f) => mapping[f.key]).map((f) => {
                        const colIdx = csvData.headers.indexOf(mapping[f.key]);
                        return <td key={f.key} className="py-1.5 px-2">{row[colIdx] ?? ""}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("map")}>Retour</Button>
              <Button onClick={handleImport} loading={loading}>
                Importer {csvData.rows.length} sessions
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
