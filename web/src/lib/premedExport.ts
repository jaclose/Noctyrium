import type { WorkBook } from "xlsx-js-style";
import type { PremedExperienceEntry, PremedExperienceKind } from "./types";

const KINDS: PremedExperienceKind[] = ["Clinical", "Service", "Research", "Shadowing", "Leadership"];
const HEADER = {
  font: { bold: true, color: { rgb: "F6FBFF" } },
  fill: { fgColor: { rgb: "236B7D" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: {
    bottom: { style: "thin", color: { rgb: "31506A" } },
  },
};
const CELL = {
  alignment: { vertical: "top", wrapText: true },
  border: {
    bottom: { style: "hair", color: { rgb: "D7E6EF" } },
  },
};

type XlsxModule = typeof import("xlsx-js-style");

export async function exportPremedExperienceWorkbook(entries: PremedExperienceEntry[]) {
  const XLSX = await import("xlsx-js-style");
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "Noctyrium Pre-Med Experience Log",
    Subject: "Clinical, service, research, shadowing, and leadership evidence",
    Author: "Noctyrium",
    CreatedDate: new Date(),
  };

  appendSheet(XLSX, wb, "Overview", overviewRows(entries), overviewWidths());
  for (const kind of KINDS) {
    appendSheet(XLSX, wb, kind, detailRows(entries.filter((entry) => entry.kind === kind)), detailWidths());
  }

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `noctyrium-premed-experiences-${stamp}.xlsx`);
}

function overviewRows(entries: PremedExperienceEntry[]) {
  const rows = [["Category", "Entries", "Hours", "Verified hours", "Verification %", "Competency tags"]];
  for (const kind of KINDS) {
    const subset = entries.filter((entry) => entry.kind === kind);
    const hours = sumHours(subset);
    const verified = sumHours(subset.filter((entry) => entry.verified));
    const tags = [...new Set(subset.flatMap((entry) => entry.competencyTags ?? []))].join(", ");
    rows.push([
      kind,
      String(subset.length),
      hours.toFixed(2),
      verified.toFixed(2),
      hours ? `${Math.round((verified / hours) * 100)}%` : "0%",
      tags,
    ]);
  }
  const total = sumHours(entries);
  const verified = sumHours(entries.filter((entry) => entry.verified));
  rows.push([
    "Total",
    String(entries.length),
    total.toFixed(2),
    verified.toFixed(2),
    total ? `${Math.round((verified / total) * 100)}%` : "0%",
    [...new Set(entries.flatMap((entry) => entry.competencyTags ?? []))].join(", "),
  ]);
  return rows;
}

function detailRows(entries: PremedExperienceEntry[]) {
  return [
    ["Date", "Hours", "Verified", "Activity", "Organization", "Contact / verifier", "Reflection", "Evidence link", "Competency tags", "Notes"],
    ...entries
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || b.created.localeCompare(a.created))
      .map((entry) => [
        entry.date,
        entry.hours,
        entry.verified ? "Verified" : "Unverified",
        entry.title,
        entry.organization,
        entry.contact ?? "",
        entry.reflection,
        entry.evidenceLink ?? "",
        (entry.competencyTags ?? []).join(", "),
        entry.notes ?? "",
      ]),
  ];
}

function appendSheet(XLSX: XlsxModule, wb: WorkBook, name: string, rows: unknown[][], widths: number[]) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1:A1");
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = HEADER;
  }
  for (let r = 1; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell) cell.s = CELL;
    }
  }
  ws["!cols"] = widths.map((wch) => ({ wch }));
  ws["!autofilter"] = { ref: ws["!ref"] ?? "A1:A1" };
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, ws, name);
}

function overviewWidths() {
  return [18, 10, 12, 16, 16, 42];
}

function detailWidths() {
  return [13, 9, 12, 28, 26, 24, 42, 34, 30, 34];
}

function sumHours(entries: PremedExperienceEntry[]) {
  return entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
}
