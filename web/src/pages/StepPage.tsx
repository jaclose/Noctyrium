import { useEffect, useMemo, useState } from "react";
import {
  BookOpen, Brain, CalendarDays, CheckCircle2, ChevronDown,
  Database, ExternalLink, FlaskConical, Layers, ListChecks, Plus,
  ShieldCheck, Sparkles, Target,
} from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, PanelHeader, Tag } from "../components/ui/primitives";
import { Field, SelectField, TextAreaField } from "../components/ui/Modal";
import { dayKey } from "../lib/scoring";
import { normalizeResourceUrl } from "../lib/resourceUtils";
import type { BoardBlueprintLog, BoardExamId, BoardPrepProfile, PremedExperienceKind } from "../lib/types";

type YieldLevel = "high" | "medium" | "low";
type PrepLeaf = { id: string; title: string; why: string; action: string };
type PrepFolder = { title: string; leaves: PrepLeaf[] };
type PrepArea = {
  id: string;
  title: string;
  yield: YieldLevel;
  weight: number;
  summary: string;
  folders: PrepFolder[];
  tips?: string[];
};
type PrepResource = { id: string; title: string; kind: string; url: string; why: string; tags: string[] };
type ExamConfig = {
  label: string;
  shortLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  structure: string;
  passMeaning: string;
  doneMeaning: string;
  installCopy: string;
  areas: PrepArea[];
  resources: PrepResource[];
  rhythm: { title: string; body: string; chips: string[] }[];
};

const yieldTone: Record<YieldLevel, "green" | "orange" | "neutral"> = {
  high: "green",
  medium: "orange",
  low: "neutral",
};

const PREMED_KINDS: PremedExperienceKind[] = ["Clinical", "Service", "Research", "Shadowing", "Leadership"];

