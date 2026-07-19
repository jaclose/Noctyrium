#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const validatorPath = fileURLToPath(import.meta.url);
const sourcePackageRoot = path.dirname(validatorPath);
const repoRoot = path.resolve(sourcePackageRoot, "../../..");
const requireComplete = process.argv.includes("--require-complete");
const fixtureRootIndex = process.argv.indexOf("--fixture-root");
if (
  fixtureRootIndex !== -1 &&
  (!process.argv[fixtureRootIndex + 1] ||
    process.argv[fixtureRootIndex + 1].startsWith("--"))
) {
  throw new Error("--fixture-root requires a directory path");
}
const fixtureRoot =
  fixtureRootIndex === -1
    ? null
    : path.resolve(process.argv[fixtureRootIndex + 1]);
const packageRoot = fixtureRoot ?? sourcePackageRoot;
const requiredFiles = [
  "README.md",
  "DISPOSITION-MATRIX.md",
  "RECOMMENDED-DISPOSITIONS.md",
  "OWNER-DECISIONS.md",
  "AUTHORITY-ROUTING.md",
  "SPLIT-MERGE-PLAN.md",
  "DEFERRED-QUESTIONS.md",
  "CANONICAL-INSERTION-PLAN.md",
  "VALIDATION-REPORT.md",
];
const supportingFiles = [
  "validate-dispositions.mjs",
  "test-validator-negative.mjs",
];
const expectedPackageFiles = [...requiredFiles, ...supportingFiles].sort();
const allowedDispositions = new Set([
  "APPROVE AS RECORD",
  "APPROVE WITH REWORDING",
  "MERGE",
  "SPLIT",
  "EVIDENCE ONLY",
  "DEFER",
  "RESEARCH ONLY",
  "REJECT",
]);
const recordGeneratingDispositions = new Set([
  "APPROVE AS RECORD",
  "APPROVE WITH REWORDING",
  "MERGE",
  "SPLIT",
  "RESEARCH ONLY",
]);
const expectedHandles = Array.from(
  { length: 35 },
  (_, index) => `FOUND-${String(index + 1).padStart(3, "0")}`,
);
const batchHandles = new Map([
  [1, ["FOUND-001", "FOUND-002", "FOUND-003", "FOUND-004"]],
  [2, ["FOUND-005", "FOUND-006", "FOUND-007", "FOUND-008"]],
  [
    3,
    [
      "FOUND-009",
      "FOUND-010",
      "FOUND-011",
      "FOUND-012",
      "FOUND-025",
      "FOUND-026",
      "FOUND-027",
    ],
  ],
  [
    4,
    [
      "FOUND-013",
      "FOUND-014",
      "FOUND-017",
      "FOUND-018",
      "FOUND-019",
      "FOUND-020",
      "FOUND-021",
    ],
  ],
  [5, ["FOUND-015", "FOUND-016", "FOUND-022", "FOUND-023"]],
  [
    6,
    [
      "FOUND-028",
      "FOUND-029",
      "FOUND-030",
      "FOUND-031",
      "FOUND-032",
      "FOUND-033",
    ],
  ],
  [7, ["FOUND-024", "FOUND-034", "FOUND-035"]],
]);
const handleBatch = new Map(
  [...batchHandles].flatMap(([batch, handles]) =>
    handles.map((handle) => [handle, batch]),
  ),
);
const proposalBaseline = "bcfc82c123f013911d94eac8d8a9e9688cf084ad";
const confirmedState = "CONFIRMED BY PRODUCT OWNER";
const eligibleAfterPhase =
  "ELIGIBLE AFTER PHASE 1 DISPOSITION COMPLETES";
