"use client";

import type { FindingType, Risk } from "../lib/detection/types";
import { TYPE_LABELS, formatDate } from "../lib/ui/labels";

export interface ExportFindingRow {
  type: FindingType;
  risk: Exclude<Risk, "None">;
  count: number;
  masked_example: string;
  scans: { file_name: string; created_at: string } | null;
}

const HEADERS = ["File", "Scanned", "Type", "Risk", "Count", "Masked example"] as const;

// Wrap every field in quotes and double embedded quotes so commas, newlines and quotes survive Excel/Sheets.
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildCsv(rows: ExportFindingRow[]): string {
  const lines = [HEADERS.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.scans?.file_name ?? "",
        r.scans ? formatDate(r.scans.created_at) : "",
        TYPE_LABELS[r.type],
        r.risk,
        String(r.count),
        r.masked_example,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  // Prepend a BOM so Excel reads the UTF-8 content correctly.
  return "\uFEFF" + lines.join("\r\n");
}

export function ExportFindingsButton({ rows }: { rows: ExportFindingRow[] }) {
  const download = () => {
    const blob = new Blob([buildCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `findings-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" className="lp-button lp-button--secondary lp-button--md" onClick={download} disabled={rows.length === 0}>
      Export CSV
    </button>
  );
}
