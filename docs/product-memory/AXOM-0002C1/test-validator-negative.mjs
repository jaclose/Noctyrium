#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const packageRoot = path.dirname(scriptPath);
const validatorPath = path.join(packageRoot, "validate-dispositions.mjs");
const liveInsertionPlan = fs.readFileSync(
  path.join(packageRoot, "CANONICAL-INSERTION-PLAN.md"),
  "utf8",
);
const conditionalSplitRow = liveInsertionPlan.match(
  /^\| `(FOUND-\d{3})` \| ([^|]*`DISP-\d{3}[A-Z]`[^|]*) \| ([^|]+) \|$/m,
);
const conditionalSplitParent = conditionalSplitRow?.[1] ?? null;
const conditionalSplitLine = conditionalSplitRow?.[0] ?? null;
const conditionalSplitHandle =
  conditionalSplitRow?.[2].match(/DISP-\d{3}[A-Z]/)?.[0] ?? null;

function replaceExactlyOnce(text, before, after) {
  const occurrences = text.split(before).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `Expected one mutation target, found ${occurrences}: ${before}`,
    );
  }
  return text.replace(before, after);
}

function replaceInSection(text, startMarker, endMarker, mutate) {
  const start = text.indexOf(startMarker);
  if (start === -1) {
    throw new Error(`Missing section start: ${startMarker}`);
  }
  const end =
    endMarker === null ? text.length : text.indexOf(endMarker, start + 1);
  if (end === -1) {
    throw new Error(`Missing section end: ${endMarker}`);
  }
  const section = text.slice(start, end);
  const mutated = mutate(section);
  if (mutated === section) {
    throw new Error(`Section mutation made no change: ${startMarker}`);
  }
  return `${text.slice(0, start)}${mutated}${text.slice(end)}`;
}

function replaceLineContaining(text, needle, mutate) {
  const lines = text.split("\n");
  const matchingIndexes = lines
    .map((line, index) => (line.includes(needle) ? index : -1))
    .filter((index) => index !== -1);
  if (matchingIndexes.length !== 1) {
    throw new Error(
      `Expected one line containing ${needle}, found ${matchingIndexes.length}`,
    );
  }
  const index = matchingIndexes[0];
  const mutated = mutate(lines[index]);
  if (mutated === lines[index]) {
    throw new Error(`Line mutation made no change: ${needle}`);
  }
  lines[index] = mutated;
  return lines.join("\n");
}

function hashPackage(root) {
  return Object.fromEntries(
    fs
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const content = fs.readFileSync(path.join(root, entry.name));
        return [
          entry.name,
          crypto.createHash("sha256").update(content).digest("hex"),
        ];
      })
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function runValidator(fixtureRoot, extraArgs = []) {
  const result = spawnSync(
    process.execPath,
    [
      validatorPath,
      "--fixture-root",
      fixtureRoot,
      ...extraArgs,
    ],
    {
      cwd: packageRoot,
      encoding: "utf8",
    },
  );
  let payload;
  try {
    payload = JSON.parse(result.stdout);
  } catch {
    throw new Error(
      `Validator did not return JSON (status ${result.status}): ${result.stderr || result.stdout}`,
    );
  }
  return { status: result.status, payload, stderr: result.stderr };
}