const expectedBatch1Verbatim = `“Approve Batch 1 with the following refinements:
FOUND-001: Approve with wording. Title: Learner-Owned Academic Operating
System. Description should state that AXOM is a connected academic operating
system whose authority, continuity, and knowledge belong first to the learner.
FOUND-002: Approve with wording. Mission: Transform Academic Overwhelm into
Clear, Grounded Progress. ‘One grounded next move’ is the primary daily
expression of this mission, not the mission itself.
FOUND-003: Approve as recommended. Preserve the connected, compounding system
vision without freezing the historical six-system taxonomy.
FOUND-004: Approve with wording. Primary audience: High-Performance
Health-Professions Learners, beginning with medical students. The learner
remains the primary user and authority even when AXOM is distributed through
institutions. Add the statement: AXOM is optimized for ambitious learners
rather than average educational workflows.”`;
const expectedVerbatimBatchHashes = new Map([
  [1, "fbbfecf865619a5734440e7a8fb01c7c4563a8d31ad374e3ec78fea31efbd484"],
  [2, "f0343dd700be5e04009c0d8ac32e30b2fccd0e95ffe94731c24ff56d4dff6785"],
]);
const expectedBatch1 = new Map([
  [
    "FOUND-001",
    {
      recommendation: "APPROVE WITH REWORDING",
      disposition: "APPROVE WITH REWORDING",
      originalTitle: "AXOM is the learner-owned academic operating system",
      response:
        "FOUND-001: Approve with wording. Title: Learner-Owned Academic Operating System. Description should state that AXOM is a connected academic operating system whose authority, continuity, and knowledge belong first to the learner.",
      title: "Learner-Owned Academic Operating System",
      boundary:
        "AXOM is a connected academic operating system whose authority, continuity, and knowledge belong first to the learner.",
      wording:
        "Title: Learner-Owned Academic Operating System. Boundary: AXOM is a connected academic operating system whose authority, continuity, and knowledge belong first to the learner.",
      category: "Product Decision",
      area: "Core Product / Identity",
      authority: "Canonical AX-0001 Product Decision",
      exclusions:
        "Do not force “local-first” into the title; do not use “operating partner” as the canonical title; exact audience and system taxonomy, accounts, sync, cloud promises, compatibility identifiers, legacy branding, and hosted URL cleanup remain outside this record.",
      safeguard:
        "Preserve local-first governance references, learner ownership, continuity, and connected-system identity without duplicating their definitions.",
      unresolved:
        "Legacy cloud copy, compatibility-brand debt, and hosted URL cleanup remain later dispositions.",
      candidateIds: ["CAND-000001", "CAND-000007"],
    },
  ],
  [
    "FOUND-002",
    {
      recommendation: "APPROVE WITH REWORDING",
      disposition: "APPROVE WITH REWORDING",
      originalTitle: "Turn academic overwhelm into one grounded next move",
      response:
        "FOUND-002: Approve with wording. Mission: Transform Academic Overwhelm into Clear, Grounded Progress. ‘One grounded next move’ is the primary daily expression of this mission, not the mission itself.",
      title: "Transform Academic Overwhelm into Clear, Grounded Progress",
      boundary:
        "AXOM exists to transform academic overwhelm into clear, grounded progress while preserving continuity across learning. “One grounded next move” is the primary daily expression of the mission, not the total mission.",
      wording:
        "Title: Transform Academic Overwhelm into Clear, Grounded Progress. Boundary: AXOM exists to transform academic overwhelm into clear, grounded progress while preserving continuity across learning. “One grounded next move” is the primary daily expression of the mission, not the total mission.",
      category: "Product Decision",
      area: "Core Product / Mission",
      authority: "Canonical AX-0001 Product Decision",
      exclusions:
        "Command Brief mechanics, daily-loop steps, generic primary-action doctrine, and mandatory evidence display for trivial interactions remain outside this record; “one grounded next move” must not be treated as the total mission.",
      safeguard:
        "The mission includes continuity across learning and is broader than any one daily recommendation surface.",
      unresolved: "NONE",
      candidateIds: ["CAND-000002", "CAND-000008", "CAND-000168"],
    },
  ],
  [
    "FOUND-003",
    {
      recommendation: "APPROVE AS RECORD",
      disposition: "APPROVE AS RECORD",
      originalTitle: "One connected system that compounds with use",
      response:
        "FOUND-003: Approve as recommended. Preserve the connected, compounding system vision without freezing the historical six-system taxonomy.",
      title: "One Connected System That Compounds with Use",
      boundary:
        "Trustworthy activity should improve later orientation, practice, reflection, and decisions. The record must not establish a permanent number of systems. The historical six-system taxonomy remains evidence and institutional history, not a frozen limit on future product structure.",
      wording:
        "Title: One Connected System That Compounds with Use. Boundary: Trustworthy activity should improve later orientation, practice, reflection, and decisions. The record must not establish a permanent number of systems. The historical six-system taxonomy remains evidence and institutional history, not a frozen limit on future product structure.",
      category: "Product Decision",
      area: "Core Product / Vision",
      authority: "Canonical AX-0001 Product Decision",
      exclusions:
        "Exact taxonomy, permanent system count, module hierarchy, Knowledge Graph implementation, and automatic acceptance of future systems remain outside this record.",
      safeguard:
        "Preserve the historical six-system taxonomy as evidence and institutional history without converting it into a frozen product limit.",
      unresolved:
        "NONE — future system taxonomy remains a separate Product Specification decision.",
      candidateIds: ["CAND-000003", "CAND-000042"],
    },
  ],
  [
    "FOUND-004",
    {
      recommendation: "APPROVE WITH REWORDING",
      disposition: "APPROVE WITH REWORDING",
      originalTitle:
        "Primary user: the high-pressure health-professions learner",
      response:
        "FOUND-004: Approve with wording. Primary audience: High-Performance Health-Professions Learners, beginning with medical students. The learner remains the primary user and authority even when AXOM is distributed through institutions. Add the statement: AXOM is optimized for ambitious learners rather than average educational workflows.",
      title:
        "Primary Audience: High-Performance Health-Professions Learners",
      boundary:
        "AXOM begins with medical students and is optimized first for ambitious, high-performance health-professions learners. The learner remains the primary user and authority even when AXOM is distributed through institutions.",
      wording:
        "Title: Primary Audience: High-Performance Health-Professions Learners. Boundary: AXOM begins with medical students and is optimized first for ambitious, high-performance health-professions learners. The learner remains the primary user and authority even when AXOM is distributed through institutions. Supporting statement: AXOM is optimized for ambitious learners rather than average educational workflows.",
      category: "Product Decision",
      area: "Core Product / Target User",
      authority: "Canonical AX-0001 Product Decision",
      exclusions:
        "SGU as a universal identity, commitments to every pathway, an institutional customer model, templates, and integrations remain outside this record.",
      safeguard:
        "“High-performance” must describe the target context, aspirations, and design demands. It must not imply that struggling, recovering, inconsistent, overwhelmed, or currently underperforming learners are unwelcome. AXOM’s recovery and non-punitive principles remain applicable.",
      unresolved:
        "Secondary audiences and SGU’s eventual role remain later decisions.",
      supportingStatement:
        "AXOM is optimized for ambitious learners rather than average educational workflows.",
      candidateIds: [
        "CAND-000001",
        "CAND-000031",
        "CAND-000032",
        "CAND-000040",
        "CAND-000082",
        "CAND-000083",
        "CAND-000085",
      ],
    },
  ],
]);
const expectedBatch2 = new Map([
  [
    "FOUND-005",
    {
      recommendation: "APPROVE AS RECORD",
      disposition: "APPROVE AS RECORD",
      originalTitle: "Calm, non-punitive academic support",
      response:
        "Disposition: APPROVE AS RECORD Approved title: Calm, Non-Punitive Academic Support Approved boundary: AXOM should help learners recover, reorient, and continue without using shame, manipulation, artificial urgency, or punitive design. Optional competition may exist only when it is: - honest - bounded - learner-controlled - optional - subordinate to learning Competition must never distort learning truth or mastery reporting. Approved exclusions: Competitive mechanics remain optional product features. Public rankings, leaderboards, and future game systems remain separate product decisions. Unresolved qualifications: NONE.",
      title: "Calm, Non-Punitive Academic Support",
      boundary:
        "AXOM should help learners recover, reorient, and continue without using shame, manipulation, artificial urgency, or punitive design. Optional competition may exist only when it is honest, bounded, learner-controlled, optional, and subordinate to learning. Competition must never distort learning truth or mastery reporting.",
      wording:
        "Title: Calm, Non-Punitive Academic Support. Boundary: AXOM should help learners recover, reorient, and continue without using shame, manipulation, artificial urgency, or punitive design. Optional competition may exist only when it is honest, bounded, learner-controlled, optional, and subordinate to learning. Competition must never distort learning truth or mastery reporting.",
      category: "Product Decision",
      area: "Product Philosophy / Experience",
      authority: "Canonical AX-0001 Product Decision",
      exclusions:
        "Competitive mechanics remain optional product features. Public rankings, leaderboards, and future game systems remain separate product decisions.",
      safeguard:
        "Competition must never distort learning truth or mastery reporting.",
      unresolved: "NONE",
      candidateIds: [
        "CAND-000005",
        "CAND-000015",
        "CAND-000021",
        "CAND-000086",
      ],
    },
  ],
  [
    "FOUND-006",
    {
      recommendation: "APPROVE WITH REWORDING",
      disposition: "APPROVE WITH REWORDING",
      originalTitle: "Question-first, feedback-driven learning",
      response:
        "Disposition: APPROVE WITH REWORDING Approved title: Question-First, Feedback-Driven Learning Approved boundary: Practice questions and high-quality feedback are AXOM's primary learning engine because retrieval is the strongest default mechanism for durable learning. Lectures, notes, flashcards, reflection, curriculum systems, and future learning modes remain fully supported where appropriate. Question-first defines the flagship learning engine. It is not an exclusive doctrine. Approved exclusions: No requirement that every learning session begin with questions. No prohibition on future learning systems. Unresolved qualifications: NONE.",
      title: "Question-First, Feedback-Driven Learning",
      boundary:
        "Practice questions and high-quality feedback are AXOM's primary learning engine because retrieval is the strongest default mechanism for durable learning. Lectures, notes, flashcards, reflection, curriculum systems, and future learning modes remain fully supported where appropriate. Question-first defines the flagship learning engine. It is not an exclusive doctrine.",
      wording:
        "Title: Question-First, Feedback-Driven Learning. Boundary: Practice questions and high-quality feedback are AXOM's primary learning engine because retrieval is the strongest default mechanism for durable learning. Lectures, notes, flashcards, reflection, curriculum systems, and future learning modes remain fully supported where appropriate. Question-first defines the flagship learning engine. It is not an exclusive doctrine.",
      category: "Product Decision",
      area: "Product Philosophy / Learning",
      authority: "Canonical AX-0001 Product Decision",
      exclusions:
        "No requirement that every learning session begin with questions. No prohibition on future learning systems.",
      safeguard:
        "Question-first defines the flagship learning engine. It is not an exclusive doctrine.",
      unresolved: "NONE",
      candidateIds: [
        "CAND-000101",
        "CAND-000117",
        "CAND-000129",
        "CAND-000159",
      ],
    },
  ],
  [
    "FOUND-007",
    {
      recommendation: "APPROVE AS RECORD",
      disposition: "APPROVE AS RECORD",
      originalTitle: "Evidence-qualified learning progress",
      response:
        "Disposition: APPROVE AS RECORD Approve exactly as recommended. No wording changes.",
      title: "Evidence-Qualified Learning Progress",
      boundary:
        "AXOM may make progress claims only when the evidence, denominator, time boundary, provenance, and uncertainty justify them. Activity must not masquerade as mastery.",
      wording:
        "Title: Evidence-Qualified Learning Progress. Boundary: AXOM may make progress claims only when the evidence, denominator, time boundary, provenance, and uncertainty justify them. Activity must not masquerade as mastery.",
      category: "Product Decision",
      area: "Product Philosophy / Learning Evidence",
      authority: "Canonical AX-0001 Product Decision",
      exclusions:
        "Redefining Accuracy, Mastery, or Readiness, Reports features, universal scores, and implementation calculations.",
      safeguard: "Activity must not masquerade as mastery.",
      unresolved: "Difficulty and yield remain later supporting decisions.",
      candidateIds: ["CAND-000023", "CAND-000044", "CAND-000130"],
    },
  ],
  [
    "FOUND-008",
    {
      recommendation: "APPROVE WITH REWORDING",
      disposition: "APPROVE WITH REWORDING",
      originalTitle: "Power without complexity and one clear action",
      response:
        "Disposition: APPROVE WITH REWORDING Approved title: Overrideable Guidance Within Trust Boundaries Approved boundary: AXOM recommendations, defaults, reminders, and soft limits remain learner- overrideable unless doing so would compromise: - source truth - data integrity - security - privacy - assessment integrity - another explicitly governed trust boundary Protected trust boundaries are not bypassed through normal override behavior. Approved exclusions: Generic Power Without Complexity doctrine remains governed by the Constitution and UX Standards. Unresolved qualifications: NONE.",
      title: "Overrideable Guidance Within Trust Boundaries",
      boundary:
        "AXOM recommendations, defaults, reminders, and soft limits remain learner-overrideable unless doing so would compromise source truth, data integrity, security, privacy, assessment integrity, or another explicitly governed trust boundary. Protected trust boundaries are not bypassed through normal override behavior.",
      wording:
        "Title: Overrideable Guidance Within Trust Boundaries. Boundary: AXOM recommendations, defaults, reminders, and soft limits remain learner-overrideable unless doing so would compromise source truth, data integrity, security, privacy, assessment integrity, or another explicitly governed trust boundary. Protected trust boundaries are not bypassed through normal override behavior.",
      category: "Product Decision",
      area: "Cross-System / Learner Control",
      authority: "Canonical AX-0001 Product Decision",
      exclusions:
        "Generic Power Without Complexity doctrine remains governed by the Constitution and UX Standards.",
      safeguard:
        "Protected trust boundaries are not bypassed through normal override behavior.",
      unresolved: "NONE",
      candidateIds: ["CAND-000168", "CAND-000169", "CAND-000008"],
    },
  ],
]);
const expectedConfirmedDecisions = new Map([
  ...expectedBatch1,
  ...expectedBatch2,
]);
const deferredQuestionSpecs = new Map([
  [
    1,
    [
      {
        id: "OQ-001",
        handles: "`FOUND-001`",
        resolvedText:
          "The approved product class is Learner-Owned Academic Operating System. Local First remains referenced governing meaning rather than title text; “operating partner” is not the canonical title.",
      },
      {
        id: "OQ-002",
        handles: "`FOUND-002`",
        resolvedText:
          "The mission is Transform Academic Overwhelm into Clear, Grounded Progress and includes continuity across learning. “One grounded next move” is its primary daily expression, not the total mission.",
      },
      {
        id: "OQ-003",
        handles: "`FOUND-003`",
        resolvedText:
          "The connected, compounding vision is approved without a fixed system count. The historical six-system taxonomy remains evidence and institutional history, not a frozen future limit.",
      },
      {
        id: "OQ-004",
        handles: "`FOUND-004`",
        resolvedText:
          "The primary audience is high-performance health-professions learners, beginning with medical students. The learner remains the primary user and authority under institutional distribution. “High-performance” must describe the target context, aspirations, and design demands. It must not imply that struggling, recovering, inconsistent, overwhelmed, or currently underperforming learners are unwelcome. AXOM’s recovery and non-punitive principles remain applicable.",
      },
    ],
  ],
  [
    2,
    [
      {
        id: "OQ-005",
        handles: "`FOUND-005`",
        resolvedText:
          "Optional competition may exist only when it is honest, bounded, learner-controlled, optional, and subordinate to learning. Competition must never distort learning truth or mastery reporting. Public rankings, leaderboards, and future game systems remain separate product decisions.",
      },
      {
        id: "OQ-006",
        handles: "`FOUND-006`",
        resolvedText:
          "Question-first, feedback-driven learning is the flagship learning engine, not an exclusive doctrine. Lectures, notes, flashcards, reflection, curriculum systems, and future learning modes remain fully supported where appropriate.",
      },
      {
        id: "OQ-007",
        handles: "`FOUND-007`",
        resolvedText:
          "AXOM may make progress claims only when the evidence, denominator, time boundary, provenance, and uncertainty justify them. Activity must not masquerade as mastery.",
      },
      {
        id: "OQ-008",
        handles: "`FOUND-008`",
        resolvedText:
          "Recommendations, defaults, reminders, and soft limits remain learner-overrideable unless doing so would compromise source truth, data integrity, security, privacy, assessment integrity, or another explicitly governed trust boundary. Protected trust boundaries are not bypassed through normal override behavior. Generic Power Without Complexity doctrine remains governed by the Constitution and UX Standards.",
      },
    ],
  ],
  [
    3,
    [
      { id: "OQ-009", handles: "`FOUND-009`–`FOUND-012`" },
      { id: "OQ-010", handles: "`FOUND-011`" },
      { id: "OQ-011", handles: "`FOUND-012`" },
      { id: "OQ-012", handles: "`FOUND-025`" },
    ],
  ],
  [
    4,
    [
      { id: "OQ-013", handles: "`FOUND-013`" },
      { id: "OQ-014", handles: "`FOUND-014`" },
      { id: "OQ-015", handles: "`FOUND-017`" },
      { id: "OQ-016", handles: "`FOUND-018`–`FOUND-019`" },
      { id: "OQ-017", handles: "`FOUND-020`" },
      { id: "OQ-018", handles: "`FOUND-021`" },
    ],
  ],
  [
    5,
    [
      { id: "OQ-019", handles: "`FOUND-015`" },
      { id: "OQ-020", handles: "`FOUND-016`" },
      { id: "OQ-021", handles: "`FOUND-022`" },
      { id: "OQ-022", handles: "`FOUND-023`" },
    ],
  ],
  [
    6,
    [
      { id: "OQ-023", handles: "`FOUND-028`" },
      { id: "OQ-024", handles: "`FOUND-029`" },
      { id: "OQ-025", handles: "`FOUND-030`" },
      { id: "OQ-026", handles: "`FOUND-031`" },
      { id: "OQ-027", handles: "`FOUND-032`" },
      { id: "OQ-028", handles: "`FOUND-033`" },
    ],
  ],
  [
    7,
    [
      { id: "OQ-029", handles: "`FOUND-024`" },
      { id: "OQ-030", handles: "`FOUND-034`" },
      { id: "OQ-031", handles: "`FOUND-035`" },
    ],
  ],
]);
const expectedBatch1Authority = new Map([
  [
    "FOUND-001",
    {
      primaryHome: "Confirmed future AX-0001 Product Decision",
      retainedAuthority:
        "AX-0002 Local First/no-loss/continuity; AX-0009 Workspace/Vault terms",
      followup:
        "Legacy branding and cloud-copy debt later; no Lexicon or governance amendment",
    },
  ],
  [
    "FOUND-002",
    {
      primaryHome: "Confirmed future AX-0001 Product Decision",
      retainedAuthority: "AX-0009 daily-system terms",
      followup:
        "Command Brief and daily mechanics stay in system records; no Lexicon or governance amendment",
    },
  ],
  [
    "FOUND-003",
    {
      primaryHome: "Confirmed future AX-0001 Product Decision",
      retainedAuthority: "`C-008`, `C-010`, `C-011`",
      followup:
        "Exact system taxonomy → later Product Specification; six-system history preserved; no Lexicon or governance amendment",
    },
  ],
  [
    "FOUND-004",
    {
      primaryHome: "Confirmed future AX-0001 Product Decision",
      retainedAuthority: "Constitution evidence",
      followup:
        "Audience expansion and institutional model later; no Lexicon or governance amendment",
    },
  ],
]);
const expectedBatch2Authority = new Map([
  [
    "FOUND-005",
    {
      primaryHome: "Confirmed future AX-0001 Product Decision",
      retainedAuthority: "AX-0010 experience/state standards",
      followup:
        "Competitive mechanics remain optional product features; public rankings, leaderboards, and future game systems remain separate product decisions; no Lexicon or governance amendment",
    },
  ],
  [
    "FOUND-006",
    {
      primaryHome: "Confirmed future AX-0001 Product Decision",
      retainedAuthority: "AX-0009 Question and metric terms",
      followup:
        "Lectures, notes, flashcards, reflection, curriculum systems, and future learning modes remain supported; no Lexicon or governance amendment",
    },
  ],
  [
    "FOUND-007",
    {
      primaryHome: "Confirmed future AX-0001 Product Decision",
      retainedAuthority: "AX-0009 metric semantics",
      followup:
        "Reports and analytics specifications remain separate; no Lexicon or governance amendment",
    },
  ],
  [
    "FOUND-008",
    {
      primaryHome: "Confirmed future AX-0001 Product Decision",
      retainedAuthority:
        "Generic Power Without Complexity doctrine remains governed by AX-0002/AX-0010",
      followup:
        "Protected trust boundaries are not bypassed through normal override behavior; no Lexicon or governance amendment",
    },
  ],
]);
const expectedConfirmedAuthority = new Map([
  ...expectedBatch1Authority,
  ...expectedBatch2Authority,
]);
const expectedRecommendationAnalyticalHashes = new Map([
  ["FOUND-001", "6e3f0e1bcbf2262de2510ee4c3ebe42b50745bf7d1e08888fb3dcb2b0f4d9241"],
  ["FOUND-002", "34fd38412166a5a333844156a35eb2b03ba67614090f46d96d7075c7e67a001b"],
  ["FOUND-003", "9eb739f66f85bca9aa7d602c9f66668c2b07cbd46cd4b978cd5f96f34300a589"],
  ["FOUND-004", "8278cb84c135667e91160723fdf93b27ca28a594f5b4b870ebf28aa248e10d5d"],
  ["FOUND-005", "19353c3d6341aa4f3031b03bceda025fea18e1ed6615e85a8d0f586f59f3a121"],
  ["FOUND-006", "36b58e96bd90196c893690dc0cef94114d99862b1366998b7d9a88a2d04d8f38"],
  ["FOUND-007", "6332045c571fe7559914dcc6cc120d3f458495ea4b7b28c00ff4cc5ff69645b9"],
  ["FOUND-008", "68e9e8511a8ba957efaa212c5c5d90b7036e56860881f82daff995f6a6683bab"],
  ["FOUND-009", "13c66eb81f0f5208caa0073fb54214a4fae44783b434b03053a59886b5aa918f"],
  ["FOUND-010", "06c42789039dd92fad8d4e0cd61a15fb73ace18febd9a8a588f7fdb0946c3243"],
  ["FOUND-011", "3a57dfa4b79e90414e7c2226e2e7a3a717b1cefc3d6685e1e5fd4d6a3cce21e1"],
  ["FOUND-012", "14b7cf5428f7970627e5b81a94870163b7a93fd20d8e020db1b5842c0f64808b"],
  ["FOUND-013", "ddd42698ad89ced98048c18caac045a6845bccf1db4ccbc433a5fde636ad9c80"],
  ["FOUND-014", "3669ae8eca953acf2837c6e081b6c68c240cbf8031a340944d13001bcbb80b34"],
  ["FOUND-015", "fb251216efa21c4c6b66f0dc53dc1c58e12a753e5fbec97b3f66308fcb1f7ec6"],
  ["FOUND-016", "4aa678fcc5a45904b0cb71a65271cf9506aba766d33acaa4d1ba22f27f538421"],
  ["FOUND-017", "9f3842ae509c8a2273bbf20c121b7851813f3687a0447d4fb7df3931e90b9d34"],
  ["FOUND-018", "a57ea1286083cd558bc34df0283ad7562cc8e6a4b2abe74c31a6a0f2cabcc293"],
  ["FOUND-019", "c180ac025b8f2d62bf2aef0840ab30b0d956ca8e1ab43bec71355a16c3a8503f"],
  ["FOUND-020", "16d96fed50ede206ba97bc64e3b3833f1710752c3e807d81c5ffdb4ed28ce819"],
  ["FOUND-021", "77015d9a87f814c586f65fbffe600ea9f3290e0d797662cd0ff583bc438da4f7"],
  ["FOUND-022", "aa32905cdf7ea0cdff1381faf555638e79141c5e90767cbd8ab0f87ca5a7be3a"],
  ["FOUND-023", "448514db7354dab88a3e7ec063148a0a2630922a7687b4e483269751f13b1a70"],
  ["FOUND-024", "d632e389749d6df9762b51f9ab3dd48313d808b2b40d61fa9150aa0231cc4b04"],
  ["FOUND-025", "10feee2c91ac9b94de1f50b9f9127f36d966034323cfcc5802653cf28c09850b"],
  ["FOUND-026", "82ad9a5494461e0dcc2b8399507d1f7b689b1e4dfe02eb7f60bd2602195d2b11"],
  ["FOUND-027", "cfdc2d388da97ce62608d81133408f714b58e8589aad37618e2f61a62e1bcfc3"],
  ["FOUND-028", "8a95c392e43ca73a418dbfefe5ab18dc8dd79c90792dbbb41c653645cbdb9c04"],
  ["FOUND-029", "b4f3db29c777d6c3778d4f6bd6234c3a7c86f6e23327350ff1c725f8d8bc53cd"],
  ["FOUND-030", "8b7755972944f43cfcfccd7bfaf1a8538b3bc1842650ecc545ca3c5e01938914"],
  ["FOUND-031", "3f4eb4a8cb84c27d8eb29abf78fa185a114c1a23d12c8e802d3afecd1cf81342"],
  ["FOUND-032", "22745885392705a8c8a87ab3efde25a0d6745ffe6306a6126212751038de43eb"],
  ["FOUND-033", "7d5625e0ff706c1a35f424f563219108700eb3de4018a392de0d2399512850bf"],
  ["FOUND-034", "54b7185257a857c85874e480f31ea62804e93842a24b06a0c4c7d79a82b5f06f"],
  ["FOUND-035", "468466c3152492536c1aff40c991d14bfba0884349ead149363b4c551871fab2"],
]);
const expectedPendingMatrixAnalyticalHashes = new Map([
  ["FOUND-001", "7743c1ba375d645b72e8b459ab8c48d0d5b6dd2f8c4a43369f87c7eb658dc652"],
  ["FOUND-002", "d16e6cac6e034992e386514a44ad1253baf275dc40c7d4054ce5777a87ceac6c"],
  ["FOUND-003", "ce9ef33c6192a14d09d37a91b8075a19fbfbc4195af1db0756185609dff75417"],
  ["FOUND-004", "1241b74fa48fca44c2042603e15589ae73e29139d0c312aa8abc2ac91b022516"],
  ["FOUND-005", "2d92e6aa6ad15c906287f30ad054977cd58d93dc7b0e11a3d3aba4f492bc98d5"],
  ["FOUND-006", "9084b3f840d28690ec048e84137f02b79511e3037d2d5575af2e441f350085b5"],
  ["FOUND-007", "4458611e66f7e95c7ff1a8f2cda2d3538d6d7426b4454df3fc8fe972763525bc"],
  ["FOUND-008", "cf4112984ecd0d552532bdc61b54a5703c4b359aa4e135f0c415cb00e5f6e8d2"],
  ["FOUND-009", "d047b65e74a0b87dfa405ac5a7ffabe19c5722ede24252951a9b23fc40c82fcd"],
  ["FOUND-010", "a1d85f7ca59ab7d8e919f8351b0ba63a245a9ace1878ac9fee35adee69d64d67"],
  ["FOUND-011", "7ef7b85ee7ad3ba7a1f94edb162546ad2edc7a04e3f36fc77dc9ef024ca3b789"],
  ["FOUND-012", "2b0c3526e434c5f205fe78531078f524e07167cacf23542b589aa09acc49d82d"],
  ["FOUND-013", "ae2912b789e4ae87ec22e7e82f192285078dab986321c5921a60f2f66ee47168"],
  ["FOUND-014", "54940095031afa9f2fc6a9f3f61925760857bf8664f450a84cb6bc0d1ac8cb98"],
  ["FOUND-015", "21c620c71b070f27bc537e8d4016af939d15a836e9fea8d2320086eda3f90554"],
  ["FOUND-016", "d9f7edf1430b3f520ea4913df89cded17fce4c7ff7521b88f431ff56dd15719e"],
  ["FOUND-017", "f118827ba1821b0272919c99e3fc1a8ac0fb07b8e488ed38713fa9b78d43ffcf"],
  ["FOUND-018", "a0f124c98b8828c1a83dffe6497867b24216e5aaf1c00f2282ecbd7611eff2b1"],
  ["FOUND-019", "973202dc533a79578a15f830d421527dfa558e9cfce389a1ea41c9463bd3525e"],
  ["FOUND-020", "e21a508450aa1b1eda562c957aba2f3e3303abeca261724345728bae8630590f"],
  ["FOUND-021", "90b81a8baab1071f60826ddece6fcdfe45e6e4db4f92a0e32181569fd2508c08"],
  ["FOUND-022", "409f161259b513e50deed38a36aa789b0596db0b5b693e0b9b3a14951af781ed"],
  ["FOUND-023", "6120cfb617813e71868acd2f6f56f20f587cfafdca3e63677b0ac10ab2418ccb"],
  ["FOUND-024", "ee6926e2128bf6ca4917ee5427fb5eac9a43f134e5010c4cb060a3c1086d2fc2"],
  ["FOUND-025", "cdd4bbcd59db909e898dead44d8239fab590539a39b82af2ee7773933484ef3b"],
  ["FOUND-026", "6c8e2d33d05afa527831f0999922bcb663a6f49c09987e852a083c665be315f6"],
  ["FOUND-027", "f396ec5d0b209079ec9d0397e7f8b7c7e0ee943d00404344a1193993c2b3539a"],
  ["FOUND-028", "7b109b2eba47cf4d8d095b46ea4477ef868d5bbb7ee492043a02343a6f97533e"],
  ["FOUND-029", "2eb7957e06c9a5998418d9dda9077712f037cb6f25be12f0a3d34871b3f03f2d"],
  ["FOUND-030", "f3c51da1ed7789521b12da39e6377cab042731567d8d7afe451827c79aecbbab"],
  ["FOUND-031", "a6d8da727d474122e1d3f648496f41ce6cd053e67f75a731d0c6c35a911b5925"],
  ["FOUND-032", "aee764af007760bd53d57c289acaa090a37a599eec0cedcbf9075ea710d29466"],
  ["FOUND-033", "1dcebc4c0e4bb0bde23ea784a84ba137e721eb50199264dcb6e3f49b2e88e10a"],
  ["FOUND-034", "5f62c2092a899e25a1c9aea39eea224d3f82f5a606fad3da2904b4851c8ac84a"],
  ["FOUND-035", "7eefe2ca3826cd9eee926f949bf1f18652a06fce4da7e9e641aa619b35cb5f40"],
]);
const mandatoryNegativeFixtureNames = new Set([
  "duplicate Owner field",
  "contradictory Batch 1 approved wording",
  "pending row retains confirmed eligibility",
  "false Batch 1 pending state",
  "stale recommendation summary",
  "recommendation conflicts with matrix",
  "authority route conflicts with insertion",
  "duplicate matrix Candidate provenance",
  "malformed Candidate suffix",
  "contradictory duplicate verdict",
  "malformed decision heading",
  "invalid calendar date",
  "matrix title drifts from foundation",
  "stale README confirmed count",
  "confirmed matrix eligibility conflicts with Owner record",
  "confirmed recommendation decision remains pending",
  "confirmed recommendation eligibility remains blocked",
  "confirmed recommendation has false confirmation state",
  "confirmed recommendation authority route drifts",
  "confirmed recommendation exclusions drift",
  "confirmed Owner authority route drifts",
  "Owner exact response is absent from verbatim block",
  "deferred-question state remains stale",
  "deferred-question batch heading reopens Batch 1",
  "duplicate contradictory structural result",
  "malformed FOUND handle suffix",
  "malformed DISP handle suffix",
  "duplicate verbatim Batch 1 block",
  "self-referential report HEAD",
  "stale conditional future-record total",
  "Evidence-only summary names the wrong proposal",
  "unregistered governance ID",
  "Batch 1 verbatim response tamper",
  "unknown Candidate ID",
  "matrix decision without Owner record",
  "duplicate confirmed decision heading",
  "temporary split-handle drift",
  "duplicate temporary-handle parent row",
  "unauthorized permanent product ID",
  "prohibited canonical field",
  "malformed Markdown table",
  "wrapped recommendation provenance drift",
  "duplicate insertion Candidate provenance",
  "resolved deferred question relabeled unresolved",
  "confirmed deferred safeguard gains contradiction",
  "confirmed recommendation wording gains contradiction",
  "confirmed recommendation route gains contradiction",
  "confirmed authority follow-up gains contradiction",
  "verdict reason gains authorization contradiction",
  "pending authority route has conflicting classes",
  "pending insertion home has conflicting classes",
  "README has contradictory authorization duplicates",
  "README pending narrative gains approval contradiction",
  "validation report has contradictory authorization duplicates",
  "insertion blockers contradict commit authorization",
  "split child boundary gains rejection contradiction",
  "Owner totals gain contradictory bold summaries",
  "recommendation totals gain contradictory bold total",
  "authority split handles swap parents",
  "matrix split handles swap parents",
  "recommended split targets use sibling parent handles",
  "positive insertion route is negated without a second class",
  "positive authority route is negated without a second class",
  "negative harness fixture inventory is erased",
  "pending recommendation analytical boundary drifts",
  "pending matrix analytical boundary drifts",
  "validation phase narrative gains approval contradiction",
  "malformed AX token",
  "malformed Constitution token",
  "unconfirmed deferred question is marked resolved",
  "confirmed matrix boundary contradicts Owner record",
  "Owner approved wording contradicts approved fields",
  "Owner exact response contradicts generating disposition",
  "Owner original title loses foundation provenance",
  "Owner Evidence references lose provenance",
  "README confirmed handle range is stale",
  "Batch 2 verbatim response tamper",
  "Batch 2 normalized safeguard drifts",
  "Batch 2 authority retained cells drift",
  "Batch 2 resolved wording drifts",
  "completion guards reject pending package",
]);
const errors = [];
const warnings = [];