export const EXAMS: Record<BoardExamId, ExamConfig> = {
  step1: {
    label: "USMLE Step 1 Blueprint",
    shortLabel: "Step 1",
    sourceLabel: "USMLE Content Outline 2026 + local Blueprint God file",
    sourceUrl: "https://www.usmle.org/exam-resources/step-1-materials/step-1-content-outline-and-specifications",
    structure: "Basic-science blueprint folders by system, discipline, and competency. Install the map, then complete final items as evidence accumulates.",
    passMeaning: "A pass is a board-work cycle: questions or review, explanation repair, and a logged weak-area decision.",
    doneMeaning: "Done means the final item has evidence: stable questions, repaired misses, or a retested weak point. It is not a lecture pass.",
    installCopy: "Install Step 1 blueprint",
    areas: [
      area("step1-foundations", "Foundations and scientific principles", "high", 1.18, "Cross-system mechanisms that explain the rest of the exam.", [
        folder("Biochemistry and molecular biology", ["Amino acids and protein structure", "Enzymes and kinetics", "Metabolism checkpoints", "Vitamins and nutrition links", "Genetics and gene expression", "Lab techniques and molecular tools"]),
        folder("Cell biology and physiology methods", ["Cell structure and trafficking", "Membranes and transport", "Signal transduction", "Homeostasis feedback loops", "Experimental design"]),
        folder("Pathology and pharmacology principles", ["Inflammation and wound healing", "Neoplasia principles", "Drug receptors and kinetics", "Autonomic pharmacology", "Toxicities and adverse effects"]),
      ], ["Start broad, then let missed questions choose the next subfolder.", "Rewrite every missed mechanism as a cause-effect chain, not as a fact list."]),
      area("step1-micro-immune-heme", "Microbiology, immune, blood", "high", 1.16, "Host defense, pathogens, hematology, coagulation, and malignancy patterns.", [
        folder("Immune system", ["Innate/adaptive overview", "Immunodeficiencies", "Hypersensitivity reactions", "Autoimmunity", "Transplant and rejection", "Vaccines and immune drugs"]),
        folder("Microbiology", ["Bacteria classification", "Viruses and replication", "Fungi and parasites", "Antimicrobials", "Opportunistic infections", "Micro lab identification"]),
        folder("Blood and lymphoreticular", ["Anemia algorithms", "Bleeding and thrombosis", "Leukemia and lymphoma", "Plasma cell disorders", "Transfusion reactions", "Hemostasis drugs"]),
      ]),
      area("step1-cardio", "Cardiovascular system", "high", 1.12, "Hemodynamics, pathophysiology, embryology, pharmacology, and clinical scripts.", [
        folder("Physiology and graphs", ["Pressure-volume loops", "Cardiac output determinants", "Murmurs and maneuvers", "Vascular resistance", "Shock states"]),
        folder("Pathology and pharmacology", ["Ischemic heart disease", "Heart failure", "Valvular disease", "Arrhythmias", "Hypertension drugs", "Congenital heart disease"]),
      ], ["For graph questions, draw the relationship before reading choices."]),
      area("step1-pulm-renal-acidbase", "Respiratory, renal, acid-base", "high", 1.12, "Gas exchange, nephron logic, fluids, compensation, and high-frequency equations.", [
        folder("Respiratory", ["Ventilation/perfusion", "Obstructive vs restrictive disease", "Pulmonary vascular disease", "Oxygen content and delivery", "Respiratory pharmacology"]),
        folder("Renal and urinary", ["Nephron transport", "Glomerular disease", "Tubular disorders", "Diuretics", "Renal stones and tumors"]),
        folder("Acid-base and electrolytes", ["Metabolic acidosis", "Metabolic alkalosis", "Respiratory compensation", "Potassium disorders", "Sodium and water disorders"]),
      ]),
      area("step1-gi-endocrine-nutrition", "GI, endocrine, nutrition", "high", 1.04, "Metabolism, hormones, digestion, liver, pancreas, and nutrition links.", [
        folder("Gastrointestinal and hepatobiliary", ["Esophagus and stomach", "Small/large bowel disease", "Hepatitis and cirrhosis", "Gallbladder disease", "Pancreatitis and pancreatic cancer"]),
        folder("Endocrine", ["Pituitary and hypothalamus", "Thyroid/parathyroid", "Adrenal", "Diabetes and insulin", "Endocrine tumors"]),
        folder("Nutrition and metabolism", ["Vitamin deficiencies", "Inborn errors", "Lipid metabolism", "Obesity and malnutrition", "Feeding and absorption"]),
      ]),
      area("step1-neuro-behavior", "Neuro, behavior, special senses", "high", 1.08, "Localization, neurophysiology, psychiatry, behavior, sleep, and sensory systems.", [
        folder("Neuroanatomy and localization", ["Spinal cord tracts", "Brainstem lesions", "Cranial nerves", "Basal ganglia/cerebellum", "Vascular territories", "Seizures and headaches"]),
        folder("Behavioral health", ["Mood disorders", "Psychosis", "Anxiety/trauma", "Substance use", "Personality disorders", "Sleep and cognition"]),
        folder("Special senses", ["Vision pathways", "Eye pathology", "Auditory/vestibular", "Taste/smell", "Neuro pharmacology"]),
      ]),
      area("step1-repro-development", "Human development and reproductive systems", "medium", 0.96, "Development, pregnancy, sex-specific systems, breast, and reproductive pharmacology.", [
        folder("Human development", ["Embryology landmarks", "Childhood development", "Adolescent care", "Aging and geriatric physiology", "Preventive care by age"]),
        folder("Pregnancy and childbirth", ["Placenta and fetal circulation", "Maternal physiology", "Pregnancy complications", "Labor/postpartum", "Teratogens"]),
        folder("Reproductive and breast", ["Female reproductive pathology", "Male reproductive pathology", "Breast disease", "Sex hormones", "Gender-affirming care basics"]),
      ]),
      area("step1-msk-skin-connective", "MSK, skin, connective tissue", "medium", 0.86, "Dermatology, rheumatology, bone, muscle, and connective tissue disorders.", [
        folder("Musculoskeletal", ["Bone remodeling", "Arthritis patterns", "Myopathies", "Trauma and healing", "MSK pharmacology"]),
        folder("Skin and subcutaneous tissue", ["Primary lesions", "Inflammatory dermatoses", "Infections", "Skin cancers", "Blistering disorders"]),
        folder("Connective tissue and rheum", ["SLE and vasculitis", "Scleroderma/myositis", "Seronegative disease", "Crystal arthropathies", "Immunomodulator toxicities"]),
      ]),
      area("step1-multisystem-biostats-social", "Multisystem, biostats, ethics, social sciences", "high", 1.0, "Evidence interpretation, safety, communication, population health, and multisystem disease.", [
        folder("Biostats and epidemiology", ["Study design", "Bias and confounding", "Screening math", "Diagnostic test interpretation", "Survival and risk measures", "Medical literature reading"]),
        folder("Ethics and communication", ["Capacity and consent", "Confidentiality", "Professional boundaries", "End-of-life decisions", "Error disclosure", "Difficult conversations"]),
        folder("Multisystem and population health", ["Shock and sepsis", "Trauma/burns", "Nutrition and prescription drug use", "Military/veteran health", "Disability care", "Health disparities"]),
      ], ["Biostats grows fastest when every missed method is rewritten in your own words."]),
      area("step1-readiness", "Assessments and error repair", "medium", 0.94, "NBME-style checkpoints, sample items, recall artifacts, and retesting loops.", [
        folder("Assessment loop", ["Official sample questions", "NBME/CBSSA review", "Timed mixed block", "Two-pass error log", "Retest repeat misses"]),
        folder("Recall artifacts", ["Anki for repeat misses", "One-page weak-area repair", "Formula/scheme sheet", "48-hour retest queue", "Final week compression"]),
      ]),
    ],
    resources: [
      res("usmle-step1-outline", "USMLE Step 1 Content Outline", "Official", "https://www.usmle.org/exam-resources/step-1-materials/step-1-content-outline-and-specifications", "Official Step 1 content and specifications.", ["official", "blueprint"]),
      res("usmle-step1-samples", "USMLE Step 1 Sample Questions", "Official", "https://www.usmle.org/exam-resources/step-1-materials/step-1-sample-test-questions", "Official item format and testing experience.", ["official", "practice"]),
      res("nbme-cbssa", "NBME CBSSA", "Assessment", "https://www.nbme.org/examinees/self-assessments/comprehensive-basic-science-self-assessment", "Comprehensive Basic Science readiness check.", ["nbme", "assessment"]),
      res("anking-step", "AnKing Step Deck", "Anki", "https://www.ankihub.net/step-deck", "Spaced retrieval for missed facts.", ["anki", "retrieval"]),
    ],
    rhythm: [
      rhythm("Daily board loop", "Questions first, explanation review second, recall artifact third.", ["40-80 questions", "missed-fact repair", "48h retest"]),
      rhythm("Weekly checkpoint", "One mixed block or NBME-style review day to expose cross-system drift.", ["mixed systems", "biostats touch", "weak-area queue"]),
    ],
  },
  step2: {
    label: "USMLE Step 2 CK Blueprint",
    shortLabel: "Step 2",
    sourceLabel: "USMLE Step 2 CK outline + clinical task framework",
    sourceUrl: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-content-outline-specifications",
    structure: "Clinical reasoning folders for diagnosis, management, screening, and patient safety.",
    passMeaning: "A pass is a clinical-reasoning cycle: questions, management algorithm review, and a logged decision error.",
    doneMeaning: "Done means diagnosis/next-step errors have been retested and shelf/Step 2 evidence is improving.",
    installCopy: "Install Step 2 blueprint",
    areas: [
      area("step2-medicine", "Internal medicine decision system", "high", 1.22, "Adult diagnosis, management, risk stratification, and inpatient/ambulatory pivots.", [
        folder("Core adult systems", ["Cardiology", "Pulmonary", "Renal/electrolytes", "GI/hepatology", "Endocrine", "Heme/onc"]),
        folder("Complex adult medicine", ["Infectious disease", "Rheumatology", "Dermatology", "Neurology", "Geriatrics", "Multisystem disease"]),
        folder("Management algorithms", ["Initial stabilization", "Diagnostic next step", "Treatment next step", "Monitoring/follow-up", "Medication safety", "Disposition"]),
      ], ["Step 2 usually rewards the safest next action, not the most exotic diagnosis."]),
      area("step2-surgery-emergency", "Surgery, trauma, emergency care", "high", 1.08, "Acute abdomen, trauma, perioperative reasoning, and ED triage.", [
        folder("Surgery shelf core", ["Acute abdomen", "Trauma and burns", "GI surgery", "Vascular surgery", "Breast/endocrine surgery", "Post-op complications"]),
        folder("Emergency medicine", ["ABCs and resuscitation", "Chest pain/dyspnea", "Shock/sepsis", "Toxicology", "Procedures and imaging", "Disposition"]),
      ]),
      area("step2-peds-obgyn", "Pediatrics and OB/GYN", "high", 1.04, "Growth, development, pregnancy, postpartum, gynecology, and prevention.", [
        folder("Pediatrics", ["Newborn care", "Milestones and development", "Pediatric infections", "Congenital disease", "Pediatric emergencies", "Vaccines and screening"]),
        folder("Obstetrics", ["Prenatal care", "Pregnancy complications", "Labor management", "Postpartum care", "Fetal testing", "Hypertensive disorders"]),
        folder("Gynecology", ["Abnormal uterine bleeding", "Pelvic pain", "Contraception", "Infertility", "Gynecologic oncology", "Breast health"]),
      ]),
      area("step2-psych-family-ambulatory", "Psychiatry, family medicine, ambulatory care", "high", 1.0, "Longitudinal care, prevention, psychiatric safety, and outpatient management.", [
        folder("Psychiatry", ["Mood disorders", "Psychosis", "Anxiety/trauma", "Substance use", "Suicide/risk safety", "Psychopharmacology"]),
        folder("Family and ambulatory", ["Preventive screening", "Chronic disease follow-up", "Vaccines", "Sports/occupational medicine", "Adolescent care", "Older adult care"]),
      ]),
      area("step2-quality", "Ethics, safety, biostats, systems", "medium", 0.92, "The Step 2 questions that punish vague reasoning and unsafe handoffs.", [
        folder("Evidence and abstracts", ["Study design", "Biostats interpretation", "Drug ads", "Screening tests", "Risk communication"]),
        folder("Systems and communication", ["Quality improvement", "Patient safety", "Consent/capacity/confidentiality", "Health equity", "Interprofessional handoff", "Medical error disclosure"]),
      ]),
      area("step2-dedicated-engine", "Dedicated Step 2 engine", "medium", 0.92, "NBME/CCSSA calibration, mixed blocks, score trend, and final compression.", [
        folder("Assessment cadence", ["Baseline NBME/CCSSA", "CMS form by weak shelf", "Timed mixed UWorld block", "Official sample questions", "Final interactive test"]),
        folder("Error-log analytics", ["Diagnosis miss", "Management miss", "Screening/prevention miss", "Risk stratification miss", "Reading/timing miss", "Retest queue"]),
      ]),
    ],
    resources: [
      res("usmle-step2-outline", "USMLE Step 2 CK Content Outline", "Official", "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-content-outline-specifications", "Official Step 2 CK specifications.", ["official", "blueprint"]),
      res("usmle-step2-samples", "USMLE Step 2 CK Sample Questions", "Official", "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-sample-test-questions", "Official sample item style.", ["official", "practice"]),
      res("nbme-clinical-self", "NBME Clinical Science Self-Assessments", "Assessment", "https://www.nbme.org/examinees/self-assessments/clinical-science-subject-exams", "Shelf and clinical readiness checks.", ["nbme", "assessment"]),
    ],
    rhythm: [
      rhythm("Rotation weekday", "Questions plus one algorithm repair tied to the patients you saw.", ["20-60 questions", "one algorithm", "patient tie-in"]),
      rhythm("Shelf carry-forward", "Shelf misses become Step 2 tags instead of disappearing after the rotation.", ["missed themes", "management errors", "retest"]),
    ],
  },
  step3: {
    label: "USMLE Step 3 Blueprint",
    shortLabel: "Step 3",
    sourceLabel: "USMLE Step 3 outline",
    sourceUrl: "https://www.usmle.org/exam-resources/step-3-materials/step-3-content-outline-and-specifications",
    structure: "Management, prognosis, ambulatory care, inpatient care, and CCS-style decision timing.",
    passMeaning: "A pass is a management/CCS cycle: orders, monitoring, reassessment, and safety check.",
    doneMeaning: "Done means safe management patterns are consistent and CCS timing errors are repaired.",
    installCopy: "Install Step 3 blueprint",
    areas: [
      area("step3-foundations", "Step 3 orientation and exam mechanics", "medium", 0.86, "FIP, ACM, CCS mechanics, timing, and readiness baselines.", [
        folder("Exam architecture", ["Day 1 FIP map", "Day 2 ACM map", "CCS case flow", "Question timing", "Break strategy", "Permit/test-day checklist"]),
        folder("Baseline setup", ["Content baseline", "CCS baseline", "Biostats baseline", "Risk domain selection", "Study calendar"]),
      ]),
      area("step3-ambulatory", "Ambulatory and chronic care", "high", 1.08, "Outpatient diagnosis, follow-up, prevention, and chronic disease control.", [
        folder("Longitudinal care", ["Hypertension/diabetes", "Asthma/COPD", "Heart failure", "CKD", "Preventive visits", "Medication monitoring"]),
        folder("Primary care decisions", ["Screening intervals", "Vaccines", "Follow-up timing", "Counseling", "Adherence barriers", "Referral thresholds"]),
      ]),
      area("step3-emergency-inpatient", "Emergency and inpatient management", "high", 1.18, "Triage, orders, reassessment, complications, and disposition.", [
        folder("Acute management", ["Initial orders", "Diagnostic sequencing", "Shock/sepsis", "Chest pain/dyspnea", "Altered mental status", "Disposition"]),
        folder("Inpatient safety", ["Monitoring", "Medication reconciliation", "Complication prevention", "Consult timing", "Handoff", "Discharge planning"]),
      ]),
      area("step3-ccs", "CCS case execution", "high", 1.24, "Order timing, interval management, consults, prevention, and case closure.", [
        folder("CCS orders", ["Initial stabilization orders", "Diagnostic orders", "Therapeutic orders", "Monitoring orders", "Preventive orders", "Patient counseling"]),
        folder("CCS timing", ["Clock advance", "Reassessment triggers", "Escalation", "Consults and procedures", "Case end conditions", "Post-case error log"]),
      ], ["Step 3 is management and prioritization. CCS punishes knowing the diagnosis but not acting safely."]),
      area("step3-special-populations", "Special populations and longitudinal judgment", "medium", 0.94, "Peds, pregnancy, geriatrics, psychiatry, disability care, and population health.", [
        folder("Population-specific care", ["Pediatrics", "Pregnancy/postpartum", "Geriatrics/polypharmacy", "Veteran health", "Disability care", "Gender-affirming care basics"]),
        folder("Psych and behavior", ["Substance use", "Mood/anxiety", "Suicide/risk", "Capacity", "Adherence and counseling"]),
      ]),
      area("step3-systems", "Biostats, ethics, systems", "medium", 0.9, "Abstracts, drug ads, systems-based practice, safety, and professionalism.", [
        folder("Evidence and systems", ["Drug ads/abstracts", "Quality and safety", "Ethics/legal", "Population health", "Public health reporting", "Practice-based learning"]),
      ]),
      area("step3-assessment", "Assessment and final readiness", "medium", 0.88, "NBME/UWorld-style checkpoints, CCS retests, and final week compression.", [
        folder("Readiness loop", ["NBME/CCMSA checkpoint", "UWorld block trend", "CCS case trend", "Biostats retest", "Final weak-domain list", "Test-week safety plan"]),
      ]),
    ],
    resources: [
      res("usmle-step3-outline", "USMLE Step 3 Content Outline", "Official", "https://www.usmle.org/exam-resources/step-3-materials/step-3-content-outline-and-specifications", "Official Step 3 specifications.", ["official", "blueprint"]),
      res("usmle-step3-samples", "USMLE Step 3 Sample Questions", "Official", "https://www.usmle.org/exam-resources/step-3-materials/step-3-sample-test-questions", "Official practice materials.", ["official", "practice"]),
    ],
    rhythm: [rhythm("Management day", "Mix MCQs with CCS so content and timing improve together.", ["MCQs", "CCS case", "safety review"])],
  },
  shelf: {
    label: "Shelf Exams Blueprint",
    shortLabel: "Shelf",
    sourceLabel: "NBME Clinical Science Subject Exams",
    sourceUrl: "https://www.nbme.org/educators/assess-learn/subject-exams/clinical-science",
    structure: "Rotation-specific shelf folders with patient encounter evidence and NBME-style review.",
    passMeaning: "A pass is one rotation cycle: patient/task exposure, questions, explanation review, and algorithm repair.",
    doneMeaning: "Done means the shelf domain was retested and the clinical behavior or algorithm is clearer.",
    installCopy: "Install shelf blueprint",
    areas: [
      area("shelf-medicine", "Medicine shelf", "high", 1.18, "Diagnosis and management across adult inpatient and outpatient systems.", [
        folder("Medicine systems", ["Cardio/pulm/renal", "GI/endocrine", "Heme/onc", "Infectious disease", "Rheum/derm", "Neurology"]),
        folder("Medicine shelf execution", ["Daily question block", "CMS/NBME checkpoint", "Algorithm repair", "Admission/discharge reasoning", "Weak-system retest"]),
      ]),
      area("shelf-surgery", "Surgery shelf", "high", 1.08, "Acute abdomen, trauma, perioperative care, and complications.", [
        folder("Surgical domains", ["Trauma/burns", "GI surgery", "Vascular", "Breast/endocrine", "Urology", "Ortho/anesthesia basics"]),
        folder("Surgery decisions", ["Pre-op risk", "Post-op fever", "Fluid/electrolytes", "Imaging choice", "Operate vs observe", "Complication prevention"]),
      ]),
      area("shelf-peds-obgyn", "Pediatrics and OB/GYN shelves", "high", 1.02, "Pediatric development and obstetric/gynecologic management.", [
        folder("Pediatrics shelf", ["Newborn", "Milestones", "Pediatric infections", "Congenital disease", "Vaccines/screening", "Emergencies"]),
        folder("OB/GYN shelf", ["Prenatal care", "Pregnancy complications", "Labor/postpartum", "AUB/pelvic pain", "Contraception", "Gynecologic oncology"]),
      ]),
      area("shelf-psych-family-neuro", "Psych, family, neuro, ambulatory shelves", "medium", 0.98, "Rotation-specific reasoning that also compounds into Step 2.", [
        folder("Psychiatry shelf", ["Mood/anxiety", "Psychosis", "Substance use", "Child/adolescent psych", "Risk assessment", "Psych meds"]),
        folder("Family/ambulatory/neuro", ["Screening/prevention", "Chronic care", "MSK/derm", "Headache/seizure/stroke", "Neuro localization", "Follow-up planning"]),
      ]),
      area("shelf-patient-evidence", "Patient encounter evidence", "medium", 0.9, "Turn real clinical exposure into exam and feedback signal.", [
        folder("Encounter loop", ["Diagnosis seen", "Management decision", "Feedback received", "One behavior to test next shift", "Observed skill", "Patient-care reflection"]),
        folder("Rotation operations", ["Daily patients logged", "Presentation feedback", "Procedure/skill log", "Clerkship objectives", "Shelf date countdown", "End-of-rotation debrief"]),
      ]),
      area("shelf-assessment-center", "Shelf assessment center", "medium", 0.88, "CMS forms, NBME-style sample items, weak-area analytics, and carry-forward logic.", [
        folder("Assessment cadence", ["Baseline topic scan", "CMS form schedule", "Incorrect review", "Timed block trend", "Final week plan", "Carry-forward to Step 2"]),
      ]),
    ],
    resources: [
      res("nbme-clinical", "NBME Clinical Science Subject Exams", "Official", "https://www.nbme.org/educators/assess-learn/subject-exams/clinical-science", "Content outlines and sample items by shelf.", ["official", "nbme"]),
      res("nbme-subject-exams", "NBME Subject Exams", "Official", "https://www.nbme.org/examinees/subject-exams", "Subject exam information for examinees.", ["official", "nbme"]),
    ],
    rhythm: [rhythm("Rotation week", "Tie qbank misses to one patient, one algorithm, and one feedback experiment.", ["patients", "questions", "feedback"])],
  },
  mcat: {
    label: "MCAT Blueprint",
    shortLabel: "MCAT",
    sourceLabel: "AAMC MCAT outline + local MCAT topic file + Blueprint God file",
    sourceUrl: "https://students-residents.aamc.org/prepare-mcat-exam/whats-mcat-exam-pdf-outline",
    structure: "AAMC-style section folders with daily CARS, content/passages, full-length review, equations, and pathways.",
    passMeaning: "A pass is a section cycle: content, passages, error log, and next-day review. CARS is a daily habit, not an occasional topic.",
    doneMeaning: "Done means the final item has practice evidence, and full-length review confirms the weakness is not recurring.",
    installCopy: "Install MCAT blueprint",
    areas: [
      area("mcat-bb", "Biological and Biochemical Foundations", "high", 1.12, "Biology, biochemistry, pathways, proteins, genetics, physiology, and experimental design.", [
        folder("Proteins and enzymes", ["Amino acids", "Protein structure", "Enzyme kinetics", "Enzyme regulation", "Lab separation methods", "Protein function passages"]),
        folder("Metabolism and pathways", ["Glycolysis/gluconeogenesis", "TCA/ETC/oxidative phosphorylation", "Fatty acid metabolism", "Amino acid metabolism", "Pentose phosphate pathway", "Hormonal regulation"]),
        folder("Cell and molecular biology", ["Cell structure", "Membranes and transport", "Genetics and inheritance", "Gene expression", "DNA technology", "Cell cycle/cancer"]),
        folder("Organ systems", ["Nervous/endocrine", "Cardiovascular/respiratory", "Renal/digestive", "Immune", "Reproduction/development", "Musculoskeletal"]),
      ], ["Pathways should be toggled as systems, enzymes, regulation, and disease links - not memorized as a poster."]),
      area("mcat-cp", "Chemical and Physical Foundations", "high", 1.08, "General chemistry, organic chemistry, physics, biochemistry, and lab reasoning.", [
        folder("Physics equations", ["Kinematics and forces", "Work/energy/power", "Fluids", "Circuits", "Optics and waves", "Radioactive decay", "Thermodynamics", "Electrostatics/magnetism"]),
        folder("General chemistry", ["Stoichiometry", "Atomic structure", "Bonding", "Equilibrium", "Acid/base and buffers", "Thermodynamics", "Electrochemistry"]),
        folder("Organic chemistry", ["Structure and stereochemistry", "Substitution/elimination", "Carbonyl chemistry", "Carboxylic acid derivatives", "Redox", "Spectroscopy"]),
        folder("Lab and passage reasoning", ["Chromatography", "Electrophoresis", "Spectrophotometry", "Experimental controls", "Units/dimensional analysis", "Graph interpretation"]),
      ], ["Pick two equations weekly and work them until units and assumptions are automatic."]),
      area("mcat-cars", "CARS daily reasoning", "high", 1.2, "Passage reasoning, author profile, tone, inference, timing, and review.", [
        folder("Daily passage loop", ["Timed passage", "Main idea in one sentence", "Author profile", "Question stem translation", "Wrong-answer autopsy", "Timing audit"]),
        folder("Reasoning skills", ["Foundations of comprehension", "Reasoning within the text", "Reasoning beyond the text", "Tone and attitude", "Assumption/inference", "Evidence boundaries"]),
        folder("Reading practice", ["10 pages non-fiction/fiction", "Paragraph gist notes", "End summary", "Dense passage tolerance", "Author perspective drill"]),
      ], ["Think only inside the passage boundaries.", "Build a mental profile of the author before answering tone/inference.", "If CARS is stubborn, protect daily contact without letting it eat the entire day."]),
      area("mcat-ps", "Psychological, Social, and Biological Foundations", "medium", 0.98, "Psychology, sociology, behavior, research methods, and health disparities.", [
        folder("Psychology", ["Sensation/perception", "Learning and memory", "Cognition", "Emotion and stress", "Development", "Psychological disorders"]),
        folder("Sociology", ["Social structure", "Demographics", "Social stratification", "Culture", "Social behavior", "Health disparities"]),
        folder("Research and terminology", ["Study design", "Bias", "Validity/reliability", "Operational definitions", "Statistics basics", "Passage variable mapping"]),
      ]),
      area("mcat-full-length-engine", "Full-length and error-log engine", "high", 1.05, "Diagnostics, full-length review, section trends, retests, and schedule decisions.", [
        folder("Assessment cadence", ["Diagnostic", "Full-length score log", "Section timing", "Break/test-day routine", "AAMC material schedule", "Score plateau response"]),
        folder("Error log", ["Content miss", "Passage reasoning miss", "Math/units miss", "CARS trap", "Psych/Soc term miss", "Next-day retest"]),
      ]),
      area("mcat-weekly-rhythm", "Weekly MCAT operating rhythm", "medium", 0.92, "Daily CARS, Anki, topic blocks, next-day review, and Sunday accessory work.", [
        folder("Normal day", ["Anki warm-up", "CARS passage", "Main topic block", "Question set", "Error log", "Next-day review"]),
        folder("Sunday accessory day", ["CARS set", "Two equations", "One pathway", "Full-length review cleanup", "Mobility/rest", "Next week plan"]),
      ]),
    ],
    resources: [
      res("aamc-mcat-outline", "AAMC What's on the MCAT Exam? PDF Outline", "Official", "https://students-residents.aamc.org/prepare-mcat-exam/whats-mcat-exam-pdf-outline", "Official content outline and competencies.", ["official", "blueprint"]),
      res("aamc-mcat-study-plan", "AAMC Creating Your MCAT Study Plan", "Official", "https://students-residents.aamc.org/prepare-mcat-exam/creating-your-mcat-exam-study-plan", "Official study-plan guidance.", ["official", "planning"]),
      res("aamc-mcat-prep", "AAMC Prepare for the MCAT", "Official", "https://students-residents.aamc.org/prepare-mcat-exam/prepare-mcat-exam", "Official practice and prep hub.", ["official", "practice"]),
      res("jack-westin-cars", "Jack Westin CARS", "CARS", "https://jackwestin.com/mcat-question-of-the-day", "Useful daily CARS habit builder.", ["cars", "daily"]),
      res("khan-mcat", "Khan Academy MCAT", "Content", "https://www.khanacademy.org/test-prep/mcat", "Free content review aligned to MCAT prep.", ["free", "content"]),
    ],
    rhythm: [
      rhythm("Normal MCAT day", "Anki or warm-up, CARS, one main topic, questions, then next-day review of yesterday's misses.", ["Anki", "CARS", "topic block", "error log"]),
      rhythm("Sunday accessory day", "CARS, equations, pathways, mobility/rest, and weekly schedule reset.", ["CARS", "2 equations", "pathways", "reset"]),
    ],
  },
  premed: {
    label: "Pre-Med Operating System",
    shortLabel: "Pre-Med",
    sourceLabel: "Blueprint God file + AAMC competencies + AMCAS/AACOMAS guidance",
    sourceUrl: "https://students-residents.aamc.org/real-stories-demonstrating-premed-competencies/premed-competencies-entering-medical-students",
    structure: "Prerequisites, competencies, experience evidence, application cycle, school fit, and narrative vault.",
    passMeaning: "Pre-med items are requirements and evidence. A prerequisite is not a lecture pass; an experience is useful when hours and reflection are both captured.",
    doneMeaning: "Done means completed course/verified evidence/submitted artifact, with uncertainty labeled instead of invented.",
    installCopy: "Install Pre-Med operating system",
    areas: [
      area("premed-mission-control", "Mission Control and profile engine", "high", 1.06, "Academic context, pathway, timeline, risk flags, and next-best-action dashboard.", [
        folder("Profile setup", ["Preferred/legal name", "Citizenship/residency", "Institution/country", "Major/minor", "Graduation year", "Target application cycle"]),
        folder("Pathway selection", ["US MD", "US DO", "TMDSAS", "International applicant", "SGU/international pathway", "Nontraditional/gap year"]),
        folder("Readiness dashboard", ["Gap analysis", "Next-best action", "Deadline alerts", "Evidence freshness", "Source/audit status", "Wellness risk flag"]),
      ]),
      area("premed-academic-map", "Academic map and degree audit", "high", 1.18, "Transcript, DARS/degree audit, GPA trend, graduation requirements, and coursework strategy.", [
        folder("Academic record", ["Transcript/DARS entered", "AP/IB/A-Level/CAPE noted", "Transfer/community-college credit", "Science GPA trend", "Repeated/withdrawn courses", "Pass/fail coursework"]),
        folder("Degree planner", ["Major requirements", "General education", "Graduation checkpoints", "Post-bacc/graduate work", "Course sequencing conflicts", "Advisor verification"]),
        folder("Performance recovery", ["GPA trend explanation", "Academic hardship note", "Retake strategy", "Upper-level science plan", "Risk course watchlist", "Semester load sanity check"]),
      ]),
      area("premed-prerequisites", "Medical school prerequisites", "high", 1.2, "School-specific prereq audit instead of a generic biology-major checklist.", [
        folder("Common prerequisite families", ["Biology with lab", "General chemistry with lab", "Organic chemistry with lab", "Biochemistry", "Physics with lab", "Math/statistics"]),
        folder("Writing and behavioral science", ["English/writing", "Psychology", "Sociology", "Humanities/social science", "Behavioral science MCAT tie-in"]),
        folder("Policy uncertainty flags", ["AP/IB policy", "Online-course policy", "Community college policy", "International credit policy", "Prereq expiration", "School-specific missing rule"]),
      ], ["Never invent school-specific requirements. Unknown policies should stay labeled until sourced."]),
      area("premed-mcat", "MCAT readiness system", "high", 1.08, "Diagnostic, coursework readiness, content map, daily CARS, full-length plan, and score-risk logic.", [
        folder("Readiness inputs", ["Prereq completion", "Diagnostic score", "Target date", "Weekly hours", "Score goal", "Retake policy/risk"]),
        folder("MCAT plan", ["AAMC outline map", "Daily CARS", "Content schedule", "Equation/pathway accessory work", "Full-length schedule", "Error-log review"]),
      ]),
      area("premed-experiences", "Experiences and competencies", "high", 1.12, "AAMC competencies plus experiences that can become application evidence.", [
        folder("Experience vault", ["Clinical hours", "Non-clinical service", "Research/scholarly work", "Shadowing", "Leadership/teaching/employment", "Caregiving/life experience"]),
        folder("AAMC competency map", ["Service orientation", "Social skills", "Cultural competence", "Teamwork", "Ethical responsibility", "Reliability/dependability"]),
        folder("Thinking and science competencies", ["Critical thinking", "Quantitative reasoning", "Scientific inquiry", "Written communication", "Living systems", "Human behavior"]),
      ]),
      area("premed-clinical-service-research", "Clinical, service, research, shadowing", "high", 1.08, "Separate evidence lanes with hours, verification, supervisor contacts, and reflection quality.", [
        folder("Clinical exposure", ["Direct patient exposure", "Shadowing", "Healthcare employment", "Verification contact", "Patient-care reflection", "Scope/role clarity"]),
        folder("Service and advocacy", ["Non-clinical service", "Community need", "Longitudinal commitment", "Leadership in service", "Reflection on impact", "Verification source"]),
        folder("Research and scholarly work", ["Lab/clinical research", "Poster/publication", "PI contact", "Methods learned", "Intellectual contribution", "Future research angle"]),
      ]),
      area("premed-letters-narrative", "Letters and narrative vault", "medium", 1.0, "Evaluator relationships, personal statement, activities, meaningful stories, and hardship context.", [
        folder("Letters of recommendation", ["Science professor", "Non-science professor", "Clinical/supervisor", "Research PI", "Committee letter", "Submission/waiver status"]),
        folder("Narrative vault", ["Personal statement thesis", "Most meaningful experiences", "Patient moment", "Leadership moment", "Failure/recovery story", "Why medicine proof"]),
        folder("Activity writing", ["Role clarity", "Impact evidence", "Reflection", "Competency tags", "Hours/date proof", "No exaggeration audit"]),
      ]),
      area("premed-school-fit", "School discovery and fit engine", "medium", 0.96, "Requirements, mission fit, geography, cost, stats, and conservative source labeling.", [
        folder("School-list logic", ["Mission fit", "Prereq fit", "State/residency fit", "MCAT/GPA range", "Cost/debt", "Clinical/community fit"]),
        folder("Source audit", ["MSAR checked", "School website checked", "AACOM/ChooseDO checked", "TMDSAS checked", "Last verified date", "Unknown policies flagged"]),
      ]),
      area("premed-application-cycle", "Application cycle center", "medium", 1.02, "AMCAS, AACOMAS, TMDSAS, SGU/international pathways, secondaries, interviews, and decisions.", [
        folder("Primary application", ["AMCAS/AACOMAS/TMDSAS profile", "Transcript request", "Activities entered", "Letters attached", "School list submitted", "Fee/financial plan"]),
        folder("Secondaries and interviews", ["Secondary prompt bank", "Turnaround tracker", "Interview prep", "MMI scenarios", "Thank-you/follow-up", "Decision/waitlist tracking"]),
        folder("Gap year/reapplication", ["Gap year plan", "Weakness repair", "Reapplication audit", "New evidence plan", "Financial/mental-health plan", "Matriculation checklist"]),
      ]),
      area("premed-sgu-international", "International and SGU pathways", "medium", 0.9, "Caribbean/international and SGU-specific pathway logic without showing it to every user by default.", [
        folder("International applicant logic", ["Citizenship rules", "Visa/residency flags", "International coursework", "English-language/testing rules", "Credential verification", "Country-specific caution"]),
        folder("SGU pathway logic", ["SGU term/pathway selection", "Premed/BSc/MD route", "Entry requirements", "Term progression", "Resource drive toggles", "USMLE carry-forward"]),
      ]),
      area("premed-wellness-data", "Wellness, safeguards, data sources", "low", 0.82, "Burnout guardrails, audit trail, change log, and conservative source governance.", [
        folder("Wellness safeguards", ["Burnout risk", "Overloaded semester", "Sleep/exercise signal", "Roadblock/injury/illness note", "Support system", "Recovery plan"]),
        folder("Data governance", ["Source label", "Version date", "Last verified date", "Confidence level", "School-specific unknowns", "Change log"]),
      ]),
    ],
    resources: [
      res("aamc-competencies", "AAMC Premed Competencies", "Official", "https://students-residents.aamc.org/real-stories-demonstrating-premed-competencies/premed-competencies-entering-medical-students", "17 competencies for entering medical students.", ["official", "competencies"]),
      res("amcas-guide", "AAMC AMCAS Applicant Guide", "Official", "https://students-residents.aamc.org/applying-medical-school-amcas/publication/2027-amcas-applicant-guide", "Current AMCAS application process and policies.", ["official", "amcas"]),
      res("aacom-apply", "AACOMAS Apply to Medical School", "Official", "https://www.aacom.org/become-a-doctor/apply-to-medical-school", "DO application pathway.", ["official", "do"]),
      res("msar", "AAMC MSAR", "Official", "https://students-residents.aamc.org/medical-school-admission-requirements/medical-school-admission-requirements-msar-applicants", "School requirements and fit research.", ["official", "school-list"]),
    ],
    rhythm: [
      rhythm("Weekly pre-med audit", "One small audit: hours, GPA/prereqs, MCAT readiness, or application artifact.", ["hours", "grades", "MCAT", "artifact"]),
      rhythm("Evidence capture", "After meaningful experiences, log hours and reflection before the details fade.", ["what happened", "who verified", "why it matters"]),
    ],
  },
};

