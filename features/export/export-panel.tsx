"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportSessionsCSV, exportTournamentsCSV, exportAllDataJSON } from "./actions";
import { Download, FileText, FileJson } from "lucide-react";

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExportSessionsCSV() {
    setLoading("sessions");
    setError(null);
    const result = await exportSessionsCSV();
    if (result.error) {
      setError(result.error);
    } else if (result.csv) {
      downloadFile(result.csv, result.filename!, "text/csv;charset=utf-8;");
    }
    setLoading(null);
  }

  async function handleExportTournamentsCSV() {
    setLoading("tournaments");
    setError(null);
    const result = await exportTournamentsCSV();
    if (result.error) {
      setError(result.error);
    } else if (result.csv) {
      downloadFile(result.csv, result.filename!, "text/csv;charset=utf-8;");
    }
    setLoading(null);
  }

  async function handleExportJSON() {
    setLoading("json");
    setError(null);
    const result = await exportAllDataJSON();
    if (result.error) {
      setError(result.error);
    } else if (result.json) {
      downloadFile(result.json, result.filename!, "application/json;charset=utf-8;");
    }
    setLoading(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exporter les données
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
        )}
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={handleExportSessionsCSV}
          loading={loading === "sessions"}
        >
          <FileText className="h-4 w-4" />
          Sessions (CSV)
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={handleExportTournamentsCSV}
          loading={loading === "tournaments"}
        >
          <FileText className="h-4 w-4" />
          Tournois (CSV)
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={handleExportJSON}
          loading={loading === "json"}
        >
          <FileJson className="h-4 w-4" />
          Toutes les données (JSON - RGPD)
        </Button>
      </CardContent>
    </Card>
  );
}
