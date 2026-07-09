// ===========================================================================
// Restrained USMLE / Step 1 taxonomy + keyless heuristic auto-categorizer
// (rehaul phase 5). The point is USEFUL sorting, not category spam: a small
// stable set of broad buckets, keyword-scored with a confidence gate.
//   high   → auto-assign
//   medium → suggest (UI applies on user confirm)
//   low    → leave uncategorized, suggest review
// No model required; an AI provider can refine tags later through the same
// shape. Never invents a new category from a stray phrase.
// ===========================================================================

/** Broad, stable USMLE-style categories. Prefer these over ad-hoc labels. */
export const USMLE_CATEGORIES = [
  "Biochemistry", "Immunology", "Microbiology", "Pathology", "Pharmacology",
  "Physiology", "Anatomy", "Behavioral Science", "Biostatistics / Epidemiology",
  "Ethics", "Genetics", "Embryology", "Neuroscience", "Cardiovascular",
  "Respiratory", "Renal", "Gastrointestinal", "Endocrine", "Reproductive",
  "Hematology / Oncology", "Musculoskeletal / Dermatology", "Psychiatry",
  "Public Health", "Custom",
] as const;

export type UsmleCategory = (typeof USMLE_CATEGORIES)[number];

export type CategoryConfidence = "high" | "medium" | "low";

export interface CategorySuggestion {
  category?: UsmleCategory;
  confidence: CategoryConfidence;
  /** Auto-assign only when true (high confidence). */
  autoAssign: boolean;
  /** Runner-up buckets that also scored, for the review UI. */
  alternatives: UsmleCategory[];
  /** A few restrained topic tags pulled from matched keywords. */
  tags: string[];
}

/** Keyword signals per category. Kept deliberately small and specific. */
const SIGNALS: Partial<Record<UsmleCategory, string[]>> = {
  Immunology: ["complement", "antibod", "immunoglobulin", "t-cell", "t cell", "b-cell", "b cell", "mhc", "cytokine", "hypersensitivity", "scid", "immunodeficien", "vaccine", "autoimmun", "hla", "interleukin"],
  Microbiology: ["bacteri", "virus", "viral", "fungal", "fungus", "parasite", "gram-positive", "gram positive", "gram-negative", "gram negative", "antibiotic resistance", "staphylo", "strepto", "neisseria", "mycobacter", "plasmodium", "e. coli"],
  Pharmacology: ["drug", "dose", "receptor agonist", "antagonist", "half-life", "pharmacokinetic", "inhibitor", "side effect", "adverse effect", "mechanism of action", "contraindicat", "beta-blocker", "nsaid", "ssri"],
  Pathology: ["neoplas", "carcinoma", "tumor", "tumour", "biopsy", "histolog", "necrosis", "dysplasia", "metaplasia", "granuloma", "infarct", "malignan", "benign"],
  Biochemistry: ["enzyme", "glycolysis", "krebs", "tca cycle", "metabol", "amino acid", "nucleotide", "gluconeogenesis", "cofactor", "vitamin deficiency", "urea cycle", "fatty acid oxidation"],
  Physiology: ["homeostasis", "action potential", "membrane potential", "gradient", "reflex", "baroreceptor", "starling", "filtration", "secretion", "osmolality"],
  Anatomy: ["nerve", "muscle", "artery supplies", "innervat", "vertebra", "cranial nerve", "foramen", "ligament", "dermatome", "brachial plexus"],
  "Behavioral Science": ["defense mechanism", "grief", "coping", "developmental milestone", "attachment", "cognitive bias", "psychosocial"],
  "Biostatistics / Epidemiology": ["sensitivity", "specificity", "odds ratio", "relative risk", "incidence", "prevalence", "confidence interval", "p-value", "p value", "confounding", "cohort", "case-control", "number needed to treat", "positive predictive"],
  Ethics: ["informed consent", "autonomy", "confidential", "capacity", "beneficence", "malpractice", "advance directive", "surrogate", "do-not-resuscitate"],
  Genetics: ["autosomal dominant", "autosomal recessive", "x-linked", "trinucleotide", "mutation", "pedigree", "imprinting", "aneuploidy", "trisomy", "penetrance"],
  Embryology: ["embryo", "pharyngeal arch", "neural crest", "gestation week", "teratogen", "notochord", "branchial", "yolk sac"],
  Neuroscience: ["neuron", "synap", "neurotransmitter", "myelin", "basal ganglia", "cerebell", "spinal cord", "stroke", "seizure", "dopamin", "gaba"],
  Cardiovascular: ["cardiac", "myocard", "heart failure", "arrhythmia", "coronary", "valve", "ejection fraction", "hypertension", "atrial", "ventricular", "murmur"],
  Respiratory: ["lung", "pulmonary", "bronch", "alveol", "pneumonia", "asthma", "copd", "hypoxia", "ventilation", "pleural"],
  Renal: ["kidney", "renal", "nephron", "glomerul", "creatinine", "tubular", "acid-base", "dialysis", "urin"],
  Gastrointestinal: ["stomach", "intestin", "hepat", "liver", "pancrea", "bowel", "colon", "gastric", "bile", "cirrhosis", "jaundice"],
  Endocrine: ["thyroid", "insulin", "cortisol", "adrenal", "pituitary", "hormone", "diabetes", "glucose regulation", "parathyroid"],
  Reproductive: ["ovar", "uter", "testis", "testicular", "menstru", "pregnan", "placenta", "estrogen", "progesterone", "sperm"],
  "Hematology / Oncology": ["anemia", "leukemia", "lymphoma", "platelet", "coagulat", "hemoglobin", "thrombo", "bleeding", "bone marrow", "sickle cell"],
  "Musculoskeletal / Dermatology": ["bone", "joint", "arthritis", "skin lesion", "rash", "fracture", "tendon", "dermat", "osteo", "psoriasis"],
  Psychiatry: ["depression", "schizophren", "anxiety", "bipolar", "psychosis", "mania", "delusion", "hallucination", "personality disorder", "substance use"],
  "Public Health": ["screening program", "outbreak", "surveillance", "herd immunity", "health policy", "vaccination rate", "notifiable disease"],
};