for (const filename of requiredFiles) {
  if (!fs.existsSync(path.join(packageRoot, filename))) {
    errors.push(`Missing required file: ${filename}`);
  }
}
for (const filename of supportingFiles) {
  const supportingPath = path.join(packageRoot, filename);
  if (!fs.existsSync(supportingPath)) {
    errors.push(`Missing validator support file: ${filename}`);
    continue;
  }
  try {
    execFileSync(process.execPath, ["--check", supportingPath], {
      cwd: repoRoot,
      encoding: "utf8",
    });
  } catch (error) {
    const detail = String(error?.stderr ?? error?.message ?? error).trim();
    errors.push(
      `${filename} fails JavaScript syntax validation${detail ? `: ${detail}` : ""}`,
    );
  }
}
if (!fixtureRoot) {
  const actualPackageFiles = fs
    .readdirSync(sourcePackageRoot, { withFileTypes: true })
    .map((entry) => entry.name)
    .sort();
  if (
    JSON.stringify(actualPackageFiles) !==
    JSON.stringify(expectedPackageFiles)
  ) {
    errors.push(
      `AXOM-0002C1 file inventory is ${actualPackageFiles.join(", ")}, expected ${expectedPackageFiles.join(", ")}`,
    );
  }
}

const docs = Object.fromEntries(
  requiredFiles
    .filter((filename) => fs.existsSync(path.join(packageRoot, filename)))
    .map((filename) => [
      filename,
      fs.readFileSync(path.join(packageRoot, filename), "utf8"),
    ]),
);
const validatorText = fs.readFileSync(validatorPath, "utf8");
const negativeTestPath = path.join(
  packageRoot,
  "test-validator-negative.mjs",
);
const negativeTestText = fs.existsSync(negativeTestPath)
  ? fs.readFileSync(negativeTestPath, "utf8")
  : "";
const checkedFiles = {
  ...docs,
  "validate-dispositions.mjs": validatorText,
};
const allText = Object.values(checkedFiles).join("\n");

const archivePath = path.join(
  repoRoot,
  "docs/product-memory/AXOM-0002A/RECONSTRUCTION-LEDGER.jsonl",
);
const archive = fs
  .readFileSync(archivePath, "utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));
const archiveIds = new Set(archive.map((record) => record.candidate_id));
if (archive.length !== 196 || archiveIds.size !== 196) {
  errors.push("Candidate archive is not exactly 196 unique records");
}

const matrix = docs["DISPOSITION-MATRIX.md"] ?? "";
const matrixRows = [
  ...matrix.matchAll(
    /^\| `(FOUND-\d{3})` \| ([^|]+) \| ([^|]+) \| `([^`]+)` \| ([^|]+) \| `([^`]+)` \| `([^`]+)` \|$/gm,
  ),
].map((match) => ({
  handle: match[1],
  title: match[2].trim(),
  sources: match[3].trim(),
  recommendation: match[4],
  boundary: match[5].trim(),
  decision: match[6],
  eligibility: match[7],
}));
if (matrixRows.length !== 35) {
  errors.push(`Disposition matrix has ${matrixRows.length} parsed rows, expected 35`);
}
const rowHandles = matrixRows.map((row) => row.handle).sort();
if (JSON.stringify(rowHandles) !== JSON.stringify(expectedHandles)) {
  errors.push("Disposition matrix does not contain FOUND-001..FOUND-035 exactly once");
}
for (const row of matrixRows) {
  if (!allowedDispositions.has(row.recommendation)) {
    errors.push(`${row.handle} has invalid recommendation ${row.recommendation}`);
  }
  if (
    row.decision !== "PENDING" &&
    !allowedDispositions.has(row.decision)
  ) {
    errors.push(`${row.handle} has invalid Product Owner decision ${row.decision}`);
  }
  if (
    row.decision === "PENDING" &&
    row.eligibility !== "BLOCKED — OWNER DECISION"
  ) {
    errors.push(`${row.handle} pending matrix row is not blocked`);
  }
  const rowCandidateIds = candidateIdsFrom(row.sources);
  if (hasDuplicates(rowCandidateIds)) {
    errors.push(`${row.handle} matrix Candidate provenance contains duplicates`);
  }
}

const pendingRows = matrixRows.filter((row) => row.decision === "PENDING");
if (
  expectedPendingMatrixAnalyticalHashes.size !== 35 ||
  expectedHandles.some(
    (handle) => !expectedPendingMatrixAnalyticalHashes.has(handle),
  )
) {
  errors.push(
    "Validator pending-matrix analytical baseline inventory is incomplete",
  );
}
for (const row of pendingRows) {
  const analyticalTuple = JSON.stringify({
    title: row.title,
    sources: row.sources,
    recommendation: row.recommendation,
    boundary: row.boundary,
  });
  if (
    sha256(analyticalTuple) !==
    expectedPendingMatrixAnalyticalHashes.get(row.handle)
  ) {
    errors.push(
      `${row.handle} pending matrix analytical fields drift from the preserved baseline`,
    );
  }
}
if (requireComplete && pendingRows.length > 0) {
  errors.push(
    `Completion required, but ${pendingRows.length} Product Owner decisions remain pending`,
  );
}
if (!requireComplete && pendingRows.length > 0) {
  warnings.push(`${pendingRows.length} Product Owner decisions remain pending`);
}

function readDecisionField(section, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = section.match(
    new RegExp(`^- \\*\\*${escaped}:\\*\\*\\s*(.*)$`, "m"),
  );
  return match?.[1]?.trim() ?? "";
}

function readWrappedDecisionField(section, label) {
  const lines = section.split("\n");
  const prefix = `- **${label}:**`;
  const start = lines.findIndex((line) => line.startsWith(prefix));
  if (start === -1) return "";
  const values = [lines[start].slice(prefix.length).trim()];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (!/^ {2,}\S/.test(lines[index])) break;
    values.push(lines[index].trim());
  }
  return values.join(" ");
}

function normalizedMarkdownValue(value) {
  return value
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\.$/, "")
    .trim();
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hasPrematureApprovalClaim(value) {
  return /\ball (?:remaining )?(?:recommendations|proposals|decisions) (?:are|have been) (?:approved|confirmed)\b|\bready for (?:phase 1 )?canonical insertion\b|\bauthorized for canonical insertion\b/i.test(
    value,
  );
}

function singletonLineValue(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [
    ...text.matchAll(new RegExp(`^- ${escaped}: (.*)$`, "gm")),
  ];
  return {
    count: matches.length,
    value: matches[0]?.[1] ?? "",
  };
}

function parseHandleList(value, prefix) {
  if (!value || value === "NONE") return [];
  const pattern =
    prefix === "FOUND"
      ? /(?<![A-Z0-9-])FOUND-\d{3}(?![A-Z0-9])/g
      : /(?<![A-Z0-9-])DISP-\d{3}[A-Z](?![A-Z0-9])/g;
  return [...value.matchAll(pattern)].map((match) => match[0]);
}

function expandedFoundHandleReferences(value) {
  const handles = new Set(parseHandleList(value, "FOUND"));
  for (const match of value.matchAll(
    /FOUND-(\d{3})`?–`?FOUND-(\d{3})/g,
  )) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    for (let number = start; number <= end; number += 1) {
      handles.add(`FOUND-${String(number).padStart(3, "0")}`);
    }
  }
  return [...handles].sort();
}

function formatMarkdownHandleRanges(handles) {
  const numbers = [...new Set(handles)]
    .map((handle) => Number(handle.slice(-3)))
    .sort((left, right) => left - right);
  const ranges = [];
  for (const number of numbers) {
    const previous = ranges.at(-1);
    if (previous && number === previous.end + 1) {
      previous.end = number;
    } else {
      ranges.push({ start: number, end: number });
    }
  }
  const formatted = ranges.map(({ start, end }) => {
    const first = `\`FOUND-${String(start).padStart(3, "0")}\``;
    const last = `\`FOUND-${String(end).padStart(3, "0")}\``;
    return start === end ? first : `${first} through ${last}`;
  });
  if (formatted.length <= 1) return formatted[0] ?? "";
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(", ")}, and ${formatted.at(-1)}`;
}

function candidateIdsFrom(value) {
  return [
    ...value.matchAll(
      /(?<![A-Z0-9-])CAND-\d{6}(?![A-Z0-9])/g,
    ),
  ].map((match) => match[0]);
}

function hasDuplicates(values) {
  return new Set(values).size !== values.length;
}

function isValidIsoCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const ownerDecisionsText = docs["OWNER-DECISIONS.md"] ?? "";
const decisionHeadings = [
  ...ownerDecisionsText.matchAll(/^### DECISION (FOUND-\d{3})$/gm),
];
const decisionLikeHeadings = [
  ...ownerDecisionsText.matchAll(/^###\s+DECISION.*$/gm),
].map((match) => match[0]);
if (
  decisionLikeHeadings.length !== decisionHeadings.length ||
  decisionLikeHeadings.some(
    (heading) => !/^### DECISION FOUND-\d{3}$/.test(heading),
  )
) {
  errors.push("OWNER-DECISIONS contains a malformed decision heading");
}
const requiredOwnerFields = [
  "Date",
  "Repository baseline",
  "Batch",
  "FOUND handle",
  "Original proposal title",
  "Candidate sources",
  "Analytical recommendation",
  "Exact Product Owner response",
  "Normalized disposition",
  "Approved temporary title",
  "Approved boundary",
  "Approved wording",
  "Category route",
  "Area route",
  "Authority route",
  "Split or merge targets",
  "Approved exclusions",
  "Interpretation safeguard",
  "Unresolved qualifications",
  "Lexicon follow-up",
  "Governance follow-up",
  "Insertion eligibility",
  "Confirmation state",
  "Decision author",
  "Analytical assistant",
  "Evidence references",
  "Superseded proposal wording",
  "Reviewer or assistant involvement",
  "Confirmation occurred",
  "Confirmed temporary handles",
  "Confirmed merge sources",
];
const allowedOwnerFields = new Set([
  ...requiredOwnerFields,
  "Approved supporting statement",
]);
const ownerDecisionRecords = [];
for (let index = 0; index < decisionHeadings.length; index += 1) {
  const heading = decisionHeadings[index];
  const start = heading.index;
  const end =
    index + 1 < decisionHeadings.length
      ? decisionHeadings[index + 1].index
      : ownerDecisionsText.length;
  const section = ownerDecisionsText.slice(start, end);
  const sectionFields = [
    ...section.matchAll(/^- \*\*([^*]+):\*\*/gm),
  ].map((match) => match[1]);
  for (const field of requiredOwnerFields) {
    const occurrences = sectionFields.filter(
      (candidate) => candidate === field,
    ).length;
    if (occurrences === 0) {
      errors.push(`${heading[1]} is missing Owner field ${field}`);
    } else if (occurrences > 1) {
      errors.push(`${heading[1]} has duplicate Owner field ${field}`);
    }
  }
  if (
    sectionFields.filter(
      (field) => field === "Approved supporting statement",
    ).length > 1
  ) {
    errors.push(
      `${heading[1]} has duplicate Owner field Approved supporting statement`,
    );
  }
  for (const field of sectionFields) {
    if (!allowedOwnerFields.has(field)) {
      errors.push(`${heading[1]} has unknown Owner field ${field}`);
    }
  }
  const record = {
    headingHandle: heading[1],
    date: readDecisionField(section, "Date"),
    baseline: readDecisionField(section, "Repository baseline"),
    batch: Number(readDecisionField(section, "Batch")),
    bodyHandle: readDecisionField(section, "FOUND handle"),
    originalTitle: readDecisionField(section, "Original proposal title"),
    candidateSources: readDecisionField(section, "Candidate sources"),
    recommendation: readDecisionField(section, "Analytical recommendation"),
    exactResponse: readDecisionField(section, "Exact Product Owner response"),
    disposition: readDecisionField(section, "Normalized disposition"),
    approvedTitle: readDecisionField(section, "Approved temporary title"),
    approvedBoundary: readDecisionField(section, "Approved boundary"),
    approvedSupportingStatement: readDecisionField(
      section,
      "Approved supporting statement",
    ),
    approvedWording: readDecisionField(section, "Approved wording"),
    categoryRoute: readDecisionField(section, "Category route"),
    areaRoute: readDecisionField(section, "Area route"),
    authorityRoute: readDecisionField(section, "Authority route"),
    splitMergeTargets: readDecisionField(section, "Split or merge targets"),
    approvedExclusions: readDecisionField(section, "Approved exclusions"),
    interpretationSafeguard: readDecisionField(
      section,
      "Interpretation safeguard",
    ),
    unresolved: readDecisionField(section, "Unresolved qualifications"),
    lexiconFollowup: readDecisionField(section, "Lexicon follow-up"),
    governanceFollowup: readDecisionField(section, "Governance follow-up"),
    insertionEligibility: readDecisionField(section, "Insertion eligibility"),
    confirmationState: readDecisionField(section, "Confirmation state"),
    decisionAuthor: readDecisionField(section, "Decision author"),
    analyticalAssistant: readDecisionField(section, "Analytical assistant"),
    evidenceReferences: readDecisionField(section, "Evidence references"),
    superseded: readDecisionField(section, "Superseded proposal wording"),
    involvement: readDecisionField(section, "Reviewer or assistant involvement"),
    confirmed: readDecisionField(section, "Confirmation occurred"),
    temporaryHandlesText: readDecisionField(
      section,
      "Confirmed temporary handles",
    ),
    mergeSourcesText: readDecisionField(section, "Confirmed merge sources"),
  };
  record.temporaryHandles = parseHandleList(
    record.temporaryHandlesText,
    "DISP",
  );
  record.mergeSources = parseHandleList(record.mergeSourcesText, "FOUND");
  record.candidateIds = candidateIdsFrom(record.candidateSources);
  ownerDecisionRecords.push(record);
}

const ownerDecisionHandles = ownerDecisionRecords.map(
  (record) => record.headingHandle,
);
if (new Set(ownerDecisionHandles).size !== ownerDecisionHandles.length) {
  errors.push("OWNER-DECISIONS contains duplicate confirmed record headings");
}
const batchStatusEntries = [
  ...ownerDecisionsText.matchAll(
    /^\| ([1-7]) \| ([^|]+) \| `([^`]+)` \|$/gm,
  ),
].map((match) => ({
  batch: Number(match[1]),
  state: match[3],
}));
if (
  batchStatusEntries.length !== 7 ||
  new Set(batchStatusEntries.map((entry) => entry.batch)).size !== 7
) {
  errors.push("OWNER-DECISIONS batch-status table is not exactly seven rows");
}
for (const [batch, handles] of batchHandles) {
  const confirmedCount = handles.filter((handle) =>
    ownerDecisionHandles.includes(handle),
  ).length;
  const expectedState =
    confirmedCount === handles.length
      ? confirmedState
      : confirmedCount === 0
        ? "PENDING"
        : `PARTIALLY CONFIRMED (${confirmedCount} OF ${handles.length})`;
  const actualState = batchStatusEntries.find(
    (entry) => entry.batch === batch,
  )?.state;
  if (actualState !== expectedState) {
    errors.push(
      `Batch ${batch} status is ${actualState || "missing"}, expected ${expectedState}`,
    );
  }
}
let sequentiallyCompletedBatches = 0;
for (let batch = 1; batch <= batchHandles.size; batch += 1) {
  if (
    batchHandles
      .get(batch)
      .every((handle) => ownerDecisionHandles.includes(handle))
  ) {
    sequentiallyCompletedBatches = batch;
  } else {
    break;
  }
}
const matrixByHandle = new Map(matrixRows.map((row) => [row.handle, row]));
const ownerDecisionByHandle = new Map(
  ownerDecisionRecords.map((record) => [record.headingHandle, record]),
);
for (const record of ownerDecisionRecords) {
  const row = matrixByHandle.get(record.headingHandle);
  if (!row) {
    errors.push(`Owner record has unknown proposal ${record.headingHandle}`);
    continue;
  }
  if (record.bodyHandle !== record.headingHandle) {
    errors.push(`${record.headingHandle} body handle does not match heading`);
  }
  if (!isValidIsoCalendarDate(record.date)) {
    errors.push(`${record.headingHandle} has invalid or missing decision date`);
  }
  if (!/^[0-9a-f]{40}$/.test(record.baseline)) {
    errors.push(`${record.headingHandle} has invalid repository baseline`);
  }
  if (record.baseline !== proposalBaseline) {
    errors.push(
      `${record.headingHandle} repository baseline does not match the preserved proposal package`,
    );
  }
  if (record.batch !== handleBatch.get(record.headingHandle)) {
    errors.push(`${record.headingHandle} is assigned to the wrong batch`);
  }
  if (
    !allowedDispositions.has(record.recommendation) ||
    record.recommendation !== row.recommendation
  ) {
    errors.push(
      `${record.headingHandle} analytical recommendation does not match matrix`,
    );
  }
  if (!allowedDispositions.has(record.disposition)) {
    errors.push(`${record.headingHandle} has invalid normalized disposition`);
  }
  if (row.decision !== record.disposition) {
    errors.push(
      `${record.headingHandle} matrix decision does not match confirmed record`,
    );
  }
  if (row.eligibility !== record.insertionEligibility) {
    errors.push(
      `${record.headingHandle} matrix insertion eligibility does not match confirmed record`,
    );
  }
  if (record.originalTitle !== row.title) {
    errors.push(
      `${record.headingHandle} Owner original proposal title does not match the matrix`,
    );
  }
  const expectedConfirmedMatrixBoundary =
    `${record.approvedTitle} — ${record.approvedBoundary}`;
  if (row.boundary !== expectedConfirmedMatrixBoundary) {
    errors.push(
      `${record.headingHandle} confirmed matrix boundary does not exactly match the Owner record`,
    );
  }
  if (recordGeneratingDispositions.has(record.disposition)) {
    const expectedApprovedWording =
      `Title: ${record.approvedTitle}. Boundary: ${
        record.approvedBoundary
      }${
        record.approvedSupportingStatement
          ? ` Supporting statement: ${record.approvedSupportingStatement}`
          : ""
      }`;
    if (record.approvedWording !== expectedApprovedWording) {
      errors.push(
        `${record.headingHandle} Approved wording does not exactly match its approved title, boundary, and supporting statement`,
      );
    }
  } else if (
    !/^NOT APPLICABLE(?:\s*[—:]|\s+-)\s+\S/.test(
      record.approvedWording,
    )
  ) {
    errors.push(
      `${record.headingHandle} non-record disposition lacks an explicit NOT APPLICABLE wording reason`,
    );
  }
  const normalizedResponseAction = record.exactResponse
    .replace(new RegExp(`^${record.headingHandle}:\\s*`, "i"), "")
    .trim();
  if (
    recordGeneratingDispositions.has(record.disposition) &&
    /^Reject\b/i.test(normalizedResponseAction)
  ) {
    errors.push(
      `${record.headingHandle} exact Owner response contradicts its record-generating disposition`,
    );
  }
  if (
    record.disposition === "REJECT" &&
    /^(?:Approve|Split|Merge|Research)\b/i.test(
      normalizedResponseAction,
    )
  ) {
    errors.push(
      `${record.headingHandle} exact Owner response contradicts its REJECT disposition`,
    );
  }
  for (const [field, value] of [
    ["Original proposal title", record.originalTitle],
    ["Candidate sources", record.candidateSources],
    ["Exact Product Owner response", record.exactResponse],
    ["Approved temporary title", record.approvedTitle],
    ["Approved boundary", record.approvedBoundary],
    ["Approved wording", record.approvedWording],
    ["Category route", record.categoryRoute],
    ["Area route", record.areaRoute],
    ["Authority route", record.authorityRoute],
    ["Split or merge targets", record.splitMergeTargets],
    ["Approved exclusions", record.approvedExclusions],
    ["Interpretation safeguard", record.interpretationSafeguard],
    ["Unresolved qualifications", record.unresolved],
    ["Lexicon follow-up", record.lexiconFollowup],
    ["Governance follow-up", record.governanceFollowup],
    ["Insertion eligibility", record.insertionEligibility],
    ["Confirmation state", record.confirmationState],
    ["Decision author", record.decisionAuthor],
    ["Analytical assistant", record.analyticalAssistant],
    ["Evidence references", record.evidenceReferences],
    ["Superseded proposal wording", record.superseded],
    ["Reviewer or assistant involvement", record.involvement],
  ]) {
    if (
      !value ||
      ["PENDING", "NOT PROVIDED"].includes(value.toUpperCase())
    ) {
      errors.push(`${record.headingHandle} is missing confirmed ${field}`);
    }
  }
  if (
    ["NONE", "NOT APPLICABLE"].includes(record.exactResponse.toUpperCase())
  ) {
    errors.push(
      `${record.headingHandle} Exact Product Owner response cannot be ${record.exactResponse}`,
    );
  }
  if (record.approvedWording.toUpperCase() === "NONE") {
    errors.push(
      `${record.headingHandle} Approved wording must be explicit or state a NOT APPLICABLE reason`,
    );
  }
  if (record.confirmed !== "YES") {
    errors.push(`${record.headingHandle} confirmation is not YES`);
  }
  if (record.confirmationState !== confirmedState) {
    errors.push(
      `${record.headingHandle} confirmation state is not ${confirmedState}`,
    );
  }
  if (record.decisionAuthor !== "Jafar Dabbagh") {
    errors.push(`${record.headingHandle} has the wrong decision author`);
  }
  if (record.analyticalAssistant !== "Sol") {
    errors.push(`${record.headingHandle} has the wrong analytical assistant`);
  }
  const matrixCandidateIdsForRecord = candidateIdsFrom(row.sources);
  if (
    JSON.stringify([...new Set(record.candidateIds)].sort()) !==
    JSON.stringify([...new Set(matrixCandidateIdsForRecord)].sort())
  ) {
    errors.push(
      `${record.headingHandle} confirmed Candidate provenance does not match the matrix`,
    );
  }
  if (record.candidateIds.length === 0) {
    errors.push(`${record.headingHandle} has no confirmed Candidate provenance`);
  }
  if (hasDuplicates(record.candidateIds)) {
    errors.push(
      `${record.headingHandle} confirmed Candidate provenance contains duplicates`,
    );
  }
  const evidenceCandidateIds = candidateIdsFrom(
    record.evidenceReferences,
  );
  if (
    record.evidenceReferences.toUpperCase() === "NONE" ||
    !record.evidenceReferences.includes(
      `AXOM-0002C \`${record.headingHandle}\``,
    ) ||
    hasDuplicates(evidenceCandidateIds) ||
    JSON.stringify([...evidenceCandidateIds].sort()) !==
      JSON.stringify([...record.candidateIds].sort())
  ) {
    errors.push(
      `${record.headingHandle} Evidence references do not exactly preserve its proposal and Candidate provenance`,
    );
  }
  if (record.disposition === "SPLIT") {
    if (
      record.temporaryHandles.length < 2 ||
      new Set(record.temporaryHandles).size !== record.temporaryHandles.length
    ) {
      errors.push(`${record.headingHandle} lacks unique confirmed split handles`);
    }
    if (record.mergeSources.length > 0) {
      errors.push(`${record.headingHandle} SPLIT record claims merge sources`);
    }
    const targetHandles = parseHandleList(record.splitMergeTargets, "DISP");
    if (
      JSON.stringify([...targetHandles].sort()) !==
      JSON.stringify([...record.temporaryHandles].sort())
    ) {
      errors.push(
        `${record.headingHandle} split targets do not match confirmed temporary handles`,
      );
    }
  } else if (record.disposition === "MERGE") {
    if (record.temporaryHandles.length !== 1) {
      errors.push(`${record.headingHandle} MERGE record needs one output handle`);
    }
    if (
      record.mergeSources.length < 2 ||
      !record.mergeSources.includes(record.headingHandle)
    ) {
      errors.push(
        `${record.headingHandle} MERGE record must name every source including itself`,
      );
    }
    const targetHandles = parseHandleList(record.splitMergeTargets, "DISP");
    if (
      targetHandles.length !== 1 ||
      targetHandles[0] !== record.temporaryHandles[0]
    ) {
      errors.push(
        `${record.headingHandle} merge target does not match confirmed output handle`,
      );
    }
  } else if (
    record.temporaryHandles.length > 0 ||
    record.mergeSources.length > 0
  ) {
    errors.push(
      `${record.headingHandle} claims temporary handles or merge sources without SPLIT/MERGE`,
    );
  } else if (record.splitMergeTargets !== "NONE") {
    errors.push(
      `${record.headingHandle} claims split or merge targets without SPLIT/MERGE`,
    );
  }
}

