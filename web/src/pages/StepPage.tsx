// Exam-prep page. The sidebar routes "step" (USMLE) and "premed" (Pre-Health)
// here; the page derives the Blueprint mode so the lane bar only shows that
// pathway's lanes. The Blueprint Workbench is the operating-system UI; in
// Pre-Health mode the Pre-Med experience log rides alongside the Applicant OS.
import { BlueprintWorkbench } from "../components/blueprints/BlueprintWorkbench";
import { PremedExperiencePanel } from "../components/blueprints/PremedExperiencePanel";
import type { BoardExamId, BlueprintMode } from "../lib/types";

export function StepPage({ initialExam = "step1" }: { initialExam?: BoardExamId }) {
  const mode: BlueprintMode = initialExam === "premed" || initialExam === "mcat" ? "prehealth" : "usmle";
  return (
    <>
      <BlueprintWorkbench mode={mode} />
      {mode === "prehealth" && <PremedExperiencePanel />}
    </>
  );
}