function area(id: string, title: string, y: YieldLevel, weight: number, summary: string, folders: PrepFolder[], tips?: string[]): PrepArea {
  return { id, title, yield: y, weight, summary, folders, tips };
}

function folder(title: string, leaves: string[]): PrepFolder {
  const base = slug(title);
  return {
    title,
    leaves: leaves.map((title, index) => ({
      id: `${base}-${index}`,
      title,
      why: "Final actionable item inside this blueprint folder.",
      action: "Toggle when you have evidence from questions, review, a verified requirement, or a submitted artifact.",
    })),
  };
}

function res(id: string, title: string, kind: string, url: string, why: string, tags: string[]): PrepResource {
  return { id, title, kind, url, why, tags };
}

function rhythm(title: string, body: string, chips: string[]) {
  return { title, body, chips };
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function defaultPrep(exam: BoardExamId): BoardPrepProfile {
  return {
    medYear: exam === "premed" || exam === "mcat" ? "Pre-Med" : exam === "step2" || exam === "shelf" ? "MS3" : "MS2",
    contentStarted: exam === "step1" || exam === "mcat" || exam === "shelf" ? "light" : "not-started",
    weeklyHours: exam === "step1" ? 18 : exam === "step2" ? 14 : exam === "mcat" ? 12 : 10,
    questionTarget: exam === "premed" ? 15 : exam === "shelf" ? 25 : exam === "step3" ? 30 : 40,
    resourcesDone: [],
    installedBlueprintAreas: [],
    completedBlueprintItems: [],
    otherResources: "",
    confidence: "medium",
    blueprintLogs: [],
    aiStrategy: "",
    updated: new Date().toISOString(),
  };
}

function allLeafIds(config: ExamConfig) {
  return config.areas.flatMap((area) => area.folders.flatMap((folder) => folder.leaves.map((leaf) => leafId(area.id, leaf.id))));
}

function leafId(areaId: string, id: string) {
  return `${areaId}/${id}`;
}

function areaLeafIds(area: PrepArea) {
  return area.folders.flatMap((folder) => folder.leaves.map((leaf) => leafId(area.id, leaf.id)));
}

function pct(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

type BlueprintDepth = "macro" | "detailed";
const DEPTH_KEY = "noctyrium-blueprint-depth";
function readDepth(): BlueprintDepth {
  try { return localStorage.getItem(DEPTH_KEY) === "detailed" ? "detailed" : "macro"; } catch { return "macro"; }
}
function writeDepth(depth: BlueprintDepth) {
  try { localStorage.setItem(DEPTH_KEY, depth); } catch { /* storage unavailable */ }
}

function folderLeafIds(area: PrepArea, folder: PrepFolder) {
  return folder.leaves.map((leaf) => leafId(area.id, leaf.id));
}

function boardReadiness(logs: BoardBlueprintLog[], completion: number): number {
  const confidenceScore: Record<BoardBlueprintLog["confidence"], number> = { red: 18, orange: 45, green: 72, blue: 92 };
  const recent = logs.slice(0, 20);
  const confidence = recent.length ? recent.reduce((sum, log) => sum + confidenceScore[log.confidence], 0) / recent.length : 0;
  const withQuestions = recent.filter((log) => log.questions > 0);
  const accuracy = withQuestions.length
    ? withQuestions.reduce((sum, log) => sum + (log.correct / Math.max(1, log.questions)) * 100, 0) / withQuestions.length
    : 0;
  return Math.round(completion * 0.42 + confidence * 0.28 + accuracy * 0.3);
}

export function StepPage({ initialExam = "step1" }: { initialExam?: BoardExamId }) {
  const s = useStore();
  const [examId, setExamId] = useState<BoardExamId>(initialExam);
  const [openArea, setOpenArea] = useState<string>(EXAMS[initialExam].areas[0]?.id ?? "");
  const [depth, setDepth] = useState<BlueprintDepth>(readDepth);
  const [blueprintFilter, setBlueprintFilter] = useState<"all" | "installed" | "high" | "open">("all");
  const [flash, setFlash] = useState<string | null>(null);
  const [logArea, setLogArea] = useState(EXAMS[initialExam].areas[0]?.title ?? "");
  const [logMode, setLogMode] = useState<BoardBlueprintLog["mode"]>("Questions");
  const [logMinutes, setLogMinutes] = useState("45");
  const [logQuestions, setLogQuestions] = useState("20");
  const [logCorrect, setLogCorrect] = useState("0");
  const [logConfidence, setLogConfidence] = useState<BoardBlueprintLog["confidence"]>("orange");
  const [logNotes, setLogNotes] = useState("");

  const config = EXAMS[examId];
  const prep = s.boardPrep?.[examId] ?? defaultPrep(examId);
  const installed = new Set(prep.installedBlueprintAreas ?? []);
  const completed = new Set(prep.completedBlueprintItems ?? []);
  const resourceUrls = useMemo(() => new Set(s.resources.map((r) => normalizeResourceUrl(r.url))), [s.resources]);
  const installedAreaIds = config.areas.filter((area) => installed.has(area.id)).map((area) => area.id);
  const installedLeaves = config.areas.filter((area) => installed.has(area.id)).flatMap(areaLeafIds);
  const completion = pct(installedLeaves.filter((id) => completed.has(id)).length, installedLeaves.length || allLeafIds(config).length);
  const readiness = boardReadiness(prep.blueprintLogs, completion);
  const savedResources = config.resources.filter((r) => resourceUrls.has(normalizeResourceUrl(r.url))).length;
  const visibleAreas = config.areas.filter((area) => {
    if (blueprintFilter === "installed") return installed.has(area.id);
    if (blueprintFilter === "high") return area.yield === "high";
    if (blueprintFilter === "open") return openArea === area.id;
    return true;
  });

  useEffect(() => {
    const first = EXAMS[examId].areas[0];
    setOpenArea(first?.id ?? "");
    setLogArea(first?.title ?? EXAMS[examId].shortLabel);
  }, [examId]);

  function announce(msg: string) {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 4500);
  }

  function patchPrep(patch: Partial<BoardPrepProfile>) {
    s.updateBoardPrep(examId, patch);
  }

  function installBlueprint() {
    const allInstalled = config.areas.every((area) => installed.has(area.id));
    if (allInstalled) {
      announce(`${config.shortLabel} blueprint is already installed.`);
      return;
    }
    patchPrep({ installedBlueprintAreas: [...new Set([...prep.installedBlueprintAreas ?? [], ...config.areas.map((area) => area.id)])] });
    announce(`${config.shortLabel} blueprint installed as dedicated prep folders.`);
  }

  function toggleArea(area: PrepArea) {
    const next = new Set(prep.installedBlueprintAreas ?? []);
    const completedNext = new Set(prep.completedBlueprintItems ?? []);
    if (next.has(area.id)) {
      next.delete(area.id);
      for (const id of areaLeafIds(area)) completedNext.delete(id);
    } else {
      next.add(area.id);
      setOpenArea(area.id);
    }
    patchPrep({ installedBlueprintAreas: [...next], completedBlueprintItems: [...completedNext] });
  }

  function toggleLeaf(id: string) {
    const next = new Set(prep.completedBlueprintItems ?? []);
    next.has(id) ? next.delete(id) : next.add(id);
    patchPrep({ completedBlueprintItems: [...next] });
  }

  function changeDepth(next: BlueprintDepth) {
    setDepth(next);
    writeDepth(next);
  }

  // Macro controls toggle a whole folder (or area) at once — same underlying
  // per-leaf completion set, just coarser when you only want the big picture.
  function toggleIds(ids: string[]) {
    if (!ids.length) return;
    const next = new Set(prep.completedBlueprintItems ?? []);
    const allDone = ids.every((id) => next.has(id));
    for (const id of ids) allDone ? next.delete(id) : next.add(id);
    patchPrep({ completedBlueprintItems: [...next] });
  }

  function saveAllResources() {
    const next = config.resources
      .filter((r) => !resourceUrls.has(normalizeResourceUrl(r.url)))
      .map((r) => ({ title: r.title, url: r.url, category: config.shortLabel, tags: r.tags, note: r.why, favorite: r.kind === "Official" || r.kind === "Assessment" }));
    if (next.length) s.bulkAddResources(next);
    announce(next.length ? `Saved ${next.length} resource${next.length === 1 ? "" : "s"} to Resources.` : "All blueprint resources are already downloaded in Resources.");
  }

  function saveResource(resource: PrepResource) {
    if (resourceUrls.has(normalizeResourceUrl(resource.url))) {
      announce(`${resource.title} is already downloaded in Resources.`);
      return;
    }
    s.addResource({ title: resource.title, url: resource.url, category: config.shortLabel, tags: resource.tags, note: resource.why, favorite: resource.kind === "Official" || resource.kind === "Assessment" });
    announce(`Saved ${resource.title} to Resources.`);
  }

  function addBlueprintLog() {
    const questions = Math.max(0, Number(logQuestions) || 0);
    s.addBoardBlueprintLog(examId, {
      date: dayKey(),
      dimension: examId === "shelf" ? "discipline" : examId === "premed" ? "competency" : "system",
      area: logArea || config.shortLabel,
      mode: logMode,
      minutes: Math.max(0, Number(logMinutes) || 0),
      questions,
      correct: Math.max(0, Math.min(Number(logCorrect) || 0, questions)),
      confidence: logConfidence,
      notes: logNotes.trim() || undefined,
    });
    setLogNotes("");
    announce(`Logged ${config.shortLabel} work for ${logArea}.`);
  }

  return (
    <>
      <GlassCard pad className="step-command prep-command-center" data-tour="step">
        <div className="prep-hero">
          <div className="prep-hero-copy">
            <div className="step-tabs">
              {(Object.keys(EXAMS) as BoardExamId[]).map((id) => (
                <button key={id} className={`filter-pill ${examId === id ? "on" : ""}`} onClick={() => setExamId(id)}>{EXAMS[id].shortLabel}</button>
              ))}
            </div>
            <div className="step-title">{config.label}</div>
            <div className="sub">{config.structure}</div>
            <div className="prep-source-line">
              <ShieldCheck size={14} /> Built from {config.sourceLabel}. Yield is guidance, not permission to ignore anything.
            </div>
          </div>
          <div className="prep-readiness">
            <div className="ring" style={{ width: 104, height: 104 }}>
              <svg width="104" height="104" viewBox="0 0 104 104">
                <circle cx="52" cy="52" r="43" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                <circle cx="52" cy="52" r="43" fill="none" stroke="var(--cyan)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 43} strokeDashoffset={2 * Math.PI * 43 * (1 - readiness / 100)}
                  transform="rotate(-90 52 52)" />
              </svg>
              <div className="ring-label">{readiness}%</div>
            </div>
            <span>{installedAreaIds.length}/{config.areas.length} areas installed</span>
          </div>
        </div>
        <div className="step-actions">
          <GButton variant="primary" onClick={installBlueprint}><ListChecks size={14} /> {config.installCopy}</GButton>
          <GButton onClick={saveAllResources}><Database size={14} /> Save resources ({savedResources}/{config.resources.length})</GButton>
          <a className="gbtn" href={config.sourceUrl} target="_blank" rel="noreferrer noopener">Official source <ExternalLink size={14} /></a>
        </div>
        {flash && <div className="step-flash"><CheckCircle2 size={15} /> <span>{flash}</span></div>}
      </GlassCard>

      <div className="prep-progress-explainer">
        <div className="ppe-item">
          <span className="ppe-dot" style={{ background: "var(--cyan)" }} />
          <div><b>What progress means</b><span>{config.passMeaning}</span></div>
        </div>
        <div className="ppe-item">
          <span className="ppe-dot" style={{ background: "var(--green)" }} />
          <div><b>When it is done</b><span>{config.doneMeaning}</span></div>
        </div>
      </div>

      {examId === "premed" && <PremedExperiencePanel />}

      <div className="step-overview-grid blueprint-main-grid">
        <GlassCard pad>
          <PanelHeader title="Blueprint Library"
            sub={depth === "macro"
              ? "Macro: install areas and check off whole folders for a fast big-picture pass."
              : "Detailed: open every folder and complete each final item with its own evidence."}
            action={
              <div className="depth-toggle" title="Choose how deep the blueprint goes">
                <button type="button" className={`depth-pill ${depth === "macro" ? "on" : ""}`} onClick={() => changeDepth("macro")}>Macro</button>
                <button type="button" className={`depth-pill ${depth === "detailed" ? "on" : ""}`} onClick={() => changeDepth("detailed")}>Detailed</button>
              </div>
            } />
          <div className="blueprint-workspace">
            <aside className="blueprint-spine" aria-label={`${config.shortLabel} blueprint areas`}>
              <div className="blueprint-spine-kicker">Blueprint spine</div>
              {config.areas.map((area) => {
                const ids = areaLeafIds(area);
                const areaPct = pct(ids.filter((id) => completed.has(id)).length, ids.length);
                const isInstalled = installed.has(area.id);
                const isOpen = openArea === area.id;
                return (
                  <button key={area.id} type="button"
                    className={`blueprint-spine-row ${isOpen ? "on" : ""} ${isInstalled ? "installed" : ""}`}
                    onClick={() => setOpenArea(area.id)}>
                    <span className="blueprint-spine-dot" />
                    <span className="grow">
                      <b>{area.title}</b>
                      <small>{isInstalled ? `${areaPct}% complete` : "available"}</small>
                    </span>
                    <span>{area.yield}</span>
                  </button>
                );
              })}
            </aside>
            <div className="blueprint-library-main">
              <div className="blueprint-filter-row">
                {[
                  ["all", "All areas"],
                  ["installed", "Subscribed"],
                  ["high", "High yield"],
                  ["open", "Current"],
                ].map(([id, label]) => (
                  <button key={id} type="button" className={`filter-pill ${blueprintFilter === id ? "on" : ""}`}
                    onClick={() => setBlueprintFilter(id as typeof blueprintFilter)}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="blueprint-tree-grid">
                {visibleAreas.map((area) => {
              const ids = areaLeafIds(area);
              const areaPct = pct(ids.filter((id) => completed.has(id)).length, ids.length);
              const isInstalled = installed.has(area.id);
              const isOpen = openArea === area.id;
              return (
                <div key={area.id} className={`prep-area ${isInstalled ? "installed" : ""} ${isOpen ? "open" : ""}`}>
                  <button type="button" className="prep-area-head" onClick={() => setOpenArea(isOpen ? "" : area.id)}>
                    <span className="prep-area-icon"><Brain size={17} /></span>
                    <span className="grow">
                      <span className="prep-area-title">{area.title}</span>
                      <span className="prep-area-summary">{area.summary}</span>
                    </span>
                    <Tag tone={yieldTone[area.yield]}>{area.yield} yield</Tag>
                    <span className="prep-area-score">{areaPct}%</span>
                    <ChevronDown size={15} />
                  </button>
                  <div className="track prep-area-track"><div className="track-fill" style={{ width: `${areaPct}%` }} /></div>
                  {isOpen && (
                    <div className="prep-area-body">
                      <div className="row wrap gap8">
                        <GButton size="sm" variant={isInstalled ? "default" : "primary"} onClick={() => toggleArea(area)}>
                          {isInstalled ? <CheckCircle2 size={14} /> : <Plus size={14} />} {isInstalled ? "Subscribed" : "Subscribe area"}
                        </GButton>
                        <Tag tone="neutral">weight {area.weight.toFixed(1)}x</Tag>
                        {depth === "macro" && isInstalled && (
                          <GButton size="sm" onClick={() => toggleIds(ids)}>
                            {areaPct === 100 ? "Clear area" : "Mark area done"}
                          </GButton>
                        )}
                      </div>
                      {area.folders.map((folder) => {
                        const fids = folderLeafIds(area, folder);
                        const fdone = fids.filter((id) => completed.has(id)).length;
                        const allDone = fids.length > 0 && fdone === fids.length;
                        if (depth === "macro") {
                          return (
                            <button key={folder.title} type="button" className={`prep-macro-folder ${allDone ? "done" : ""}`}
                              onClick={() => toggleIds(fids)} disabled={!isInstalled}>
                              <span className="pmf-check">{allDone ? <CheckCircle2 size={16} /> : <CircleDot />}</span>
                              <span className="grow">
                                <b>{folder.title}</b>
                                <small>{folder.leaves.slice(0, 3).map((leaf) => leaf.title).join(" · ")}{folder.leaves.length > 3 ? ` · +${folder.leaves.length - 3} more` : ""}</small>
                              </span>
                              <span className="pmf-count">{fdone}/{fids.length}</span>
                            </button>
                          );
                        }
                        return (
                          <details className="prep-folder" key={folder.title} open={isInstalled}>
                            <summary><BookOpen size={15} /><b>{folder.title}</b><span className="prep-folder-count">{fdone}/{fids.length}</span><ChevronDown size={14} /></summary>
                            <div className="prep-leaf-grid">
                              {folder.leaves.map((leaf) => {
                                const id = leafId(area.id, leaf.id);
                                const done = completed.has(id);
                                return (
                                  <button key={id} type="button" className={`prep-leaf ${done ? "done" : ""}`} onClick={() => toggleLeaf(id)} disabled={!isInstalled}>
                                    <span>{done ? <CheckCircle2 size={14} /> : <CircleDot />}</span>
                                    <b>{leaf.title}</b>
                                    <small>{leaf.action}</small>
                                  </button>
                                );
                              })}
                            </div>
                          </details>
                        );
                      })}
                      {area.tips?.length ? (
                        <div className="prep-tip-list">
                          {area.tips.map((tip) => <span key={tip}><Sparkles size={13} /> {tip}</span>)}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
                {visibleAreas.length === 0 && (
                  <div className="empty">No areas match this filter yet. Install the blueprint or switch back to All areas.</div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="stack gap16">
          <GlassCard pad>
            <PanelHeader title={`${config.shortLabel} resources`} sub={`${savedResources}/${config.resources.length} saved to Resources`}
              action={<GButton size="sm" onClick={saveAllResources}><Plus size={14} /> Add all</GButton>} />
            <div className="prep-resource-list">
              {config.resources.map((resource) => {
                const saved = resourceUrls.has(normalizeResourceUrl(resource.url));
                return (
                  <div className={`prep-resource-row ${saved ? "saved" : ""}`} key={resource.id}>
                    <span className="prep-resource-mark">{saved ? <CheckCircle2 size={16} /> : <Database size={16} />}</span>
                    <div className="grow">
                      <b>{resource.title}</b>
                      <span><Tag tone="neutral">{resource.kind}</Tag> {resource.why}</span>
                    </div>
                    <a className="gbtn sm" href={resource.url} target="_blank" rel="noreferrer noopener">Open <ExternalLink size={13} /></a>
                    {saved ? <Tag tone="green">In library</Tag> : <GButton size="sm" onClick={() => saveResource(resource)}>Add</GButton>}
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard pad className="step-schedule-card">
            <PanelHeader title="Suggested rhythm" sub="A starter operating cadence you can adapt." />
            <div className="prep-rhythm-list">
              {config.rhythm.map((item) => (
                <div className="prep-rhythm" key={item.title}>
                  <CalendarDays size={15} />
                  <div>
                    <b>{item.title}</b>
                    <span>{item.body}</span>
                    <div>{item.chips.map((chip) => <Tag key={chip} tone="cyan">{chip}</Tag>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="step-overview-grid">
        <GlassCard pad className="step-log-card">
          <PanelHeader title={`${config.shortLabel} work log`} sub="Board/prep logging stays separate from lecture, DLA, and PQ course tracking." />
          <div className="step-form-grid board-log-form">
            <label className="stack gap6">
              <span className="field-label">Area</span>
              <select className="field" value={logArea} onChange={(e) => setLogArea(e.target.value)}>
                {config.areas.map((area) => <option key={area.id}>{area.title}</option>)}
              </select>
            </label>
            <label className="stack gap6">
              <span className="field-label">Mode</span>
              <select className="field" value={logMode} onChange={(e) => setLogMode(e.target.value as BoardBlueprintLog["mode"])}>
                {["Questions", "Assessment", "Missed facts", "First pass", "Review"].map((mode) => <option key={mode}>{mode}</option>)}
              </select>
            </label>
            <Field label="Minutes" type="number" min="0" value={logMinutes} onChange={(e) => setLogMinutes(e.target.value)} />
            <Field label="Questions" type="number" min="0" value={logQuestions} onChange={(e) => setLogQuestions(e.target.value)} />
            <Field label="Correct" type="number" min="0" value={logCorrect} onChange={(e) => setLogCorrect(e.target.value)} />
            <label className="stack gap6">
              <span className="field-label">Confidence</span>
              <select className="field" value={logConfidence} onChange={(e) => setLogConfidence(e.target.value as BoardBlueprintLog["confidence"])}>
                <option value="red">Red</option>
                <option value="orange">Orange</option>
                <option value="green">Green</option>
                <option value="blue">Blue</option>
              </select>
            </label>
          </div>
          <div className="board-log-note-row">
            <input className="field" value={logNotes} onChange={(e) => setLogNotes(e.target.value)} placeholder="Missed themes, next repair, resource used..." />
            <GButton variant="primary" onClick={addBlueprintLog}><Plus size={14} /> Log work</GButton>
          </div>
          <div className="board-quick-row">
            <button onClick={() => { setLogMode("Questions"); setLogMinutes("60"); setLogQuestions("40"); }}>40Q block</button>
            <button onClick={() => { setLogMode("Missed facts"); setLogMinutes("25"); setLogQuestions("0"); }}>Missed-fact repair</button>
            <button onClick={() => { setLogMode("Assessment"); setLogMinutes("240"); setLogQuestions("0"); }}>Assessment review</button>
          </div>
        </GlassCard>

        <GlassCard pad>
          <PanelHeader title="Recent evidence" sub={`${prep.blueprintLogs.length} board/prep log${prep.blueprintLogs.length === 1 ? "" : "s"}`} />
          {prep.blueprintLogs.length ? (
            <div className="board-log-list">
              {prep.blueprintLogs.slice(0, 8).map((log) => (
                <div className="board-log-row" key={log.id}>
                  <span className="board-log-dot" style={{ color: confidenceColor(log.confidence), background: confidenceColor(log.confidence) }} />
                  <div className="grow">
                    <b>{log.area}</b>
                    <span>{log.date} - {log.mode} - {log.minutes}m{log.questions ? ` - ${log.correct}/${log.questions}` : ""}</span>
                    {log.notes && <small>{log.notes}</small>}
                  </div>
                  <button className="ghost-btn danger" onClick={() => s.removeBoardBlueprintLog(examId, log.id)}>Remove</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No board/prep logs yet. Install a blueprint, do one small block, then log the evidence.</div>
          )}
        </GlassCard>
      </div>

      <GlassCard pad>
        <PanelHeader title="Why this is not the Course Tracker" sub="Course Tracker stays for lectures, DLAs, PQs, and term work. Blueprint Prep tracks exam readiness and application evidence." />
        <div className="evidence-grid prep-evidence-grid">
          <a className="evidence-card" href={config.sourceUrl} target="_blank" rel="noreferrer noopener">
            <span><FlaskConical size={15} /></span>
            <div><b>Source anchored</b><small>Official exam outlines and your local Blueprint God file define the folder structure.</small><em>{config.sourceLabel}</em></div>
          </a>
          <div className="evidence-card">
            <span><Target size={15} /></span>
            <div><b>Completion is evidence</b><small>Toggle final items only when you have practice, verification, retest, or application evidence.</small><em>No fake lecture passes</em></div>
          </div>
          <div className="evidence-card">
            <span><Layers size={15} /></span>
            <div><b>Modular by design</b><small>Subscribe to only the exam or pathway you need; hidden tracks stay available from customization.</small><em>Calmer mobile experience</em></div>
          </div>
        </div>
      </GlassCard>
    </>
  );
}

function CircleDot() {
  return <span className="circle-dot" aria-hidden="true" />;
}

function confidenceColor(confidence: BoardBlueprintLog["confidence"]) {
  if (confidence === "blue") return "var(--grade-blue)";
  if (confidence === "green") return "var(--green)";
  if (confidence === "orange") return "var(--orange)";
  return "var(--red)";
}

function PremedExperiencePanel() {
  const s = useStore();
  const [kind, setKind] = useState<PremedExperienceKind>("Clinical");
  const [date, setDate] = useState(dayKey());
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [contact, setContact] = useState("");
  const [hours, setHours] = useState("2");
  const [verified, setVerified] = useState(false);
  const [reflection, setReflection] = useState("");
  const entries = s.premedExperiences ?? [];
  const totals = PREMED_KINDS.map((k) => ({
    kind: k,
    hours: entries.filter((entry) => entry.kind === k).reduce((sum, entry) => sum + entry.hours, 0),
    verified: entries.filter((entry) => entry.kind === k && entry.verified).reduce((sum, entry) => sum + entry.hours, 0),
  }));
  const totalHours = totals.reduce((sum, item) => sum + item.hours, 0);
  const verifiedHours = totals.reduce((sum, item) => sum + item.verified, 0);
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const max = Math.max(1, ...totals.map((item) => item.hours));

  function save() {
    const amount = Math.max(0, Number(hours) || 0);
    if (!title.trim() || !organization.trim() || amount <= 0) return;
    s.addPremedExperience({
      date,
      kind,
      title: title.trim(),
      organization: organization.trim(),
      contact: contact.trim() || undefined,
      hours: amount,
      verified,
      reflection: reflection.trim(),
    });
    setTitle("");
    setOrganization("");
    setContact("");
    setHours("2");
    setVerified(false);
    setReflection("");
  }

  return (
    <GlassCard pad className="premed-hours-card">
      <PanelHeader title="Pre-Med Experience Log" sub="Clinical exposure, service, research, shadowing, leadership, and verification evidence"
        action={<Tag tone={verifiedHours >= 50 ? "green" : verifiedHours > 0 ? "cyan" : "neutral"}>{verifiedHours} verified hours</Tag>} />
      <div className="premed-hours-layout">
        <div className="premed-hours-form">
          <div className="step-form-grid">
            <SelectField label="Category" value={kind} onChange={(e) => setKind(e.target.value as PremedExperienceKind)}>
              {PREMED_KINDS.map((k) => <option key={k}>{k}</option>)}
            </SelectField>
            <Field label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Field label="Hours" type="number" min="0" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <Field label="What did you do?" placeholder="e.g. Shadowed cardiology clinic" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="step-form-grid">
            <Field label="Organization / physician / service" value={organization} onChange={(e) => setOrganization(e.target.value)} />
            <Field label="Verification contact" placeholder="email, supervisor, club officer" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <TextAreaField label="Reflection / evidence" placeholder="What mattered? What did you learn? What proof exists?" value={reflection} onChange={(e) => setReflection(e.target.value)} />
          <div className="premed-log-actions">
            <label className="promise-check compact">
              <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
              <span>Verified or verification path exists</span>
            </label>
            <GButton variant="primary" onClick={save}>Log experience</GButton>
          </div>
        </div>
        <div className="premed-hours-dashboard">
          <div className="premed-hours-total">
            <b>{totalHours}</b>
            <span>total hours logged</span>
          </div>
          <div className="premed-hour-bars">
            {totals.map((item) => (
              <div className="premed-hour-bar" key={item.kind}>
                <div className="spread"><span>{item.kind}</span><b>{item.hours}h</b></div>
                <div className="track">
                  <div className="track-fill" style={{ width: `${Math.round((item.hours / max) * 100)}%`, background: item.verified ? "var(--green)" : "var(--cyan)" }} />
                </div>
                <small>{item.verified}h verified</small>
              </div>
            ))}
          </div>
          <div className="premed-trend-note">
            {entries.length
              ? `${recent[0].kind} was your latest signal. Keep reflections specific enough to become application material later.`
              : "Start with one honest entry. Verified hours are useful; reflective detail is what makes them usable."}
          </div>
        </div>
      </div>
      {recent.length > 0 && (
        <div className="premed-recent-list">
          {recent.map((entry) => (
            <div className="premed-recent-row" key={entry.id}>
              <Tag tone={entry.verified ? "green" : "neutral"}>{entry.kind}</Tag>
              <div className="grow">
                <b>{entry.title}</b>
                <span>{entry.date} - {entry.organization} - {entry.hours}h{entry.verified ? " - verified" : ""}</span>
              </div>
              <button className="ghost-btn danger" onClick={() => s.removePremedExperience(entry.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