const verbatimBatch1Headings = [
  ...ownerDecisionsText.matchAll(/^## Verbatim Batch 1 response$/gm),
];
const verbatimBatch1Blocks = [
  ...ownerDecisionsText.matchAll(
    /^## Verbatim Batch 1 response\s+```text\n([\s\S]*?)\n```$/gm,
  ),
];
if (
  verbatimBatch1Headings.length !== 1 ||
  verbatimBatch1Blocks.length !== 1 ||
  verbatimBatch1Blocks[0][1] !== expectedBatch1Verbatim
) {
  errors.push("OWNER-DECISIONS does not preserve the exact Batch 1 response");
}
const verbatimBatchHeadings = [
  ...ownerDecisionsText.matchAll(/^## Verbatim Batch ([1-7]) response$/gm),
].map((match) => Number(match[1]));
const verbatimBatchBlocks = [
  ...ownerDecisionsText.matchAll(
    /^## Verbatim Batch ([1-7]) response\s+```text\n([\s\S]*?)\n```$/gm,
  ),
].map((match) => ({
  batch: Number(match[1]),
  response: match[2],
}));
const verbatimLikeHeadings = [
  ...ownerDecisionsText.matchAll(/^## Verbatim Batch .* response$/gm),
];
if (
  verbatimLikeHeadings.length !== verbatimBatchHeadings.length ||
  verbatimBatchBlocks.length !== verbatimBatchHeadings.length
) {
  errors.push("OWNER-DECISIONS contains a malformed verbatim batch response");
}
for (const [batch, handles] of batchHandles) {
  const records = ownerDecisionRecords.filter(
    (record) => record.batch === batch,
  );
  const blocks = verbatimBatchBlocks.filter(
    (block) => block.batch === batch,
  );
  if (
    (records.length > 0 && blocks.length !== 1) ||
    (records.length === 0 && blocks.length !== 0)
  ) {
    errors.push(
      `OWNER-DECISIONS Batch ${batch} has ${records.length} records and ${blocks.length} verbatim response blocks`,
    );
    continue;
  }
  if (records.length > handles.length) {
    errors.push(`OWNER-DECISIONS Batch ${batch} has too many records`);
  }
  if (records.length > 0) {
    const expectedVerbatimHash =
      expectedVerbatimBatchHashes.get(batch);
    if (!expectedVerbatimHash) {
      errors.push(
        `OWNER-DECISIONS Batch ${batch} has no immutable verbatim-response hash`,
      );
    } else if (sha256(blocks[0].response) !== expectedVerbatimHash) {
      errors.push(
        `OWNER-DECISIONS Batch ${batch} verbatim response does not match its immutable hash`,
      );
    }
  } else if (expectedVerbatimBatchHashes.has(batch)) {
    errors.push(
      `Validator retains a verbatim-response hash for empty Batch ${batch}`,
    );
  }
  for (const record of records) {
    if (
      !blocks[0].response
        .replace(/\s+/g, " ")
        .includes(record.exactResponse.replace(/\s+/g, " "))
    ) {
      errors.push(
        `${record.headingHandle} exact Product Owner response is absent from the Batch ${batch} verbatim block`,
      );
    }
  }
}
for (const [handle, expected] of expectedConfirmedDecisions) {
  const expectedBatch = handleBatch.get(handle);
  const record = ownerDecisionRecords.find(
    (candidate) => candidate.headingHandle === handle,
  );
  const row = matrixByHandle.get(handle);
  if (!record) {
    errors.push(
      `${handle} is missing its confirmed Batch ${expectedBatch} decision record`,
    );
    continue;
  }
  for (const [field, actual, expectedValue] of [
    ["analytical recommendation", record.recommendation, expected.recommendation],
    ["normalized disposition", record.disposition, expected.disposition],
    ["original proposal title", record.originalTitle, expected.originalTitle],
    ["exact Product Owner response", record.exactResponse, expected.response],
    ["approved temporary title", record.approvedTitle, expected.title],
    ["approved boundary", record.approvedBoundary, expected.boundary],
    ["approved wording", record.approvedWording, expected.wording],
    ["category route", record.categoryRoute, expected.category],
    ["area route", record.areaRoute, expected.area],
    ["authority route", record.authorityRoute, expected.authority],
    ["approved exclusions", record.approvedExclusions, expected.exclusions],
    [
      "interpretation safeguard",
      record.interpretationSafeguard,
      expected.safeguard,
    ],
    ["unresolved qualifications", record.unresolved, expected.unresolved],
    ["insertion eligibility", record.insertionEligibility, eligibleAfterPhase],
    ["confirmation state", record.confirmationState, confirmedState],
  ]) {
    if (actual !== expectedValue) {
      errors.push(
        `${handle} Batch ${expectedBatch} ${field} does not match the approved decision`,
      );
    }
  }
  if (
    JSON.stringify([...new Set(record.candidateIds)].sort()) !==
    JSON.stringify([...expected.candidateIds].sort())
  ) {
    errors.push(
      `${handle} Batch ${expectedBatch} Candidate provenance is not exact`,
    );
  }
  if (record.lexiconFollowup !== "NONE") {
    errors.push(
      `${handle} incorrectly claims a Batch ${expectedBatch} Lexicon follow-up`,
    );
  }
  if (record.governanceFollowup !== "NONE") {
    errors.push(
      `${handle} incorrectly claims a Batch ${expectedBatch} governance follow-up`,
    );
  }
  if (record.splitMergeTargets !== "NONE") {
    errors.push(
      `${handle} incorrectly claims a Batch ${expectedBatch} split or merge target`,
    );
  }
  if (expected.supportingStatement) {
    if (record.approvedSupportingStatement !== expected.supportingStatement) {
      errors.push(`${handle} is missing the approved supporting statement`);
    }
  }
  if (!row) {
    errors.push(`${handle} is missing from the disposition matrix`);
  } else {
    if (row.title !== expected.originalTitle) {
      errors.push(
        `${handle} matrix original title does not match Batch ${expectedBatch}`,
      );
    }
    if (row.boundary !== `${expected.title} — ${expected.boundary}`) {
      errors.push(
        `${handle} matrix approved title/boundary does not match Batch ${expectedBatch}`,
      );
    }
    if (row.decision !== expected.disposition) {
      errors.push(
        `${handle} matrix decision does not match Batch ${expectedBatch}`,
      );
    }
    if (row.eligibility !== eligibleAfterPhase) {
      errors.push(
        `${handle} matrix insertion eligibility does not match Batch ${expectedBatch}`,
      );
    }
  }
  const recommendedText = docs["RECOMMENDED-DISPOSITIONS.md"] ?? "";
  const heading = `### ${handle} —`;
  const sectionStart = recommendedText.indexOf(heading);
  const sectionEndCandidates = [
    recommendedText.indexOf("\n### FOUND-", sectionStart + heading.length),
    recommendedText.indexOf("\n## Batch", sectionStart + heading.length),
  ].filter((index) => index !== -1);
  const sectionEnd =
    sectionEndCandidates.length > 0
      ? Math.min(...sectionEndCandidates)
      : recommendedText.length;
  const section = recommendedText.slice(sectionStart, sectionEnd);
  const expectedRecommendedWording = normalizedMarkdownValue(
    `${expected.title} — ${expected.boundary}${
      expected.supportingStatement
        ? ` Supporting statement: ${expected.supportingStatement}`
        : ""
    }`,
  );
  const actualRecommendedWording = normalizedMarkdownValue(
    readWrappedDecisionField(section, "Product Owner wording"),
  );
  if (
    sectionStart === -1 ||
    !section.includes(`- **Product Owner decision:** \`${expected.disposition}\`.`) ||
    actualRecommendedWording !== expectedRecommendedWording ||
    !section.includes(confirmedState)
  ) {
    errors.push(`${handle} is not reconciled in Recommended Dispositions`);
  }
}
const deferredQuestionsText = docs["DEFERRED-QUESTIONS.md"] ?? "";
const normalizedDeferredQuestions = deferredQuestionsText.replace(/\s+/g, " ");
const expectedDeferredState =
  sequentiallyCompletedBatches === 0
    ? "No batch is resolved. Questions in Batches 1 through 7 remain pending until their decision batch is reached."
    : sequentiallyCompletedBatches === 1
      ? "Batch 1 is resolved. Questions in Batches 2 through 7 remain pending until their decision batch is reached."
      : sequentiallyCompletedBatches < 7
        ? `Batches 1 through ${sequentiallyCompletedBatches} are resolved. Questions in Batches ${sequentiallyCompletedBatches + 1} through 7 remain pending until their decision batch is reached.`
        : "Batches 1 through 7 are resolved. No Product Owner questions remain pending in Phase 1.";
const deferredStateStatements = [
  ...normalizedDeferredQuestions.matchAll(
    /(?:No batch is resolved|Batch \d+ is (?:un)?resolved|Batches \d+ through \d+ are (?:un)?resolved)\. (?:Questions in Batches \d+ through \d+ remain pending until their decision batch is reached|No Product Owner questions remain pending in Phase 1)\./g,
  ),
].map((match) => match[0]);
if (
  deferredStateStatements.length !== 1 ||
  deferredStateStatements[0] !== expectedDeferredState
) {
  errors.push(
    `DEFERRED-QUESTIONS state does not match: ${expectedDeferredState}`,
  );
}
for (const [batch, handles] of batchHandles) {
  const batchIsComplete = handles.every((handle) =>
    ownerDecisionHandles.includes(handle),
  );
  const resolvedHeadings = [
    ...deferredQuestionsText.matchAll(
      new RegExp(`^## Resolved in Batch ${batch}(?: —.*)?$`, "gm"),
    ),
  ];
  const pendingHeadings = [
    ...deferredQuestionsText.matchAll(
      new RegExp(`^## Batch ${batch}(?: —.*)?$`, "gm"),
    ),
  ];
  if (
    (batchIsComplete &&
      (resolvedHeadings.length !== 1 || pendingHeadings.length !== 0)) ||
    (!batchIsComplete &&
      (resolvedHeadings.length !== 0 || pendingHeadings.length !== 1))
  ) {
    errors.push(
      `DEFERRED-QUESTIONS Batch ${batch} resolved/pending heading does not match Owner decisions`,
    );
    continue;
  }
  const activeHeading = batchIsComplete
    ? resolvedHeadings[0]
    : pendingHeadings[0];
  const sectionStart = activeHeading.index + activeHeading[0].length;
  const nextHeading = deferredQuestionsText.indexOf(
    "\n## ",
    sectionStart,
  );
  const section = deferredQuestionsText.slice(
    sectionStart,
    nextHeading === -1 ? deferredQuestionsText.length : nextHeading,
  );
  const entryHeadings = [
    ...section.matchAll(
      /^- \*\*(OQ-\d{3}) \/ (.+?)(?: — (resolved|unresolved))?:\*\*/gm,
    ),
  ];
  const expectedEntries = deferredQuestionSpecs.get(batch) ?? [];
  const actualEntryKeys = entryHeadings.map(
    (entry) => `${entry[1]} / ${entry[2]}`,
  );
  const expectedEntryKeys = expectedEntries.map(
    (entry) => `${entry.id} / ${entry.handles}`,
  );
  if (
    JSON.stringify(actualEntryKeys) !==
    JSON.stringify(expectedEntryKeys)
  ) {
    errors.push(
      `DEFERRED-QUESTIONS Batch ${batch} entries do not match the expected OQ/handle mapping`,
    );
    continue;
  }
  for (let index = 0; index < entryHeadings.length; index += 1) {
    const entry = entryHeadings[index];
    const expectedEntry = expectedEntries[index];
    const bodyStart = entry.index + entry[0].length;
    const bodyEnd =
      index + 1 < entryHeadings.length
        ? entryHeadings[index + 1].index
        : section.length;
    const body = normalizedMarkdownValue(
      section.slice(bodyStart, bodyEnd).trim(),
    );
    const entryHandles = expandedFoundHandleReferences(
      expectedEntry.handles,
    );
    const entryIsResolved =
      entryHandles.length > 0 &&
      entryHandles.every((handle) =>
        ownerDecisionHandles.includes(handle),
      );
    const expectedMarker = entryIsResolved ? "resolved" : undefined;
    if (
      entry[3] !== expectedMarker ||
      !body ||
      (entryIsResolved && body.includes("?"))
    ) {
      errors.push(
        `DEFERRED-QUESTIONS ${entry[1]} state/content does not match Batch ${batch} Owner decisions`,
      );
    }
    if (
      expectedEntry.resolvedText &&
      body !== normalizedMarkdownValue(expectedEntry.resolvedText)
    ) {
      errors.push(
        `DEFERRED-QUESTIONS ${entry[1]} resolved wording does not exactly match the confirmed Batch ${batch} decision`,
      );
    }
  }
}

const nonpendingRows = matrixRows.filter((row) => row.decision !== "PENDING");
if (nonpendingRows.length !== ownerDecisionRecords.length) {
  errors.push(
    "Matrix confirmed-decision count does not match OWNER-DECISIONS records",
  );
}
for (const row of nonpendingRows) {
  if (!ownerDecisionHandles.includes(row.handle)) {
    errors.push(`${row.handle} has a matrix decision without an Owner record`);
  }
}
for (const [batch, handles] of batchHandles) {
  const anyConfirmed = handles.some((handle) =>
    ownerDecisionHandles.includes(handle),
  );
  if (!anyConfirmed) continue;
  for (let priorBatch = 1; priorBatch < batch; priorBatch += 1) {
    const incompletePrior = batchHandles
      .get(priorBatch)
      .filter((handle) => !ownerDecisionHandles.includes(handle));
    if (incompletePrior.length > 0) {
      errors.push(
        `Batch ${batch} contains a decision before Batch ${priorBatch} is complete`,
      );
    }
  }
}
if (requireComplete && ownerDecisionRecords.length !== 35) {
  errors.push(
    `Completion requires 35 confirmed Owner records, found ${ownerDecisionRecords.length}`,
  );
}

const currentOwnerTotalsSection = matrix.slice(
  matrix.indexOf("## Current Product Owner totals"),
);
const currentOwnerTotalEntries = [
  ...currentOwnerTotalsSection.matchAll(
    /^\| `([^`]+)` \| (\d+) \|$/gm,
  ),
].map((match) => ({
  disposition: match[1],
  count: Number(match[2]),
}));
for (const disposition of allowedDispositions) {
  const expectedCount = ownerDecisionRecords.filter(
    (record) => record.disposition === disposition,
  ).length;
  const entries = currentOwnerTotalEntries.filter(
    (entry) => entry.disposition === disposition,
  );
  if (entries.length !== 1 || entries[0].count !== expectedCount) {
    errors.push(
      `Current Owner summary count for ${disposition} does not match derived count ${expectedCount}`,
    );
  }
}
const currentOwnerSummaryEntries = [
  ...currentOwnerTotalsSection.matchAll(
    /^\| \*\*(Confirmed|Pending|Total)\*\* \| \*\*(\d+)\*\* \|$/gm,
  ),
].map((match) => ({
  label: match[1],
  count: Number(match[2]),
}));
for (const [label, expectedCount] of [
  ["Confirmed", ownerDecisionRecords.length],
  ["Pending", pendingRows.length],
  ["Total", 35],
]) {
  const entries = currentOwnerSummaryEntries.filter(
    (entry) => entry.label === label,
  );
  if (
    entries.length !== 1 ||
    entries[0].count !== expectedCount
  ) {
    errors.push(
      `Current Owner summary ${label} is not the singleton derived count ${expectedCount}`,
    );
  }
}

const recommendationCounts = new Map();
for (const row of matrixRows) {
  recommendationCounts.set(
    row.recommendation,
    (recommendationCounts.get(row.recommendation) ?? 0) + 1,
  );
}
const expectedRecommendationCounts = {
  "APPROVE AS RECORD": 17,
  "APPROVE WITH REWORDING": 11,
  SPLIT: 5,
  "EVIDENCE ONLY": 1,
  "RESEARCH ONLY": 1,
};
for (const [disposition, count] of Object.entries(
  expectedRecommendationCounts,
)) {
  if (recommendationCounts.get(disposition) !== count) {
    errors.push(
      `Recommendation count for ${disposition} is ${
        recommendationCounts.get(disposition) ?? 0
      }, expected ${count}`,
    );
  }
}

const recommendationSummarySection = matrix.slice(
  matrix.indexOf("These are recommendation totals"),
  matrix.indexOf("## Current Product Owner totals"),
);
const recommendationSummaryEntries = [
  ...recommendationSummarySection.matchAll(
    /^\| `([^`]+)` \| (\d+) \|$/gm,
  ),
].map((match) => ({
  disposition: match[1],
  count: Number(match[2]),
}));
for (const disposition of allowedDispositions) {
  const matchingEntries = recommendationSummaryEntries.filter(
    (entry) => entry.disposition === disposition,
  );
  const expectedCount = recommendationCounts.get(disposition) ?? 0;
  if (
    matchingEntries.length !== 1 ||
    matchingEntries[0].count !== expectedCount
  ) {
    errors.push(
      `Recommendation summary count for ${disposition} does not match derived count ${expectedCount}`,
    );
  }
}
const recommendationSummaryTotals = [
  ...recommendationSummarySection.matchAll(
    /^\| \*\*Total\*\* \| \*\*(\d+)\*\* \|$/gm,
  ),
];
if (
  recommendationSummaryTotals.length !== 1 ||
  Number(recommendationSummaryTotals[0][1]) !== 35
) {
  errors.push("Recommendation summary Total is not the singleton count 35");
}

const recommendedText = docs["RECOMMENDED-DISPOSITIONS.md"] ?? "";
const recommendationHeadingMatches = [
  ...recommendedText.matchAll(/^### (FOUND-\d{3}) — (.+)$/gm),
];
const recommendationHeadings = recommendationHeadingMatches.map(
  (match) => match[1],
);
const recommendationSectionByHandle = new Map();
if (
  recommendationHeadings.length !== 35 ||
  new Set(recommendationHeadings).size !== 35 ||
  expectedHandles.some((handle) => !recommendationHeadings.includes(handle))
) {
  errors.push("Recommended Dispositions does not contain 35 unique proposal sections");
}
if (
  expectedRecommendationAnalyticalHashes.size !== 35 ||
  expectedHandles.some(
    (handle) => !expectedRecommendationAnalyticalHashes.has(handle),
  )
) {
  errors.push(
    "Validator recommendation analytical baseline inventory is incomplete",
  );
}
for (let index = 0; index < recommendationHeadingMatches.length; index += 1) {
  const heading = recommendationHeadingMatches[index];
  const sectionStart = heading.index;
  const sectionEnd =
    index + 1 < recommendationHeadingMatches.length
      ? recommendationHeadingMatches[index + 1].index
      : recommendedText.length;
  const section = recommendedText.slice(sectionStart, sectionEnd);
  recommendationSectionByHandle.set(heading[1], section);
  const ownerDecisionFieldStart = section.indexOf(
    "- **Product Owner decision:**",
  );
  const analyticalPrefix =
    ownerDecisionFieldStart === -1
      ? ""
      : section.slice(0, ownerDecisionFieldStart).trimEnd();
  if (
    !analyticalPrefix ||
    sha256(analyticalPrefix) !==
      expectedRecommendationAnalyticalHashes.get(heading[1])
  ) {
    errors.push(
      `${heading[1]} recommendation analytical fields drift from the preserved baseline`,
    );
  }
  const matrixRow = matrixByHandle.get(heading[1]);
  if (!matrixRow) continue;
  if (heading[2].trim() !== matrixRow.title) {
    errors.push(
      `${heading[1]} recommendation title does not match the disposition matrix`,
    );
  }
  const dispositionField = readDecisionField(
    section,
    "Recommended disposition",
  );
  const sectionDisposition = dispositionField.match(/`([^`]+)`/)?.[1] ?? "";
  if (sectionDisposition !== matrixRow.recommendation) {
    errors.push(
      `${heading[1]} Recommended Dispositions value does not match the matrix`,
    );
  }
  const recommendationCandidateIds = candidateIdsFrom(
    readWrappedDecisionField(section, "Candidate sources"),
  );
  const matrixCandidateIdsForRecommendation = candidateIdsFrom(
    matrixRow.sources,
  );
  if (
    hasDuplicates(recommendationCandidateIds) ||
    JSON.stringify([...recommendationCandidateIds].sort()) !==
      JSON.stringify([...matrixCandidateIdsForRecommendation].sort())
  ) {
    errors.push(
      `${heading[1]} Recommended Dispositions Candidate provenance does not match the matrix`,
    );
  }
  const confirmedRecord = ownerDecisionByHandle.get(heading[1]);
  const ownerDecisionValue = normalizedMarkdownValue(
    readWrappedDecisionField(section, "Product Owner decision"),
  );
  const ownerWordingValue = normalizedMarkdownValue(
    readWrappedDecisionField(section, "Product Owner wording"),
  );
  const insertionEligibilityValue = normalizedMarkdownValue(
    readWrappedDecisionField(section, "Insertion eligibility"),
  );
  const confirmationStateValue = normalizedMarkdownValue(
    readWrappedDecisionField(section, "Confirmation state"),
  );
  const authorityRouteValue = normalizedMarkdownValue(
    readWrappedDecisionField(section, "Authority route"),
  );
  if (confirmedRecord) {
    if (ownerDecisionValue !== confirmedRecord.disposition) {
      errors.push(
        `${heading[1]} recommendation decision does not match the confirmed Owner record`,
      );
    }
    const expectedOwnerWording = normalizedMarkdownValue(
      `${confirmedRecord.approvedTitle} — ${
        confirmedRecord.approvedBoundary
      }${
        confirmedRecord.approvedSupportingStatement
          ? ` Supporting statement: ${confirmedRecord.approvedSupportingStatement}`
          : ""
      }`,
    );
    if (ownerWordingValue !== expectedOwnerWording) {
      errors.push(
        `${heading[1]} recommendation wording does not exactly match the confirmed Owner record`,
      );
    }
    if (
      insertionEligibilityValue !==
      normalizedMarkdownValue(confirmedRecord.insertionEligibility)
    ) {
      errors.push(
        `${heading[1]} recommendation eligibility does not match the confirmed Owner record`,
      );
    }
    if (confirmationStateValue !== confirmedState) {
      errors.push(
        `${heading[1]} recommendation confirmation state is not ${confirmedState}`,
      );
    }
    const expectedAuthorityRoute = normalizedMarkdownValue(
      `${confirmedRecord.authorityRoute} — ${confirmedRecord.areaRoute}`,
    );
    if (authorityRouteValue !== expectedAuthorityRoute) {
      errors.push(
        `${heading[1]} recommendation authority route does not exactly match the confirmed Owner record`,
      );
    }
    for (const [recommendedField, ownerValue] of [
      ["Approved exclusions", confirmedRecord.approvedExclusions],
      ["Unresolved matters", confirmedRecord.unresolved],
    ]) {
      const recommendedValue = normalizedMarkdownValue(
        readWrappedDecisionField(section, recommendedField),
      );
      if (
        !recommendedValue ||
        recommendedValue !== normalizedMarkdownValue(ownerValue)
      ) {
        errors.push(
          `${heading[1]} recommendation ${recommendedField} does not match the confirmed Owner record`,
        );
      }
    }
  } else {
    if (ownerDecisionValue !== "PENDING") {
      errors.push(
        `${heading[1]} unconfirmed recommendation decision is not PENDING`,
      );
    }
    if (ownerWordingValue !== "NOT PROVIDED") {
      errors.push(
        `${heading[1]} unconfirmed recommendation invents Product Owner wording`,
      );
    }
    if (
      !/\b(?:blocked|ineligible)\b|^No insertion\b|^Not an insertion target\b/i.test(
        insertionEligibilityValue,
      )
    ) {
      errors.push(
        `${heading[1]} unconfirmed recommendation is not blocked from insertion`,
      );
    }
    if (
      confirmationStateValue &&
      confirmationStateValue !== "PENDING"
    ) {
      errors.push(
        `${heading[1]} unconfirmed recommendation has a false confirmation state`,
      );
    }
  }
}

const authorityEntries = [
  ...(docs["AUTHORITY-ROUTING.md"] ?? "").matchAll(
    /^\| `(FOUND-\d{3})` \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm,
  ),
].map((match) => ({
  handle: match[1],
  primaryHome: match[2].trim(),
  retainedAuthority: match[3].trim(),
  followup: match[4].trim(),
}));
const authorityRows = authorityEntries.map((entry) => entry.handle);
if (
  authorityRows.length !== 35 ||
  new Set(authorityRows).size !== 35 ||
  expectedHandles.some((handle) => !authorityRows.includes(handle))
) {
  errors.push("Authority Routing does not contain every proposal exactly once");
}
const authorityByHandle = new Map(
  authorityEntries.map((entry) => [entry.handle, entry]),
);
for (const [handle, expected] of expectedConfirmedAuthority) {
  const entry = authorityByHandle.get(handle);
  if (
    !entry ||
    entry.primaryHome !== expected.primaryHome ||
    entry.retainedAuthority !== expected.retainedAuthority ||
    entry.followup !== expected.followup
  ) {
    errors.push(
      `${handle} Authority Routing cells do not exactly match the confirmed Batch ${handleBatch.get(handle)} route`,
    );
  }
}

const splitPlan = docs["SPLIT-MERGE-PLAN.md"] ?? "";
const splitParents = [
  ...splitPlan.matchAll(/^## (FOUND-\d{3}) —/gm),
].map((match) => match[1]);
const expectedSplitParents = matrixRows
  .filter((row) => {
    const confirmed = ownerDecisionByHandle.get(row.handle);
    return (confirmed?.disposition ?? row.recommendation) === "SPLIT";
  })
  .map((row) => row.handle)
  .sort();
if (
  JSON.stringify([...splitParents].sort()) !==
  JSON.stringify(expectedSplitParents)
) {
  errors.push(
    "Split plan parents do not match confirmed-or-pending SPLIT dispositions",
  );
}
const splitHandles = [
  ...splitPlan.matchAll(/^### (DISP-\d{3}[A-Z]) —/gm),
].map((match) => match[1]);
if (new Set(splitHandles).size !== splitHandles.length) {
  errors.push("Split plan contains duplicate temporary DISP handles");
}
const splitChildrenByParent = new Map();
for (let index = 0; index < splitParents.length; index += 1) {
  const parent = splitParents[index];
  const start = splitPlan.indexOf(`## ${parent} —`);
  const nextParent =
    index + 1 < splitParents.length
      ? splitPlan.indexOf(`## ${splitParents[index + 1]} —`, start + 1)
      : splitPlan.indexOf("## Merge assessment", start + 1);
  const section = splitPlan.slice(start, nextParent === -1 ? splitPlan.length : nextParent);
  const children = [...section.matchAll(/^### (DISP-\d{3}[A-Z]) —/gm)];
  if (children.length < 2) {
    errors.push(`${parent} has fewer than two split children`);
  }
  splitChildrenByParent.set(
    parent,
    children.map((match) => match[1]),
  );
  const parentCandidateIds = new Set(
    candidateIdsFrom(matrixByHandle.get(parent)?.sources ?? ""),
  );
  const allocatedCandidateIds = new Set();
  for (let childIndex = 0; childIndex < children.length; childIndex += 1) {
    const parentNumber = parent.match(/\d{3}/)?.[0];
    const childNumber = children[childIndex][1].match(/\d{3}/)?.[0];
    if (parentNumber !== childNumber) {
      errors.push(
        `${children[childIndex][1]} does not use its parent FOUND number`,
      );
    }
    const childStart = children[childIndex].index;
    const childEnd =
      childIndex + 1 < children.length
        ? children[childIndex + 1].index
        : section.length;
    const childSection = section.slice(childStart, childEnd);
    const childCandidateIds = new Set(candidateIdsFrom(childSection));
    if (childCandidateIds.size === 0) {
      errors.push(`${children[childIndex][1]} has no Candidate provenance`);
    }
    for (const id of childCandidateIds) {
      allocatedCandidateIds.add(id);
      if (!parentCandidateIds.has(id)) {
        errors.push(
          `${children[childIndex][1]} introduces unrelated Candidate ${id}`,
        );
      }
    }
    for (const requiredLabel of [
      "Candidate provenance",
      "Recommended category / area",
      "Boundary",
      "Exclusions",
    ]) {
      const fieldValue = normalizedMarkdownValue(
        readWrappedDecisionField(childSection, requiredLabel),
      );
      if (
        !fieldValue ||
        ["NONE", "PENDING", "NOT PROVIDED"].includes(
          fieldValue.toUpperCase(),
        )
      ) {
        errors.push(
          `${children[childIndex][1]} is missing substantive split field ${requiredLabel}`,
        );
      } else if (
        requiredLabel !== "Candidate provenance" &&
        /\b(?:reject(?:ed|ion)?|invalid|no valid|must not be inserted)\b/i.test(
          fieldValue,
        )
      ) {
        errors.push(
          `${children[childIndex][1]} split field ${requiredLabel} contains contradictory rejection language`,
        );
      }
    }
  }
  const retainedOrSharedLine = section
    .split("\n")
    .find((line) => line.startsWith("- **Retained or shared provenance:**"));
  if (retainedOrSharedLine) {
    for (const candidateId of candidateIdsFrom(retainedOrSharedLine)) {
      allocatedCandidateIds.add(candidateId);
      if (!parentCandidateIds.has(candidateId)) {
        errors.push(
          `${parent} retains unrelated Candidate ${candidateId} in split plan`,
        );
      }
    }
  }
  for (const id of parentCandidateIds) {
    if (!allocatedCandidateIds.has(id)) {
      errors.push(`${parent} split plan silently loses Candidate ${id}`);
    }
  }
  const confirmed = ownerDecisionByHandle.get(parent);
  if (confirmed?.disposition === "SPLIT") {
    const sectionChildren = [...splitChildrenByParent.get(parent)].sort();
    const confirmedChildren = [...confirmed.temporaryHandles].sort();
    if (
      JSON.stringify(sectionChildren) !== JSON.stringify(confirmedChildren)
    ) {
      errors.push(`${parent} split plan does not match confirmed child handles`);
    }
  }
}
for (const parent of splitParents) {
  const expectedChildren = [
    ...(splitChildrenByParent.get(parent) ?? []),
  ].sort();
  const authorityHandles = parseHandleList(
    authorityByHandle.get(parent)?.primaryHome ?? "",
    "DISP",
  ).sort();
  if (
    hasDuplicates(authorityHandles) ||
    JSON.stringify(authorityHandles) !==
      JSON.stringify(expectedChildren)
  ) {
    errors.push(
      `${parent} Authority Routing temporary handles do not match its split children`,
    );
  }
  const matrixHandles = parseHandleList(
    matrixByHandle.get(parent)?.boundary ?? "",
    "DISP",
  ).sort();
  if (
    hasDuplicates(matrixHandles) ||
    JSON.stringify(matrixHandles) !==
      JSON.stringify(expectedChildren)
  ) {
    errors.push(
      `${parent} matrix temporary handles do not match its split children`,
    );
  }
  const recommendedTargets = parseHandleList(
    readWrappedDecisionField(
      recommendationSectionByHandle.get(parent) ?? "",
      "Recommended merge or split targets",
    ),
    "DISP",
  ).sort();
  if (
    hasDuplicates(recommendedTargets) ||
    JSON.stringify(recommendedTargets) !==
      JSON.stringify(expectedChildren)
  ) {
    errors.push(
      `${parent} Recommended split targets do not match its split children`,
    );
  }
}

const mergeSections = [
  ...splitPlan.matchAll(/^## MERGE (DISP-\d{3}[A-Z]) —/gm),
];
const mergeSectionHandles = mergeSections.map((match) => match[1]);
if (new Set(mergeSectionHandles).size !== mergeSectionHandles.length) {
  errors.push("Split/Merge plan contains duplicate merge output handles");
}
const allDispositionHandles = [...splitHandles, ...mergeSectionHandles];
if (new Set(allDispositionHandles).size !== allDispositionHandles.length) {
  errors.push("A DISP handle is reused across split and merge outputs");
}
for (const handle of allDispositionHandles) {
  for (const filename of [
    "DISPOSITION-MATRIX.md",
    "RECOMMENDED-DISPOSITIONS.md",
    "AUTHORITY-ROUTING.md",
    "SPLIT-MERGE-PLAN.md",
    "CANONICAL-INSERTION-PLAN.md",
  ]) {
    if (!(docs[filename] ?? "").includes(handle)) {
      errors.push(`${handle} is missing from ${filename}`);
    }
  }
}
const documentedDispositionHandles = new Set(
  Object.entries(docs)
    .filter(([filename]) => filename !== "VALIDATION-REPORT.md")
    .flatMap(([, content]) => parseHandleList(content, "DISP")),
);
for (const handle of documentedDispositionHandles) {
  if (!allDispositionHandles.includes(handle)) {
    errors.push(`Unknown or stale temporary disposition handle ${handle}`);
  }
}
const confirmedMergeRecords = ownerDecisionRecords.filter(
  (record) => record.disposition === "MERGE",
);
const confirmedMergeHandles = new Set(
  confirmedMergeRecords.flatMap((record) => record.temporaryHandles),
);
if (
  [...confirmedMergeHandles].some(
    (handle) => !mergeSectionHandles.includes(handle),
  ) ||
  mergeSectionHandles.some((handle) => !confirmedMergeHandles.has(handle))
) {
  errors.push("Merge plan outputs do not match confirmed MERGE decisions");
}
for (let index = 0; index < mergeSections.length; index += 1) {
  const heading = mergeSections[index];
  const start = heading.index;
  const end =
    index + 1 < mergeSections.length
      ? mergeSections[index + 1].index
      : splitPlan.length;
  const section = splitPlan.slice(start, end);
  for (const requiredLabel of [
    "Source proposals",
    "Candidate provenance",
    "Boundary",
    "Exclusions",
  ]) {
    if (!section.includes(`- **${requiredLabel}:**`)) {
      errors.push(`${heading[1]} merge section is missing ${requiredLabel}`);
    }
  }
  const planSources = parseHandleList(
    readDecisionField(section, "Source proposals"),
    "FOUND",
  ).sort();
  const relatedRecords = confirmedMergeRecords.filter(
    (record) => record.temporaryHandles[0] === heading[1],
  );
  for (const record of relatedRecords) {
    if (
      JSON.stringify([...record.mergeSources].sort()) !==
      JSON.stringify(planSources)
    ) {
      errors.push(
        `${record.headingHandle} confirmed merge sources do not match ${heading[1]}`,
      );
    }
  }
  for (const source of planSources) {
    const sourceRecord = ownerDecisionByHandle.get(source);
    if (
      sourceRecord?.disposition !== "MERGE" ||
      sourceRecord.temporaryHandles[0] !== heading[1]
    ) {
      errors.push(
        `${heading[1]} source ${source} lacks a matching confirmed MERGE record`,
      );
    }
  }
}

const matrixCandidateIds = new Set(candidateIdsFrom(matrix));
if (matrixCandidateIds.size !== 66) {
  errors.push(
    `Disposition matrix accounts for ${matrixCandidateIds.size} source Candidates, expected 66`,
  );
}
const foundationProposal = fs.readFileSync(
  path.join(
    repoRoot,
    "docs/product-memory/AXOM-0002C/FOUNDATION-PROPOSAL.md",
  ),
  "utf8",
);
const foundationCandidateIds = new Set(candidateIdsFrom(foundationProposal));
const foundationRows = [
  ...foundationProposal.matchAll(
    /^\| `(FOUND-\d{3})` \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm,
  ),
].map((match) => ({
  handle: match[1],
  title: match[2].trim(),
  sources: match[3].trim(),
}));
if (
  foundationRows.length !== 35 ||
  new Set(foundationRows.map((row) => row.handle)).size !== 35
) {
  errors.push("AXOM-0002C foundation proposal does not contain 35 unique rows");
}
const foundationByHandle = new Map(
  foundationRows.map((row) => [row.handle, row]),
);
for (const matrixRow of matrixRows) {
  const foundationRow = foundationByHandle.get(matrixRow.handle);
  if (!foundationRow) {
    errors.push(`${matrixRow.handle} has no AXOM-0002C foundation source row`);
    continue;
  }
  if (matrixRow.title !== foundationRow.title) {
    errors.push(
      `${matrixRow.handle} matrix original title does not match AXOM-0002C`,
    );
  }
  const matrixSourceIds = candidateIdsFrom(matrixRow.sources);
  const foundationSourceIds = candidateIdsFrom(foundationRow.sources);
  const matrixIds = new Set(matrixSourceIds);
  const foundationIds = new Set(foundationSourceIds);
  if (
    hasDuplicates(matrixSourceIds) ||
    matrixIds.size !== foundationIds.size ||
    [...foundationIds].some((id) => !matrixIds.has(id))
  ) {
    errors.push(
      `${matrixRow.handle} Candidate provenance does not match AXOM-0002C`,
    );
  }
}
if (
  matrixCandidateIds.size !== foundationCandidateIds.size ||
  [...matrixCandidateIds].some((id) => !foundationCandidateIds.has(id)) ||
  [...foundationCandidateIds].some((id) => !matrixCandidateIds.has(id))
) {
  errors.push(
    "Disposition matrix Candidate set does not exactly match AXOM-0002C foundation evidence",
  );
}
const constitution = fs.readFileSync(
  path.join(repoRoot, "docs/governance/AX-0002-CONSTITUTION.md"),
  "utf8",
);
const registry = fs.readFileSync(
  path.join(repoRoot, "docs/governance/AX-0000-REGISTRY.md"),
  "utf8",
);
const registeredGovernanceIds = new Set(
  [...registry.matchAll(/^\| `(AX-\d{4})` \|/gm)].map(
    (match) => match[1],
  ),
);
const foundPermanentProductIds = new Set();
for (const [filename, content] of Object.entries(checkedFiles)) {
  for (const match of content.matchAll(
    /(?<![A-Z0-9-])FOUND-[A-Z0-9-]+/g,
  )) {
    if (!/^FOUND-\d{3}$/.test(match[0])) {
      errors.push(`${filename} contains malformed FOUND handle ${match[0]}`);
    }
  }
  for (const handle of parseHandleList(content, "FOUND")) {
    if (!expectedHandles.includes(handle)) {
      errors.push(`${filename} contains unknown FOUND handle ${handle}`);
    }
  }
  for (const match of content.matchAll(
    /(?<![A-Z0-9-])DISP-[A-Z0-9-]+/g,
  )) {
    if (!/^DISP-\d{3}[A-Z]$/.test(match[0])) {
      errors.push(`${filename} contains malformed DISP handle ${match[0]}`);
    }
  }
  for (const match of content.matchAll(
    /(?<![A-Z0-9-])CAND-[A-Z0-9-]+/g,
  )) {
    if (!/^CAND-\d{6}$/.test(match[0])) {
      errors.push(`${filename} contains malformed Candidate token ${match[0]}`);
    }
  }
  for (const candidateId of candidateIdsFrom(content)) {
    if (!archiveIds.has(candidateId)) {
      errors.push(`${filename} contains unknown Candidate ${candidateId}`);
    }
  }
  if (filename.endsWith(".md")) {
    for (const match of content.matchAll(
      /(?<![A-Z0-9-])AX-[A-Z0-9-]+/g,
    )) {
      if (!/^AX-\d{4}$/.test(match[0])) {
        errors.push(`${filename} contains malformed AX token ${match[0]}`);
      }
    }
    for (const match of content.matchAll(
      /(?<![A-Z0-9-])C-[A-Z0-9-]+/g,
    )) {
      if (!/^C-\d{3}$/.test(match[0])) {
        errors.push(
          `${filename} contains malformed Constitution token ${match[0]}`,
        );
      }
    }
  }
  for (const match of content.matchAll(
    /(?<![A-Z0-9-])AX-(\d{4})(?![A-Z0-9])/g,
  )) {
    if (Number(match[1]) >= 100) {
      foundPermanentProductIds.add(match[0]);
      errors.push(`${filename} contains unauthorized product ID ${match[0]}`);
    } else if (!registeredGovernanceIds.has(match[0])) {
      errors.push(
        `${filename} contains unregistered governance ID ${match[0]}`,
      );
    }
  }
  for (const match of content.matchAll(/\bC-(\d{3})\b/g)) {
    if (!constitution.includes(`### ${match[0]} `)) {
      errors.push(`${filename} contains invalid Constitution reference ${match[0]}`);
    }
  }
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    if (/[ \t]+$/.test(line)) {
      errors.push(`${filename}:${index + 1} has trailing whitespace`);
    }
  });
  if (content.includes("\r")) {
    errors.push(`${filename} contains carriage-return line endings`);
  }
  if (!content.endsWith("\n")) {
    errors.push(`${filename} does not end with a newline`);
  }
}
if (negativeTestText) {
  negativeTestText.split("\n").forEach((line, index) => {
    if (/[ \t]+$/.test(line)) {
      errors.push(
        `test-validator-negative.mjs:${index + 1} has trailing whitespace`,
      );
    }
  });
  if (negativeTestText.includes("\r")) {
    errors.push(
      "test-validator-negative.mjs contains carriage-return line endings",
    );
  }
  if (!negativeTestText.endsWith("\n")) {
    errors.push("test-validator-negative.mjs does not end with a newline");
  }
}

const prohibitedCanonicalFields = [
  "Priority",
  "Board",
  "Status",
  "Product DNA",
  "Acceptance Criteria",
  "Product Truth",
  "Success Metric",
  "Success Metrics",
  "Verification",
  "Owner Acceptance",
  "Roadmap Placement",
  "Impact",
  "Implementation",
  "Commit",
];

function splitMarkdownRow(line) {
  let body = line.trim();
  if (body.startsWith("|")) body = body.slice(1);
  if (/(?<!\\)\|$/.test(body)) body = body.slice(0, -1);
  return body
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim());
}

function hasMarkdownPipe(line) {
  return /(?<!\\)\|/.test(line);
}

function isDelimiterRow(line) {
  if (!hasMarkdownPipe(line)) return false;
  const cells = splitMarkdownRow(line);
  return (
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell))
  );
}

function normalizedTableCell(cell) {
  return cell.replace(/[`*_]/g, "").trim();
}

for (const [filename, content] of Object.entries(docs)) {
  const lines = content.split("\n");
  let index = 0;
  while (index < lines.length) {
    if (!hasMarkdownPipe(lines[index])) {
      index += 1;
      continue;
    }
    const start = index;
    const block = [];
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      hasMarkdownPipe(lines[index])
    ) {
      block.push(lines[index]);
      index += 1;
    }
    if (block.length < 2) {
      errors.push(`${filename}:${start + 1} has an incomplete Markdown table`);
      continue;
    }
    const headerCells = splitMarkdownRow(block[0]);
    const delimiterCells = splitMarkdownRow(block[1]);
    const expectedColumns = headerCells.length;
    if (
      !isDelimiterRow(block[1]) ||
      delimiterCells.length !== expectedColumns
    ) {
      errors.push(
        `${filename}:${start + 2} has an invalid Markdown table delimiter row`,
      );
    }
    headerCells.forEach((cell) => {
      const normalized = normalizedTableCell(cell).toLowerCase();
      const prohibited = prohibitedCanonicalFields.find(
        (field) => field.toLowerCase() === normalized,
      );
      if (prohibited) {
        errors.push(
          `${filename}:${start + 1} exposes prohibited canonical table field ${prohibited}`,
        );
      }
    });
    for (let offset = 2; offset < block.length; offset += 1) {
      const cells = splitMarkdownRow(block[offset]);
      if (cells.length !== expectedColumns) {
        errors.push(
          `${filename}:${start + offset + 1} has inconsistent Markdown table columns`,
        );
      }
      for (const cell of cells) {
        const normalized = normalizedTableCell(cell);
        for (const field of prohibitedCanonicalFields) {
          const assignment = new RegExp(
            `^${field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*(?!PENDING$|NOT PROVIDED$|NONE$|NOT APPLICABLE$).+`,
            "i",
          );
          if (assignment.test(normalized)) {
            errors.push(
              `${filename}:${start + offset + 1} canonically assigns prohibited table field ${field}`,
            );
          }
        }
      }
    }
  }
}

const lexicon = fs.readFileSync(
  path.join(repoRoot, "docs/governance/AX-0009-PRODUCT-LEXICON.md"),
  "utf8",
);
const lexiconSections = new Set(
  [...lexicon.matchAll(/^### ((?:1A|[2-6])\.\d+) /gm)].map(
    (match) => match[1],
  ),
);
for (const line of allText.split("\n")) {
  if (!line.includes("§")) continue;
  for (const match of line.matchAll(/\b(\d+A?)\.(\d+)\b/g)) {
    if (!lexiconSections.has(match[0])) {
      errors.push(`Unresolved section reference ${match[0]} in ${line.trim()}`);
    }
  }
}
for (const match of allText.matchAll(/\b(?:1A|[2-6])\.\d+\b/g)) {
  if (!lexiconSections.has(match[0])) {
    errors.push(`Unresolved Product Lexicon reference ${match[0]}`);
  }
}
for (const match of allText.matchAll(
  /\b(1A|[2-6])\.(\d+)\s*[–-]\s*(?:(1A|[2-6])\.)?(\d+)\b/g,
)) {
  const startPrefix = match[1];
  const endPrefix = match[3] ?? startPrefix;
  const startNumber = Number(match[2]);
  const endNumber = Number(match[4]);
  if (startPrefix !== endPrefix || endNumber < startNumber) {
    errors.push(`Invalid Product Lexicon range ${match[0]}`);
    continue;
  }
  for (let number = startNumber; number <= endNumber; number += 1) {
    const reference = `${startPrefix}.${number}`;
    if (!lexiconSections.has(reference)) {
      errors.push(`Unresolved Product Lexicon range member ${reference}`);
    }
  }
}

for (const [filename, content] of Object.entries(checkedFiles)) {
  for (const field of prohibitedCanonicalFields) {
    const bulletPattern = new RegExp(
      `^\\s*-\\s*\\*\\*${field}:\\*\\*\\s*(?!\`?(?:PENDING|NOT PROVIDED|NONE|NOT APPLICABLE)\`?\\.?\\s*$)\\S`,
      "gim",
    );
    const tablePattern = new RegExp(
      `^\\|\\s*${field}\\s*\\|\\s*(?!\`?(?:PENDING|NOT PROVIDED|NONE|NOT APPLICABLE)\`?\\s*\\|$|-+\\s*\\|)\\S`,
      "gim",
    );
    const structuredPattern = new RegExp(
      `^\\s*(?:${field}|"${field}"|'${field}')\\s*:\\s*(?!\`?(?:PENDING|NOT PROVIDED|NONE|NOT APPLICABLE)\`?\\.?\\s*$)\\S`,
      "gim",
    );
    if (
      bulletPattern.test(content) ||
      tablePattern.test(content) ||
      structuredPattern.test(content)
    ) {
      errors.push(`${filename} canonically assigns prohibited field ${field}`);
    }
  }
}

const insertionPlan = docs["CANONICAL-INSERTION-PLAN.md"] ?? "";
const insertionStatusHeadings = [
  ...insertionPlan.matchAll(/^## Status$/gm),
];
const insertionStatusSectionStart = insertionPlan.indexOf("## Status");
const insertionStatusSectionEnd = insertionPlan.indexOf(
  "\n## ",
  insertionStatusSectionStart + 1,
);
const insertionStatusSection =
  insertionStatusSectionStart === -1
    ? ""
    : insertionPlan.slice(
        insertionStatusSectionStart,
        insertionStatusSectionEnd === -1
          ? insertionPlan.length
          : insertionStatusSectionEnd,
      );
const insertionStatusStatements = [
  ...insertionStatusSection.matchAll(/\*\*([\s\S]*?)\*\*/g),
].map((match) => match[1].replace(/\s+/g, " ").trim());
const expectedInsertionStatus =
  pendingRows.length === 0
    ? "READY — ALL SEVEN PRODUCT OWNER BATCHES ARE CONFIRMED."
    : sequentiallyCompletedBatches === 0
      ? `NOT READY — NO BATCH IS CONFIRMED; ${pendingRows.length} PRODUCT OWNER DISPOSITIONS REMAIN PENDING.`
      : sequentiallyCompletedBatches === 1
        ? `NOT READY — BATCH 1 IS CONFIRMED; ${pendingRows.length} PRODUCT OWNER DISPOSITIONS REMAIN PENDING.`
        : `NOT READY — BATCHES 1–${sequentiallyCompletedBatches} ARE CONFIRMED; ${pendingRows.length} PRODUCT OWNER DISPOSITIONS REMAIN PENDING.`;
if (
  insertionStatusHeadings.length !== 1 ||
  insertionStatusStatements.length !== 1 ||
  insertionStatusStatements[0] !== expectedInsertionStatus
) {
  errors.push(
    `Insertion readiness status does not match: ${expectedInsertionStatus}`,
  );
}
const blockerHeadings = [
  ...insertionPlan.matchAll(/^## Current blockers$/gm),
];
const blockerSectionStart = insertionPlan.indexOf("## Current blockers");
const blockerSection =
  blockerSectionStart === -1
    ? ""
    : insertionPlan.slice(blockerSectionStart);
const blockerCommitStatements = [
  ...blockerSection.matchAll(
    /^- The disposition package is (?:not )?authorized for commit\.$/gm,
  ),
].map((match) => match[0]);
if (
  blockerHeadings.length !== 1 ||
  (pendingRows.length > 0 &&
    (blockerCommitStatements.length !== 1 ||
      blockerCommitStatements[0] !==
        "- The disposition package is not authorized for commit."))
) {
  errors.push(
    "Insertion-plan commit authorization blocker does not match the pending decision state",
  );
}

const temporaryHandleRows = [
  ...insertionPlan.matchAll(
    /^\| `(FOUND-\d{3})` \| ([^|]+) \| ([^|]+) \|$/gm,
  ),
].map((match) => ({
  parent: match[1],
  handles: parseHandleList(match[2], "DISP"),
  sources: candidateIdsFrom(match[3]),
}));
if (
  temporaryHandleRows.length !== splitParents.length ||
  new Set(temporaryHandleRows.map((row) => row.parent)).size !==
    splitParents.length ||
  splitParents.some(
    (parent) => !temporaryHandleRows.some((row) => row.parent === parent),
  )
) {
  errors.push(
    "Conditional temporary-handle table does not contain every split parent exactly once",
  );
}
for (const row of temporaryHandleRows) {
  const expectedChildren = [...(splitChildrenByParent.get(row.parent) ?? [])]
    .sort();
  if (
    hasDuplicates(row.handles) ||
    JSON.stringify([...row.handles].sort()) !==
      JSON.stringify(expectedChildren)
  ) {
    errors.push(
      `${row.parent} conditional temporary handles do not match the split plan`,
    );
  }
  const expectedSources = candidateIdsFrom(
    matrixByHandle.get(row.parent)?.sources ?? "",
  ).sort();
  if (
    hasDuplicates(row.sources) ||
    JSON.stringify([...row.sources].sort()) !==
      JSON.stringify(expectedSources)
  ) {
    errors.push(
      `${row.parent} conditional temporary-handle provenance does not match the matrix`,
    );
  }
}

const insertionRows = [
  ...insertionPlan.matchAll(
    /^\| `(FOUND-\d{3})` \| `([^`]+)` \| `(\d+)` \| ([^|]+) \| ([^|]+) \|$/gm,
  ),
].map((match) => ({
  handle: match[1],
  basis: match[2],
  count: Number(match[3]),
  home: match[4].trim(),
  sources: match[5].trim(),
}));
if (
  insertionRows.length !== 35 ||
  new Set(insertionRows.map((row) => row.handle)).size !== 35 ||
  expectedHandles.some(
    (handle) => !insertionRows.some((row) => row.handle === handle),
  )
) {
  errors.push(
    "Canonical insertion plan does not reconcile all 35 proposals exactly once",
  );
}
const insertionByHandle = new Map(
  insertionRows.map((row) => [row.handle, row]),
);
const governingDispositionByHandle = new Map(
  matrixRows.map((row) => [
    row.handle,
    ownerDecisionByHandle.get(row.handle)?.disposition ??
      row.recommendation,
  ]),
);
const governingEvidenceOnlyHandles = matrixRows
  .filter(
    (row) =>
      governingDispositionByHandle.get(row.handle) === "EVIDENCE ONLY",
  )
  .map((row) => row.handle)
  .sort();
const sourceProposalCountLines = [
  ...insertionPlan.matchAll(/^- Source proposals: (\d+);$/gm),
];
if (
  sourceProposalCountLines.length !== 1 ||
  Number(sourceProposalCountLines[0][1]) !== matrixRows.length
) {
  errors.push(
    `Insertion-plan source-proposal count is not the singleton derived value ${matrixRows.length}`,
  );
}
const evidenceOnlyCountLines = [
  ...insertionPlan.matchAll(
    /^- Evidence-only proposals: (\d+)(.*);$/gm,
  ),
];
const evidenceOnlyLineHandles =
  evidenceOnlyCountLines.length === 1
    ? parseHandleList(evidenceOnlyCountLines[0][2], "FOUND").sort()
    : [];
if (
  evidenceOnlyCountLines.length !== 1 ||
  Number(evidenceOnlyCountLines[0][1]) !==
    governingEvidenceOnlyHandles.length ||
  JSON.stringify(evidenceOnlyLineHandles) !==
    JSON.stringify(governingEvidenceOnlyHandles)
) {
  errors.push(
    `Insertion-plan Evidence-only summary does not match ${governingEvidenceOnlyHandles.length} governing proposals`,
  );
}
const splitCountLines = [
  ...insertionPlan.matchAll(
    /^- Split proposals: (\d+), producing (\d+) temporary records:$/gm,
  ),
];
if (
  splitCountLines.length !== 1 ||
  Number(splitCountLines[0][1]) !== splitParents.length ||
  Number(splitCountLines[0][2]) !== splitHandles.length
) {
  errors.push(
    `Insertion-plan split summary does not match ${splitParents.length} parents and ${splitHandles.length} handles`,
  );
}
const mergeOutputCountLines = [
  ...insertionPlan.matchAll(/^- Current merge outputs: (\d+);$/gm),
];
if (
  mergeOutputCountLines.length !== 1 ||
  Number(mergeOutputCountLines[0][1]) !== confirmedMergeHandles.size
) {
  errors.push(
    `Insertion-plan merge summary does not match ${confirmedMergeHandles.size} outputs`,
  );
}
const potentialFutureRecordLines = [
  ...insertionPlan.matchAll(
    /-\s+\*\*(\d+) potential future canonical records\*\*/gm,
  ),
];
const conditionalInsertionRecordCount = insertionRows.reduce(
  (total, row) => total + row.count,
  0,
);
if (
  potentialFutureRecordLines.length !== 1 ||
  Number(potentialFutureRecordLines[0][1]) !==
    conditionalInsertionRecordCount
) {
  errors.push(
    `Insertion-plan future-record summary does not match ${conditionalInsertionRecordCount}`,
  );
}
function authorityRouteClass(value) {
  const matches = [
    ["EVIDENCE ONLY", /Evidence Only|Evidence supporting/],
    ["TECHNICAL DEBT", /Technical Debt/],
    ["PRODUCT DEBT", /Product Debt/],
    ["PRODUCT DECISION", /Product Decisions?/],
    ["FEATURE", /Features?/],
    ["RESEARCH", /Research/],
    ["DEFERRED", /Deferred/],
    ["REJECTED", /Reject(?:ed|ion)?/],
  ]
    .filter(([, pattern]) => pattern.test(value))
    .map(([routeClass]) => routeClass);
  if (matches.length === 0) return "UNKNOWN";
  if (matches.length > 1) return "AMBIGUOUS";
  return matches[0];
}
function hasContradictoryPositiveRouteLanguage(value) {
  return /\b(?:no (?:insertion|authority)|not (?:authorized|eligible|inserted)|forbidden|must not be inserted|insertion is not permitted)\b/i.test(
    value,
  );
}
for (const matrixRow of matrixRows) {
  const authorityEntry = authorityByHandle.get(matrixRow.handle);
  const insertionRow = insertionByHandle.get(matrixRow.handle);
  if (!authorityEntry || !insertionRow) continue;
  const authorityClass = authorityRouteClass(authorityEntry.primaryHome);
  const insertionClass = authorityRouteClass(insertionRow.home);
  if (
    authorityClass === "UNKNOWN" ||
    insertionClass === "UNKNOWN" ||
    authorityClass !== insertionClass
  ) {
    errors.push(
      `${matrixRow.handle} authority route does not match its insertion home`,
    );
  }
  const governingDisposition =
    ownerDecisionByHandle.get(matrixRow.handle)?.disposition ??
    matrixRow.recommendation;
  const confirmedRecord = ownerDecisionByHandle.get(matrixRow.handle);
  if (confirmedRecord) {
    const ownerAuthorityClass = authorityRouteClass(
      confirmedRecord.authorityRoute,
    );
    const ownerCategoryClass = authorityRouteClass(
      confirmedRecord.categoryRoute,
    );
    if (
      ownerAuthorityClass === "UNKNOWN" ||
      ownerAuthorityClass !== authorityClass ||
      ownerAuthorityClass !== insertionClass
    ) {
      errors.push(
        `${matrixRow.handle} confirmed Owner authority route does not reconcile`,
      );
    }
    if (
      ownerCategoryClass === "UNKNOWN" ||
      ownerCategoryClass !== ownerAuthorityClass
    ) {
      errors.push(
        `${matrixRow.handle} confirmed Owner category route does not reconcile`,
      );
    }
  }
  const requiredRouteClass =
    governingDisposition === "EVIDENCE ONLY"
      ? "EVIDENCE ONLY"
      : governingDisposition === "RESEARCH ONLY"
        ? "RESEARCH"
        : governingDisposition === "DEFER"
          ? "DEFERRED"
          : governingDisposition === "REJECT"
            ? "REJECTED"
            : null;
  if (requiredRouteClass && authorityClass !== requiredRouteClass) {
    errors.push(
      `${matrixRow.handle} authority route is incompatible with ${governingDisposition}`,
    );
  }
  if (
    !requiredRouteClass &&
    ![
      "PRODUCT DECISION",
      "FEATURE",
      "PRODUCT DEBT",
      "TECHNICAL DEBT",
      "RESEARCH",
    ].includes(authorityClass)
  ) {
    errors.push(
      `${matrixRow.handle} governing disposition lacks an AX-0001 authority route`,
    );
  }
  if (
    !requiredRouteClass &&
    (hasContradictoryPositiveRouteLanguage(
      authorityEntry.primaryHome,
    ) ||
      hasContradictoryPositiveRouteLanguage(insertionRow.home))
  ) {
    errors.push(
      `${matrixRow.handle} positive authority route contains contradictory negation`,
    );
  }
}
for (const matrixRow of matrixRows) {
  const insertionRow = insertionByHandle.get(matrixRow.handle);
  if (!insertionRow) continue;
  const confirmed = ownerDecisionByHandle.get(matrixRow.handle);
  const governingDisposition =
    confirmed?.disposition ?? matrixRow.recommendation;
  const expectedBasis = confirmed
    ? `CONFIRMED: ${governingDisposition}`
    : `PENDING RECOMMENDATION: ${governingDisposition}`;
  if (insertionRow.basis !== expectedBasis) {
    errors.push(
      `${matrixRow.handle} insertion basis does not match its current disposition`,
    );
  }
  let expectedCount;
  if (
    ["APPROVE AS RECORD", "APPROVE WITH REWORDING", "RESEARCH ONLY"].includes(
      governingDisposition,
    )
  ) {
    expectedCount = 1;
  } else if (governingDisposition === "SPLIT") {
    expectedCount = splitChildrenByParent.get(matrixRow.handle)?.length ?? 0;
  } else if (governingDisposition === "MERGE") {
    const mergeSources = [...(confirmed?.mergeSources ?? [])].sort();
    expectedCount = mergeSources[0] === matrixRow.handle ? 1 : 0;
  } else {
    expectedCount = 0;
  }
  if (insertionRow.count !== expectedCount) {
    errors.push(
      `${matrixRow.handle} insertion count is ${insertionRow.count}, expected ${expectedCount}`,
    );
  }
  if (
    ["EVIDENCE ONLY", "DEFER", "REJECT"].includes(governingDisposition) &&
    insertionRow.home.includes("AX-0001")
  ) {
    errors.push(
      `${matrixRow.handle} ${governingDisposition} incorrectly generates an AX-0001 home`,
    );
  }
  if (
    !["EVIDENCE ONLY", "DEFER", "REJECT"].includes(governingDisposition) &&
    !insertionRow.home.includes("AX-0001")
  ) {
    errors.push(
      `${matrixRow.handle} future record is missing an AX-0001 authority home`,
    );
  }
  const confirmedExpectation = expectedConfirmedDecisions.get(matrixRow.handle);
  if (
    confirmedExpectation &&
    insertionRow.home !== confirmedExpectation.authority
  ) {
    errors.push(
      `${matrixRow.handle} insertion home does not match its confirmed Batch ${handleBatch.get(matrixRow.handle)} authority route`,
    );
  }
  const insertionCandidateList = candidateIdsFrom(insertionRow.sources);
  const matrixCandidateListForInsertion = candidateIdsFrom(matrixRow.sources);
  const insertionCandidateIds = new Set(insertionCandidateList);
  const matrixCandidateIdsForInsertion = new Set(
    matrixCandidateListForInsertion,
  );
  if (
    hasDuplicates(insertionCandidateList) ||
    insertionCandidateIds.size !== matrixCandidateIdsForInsertion.size ||
    [...matrixCandidateIdsForInsertion].some(
      (id) => !insertionCandidateIds.has(id),
    )
  ) {
    errors.push(
      `${matrixRow.handle} insertion Candidate provenance does not match the matrix`,
    );
  }
}

const approvedSingleDispositions = new Set([
  "APPROVE AS RECORD",
  "APPROVE WITH REWORDING",
  "RESEARCH ONLY",
]);
const confirmedApprovedSingles = ownerDecisionRecords.filter((record) =>
  approvedSingleDispositions.has(record.disposition),
).length;
const confirmedSplitChildren = ownerDecisionRecords
  .filter((record) => record.disposition === "SPLIT")
  .reduce((total, record) => total + record.temporaryHandles.length, 0);
const confirmedMergeOutputs = new Set(
  ownerDecisionRecords
    .filter((record) => record.disposition === "MERGE")
    .flatMap((record) => record.temporaryHandles),
).size;
const confirmedEvidenceOnly = ownerDecisionRecords.filter(
  (record) => record.disposition === "EVIDENCE ONLY",
).length;
const confirmedDeferred = ownerDecisionRecords.filter(
  (record) => record.disposition === "DEFER",
).length;
const confirmedRejected = ownerDecisionRecords.filter(
  (record) => record.disposition === "REJECT",
).length;
const confirmedFutureRecordTotal =
  confirmedApprovedSingles +
  confirmedSplitChildren +
  confirmedMergeOutputs;

function readInsertionCount(label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [
    ...insertionPlan.matchAll(
      new RegExp(`^- \\*\\*${escaped}:\\*\\*\\s*\`([^\`]+)\`$`, "gm"),
    ),
  ];
  return {
    count: matches.length,
    value: matches[0]?.[1] ?? "",
  };
}

const expectedInsertionCounts = new Map([
  ["Confirmed approved single records", confirmedApprovedSingles],
  ["Confirmed split child records", confirmedSplitChildren],
  ["Confirmed merge output records", confirmedMergeOutputs],
  ["Confirmed Evidence-only proposals", confirmedEvidenceOnly],
  ["Confirmed Deferred proposals", confirmedDeferred],
  ["Confirmed Rejected proposals", confirmedRejected],
  ["Confirmed future record total", confirmedFutureRecordTotal],
]);
for (const [label, expected] of expectedInsertionCounts) {
  const actual = readInsertionCount(label);
  if (actual.count !== 1 || actual.value !== String(expected)) {
    errors.push(
      `${label} is ${actual.value || "missing"} across ${actual.count} fields, expected one value of ${expected} from confirmed decisions`,
    );
  }
}
const pendingBlockerMatches = [
  ...insertionPlan.matchAll(
    /^- (\d+) of 35 Product Owner decisions are pending\.$/gm,
  ),
];
if (
  pendingBlockerMatches.length !== 1 ||
  Number(pendingBlockerMatches[0][1]) !== pendingRows.length
) {
  errors.push(
    `Insertion-plan pending blocker is not the singleton derived count ${pendingRows.length}`,
  );
}
const confirmedFutureRecordMatches = [
  ...insertionPlan.matchAll(
    /^- Confirmed decisions currently contribute (\d+) future canonical records\.$/gm,
  ),
];
if (
  confirmedFutureRecordMatches.length !== 1 ||
  Number(confirmedFutureRecordMatches[0][1]) !== confirmedFutureRecordTotal
) {
  errors.push(
    `Insertion-plan confirmed future-record statement is not the singleton derived count ${confirmedFutureRecordTotal}`,
  );
}

let archiveIntegrity = "FAIL";
try {
  const archiveOutput = execFileSync(
    "python3",
    ["docs/product-memory/AXOM-0002B/validate-integrity.py"],
    { cwd: repoRoot, encoding: "utf8" },
  );
  if (archiveOutput.includes("RESULT: PASS — all checks green")) {
    archiveIntegrity = "PASS";
  } else {
    errors.push("Archive validator did not return its required PASS result");
  }
} catch (error) {
  const detail = String(error?.stdout ?? error?.message ?? error).trim();
  errors.push(`Archive integrity validation failed${detail ? `: ${detail}` : ""}`);
}

let diffCheck = "PASS";
for (const args of [
  ["diff", "--check"],
  ["diff", "--cached", "--check"],
]) {
  try {
    execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" });
  } catch (error) {
    diffCheck = "FAIL";
    const detail = String(error?.stdout ?? error?.message ?? error).trim();
    errors.push(
      `git ${args.slice(1).join(" ")} failed${detail ? `: ${detail}` : ""}`,
    );
  }
}

let repositoryBoundary = "PASS";
const currentBranch = execFileSync("git", ["branch", "--show-current"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();
const currentHead = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();
if (currentBranch !== "main") {
  repositoryBoundary = "FAIL";
  errors.push(`Repository branch is ${currentBranch || "detached"}, expected main`);
}
try {
  execFileSync(
    "git",
    ["merge-base", "--is-ancestor", proposalBaseline, "HEAD"],
    { cwd: repoRoot, encoding: "utf8" },
  );
} catch {
  repositoryBoundary = "FAIL";
  errors.push("Preserved proposal baseline is not an ancestor of HEAD");
}
const committedSinceBaseline = execFileSync(
  "git",
  ["diff", "--name-only", `${proposalBaseline}..HEAD`],
  { cwd: repoRoot, encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);
const commitsSinceBaseline = Number(
  execFileSync("git", ["rev-list", "--count", `${proposalBaseline}..HEAD`], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim(),
);
if (pendingRows.length > 0 && currentHead !== proposalBaseline) {
  repositoryBoundary = "FAIL";
  errors.push(
    "AXOM-0002C1 was committed before all seven Product Owner batches completed",
  );
}
if (pendingRows.length === 0 && commitsSinceBaseline > 1) {
  repositoryBoundary = "FAIL";
  errors.push(
    "More than one commit exists after the isolated proposal baseline",
  );
}
for (const changedPath of committedSinceBaseline) {
  if (!changedPath.startsWith("docs/product-memory/AXOM-0002C1/")) {
    repositoryBoundary = "FAIL";
    errors.push(`Out-of-scope committed change after proposal baseline: ${changedPath}`);
  }
}

const changedPaths = new Set();
for (const args of [
  ["diff", "--name-only"],
  ["diff", "--cached", "--name-only"],
  ["ls-files", "--others", "--exclude-standard"],
]) {
  const output = execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  for (const changedPath of output.split("\n").filter(Boolean)) {
    changedPaths.add(changedPath);
  }
}
for (const changedPath of changedPaths) {
  if (!changedPath.startsWith("docs/product-memory/AXOM-0002C1/")) {
    repositoryBoundary = "FAIL";
    errors.push(`Out-of-scope repository change: ${changedPath}`);
  }
}
for (const forbiddenPath of ["docs/governance", "web", "package.json", "package-lock.json"]) {
  const diff = execFileSync(
    "git",
    ["diff", "--name-only", "--", forbiddenPath],
    { cwd: repoRoot },
  )
    .toString()
    .trim();
  const staged = execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--", forbiddenPath],
    { cwd: repoRoot },
  )
    .toString()
    .trim();
  if (diff || staged) {
    repositoryBoundary = "FAIL";
    errors.push(`Forbidden path changed: ${forbiddenPath}`);
  }
}

const activeCasesDeclarations = [
  ...negativeTestText.matchAll(/^const cases = \[$/gm),
];
const negativeFixtureNames = [
  ...negativeTestText.matchAll(/^    name: "([^"]+)",$/gm),
].map((match) => match[1]);
if (activeCasesDeclarations.length !== 1) {
  errors.push(
    "Negative fixture harness does not preserve one active cases declaration",
  );
}
if (new Set(negativeFixtureNames).size !== negativeFixtureNames.length) {
  errors.push("Negative fixture inventory contains duplicate names");
}
const missingMandatoryNegativeFixtures = [
  ...mandatoryNegativeFixtureNames,
].filter((name) => !negativeFixtureNames.includes(name));
if (missingMandatoryNegativeFixtures.length > 0) {
  errors.push(
    `Negative fixture inventory is missing mandatory fixtures: ${missingMandatoryNegativeFixtures.join(", ")}`,
  );
}
const expectedNegativeFixtureCount = negativeFixtureNames.length;
let negativeFixtureValidation = {
  structuralResult: "PASS",
  untouchedBaseline: "PASS",
  negativeFixtures: expectedNegativeFixtureCount,
  rejectedAsExpected: expectedNegativeFixtureCount,
  livePackageUnchanged: true,
};
if (!fixtureRoot) {
  try {
    const negativeOutput = execFileSync(
      process.execPath,
      [negativeTestPath],
      {
        cwd: repoRoot,
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024,
      },
    );
    negativeFixtureValidation = JSON.parse(negativeOutput);
    if (
      negativeFixtureValidation.structuralResult !== "PASS" ||
      negativeFixtureValidation.untouchedBaseline !== "PASS" ||
      negativeFixtureValidation.negativeFixtures !==
        expectedNegativeFixtureCount ||
      negativeFixtureValidation.rejectedAsExpected !==
        expectedNegativeFixtureCount ||
      negativeFixtureValidation.livePackageUnchanged !== true
    ) {
      errors.push(
        "Adversarial negative validator fixtures did not return the required complete PASS",
      );
    }
  } catch (error) {
    const detail = String(
      error?.stdout ?? error?.stderr ?? error?.message ?? error,
    ).trim();
    errors.push(
      `Adversarial negative validator fixtures failed${detail ? `: ${detail}` : ""}`,
    );
  }
}

const readme = docs["README.md"] ?? "";
for (const [label, pattern, expectedValue] of [
  [
    "confirmed Product Owner decisions",
    /^- Confirmed Product Owner decisions: (\d+) of 35$/gm,
    ownerDecisionRecords.length,
  ],
  [
    "pending Product Owner decisions",
    /^- Pending Product Owner decisions: (\d+) of 35$/gm,
    pendingRows.length,
  ],
  [
    "permanent product IDs",
    /^- Permanent product IDs assigned: (\d+)$/gm,
    foundPermanentProductIds.size,
  ],
]) {
  const matches = [...readme.matchAll(pattern)];
  if (
    matches.length !== 1 ||
    Number(matches[0][1]) !== expectedValue
  ) {
    errors.push(
      `README ${label} state is not the singleton derived value ${expectedValue}`,
    );
  }
}
for (const [label, expectedValue] of [
  ["Canonical insertion authorized", "no"],
  ["Disposition-package commit authorized", "no"],
]) {
  const authorization = singletonLineValue(readme, label);
  if (
    authorization.count !== 1 ||
    authorization.value !== expectedValue
  ) {
    errors.push(
      `README ${label} must be the singleton value ${expectedValue}`,
    );
  }
}
const negativeTestInventoryLine =
  "10. `test-validator-negative.mjs` — isolated adversarial validator fixtures.";
if (
  readme.split("\n").filter((line) => line === negativeTestInventoryLine)
    .length !== 1
) {
  errors.push(
    `README file inventory must contain exactly one line: ${negativeTestInventoryLine}`,
  );
}
const expectedReadmePhase =
  sequentiallyCompletedBatches === 0
    ? "**Batch 1 awaiting Product Owner disposition.**"
    : sequentiallyCompletedBatches < 7
      ? sequentiallyCompletedBatches === 1
        ? "**Batch 1 confirmed; Batch 2 awaiting Product Owner disposition.**"
        : `**Batches 1 through ${sequentiallyCompletedBatches} confirmed; Batch ${sequentiallyCompletedBatches + 1} awaiting Product Owner disposition.**`
      : "**All seven batches confirmed; Phase 1 disposition complete.**";
const readmePhaseLines = [
  ...readme.matchAll(
    /^\*\*(?:Batch 1 awaiting Product Owner disposition\.|Batch 1 confirmed; Batch 2 awaiting Product Owner disposition\.|Batches 1 through \d+ confirmed; Batch \d+ awaiting Product Owner disposition\.|All seven batches confirmed; Phase 1 disposition complete\.)\*\*$/gm,
  ),
].map((match) => match[0]);
if (
  readmePhaseLines.length !== 1 ||
  readmePhaseLines[0] !== expectedReadmePhase
) {
  errors.push(`README phase line does not match: ${expectedReadmePhase}`);
}
const normalizedReadme = readme.replace(/\s+/g, " ");
const readmePendingStatements = [
  ...normalizedReadme.matchAll(
    /The remaining \d+ recommendations are analytical defaults only and remain `PENDING`\./g,
  ),
].map((match) => match[0]);
const expectedReadmePendingStatement =
  pendingRows.length > 0
    ? `The remaining ${pendingRows.length} recommendations are analytical defaults only and remain \`PENDING\`.`
    : "All 35 recommendations have explicit Product Owner dispositions.";
if (
  pendingRows.length > 0
    ? readmePendingStatements.length !== 1 ||
      readmePendingStatements[0] !== expectedReadmePendingStatement
    : readmePendingStatements.length !== 0 ||
      !normalizedReadme.includes(expectedReadmePendingStatement)
) {
  errors.push(
    `README pending-state sentence does not match: ${expectedReadmePendingStatement}`,
  );
}
const currentStateStart = readme.indexOf("## Current state");
const currentStateEnd = readme.indexOf("\n## ", currentStateStart + 1);
const currentStateSection =
  currentStateStart === -1
    ? ""
    : readme.slice(
        currentStateStart,
        currentStateEnd === -1 ? readme.length : currentStateEnd,
      );
const pendingNarrativeParagraphs = currentStateSection
  .split(/\n\s*\n/)
  .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
  .filter((paragraph) =>
    paragraph.includes("recommendations are analytical defaults"),
  );
const formattedConfirmedHandles = formatMarkdownHandleRanges(
  ownerDecisionHandles,
);
const expectedPendingNarrative =
  `The Product Owner has confirmed ${formattedConfirmedHandles}. ` +
  `The remaining ${pendingRows.length} recommendations are analytical defaults only and remain \`PENDING\`. ` +
  "Silence is never approval.";
if (
  pendingRows.length > 0 &&
  (pendingNarrativeParagraphs.length !== 1 ||
    pendingNarrativeParagraphs[0] !== expectedPendingNarrative ||
    hasPrematureApprovalClaim(currentStateSection))
) {
  errors.push(
    "README pending-state narrative contains an inconsistent approval claim",
  );
}

const validationReport = docs["VALIDATION-REPORT.md"] ?? "";
for (const [label, expectedValue] of [
  ["Disposition-package commit authorization", "not requested"],
  ["Push authorization", "not granted"],
]) {
  const authorization = singletonLineValue(validationReport, label);
  if (
    authorization.count !== 1 ||
    authorization.value !== expectedValue
  ) {
    errors.push(
      `VALIDATION-REPORT ${label} must be the singleton value ${expectedValue}`,
    );
  }
}
const currentPhaseStart = validationReport.indexOf("## Current phase");
const currentPhaseEnd = validationReport.indexOf(
  "\n## ",
  currentPhaseStart + 1,
);
const currentPhaseSection =
  currentPhaseStart === -1
    ? ""
    : validationReport.slice(
        currentPhaseStart,
        currentPhaseEnd === -1
          ? validationReport.length
          : currentPhaseEnd,
      );
const phaseNarrativeParagraphs = currentPhaseSection
  .split(/\n\s*\n/)
  .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
  .filter((paragraph) => paragraph.includes("proposals remain pending"));
const expectedPhaseNarrative =
  `${formattedConfirmedHandles} are confirmed by the Product Owner. ` +
  `The remaining ${pendingRows.length} proposals remain pending; ` +
  "silence has not been treated as approval.";
if (
  pendingRows.length > 0 &&
  sequentiallyCompletedBatches > 0 &&
  (phaseNarrativeParagraphs.length !== 1 ||
    phaseNarrativeParagraphs[0] !== expectedPhaseNarrative ||
    hasPrematureApprovalClaim(currentPhaseSection))
) {
  errors.push(
    "VALIDATION-REPORT current-phase narrative contains an inconsistent approval claim",
  );
}
for (const forbiddenDynamicLabel of [
  "Repository HEAD",
  "Commits since proposal baseline",
  "Committed changes since proposal baseline",
]) {
  const escapedLabel = forbiddenDynamicLabel.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  if (
    new RegExp(
      `^- ${escapedLabel}:`,
      "m",
    ).test(validationReport)
  ) {
    errors.push(
      `VALIDATION-REPORT contains self-referential dynamic field ${forbiddenDynamicLabel}`,
    );
  }
}
const expectedReportPhase =
  sequentiallyCompletedBatches === 0
    ? "**Batch 1 Pending**"
    : sequentiallyCompletedBatches < 7
      ? sequentiallyCompletedBatches === 1
        ? "**Batch 1 Confirmed — Batch 2 Pending**"
        : `**Batches 1–${sequentiallyCompletedBatches} Confirmed — Batch ${sequentiallyCompletedBatches + 1} Pending**`
      : "**All Seven Batches Confirmed**";
const reportPhaseLines = [
  ...validationReport.matchAll(
    /^\*\*(?:Batch 1 Pending|Batch 1 Confirmed — Batch 2 Pending|Batches 1–\d+ Confirmed — Batch \d+ Pending|All Seven Batches Confirmed)\*\*$/gm,
  ),
].map((match) => match[0]);
if (
  reportPhaseLines.length !== 1 ||
  reportPhaseLines[0] !== expectedReportPhase
) {
  errors.push(
    `VALIDATION-REPORT phase line does not match: ${expectedReportPhase}`,
  );
}
const reportExpectations = new Map([
  ["Structural result", "`PASS`"],
  ["Repository branch", `\`${currentBranch}\``],
  ["Proposal baseline recorded in package", `\`${proposalBaseline}\``],
  ["Commits since proposal baseline at package preparation", "0"],
  ["Committed changes since proposal baseline at package preparation", "0"],
  ["Proposals", String(matrixRows.length)],
  ["Analytical recommendations", String(matrixRows.length)],
  ["Product Owner decisions confirmed", String(ownerDecisionRecords.length)],
  ["Product Owner decisions pending", String(pendingRows.length)],
  ["Confirmed-batch exact-response and normalized-decision assertions", "`PASS`"],
  ["Recommended split parents", String(splitParents.length)],
  ["Unique conditional split handles", String(splitHandles.length)],
  ["Candidate sources accounted for", String(matrixCandidateIds.size)],
  ["Candidate source set exactly matches AXOM-0002C", "yes"],
  ["Confirmed-decision Candidate provenance matches the matrix", "yes"],
  ["Proposal-to-insertion rows reconciled", String(insertionRows.length)],
  [
    "Conditional insertion records",
    String(
      insertionRows.reduce((total, row) => total + row.count, 0),
    ),
  ],
  ["Canonical product IDs assigned", String(foundPermanentProductIds.size)],
  ["Markdown table structure", "`PASS`"],
  ["Whitespace validation", "`PASS`"],
  [
    "Negative validator fixtures",
    `\`PASS\` — ${expectedNegativeFixtureCount} of ${expectedNegativeFixtureCount} rejected as expected`,
  ],
  ["Untouched fixture baseline", "`PASS`"],
  ["Live-package hash preservation during negative tests", "`PASS`"],
  ["Archive integrity", `\`${archiveIntegrity}\``],
  ["Git diff checks", `\`${diffCheck}\``],
  ["Governance and application boundary", `\`${repositoryBoundary}\``],
  ["Structural errors", "0"],
  [
    "Expected warning",
    pendingRows.length > 0
      ? `${pendingRows.length} Product Owner decisions remain pending`
      : "none",
  ],
]);
for (const [label, expectedValue] of reportExpectations) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [
    ...validationReport.matchAll(
      new RegExp(`^- ${escapedLabel}: (.*)$`, "gm"),
    ),
  ];
  if (
    matches.length !== 1 ||
    matches[0][1] !== expectedValue
  ) {
    errors.push(
      `VALIDATION-REPORT ${label} is not the singleton expected value ${expectedValue}`,
    );
  }
}
const completionResultLines = [
  ...validationReport.matchAll(
    /^Current completion-only result: (.*)$/gm,
  ),
].map((match) => match[1]);
const expectedCompletionResult =
  pendingRows.length > 0
    ? "expected `FAIL` with two completion guards:"
    : "`PASS`.";
if (
  completionResultLines.length !== 1 ||
  completionResultLines[0] !== expectedCompletionResult
) {
  errors.push(
    `VALIDATION-REPORT completion result is not the singleton expected value ${expectedCompletionResult}`,
  );
}
const pendingGuardLines = [
  ...validationReport.matchAll(
    /^- (\d+) matrix decisions remain pending\.$/gm,
  ),
];
const ownerRecordGuardLines = [
  ...validationReport.matchAll(
    /^- (\d+) of 35 confirmed Product Owner records exist\.$/gm,
  ),
];
if (pendingRows.length > 0) {
  if (
    pendingGuardLines.length !== 1 ||
    Number(pendingGuardLines[0][1]) !== pendingRows.length ||
    ownerRecordGuardLines.length !== 1 ||
    Number(ownerRecordGuardLines[0][1]) !== ownerDecisionRecords.length
  ) {
    errors.push(
      "VALIDATION-REPORT completion guards do not match the derived pending state",
    );
  }
} else if (
  pendingGuardLines.length !== 0 ||
  ownerRecordGuardLines.length !== 0
) {
  errors.push(
    "VALIDATION-REPORT retains completion guards after all decisions are confirmed",
  );
}
const expectedReportVerdict =
  errors.length === 0 &&
  pendingRows.length === 0 &&
  ownerDecisionRecords.length === 35
    ? "READY FOR PHASE 1 CANONICAL INSERTION"
    : "NOT READY FOR PHASE 1 CANONICAL INSERTION";
const currentVerdictHeadings = [
  ...validationReport.matchAll(/^## Current verdict$/gm),
];
const verdictStatements = [
  ...validationReport.matchAll(
    /^\*\*((?:NOT )?READY FOR PHASE 1 CANONICAL INSERTION)\*\*$/gm,
  ),
];
if (
  currentVerdictHeadings.length !== 1 ||
  verdictStatements.length !== 1
) {
  errors.push(
    `VALIDATION-REPORT contains ${currentVerdictHeadings.length} current-verdict headings and ${verdictStatements.length} verdict statements, expected one of each`,
  );
}
const reportVerdict = verdictStatements[0]?.[1];
if (reportVerdict !== expectedReportVerdict) {
  errors.push(
    `VALIDATION-REPORT verdict is ${reportVerdict || "missing"}, expected ${expectedReportVerdict}`,
  );
}
const currentVerdictStart = validationReport.indexOf("## Current verdict");
const currentVerdictSection =
  currentVerdictStart === -1
    ? ""
    : validationReport.slice(currentVerdictStart);
const verdictReasonParagraphs = [];
const verdictLines = currentVerdictSection.split("\n");
for (let index = 0; index < verdictLines.length; index += 1) {
  if (!verdictLines[index].startsWith("Reason: ")) continue;
  const paragraph = [verdictLines[index]];
  for (
    let next = index + 1;
    next < verdictLines.length && verdictLines[next].trim() !== "";
    next += 1
  ) {
    paragraph.push(verdictLines[next]);
  }
  verdictReasonParagraphs.push(paragraph.join(" ").replace(/\s+/g, " ").trim());
}
const expectedVerdictReason =
  pendingRows.length > 0
    ? `Reason: ${pendingRows.length} Product Owner decisions remain pending. No permanent product IDs have been assigned, AX-0001 is unchanged, and the disposition package is not authorized for commit.`
    : "Reason: all 35 Product Owner decisions are confirmed.";
if (
  verdictReasonParagraphs.length !== 1 ||
  verdictReasonParagraphs[0] !== expectedVerdictReason
) {
  errors.push(
    `VALIDATION-REPORT verdict reason does not match: ${expectedVerdictReason}`,
  );
}

const structuralResult = errors.length === 0 ? "PASS" : "FAIL";
const insertionVerdict =
  errors.length === 0 &&
  pendingRows.length === 0 &&
  ownerDecisionRecords.length === 35
    ? "READY FOR PHASE 1 CANONICAL INSERTION"
    : "NOT READY FOR PHASE 1 CANONICAL INSERTION";
console.log(
  JSON.stringify(
    {
      structuralResult,
      phase: requireComplete ? "complete-required" : "pending-allowed",
      proposals: matrixRows.length,
      recommendations: Object.fromEntries(recommendationCounts),
      ownerDecisionsConfirmed: matrixRows.length - pendingRows.length,
      ownerDecisionsPending: pendingRows.length,
      splitParents: splitParents.length,
      temporarySplitHandles: splitHandles.length,
      candidateSourcesAccounted: matrixCandidateIds.size,
      canonicalProductIdsAssigned: foundPermanentProductIds.size,
      archiveIntegrity,
      diffCheck,
      repositoryBoundary,
      branch: currentBranch,
      head: currentHead,
      commitsSinceProposal: commitsSinceBaseline,
      committedChangesSinceProposal: committedSinceBaseline.length,
      insertionRowsReconciled: insertionRows.length,
      conditionalInsertionRecords: insertionRows.reduce(
        (total, row) => total + row.count,
        0,
      ),
      negativeFixtures: negativeFixtureValidation.negativeFixtures,
      negativeFixturesRejected:
        negativeFixtureValidation.rejectedAsExpected,
      livePackageUnchangedByNegativeFixtures:
        negativeFixtureValidation.livePackageUnchanged,
      insertionVerdict,
      warnings,
      errors,
    },
    null,
    2,
  ),
);
process.exitCode = errors.length === 0 ? 0 : 1;