/** Compact tag words worth surfacing when matched (restrained set). */
const TAG_HINTS: Record<string, string> = {
  neisseria: "Neisseria", scid: "SCID", complement: "complement",
  "sickle cell": "sickle cell", trisomy: "trisomy", "x-linked": "X-linked",
  "beta-blocker": "beta-blocker", ssri: "SSRI", "case-control": "case-control",
  "informed consent": "informed consent", stroke: "stroke", asthma: "asthma",
};

/**
 * Suggest a category from question text. `existingText` should be the stem
 * plus options (and explanation if available) lower-cased by the caller or
 * here. Scores buckets by distinct keyword hits; a clear leader = high.
 */
export function suggestCategory(text: string): CategorySuggestion {
  const hay = text.toLowerCase();
  const scores: Array<{ category: UsmleCategory; score: number; hits: string[] }> = [];
  for (const [category, signals] of Object.entries(SIGNALS) as Array<[UsmleCategory, string[]]>) {
    const hits = signals.filter((sig) => hay.includes(sig));
    if (hits.length) scores.push({ category, score: hits.length, hits });
  }
  scores.sort((a, b) => b.score - a.score);

  const tags = collectTags(hay);
  if (scores.length === 0) {
    return { confidence: "low", autoAssign: false, alternatives: [], tags };
  }
  const top = scores[0];
  const runnerUp = scores[1]?.score ?? 0;
  // High: a clear leader (≥2 hits and at least one more than the runner-up),
  // or a strong single-bucket match (≥3 hits).
  const clearLeader = (top.score >= 2 && top.score > runnerUp) || top.score >= 3;
  const confidence: CategoryConfidence = clearLeader ? "high" : top.score >= 1 ? "medium" : "low";
  return {
    category: top.category,
    confidence,
    autoAssign: confidence === "high",
    alternatives: scores.slice(1, 3).map((s) => s.category),
    tags,
  };
}

function collectTags(hay: string): string[] {
  const tags = new Set<string>();
  for (const [needle, label] of Object.entries(TAG_HINTS)) {
    if (hay.includes(needle)) tags.add(label);
  }
  return [...tags].slice(0, 4);
}

/** Merge/normalize a free-typed tag list: trim, dedupe case-insensitively. */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Map<string, string>();
  for (const raw of tags) {
    const clean = raw.trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!seen.has(key)) seen.set(key, clean);
  }
  return [...seen.values()];
}