const cases = [
  {
    name: "duplicate Owner field",
    file: "OWNER-DECISIONS.md",
    expected: "FOUND-001 has duplicate Owner field Normalized disposition",
    mutate: (text) =>
      replaceInSection(
        text,
        "### DECISION FOUND-001",
        "### DECISION FOUND-002",
        (section) =>
          replaceExactlyOnce(
            section,
            "- **Normalized disposition:** APPROVE WITH REWORDING",
            "- **Normalized disposition:** APPROVE WITH REWORDING\n- **Normalized disposition:** REJECT",
          ),
      ),
  },
  {
    name: "contradictory Batch 1 approved wording",
    file: "OWNER-DECISIONS.md",
    expected:
      "FOUND-001 Batch 1 approved wording does not match the approved decision",
    mutate: (text) =>
      replaceInSection(
        text,
        "### DECISION FOUND-001",
        "### DECISION FOUND-002",
        (section) =>
          replaceLineContaining(section, "- **Approved wording:**", () =>
            "- **Approved wording:** Contradiction: reject learner ownership."),
      ),
  },
  {
    name: "pending row retains confirmed eligibility",
    file: "DISPOSITION-MATRIX.md",
    expected: "FOUND-001 pending matrix row is not blocked",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-001` |", (line) =>
        replaceExactlyOnce(
          line,
          "`APPROVE WITH REWORDING` | `ELIGIBLE AFTER PHASE 1 DISPOSITION COMPLETES`",
          "`PENDING` | `ELIGIBLE AFTER PHASE 1 DISPOSITION COMPLETES`",
        )),
  },
  {
    name: "false Batch 1 pending state",
    file: "OWNER-DECISIONS.md",
    expected:
      "Batch 1 status is PENDING, expected CONFIRMED BY PRODUCT OWNER",
    mutate: (text) =>
      replaceLineContaining(text, "| 1 | Identity and Audience", (line) =>
        replaceExactlyOnce(
          line,
          "`CONFIRMED BY PRODUCT OWNER`",
          "`PENDING`",
        )),
  },
  {
    name: "stale recommendation summary",
    file: "DISPOSITION-MATRIX.md",
    expected:
      "Recommendation summary count for APPROVE AS RECORD does not match derived count 17",
    mutate: (text) =>
      replaceExactlyOnce(
        text,
        "| `APPROVE AS RECORD` | 17 |",
        "| `APPROVE AS RECORD` | 99 |",
      ),
  },
  {
    name: "recommendation conflicts with matrix",
    file: "RECOMMENDED-DISPOSITIONS.md",
    expected:
      "FOUND-005 Recommended Dispositions value does not match the matrix",
    mutate: (text) =>
      replaceInSection(
        text,
        "### FOUND-005 —",
        "### FOUND-006 —",
        (section) =>
          replaceExactlyOnce(
            section,
            "- **Recommended disposition:** `APPROVE AS RECORD`.",
            "- **Recommended disposition:** `REJECT`.",
          ),
      ),
  },
  {
    name: "authority route conflicts with insertion",
    file: "AUTHORITY-ROUTING.md",
    expected: "FOUND-001 authority route does not match its insertion home",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-001` |", (line) =>
        replaceExactlyOnce(
          line,
          "Confirmed future AX-0001 Product Decision",
          "Evidence Only",
        )),
  },
  {
    name: "duplicate matrix Candidate provenance",
    file: "DISPOSITION-MATRIX.md",
    expected: "FOUND-005 matrix Candidate provenance contains duplicates",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-005` |", (line) =>
        replaceExactlyOnce(
          line,
          "`CAND-000005`,",
          "`CAND-000005`, `CAND-000005`,",
        )),
  },
  {
    name: "malformed Candidate suffix",
    file: "DISPOSITION-MATRIX.md",
    expected:
      "DISPOSITION-MATRIX.md contains malformed Candidate token CAND-000005X",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-005` |", (line) =>
        replaceExactlyOnce(line, "CAND-000005", "CAND-000005X")),
  },
  {
    name: "contradictory duplicate verdict",
    file: "VALIDATION-REPORT.md",
    expected:
      "VALIDATION-REPORT contains 2 current-verdict headings and 2 verdict statements, expected one of each",
    mutate: (text) => {
      const contradictoryVerdict = text.includes(
        "**NOT READY FOR PHASE 1 CANONICAL INSERTION**",
      )
        ? "READY FOR PHASE 1 CANONICAL INSERTION"
        : "NOT READY FOR PHASE 1 CANONICAL INSERTION";
      return `${text}\n## Current verdict\n\n**${contradictoryVerdict}**\n`;
    },
  },
  {
    name: "malformed decision heading",
    file: "OWNER-DECISIONS.md",
    expected: "OWNER-DECISIONS contains a malformed decision heading",
    mutate: (text) => `${text}\n### DECISION: FOUND-999\n`,
  },
  {
    name: "invalid calendar date",
    file: "OWNER-DECISIONS.md",
    expected: "FOUND-001 has invalid or missing decision date",
    mutate: (text) =>
      replaceInSection(
        text,
        "### DECISION FOUND-001",
        "### DECISION FOUND-002",
        (section) =>
          replaceExactlyOnce(
            section,
            "- **Date:** 2026-07-19",
            "- **Date:** 2026-99-99",
          ),
      ),
  },
  {
    name: "matrix title drifts from foundation",
    file: "DISPOSITION-MATRIX.md",
    expected: "FOUND-005 matrix original title does not match AXOM-0002C",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-005` |", (line) =>
        replaceExactlyOnce(
          line,
          "Calm, non-punitive academic support",
          "Punitive academic pressure",
        )),
  },
  {
    name: "stale README confirmed count",
    file: "README.md",
    expected:
      "README confirmed Product Owner decisions state is not the singleton derived value",
    mutate: (text) =>
      text.replace(
        /^- Confirmed Product Owner decisions: (\d+) of 35$/m,
        (line, count) =>
          `- Confirmed Product Owner decisions: ${Number(count) + 1} of 35`,
      ),
  },
  {
    name: "confirmed matrix eligibility conflicts with Owner record",
    file: "DISPOSITION-MATRIX.md",
    expected:
      "FOUND-001 matrix insertion eligibility does not match confirmed record",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-001` |", (line) =>
        replaceExactlyOnce(
          line,
          "`ELIGIBLE AFTER PHASE 1 DISPOSITION COMPLETES`",
          "`BLOCKED — OWNER DECISION`",
        )),
  },
  {
    name: "confirmed recommendation decision remains pending",
    file: "RECOMMENDED-DISPOSITIONS.md",
    expected:
      "FOUND-001 recommendation decision does not match the confirmed Owner record",
    mutate: (text) =>
      replaceInSection(
        text,
        "### FOUND-001 —",
        "### FOUND-002 —",
        (section) =>
          replaceExactlyOnce(
            section,
            "- **Product Owner decision:** `APPROVE WITH REWORDING`.",
            "- **Product Owner decision:** `PENDING`.",
          ),
      ),
  },
  {
    name: "confirmed recommendation eligibility remains blocked",
    file: "RECOMMENDED-DISPOSITIONS.md",
    expected:
      "FOUND-001 recommendation eligibility does not match the confirmed Owner record",
    mutate: (text) =>
      replaceInSection(
        text,
        "### FOUND-001 —",
        "### FOUND-002 —",
        (section) =>
          replaceExactlyOnce(
            section,
            "- **Insertion eligibility:** `ELIGIBLE AFTER PHASE 1 DISPOSITION COMPLETES`.",
            "- **Insertion eligibility:** Blocked pending Owner decision.",
          ),
      ),
  },
  {
    name: "confirmed recommendation has false confirmation state",
    file: "RECOMMENDED-DISPOSITIONS.md",
    expected:
      "FOUND-001 recommendation confirmation state is not CONFIRMED BY PRODUCT OWNER",
    mutate: (text) =>
      replaceInSection(
        text,
        "### FOUND-001 —",
        "### FOUND-002 —",
        (section) =>
          replaceExactlyOnce(
            section,
            "- **Confirmation state:** `CONFIRMED BY PRODUCT OWNER`.",
            "- **Confirmation state:** `PENDING`.",
          ),
      ),
  },
  {
    name: "confirmed recommendation authority route drifts",
    file: "RECOMMENDED-DISPOSITIONS.md",
    expected:
      "FOUND-001 recommendation authority route does not exactly match the confirmed Owner record",
    mutate: (text) =>
      replaceInSection(
        text,
        "### FOUND-001 —",
        "### FOUND-002 —",
        (section) =>
          replaceLineContaining(section, "- **Authority route:**", (line) =>
            replaceExactlyOnce(
              line,
              "Canonical AX-0001 Product Decision",
              "Evidence Only",
            )),
      ),
  },
  {
    name: "confirmed recommendation exclusions drift",
    file: "RECOMMENDED-DISPOSITIONS.md",
    expected:
      "FOUND-001 recommendation Approved exclusions does not match the confirmed Owner record",
    mutate: (text) =>
      replaceInSection(
        text,
        "### FOUND-001 —",
        "### FOUND-002 —",
        (section) =>
          replaceExactlyOnce(
            section,
            "hosted URL cleanup remain outside this record.",
            "hosted URL cleanup is approved inside this record.",
          ),
      ),
  },
  {
    name: "confirmed Owner authority route drifts",
    file: "OWNER-DECISIONS.md",
    expected: "FOUND-001 confirmed Owner authority route does not reconcile",
    mutate: (text) =>
      replaceInSection(
        text,
        "### DECISION FOUND-001",
        "### DECISION FOUND-002",
        (section) =>
          replaceExactlyOnce(
            section,
            "- **Authority route:** Canonical AX-0001 Product Decision",
            "- **Authority route:** Evidence Only",
          ),
      ),
  },
  {
    name: "Owner exact response is absent from verbatim block",
    file: "OWNER-DECISIONS.md",
    expected:
      "FOUND-001 exact Product Owner response is absent from the Batch 1 verbatim block",
    mutate: (text) =>
      replaceInSection(
        text,
        "### DECISION FOUND-001",
        "### DECISION FOUND-002",
        (section) =>
          replaceLineContaining(
            section,
            "- **Exact Product Owner response:**",
            (line) =>
              replaceExactlyOnce(
                line,
                "whose authority, continuity, and knowledge belong first to the learner.",
                "whose authority and knowledge belong first to the learner.",
              ),
          ),
      ),
  },
  {
    name: "deferred-question state remains stale",
    file: "DEFERRED-QUESTIONS.md",
    expected: "DEFERRED-QUESTIONS state does not match",
    mutate: (text) =>
      `${text}\nBatch 1 is unresolved. Questions in Batches 2 through 7 remain pending until their decision batch is reached.\n`,
  },
  {
    name: "deferred-question batch heading reopens Batch 1",
    file: "DEFERRED-QUESTIONS.md",
    expected:
      "DEFERRED-QUESTIONS Batch 1 resolved/pending heading does not match Owner decisions",
    mutate: (text) =>
      replaceExactlyOnce(
        text,
        "## Resolved in Batch 1 — Identity and Audience",
        "## Batch 1 — Identity and Audience",
      ),
  },
  {
    name: "duplicate contradictory structural result",
    file: "VALIDATION-REPORT.md",
    expected:
      "VALIDATION-REPORT Structural result is not the singleton expected value `PASS`",
    mutate: (text) => `${text}\n- Structural result: \`FAIL\`\n`,
  },
  {
    name: "malformed FOUND handle suffix",
    file: "README.md",
    expected: "README.md contains malformed FOUND handle FOUND-001X",
    mutate: (text) => `${text}\nMalformed proposal handle: FOUND-001X.\n`,
  },
  {
    name: "malformed DISP handle suffix",
    file: "README.md",
    expected: "README.md contains malformed DISP handle DISP-011AA",
    mutate: (text) => `${text}\nMalformed temporary handle: DISP-011AA.\n`,
  },
  {
    name: "duplicate verbatim Batch 1 block",
    file: "OWNER-DECISIONS.md",
    expected: "OWNER-DECISIONS does not preserve the exact Batch 1 response",
    mutate: (text) => {
      const start = text.indexOf("## Verbatim Batch 1 response");
      const end = text.indexOf("## Batch status", start);
      if (start === -1 || end === -1) {
        throw new Error("Missing verbatim Batch 1 section");
      }
      return `${text}\n${text.slice(start, end)}`;
    },
  },
  {
    name: "self-referential report HEAD",
    file: "VALIDATION-REPORT.md",
    expected:
      "VALIDATION-REPORT contains self-referential dynamic field Repository HEAD",
    mutate: (text) =>
      `${text}\n- Repository HEAD: bcfc82c123f013911d94eac8d8a9e9688cf084ad\n`,
  },
  {
    name: "stale conditional future-record total",
    file: "CANONICAL-INSERTION-PLAN.md",
    expected: "Insertion-plan future-record summary does not match 40",
    mutate: (text) =>
      replaceExactlyOnce(
        text,
        "**40 potential future canonical records**",
        "**99 potential future canonical records**",
      ),
  },
  {
    name: "Evidence-only summary names the wrong proposal",
    file: "CANONICAL-INSERTION-PLAN.md",
    expected:
      "Insertion-plan Evidence-only summary does not match 1 governing proposals",
    mutate: (text) =>
      replaceLineContaining(text, "- Evidence-only proposals:", (line) =>
        replaceExactlyOnce(line, "FOUND-030", "FOUND-031")),
  },
  {
    name: "unregistered governance ID",
    file: "README.md",
    expected: "README.md contains unregistered governance ID AX-0099",
    mutate: (text) => `${text}\nUnregistered authority: AX-0099.\n`,
  },
  {
    name: "Batch 1 verbatim response tamper",
    file: "OWNER-DECISIONS.md",
    expected: "OWNER-DECISIONS does not preserve the exact Batch 1 response",
    mutate: (text) =>
      replaceInSection(
        text,
        "## Verbatim Batch 1 response",
        "## Batch status",
        (section) =>
          replaceExactlyOnce(
            section,
            "connected, compounding system",
            "connected and compounding system",
          ),
      ),
  },
  {
    name: "unknown Candidate ID",
    file: "DISPOSITION-MATRIX.md",
    expected: "DISPOSITION-MATRIX.md contains unknown Candidate CAND-999999",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-005` |", (line) =>
        replaceExactlyOnce(line, "CAND-000005", "CAND-999999")),
  },
  {
    name: "matrix decision without Owner record",
    expected: "FOUND-005 has a matrix decision without an Owner record",
    prepare: (fixtureRoot) => {
      const matrixPath = path.join(fixtureRoot, "DISPOSITION-MATRIX.md");
      let matrix = fs.readFileSync(matrixPath, "utf8");
      const found005Line = matrix
        .split("\n")
        .find((line) => line.includes("| `FOUND-005` |"));
      if (found005Line?.includes("`PENDING` | `BLOCKED — OWNER DECISION`")) {
        matrix = replaceLineContaining(matrix, "| `FOUND-005` |", (line) =>
          replaceExactlyOnce(
            line,
            "`PENDING` | `BLOCKED — OWNER DECISION`",
            "`APPROVE AS RECORD` | `ELIGIBLE AFTER PHASE 1 DISPOSITION COMPLETES`",
          ));
        fs.writeFileSync(matrixPath, matrix);
      }

      const ownerPath = path.join(fixtureRoot, "OWNER-DECISIONS.md");
      let owner = fs.readFileSync(ownerPath, "utf8");
      const recordStart = owner.indexOf("### DECISION FOUND-005");
      if (recordStart !== -1) {
        const nextRecord = owner.indexOf(
          "\n### DECISION FOUND-",
          recordStart + 1,
        );
        owner =
          nextRecord === -1
            ? owner.slice(0, recordStart)
            : `${owner.slice(0, recordStart)}${owner.slice(nextRecord + 1)}`;
        fs.writeFileSync(ownerPath, owner);
      }
    },
  },
  {
    name: "duplicate confirmed decision heading",
    file: "OWNER-DECISIONS.md",
    expected: "OWNER-DECISIONS contains duplicate confirmed record headings",
    mutate: (text) => `${text}\n### DECISION FOUND-001\n`,
  },
  {
    name: "temporary split-handle drift",
    file: "CANONICAL-INSERTION-PLAN.md",
    expected: conditionalSplitParent
      ? `${conditionalSplitParent} conditional temporary handles do not match the split plan`
      : "Unknown or stale temporary disposition handle DISP-999A",
    mutate: (text) => {
      if (
        !conditionalSplitLine ||
        !conditionalSplitHandle
      ) {
        return `${text}\nStale temporary handle: DISP-999A.\n`;
      }
      const replacement = `${conditionalSplitHandle.slice(0, -1)}${
        conditionalSplitHandle.endsWith("Z") ? "Y" : "Z"
      }`;
      return replaceExactlyOnce(
        text,
        conditionalSplitLine,
        replaceExactlyOnce(
          conditionalSplitLine,
          conditionalSplitHandle,
          replacement,
        ),
      );
    },
  },
  {
    name: "duplicate temporary-handle parent row",
    file: "CANONICAL-INSERTION-PLAN.md",
    expected: conditionalSplitLine
      ? "Conditional temporary-handle table does not contain every split parent exactly once"
      : "CANONICAL-INSERTION-PLAN.md contains malformed DISP handle DISP-999AA",
    mutate: (text) =>
      conditionalSplitLine
        ? replaceExactlyOnce(
            text,
            conditionalSplitLine,
            `${conditionalSplitLine}\n${conditionalSplitLine}`,
          )
        : `${text}\nMalformed temporary handle: DISP-999AA.\n`,
  },
  {
    name: "unauthorized permanent product ID",
    file: "README.md",
    expected: "README.md contains unauthorized product ID AX-0100",
    mutate: (text) => `${text}\nUnauthorized allocation: AX-0100.\n`,
  },
  {
    name: "prohibited canonical field",
    file: "README.md",
    expected: "README.md canonically assigns prohibited field Priority",
    mutate: (text) => `${text}\n- **Priority:** High\n`,
  },
  {
    name: "malformed Markdown table",
    file: "OWNER-DECISIONS.md",
    expected: "has an invalid Markdown table delimiter row",
    mutate: (text) =>
      replaceExactlyOnce(
        text,
        "| ---: | --- | --- |",
        "| -- | --- | --- |",
      ),
  },
  {
    name: "wrapped recommendation provenance drift",
    file: "RECOMMENDED-DISPOSITIONS.md",
    expected:
      "FOUND-005 Recommended Dispositions Candidate provenance does not match the matrix",
    mutate: (text) =>
      replaceInSection(
        text,
        "### FOUND-005 —",
        "### FOUND-006 —",
        (section) =>
          replaceExactlyOnce(section, "CAND-000015", "CAND-000016"),
      ),
  },
  {
    name: "duplicate insertion Candidate provenance",
    file: "CANONICAL-INSERTION-PLAN.md",
    expected:
      "FOUND-005 insertion Candidate provenance does not match the matrix",
    mutate: (text) =>
      replaceLineContaining(
        text,
        "| `FOUND-005` |",
        (line) =>
          replaceExactlyOnce(
            line,
            "`CAND-000005`,",
            "`CAND-000005`, `CAND-000005`,",
          ),
      ),
  },
  {
    name: "resolved deferred question relabeled unresolved",
    file: "DEFERRED-QUESTIONS.md",
    expected:
      "DEFERRED-QUESTIONS OQ-001 state/content does not match Batch 1 Owner decisions",
    mutate: (text) =>
      replaceInSection(
        text,
        "## Resolved in Batch 1",
        "## Resolved in Batch 2",
        (section) =>
          replaceExactlyOnce(
            section,
            "`FOUND-001` — resolved:** The approved product class is",
            "`FOUND-001` — unresolved:** Is the approved product class",
          ),
      ),
  },
  {
    name: "confirmed deferred safeguard gains contradiction",
    file: "DEFERRED-QUESTIONS.md",
    expected:
      "DEFERRED-QUESTIONS OQ-004 resolved wording does not exactly match the confirmed Batch 1 decision",
    mutate: (text) =>
      replaceInSection(
        text,
        "## Resolved in Batch 1",
        "## Resolved in Batch 2",
        (section) =>
          replaceExactlyOnce(
            section,
            "  applicable.",
            "  applicable. In fact, currently underperforming learners are unwelcome.",
          ),
      ),
  },
  {
    name: "confirmed recommendation wording gains contradiction",
    file: "RECOMMENDED-DISPOSITIONS.md",
    expected:
      "FOUND-001 recommendation wording does not exactly match the confirmed Owner record",
    mutate: (text) =>
      replaceInSection(
        text,
        "### FOUND-001 —",
        "### FOUND-002 —",
        (section) =>
          replaceExactlyOnce(
            section,
            "  and knowledge belong first to the learner.",
            "  and knowledge belong first to the learner. This confirmed wording is rejected.",
          ),
      ),
  },
  {
    name: "confirmed recommendation route gains contradiction",
    file: "RECOMMENDED-DISPOSITIONS.md",
    expected:
      "FOUND-001 recommendation authority route does not exactly match the confirmed Owner record",
    mutate: (text) =>
      replaceInSection(
        text,
        "### FOUND-001 —",
        "### FOUND-002 —",
        (section) =>
          replaceExactlyOnce(
            section,
            "  Identity.\n- **Insertion eligibility:**",
            "  Identity. This route is rejected and must not be inserted.\n- **Insertion eligibility:**",
          ),
      ),
  },
  {
    name: "confirmed authority follow-up gains contradiction",
    file: "AUTHORITY-ROUTING.md",
    expected:
      "FOUND-001 Authority Routing cells do not exactly match the confirmed Batch 1 route",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-001` |", (line) =>
        replaceExactlyOnce(
          line,
          "no Lexicon or governance amendment |",
          "no Lexicon or governance amendment; governance amendment is nevertheless required immediately |",
        )),
  },
  {
    name: "verdict reason gains authorization contradiction",
    file: "VALIDATION-REPORT.md",
    expected: "VALIDATION-REPORT verdict reason does not match",
    mutate: (text) =>
      replaceInSection(
        text,
        "## Current verdict",
        null,
        (section) =>
          replaceExactlyOnce(
            section,
            "authorized for commit.",
            "authorized for commit. Nevertheless, the package is ready and authorized for canonical insertion.",
          ),
      ),
  },
  {
    name: "pending authority route has conflicting classes",
    file: "AUTHORITY-ROUTING.md",
    expected: "FOUND-009 authority route does not match its insertion home",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-009` |", (line) =>
        replaceExactlyOnce(
          line,
          "| AX-0001 Product Decision |",
          "| AX-0001 Product Decision, but this proposal is Rejected |",
        )),
  },
  {
    name: "pending insertion home has conflicting classes",
    file: "CANONICAL-INSERTION-PLAN.md",
    expected: "FOUND-009 authority route does not match its insertion home",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-009` |", (line) =>
        replaceExactlyOnce(
          line,
          "| Canonical AX-0001 Product Decision |",
          "| Canonical AX-0001 Product Decision, but Rejected with no insertion |",
        )),
  },
  {
    name: "README has contradictory authorization duplicates",
    file: "README.md",
    expected:
      "README Canonical insertion authorized must be the singleton value no",
    mutate: (text) =>
      replaceExactlyOnce(
        text,
        "- Canonical insertion authorized: no\n- Disposition-package commit authorized: no",
        "- Canonical insertion authorized: no\n- Canonical insertion authorized: yes\n- Disposition-package commit authorized: no\n- Disposition-package commit authorized: yes",
      ),
  },
  {
    name: "README pending narrative gains approval contradiction",
    file: "README.md",
    expected:
      "README pending-state narrative contains an inconsistent approval claim",
    mutate: (text) =>
      replaceExactlyOnce(
        text,
        "27 recommendations are analytical defaults only and remain `PENDING`. Silence",
        "27 recommendations are analytical defaults only and remain `PENDING`. Nevertheless, all remaining recommendations are approved. Silence",
      ),
  },
  {
    name: "validation report has contradictory authorization duplicates",
    file: "VALIDATION-REPORT.md",
    expected:
      "VALIDATION-REPORT Disposition-package commit authorization must be the singleton value not requested",
    mutate: (text) =>
      replaceExactlyOnce(
        text,
        "- Disposition-package commit authorization: not requested\n- Push authorization: not granted",
        "- Disposition-package commit authorization: not requested\n- Disposition-package commit authorization: granted\n- Push authorization: not granted\n- Push authorization: granted",
      ),
  },
  {
    name: "insertion blockers contradict commit authorization",
    file: "CANONICAL-INSERTION-PLAN.md",
    expected:
      "Insertion-plan commit authorization blocker does not match the pending decision state",
    mutate: (text) =>
      replaceExactlyOnce(
        text,
        "- The disposition package is not authorized for commit.",
        "- The disposition package is not authorized for commit.\n- The disposition package is authorized for commit.",
      ),
  },
  {
    name: "split child boundary gains rejection contradiction",
    file: "SPLIT-MERGE-PLAN.md",
    expected:
      "DISP-011A split field Boundary contains contradictory rejection language",
    mutate: (text) =>
      replaceInSection(
        text,
        "### DISP-011A —",
        "### DISP-011B —",
        (section) =>
          replaceExactlyOnce(
            section,
            "  persistence.",
            "  persistence. This split child is rejected and has no valid boundary.",
          ),
      ),
  },
  {
    name: "Owner totals gain contradictory bold summaries",
    file: "DISPOSITION-MATRIX.md",
    expected:
      "Current Owner summary Confirmed is not the singleton derived count 8",
    mutate: (text) =>
      `${text.trimEnd()}\n| **Confirmed** | **35** |\n| **Pending** | **0** |\n| **Total** | **999** |\n`,
  },
  {
    name: "recommendation totals gain contradictory bold total",
    file: "DISPOSITION-MATRIX.md",
    expected:
      "Recommendation summary Total is not the singleton count 35",
    mutate: (text) =>
      replaceExactlyOnce(
        text,
        "| **Total** | **35** |\n\n## Current Product Owner totals",
        "| **Total** | **35** |\n| **Total** | **999** |\n\n## Current Product Owner totals",
      ),
  },
  {
    name: "authority split handles swap parents",
    file: "AUTHORITY-ROUTING.md",
    expected:
      "FOUND-011 Authority Routing temporary handles do not match its split children",
    mutate: (text) => {
      const placeholder = "__AUTHORITY_SPLIT_PAIR__";
      return replaceExactlyOnce(
        replaceExactlyOnce(
          replaceExactlyOnce(
            text,
            "`DISP-011A`, `DISP-011B`",
            placeholder,
          ),
          "`DISP-012A`, `DISP-012B`",
          "`DISP-011A`, `DISP-011B`",
        ),
        placeholder,
        "`DISP-012A`, `DISP-012B`",
      );
    },
  },
  {
    name: "matrix split handles swap parents",
    file: "DISPOSITION-MATRIX.md",
    expected:
      "FOUND-011 matrix temporary handles do not match its split children",
    mutate: (text) => {
      let mutated = replaceLineContaining(
        text,
        "| `FOUND-011` |",
        (line) => line.replaceAll("DISP-011", "DISP-012"),
      );
      mutated = replaceLineContaining(
        mutated,
        "| `FOUND-012` |",
        (line) => line.replaceAll("DISP-012", "DISP-011"),
      );
      return mutated;
    },
  },
  {
    name: "recommended split targets use sibling parent handles",
    file: "RECOMMENDED-DISPOSITIONS.md",
    expected:
      "FOUND-011 Recommended split targets do not match its split children",
    mutate: (text) =>
      replaceInSection(
        text,
        "### FOUND-011 —",
        "### FOUND-012 —",
        (section) =>
          replaceExactlyOnce(
            section,
            "- **Recommended merge or split targets:** `DISP-011A`, `DISP-011B`.",
            "- **Recommended merge or split targets:** `DISP-012A`, `DISP-012B`.",
          ),
      ),
  },
  {
    name: "positive insertion route is negated without a second class",
    file: "CANONICAL-INSERTION-PLAN.md",
    expected:
      "FOUND-009 positive authority route contains contradictory negation",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-009` |", (line) =>
        replaceExactlyOnce(
          line,
          "| Canonical AX-0001 Product Decision |",
          "| Canonical AX-0001 Product Decision, but no insertion is permitted |",
        )),
  },
  {
    name: "positive authority route is negated without a second class",
    file: "AUTHORITY-ROUTING.md",
    expected:
      "FOUND-009 positive authority route contains contradictory negation",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-009` |", (line) =>
        replaceExactlyOnce(
          line,
          "| AX-0001 Product Decision |",
          "| AX-0001 Product Decision, but this route has no authority |",
        )),
  },
  {
    name: "negative harness fixture inventory is erased",
    file: "test-validator-negative.mjs",
    expected: "Negative fixture inventory is missing mandatory fixtures",
    mutate: (text) => {
      const declarations = [...text.matchAll(/^const cases = \[$/gm)];
      if (declarations.length !== 1) {
        throw new Error(
          `Expected one active cases declaration, found ${declarations.length}`,
        );
      }
      return text
        .replace(
          /^const cases = \[$/m,
          "const cases = [];\nconst disabledCases = [",
        )
        .replace(/^    name:/gm, "    disabledName:");
    },
  },
  {
    name: "pending recommendation analytical boundary drifts",
    file: "RECOMMENDED-DISPOSITIONS.md",
    expected:
      "FOUND-005 recommendation analytical fields drift from the preserved baseline",
    mutate: (text) =>
      replaceInSection(
        text,
        "### FOUND-005 —",
        "### FOUND-006 —",
        (section) =>
          replaceExactlyOnce(
            section,
            "  when optional, bounded, and subordinate to learning.",
            "  when optional, bounded, and subordinate to learning. Punitive leaderboards are mandatory product behavior.",
          ),
      ),
  },
  {
    name: "pending matrix analytical boundary drifts",
    file: "DISPOSITION-MATRIX.md",
    expected:
      "FOUND-009 pending matrix analytical fields drift from the preserved baseline",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-009` |", (line) =>
        replaceExactlyOnce(
          line,
          "Permanent daily-loop pillar independent of page layout",
          "Permanent daily-loop pillar with a mandatory page layout",
        )),
  },
  {
    name: "validation phase narrative gains approval contradiction",
    file: "VALIDATION-REPORT.md",
    expected:
      "VALIDATION-REPORT current-phase narrative contains an inconsistent approval claim",
    mutate: (text) =>
      replaceInSection(
        text,
        "## Current phase",
        "## Repository boundary",
        (section) =>
          replaceExactlyOnce(
            section,
            "approval.",
            "approval. Nevertheless, all remaining proposals are approved.",
          ),
      ),
  },
  {
    name: "malformed AX token",
    file: "README.md",
    expected: "README.md contains malformed AX token AX-100",
    mutate: (text) => `${text}\nMalformed permanent allocation: AX-100.\n`,
  },
  {
    name: "malformed Constitution token",
    file: "README.md",
    expected: "README.md contains malformed Constitution token C-01",
    mutate: (text) => `${text}\nMalformed Constitution reference: C-01.\n`,
  },
  {
    name: "unconfirmed deferred question is marked resolved",
    file: "DEFERRED-QUESTIONS.md",
    expected:
      "DEFERRED-QUESTIONS OQ-009 state/content does not match Batch 3 Owner decisions",
    mutate: (text) =>
      replaceExactlyOnce(
        text,
        "`FOUND-009`–`FOUND-012`:** Confirm the proposed pillar boundaries",
        "`FOUND-009`–`FOUND-012` — resolved:** Confirm the proposed pillar boundaries",
      ),
  },
  {
    name: "confirmed matrix boundary contradicts Owner record",
    file: "DISPOSITION-MATRIX.md",
    expected:
      "FOUND-001 confirmed matrix boundary does not exactly match the Owner record",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-001` |", (line) =>
        replaceExactlyOnce(
          line,
          "Learner-Owned Academic Operating System — AXOM is a connected academic operating system whose authority, continuity, and knowledge belong first to the learner.",
          "Contradictory confirmed matrix boundary — this proposal is rejected.",
        )),
  },
  {
    name: "Owner approved wording contradicts approved fields",
    file: "OWNER-DECISIONS.md",
    expected:
      "FOUND-002 Approved wording does not exactly match its approved title, boundary, and supporting statement",
    mutate: (text) =>
      replaceInSection(
        text,
        "### DECISION FOUND-002",
        "### DECISION FOUND-003",
        (section) =>
          replaceLineContaining(
            section,
            "- **Approved wording:**",
            () =>
              "- **Approved wording:** Title: Rejected Record. Boundary: The Product Owner rejected this proposal.",
          ),
      ),
  },
  {
    name: "Owner exact response contradicts generating disposition",
    file: "OWNER-DECISIONS.md",
    expected:
      "FOUND-001 exact Owner response contradicts its record-generating disposition",
    mutate: (text) =>
      replaceInSection(
        text,
        "### DECISION FOUND-001",
        "### DECISION FOUND-002",
        (section) =>
          replaceLineContaining(
            section,
            "- **Exact Product Owner response:**",
            () =>
              "- **Exact Product Owner response:** FOUND-001: Reject this proposal.",
          ),
      ),
  },
  {
    name: "Owner original title loses foundation provenance",
    file: "OWNER-DECISIONS.md",
    expected:
      "FOUND-002 Owner original proposal title does not match the matrix",
    mutate: (text) =>
      replaceInSection(
        text,
        "### DECISION FOUND-002",
        "### DECISION FOUND-003",
        (section) =>
          replaceLineContaining(
            section,
            "- **Original proposal title:**",
            () =>
              "- **Original proposal title:** Fabricated unrelated proposal title",
          ),
      ),
  },
  {
    name: "Owner Evidence references lose provenance",
    file: "OWNER-DECISIONS.md",
    expected:
      "FOUND-002 Evidence references do not exactly preserve its proposal and Candidate provenance",
    mutate: (text) =>
      replaceInSection(
        text,
        "### DECISION FOUND-002",
        "### DECISION FOUND-003",
        (section) =>
          replaceLineContaining(
            section,
            "- **Evidence references:**",
            () => "- **Evidence references:** NONE",
          ),
      ),
  },
  {
    name: "README confirmed handle range is stale",
    file: "README.md",
    expected:
      "README pending-state narrative contains an inconsistent approval claim",
    mutate: (text) =>
      replaceExactlyOnce(
        text,
        "confirmed `FOUND-001` through `FOUND-008`.",
        "confirmed `FOUND-001` through `FOUND-007`.",
      ),
  },
  {
    name: "Batch 2 verbatim response tamper",
    file: "OWNER-DECISIONS.md",
    expected:
      "OWNER-DECISIONS Batch 2 verbatim response does not match its immutable hash",
    mutate: (text) =>
      replaceInSection(
        text,
        "## Verbatim Batch 2 response",
        "## Batch status",
        (section) =>
          replaceExactlyOnce(
            section,
            "Competition must never distort learning truth or mastery reporting.",
            "Competition may distort learning truth or mastery reporting.",
          ),
      ),
  },
  {
    name: "Batch 2 normalized safeguard drifts",
    file: "OWNER-DECISIONS.md",
    expected:
      "FOUND-005 Batch 2 interpretation safeguard does not match the approved decision",
    mutate: (text) =>
      replaceInSection(
        text,
        "### DECISION FOUND-005",
        "### DECISION FOUND-006",
        (section) =>
          replaceExactlyOnce(
            section,
            "- **Interpretation safeguard:** Competition must never distort learning truth or mastery reporting.",
            "- **Interpretation safeguard:** Competition may distort learning truth or mastery reporting.",
          ),
      ),
  },
  {
    name: "Batch 2 authority retained cells drift",
    file: "AUTHORITY-ROUTING.md",
    expected:
      "FOUND-008 Authority Routing cells do not exactly match the confirmed Batch 2 route",
    mutate: (text) =>
      replaceLineContaining(text, "| `FOUND-008` |", (line) =>
        replaceExactlyOnce(
          line,
          "Generic Power Without Complexity doctrine remains governed by AX-0002/AX-0010",
          "Generic Power Without Complexity doctrine remains governed by AX-0010 alone",
        )),
  },
  {
    name: "Batch 2 resolved wording drifts",
    file: "DEFERRED-QUESTIONS.md",
    expected:
      "DEFERRED-QUESTIONS OQ-007 resolved wording does not exactly match the confirmed Batch 2 decision",
    mutate: (text) =>
      replaceInSection(
        text,
        "## Resolved in Batch 2",
        "## Batch 3",
        (section) =>
          replaceExactlyOnce(
            section,
            "  justify them. Activity must not masquerade as mastery.",
            "  justify them. Activity may masquerade as mastery.",
          ),
      ),
  },
  {
    name: "completion guards reject pending package",
    expected: "Completion required, but",
    extraArgs: ["--require-complete"],
    prepare: (fixtureRoot) => {
      const matrixPath = path.join(fixtureRoot, "DISPOSITION-MATRIX.md");
      let matrix = fs.readFileSync(matrixPath, "utf8");
      if (!matrix.includes("| `PENDING` |")) {
        matrix = replaceLineContaining(
          matrix,
          "| `FOUND-035` |",
          (line) =>
            line.replace(
              /\| `(?!PENDING`)([^`]+)` \| `ELIGIBLE AFTER PHASE 1 DISPOSITION COMPLETES` \|$/,
              "| `PENDING` | `BLOCKED — OWNER DECISION` |",
            ),
        );
        fs.writeFileSync(matrixPath, matrix);
      }
    },
  },
];
const caseNames = cases.map((testCase) => testCase.name);
if (
  cases.length < 81 ||
  new Set(caseNames).size !== caseNames.length ||
  caseNames.some((name) => !name)
) {
  throw new Error(
    "Negative fixture harness inventory is incomplete or duplicated",
  );
}

const beforeHashes = hashPackage(packageRoot);
const temporaryRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), "axom-c1-validator-negative-"),
);
const results = [];
let testFailure = null;
let afterHashes;

try {
  const baselineRoot = path.join(temporaryRoot, "baseline");
  fs.cpSync(packageRoot, baselineRoot, { recursive: true });
  const baseline = runValidator(baselineRoot);
  if (
    baseline.status !== 0 ||
    baseline.payload.structuralResult !== "PASS"
  ) {
    throw new Error(
      `Untouched fixture failed baseline validation: ${JSON.stringify(baseline.payload.errors)}`,
    );
  }

  for (let index = 0; index < cases.length; index += 1) {
    const testCase = cases[index];
    const fixtureRoot = path.join(
      temporaryRoot,
      `${String(index + 1).padStart(2, "0")}-${testCase.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`,
    );
    fs.cpSync(packageRoot, fixtureRoot, { recursive: true });
    if (testCase.mutate) {
      const targetPath = path.join(fixtureRoot, testCase.file);
      const original = fs.readFileSync(targetPath, "utf8");
      const mutated = testCase.mutate(original);
      if (mutated === original) {
        throw new Error(`${testCase.name}: mutation made no change`);
      }
      fs.writeFileSync(targetPath, mutated);
    }
    if (testCase.prepare) {
      testCase.prepare(fixtureRoot);
    }
    const result = runValidator(fixtureRoot, testCase.extraArgs);
    if (
      result.status !== 1 ||
      result.payload.structuralResult !== "FAIL" ||
      !result.payload.errors.some((error) =>
        error.includes(testCase.expected))
    ) {
      throw new Error(
        `${testCase.name}: expected rejection containing ${JSON.stringify(
          testCase.expected,
        )}; status=${result.status}; errors=${JSON.stringify(
          result.payload.errors,
        )}; stderr=${result.stderr}`,
      );
    }
    results.push({ name: testCase.name, result: "REJECTED" });
  }
} catch (error) {
  testFailure = error;
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
  afterHashes = hashPackage(packageRoot);
}

if (JSON.stringify(beforeHashes) !== JSON.stringify(afterHashes)) {
  throw new Error("Negative fixtures changed the live AXOM-0002C1 package");
}
if (testFailure) {
  throw testFailure;
}

console.log(
  JSON.stringify(
    {
      structuralResult: "PASS",
      untouchedBaseline: "PASS",
      negativeFixtures: cases.length,
      rejectedAsExpected: results.length,
      livePackageUnchanged: true,
      results,
    },
    null,
    2,
  ),
);
