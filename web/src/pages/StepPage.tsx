// Exam-prep page. Each sidebar/deep-link route enters a specific Blueprint
// lane, then the page derives the mode so USMLE and Pre-Health stay separated.
import { BlueprintWorkbench } from "../components/blueprints/BlueprintWorkbench";
import { PremedExperiencePanel } from "../components/blueprints/PremedExperiencePanel";
import { modeForBlueprintLane } from "../lib/blueprintRoutes";
import type { BlueprintLaneId } from "../lib/types";

export function StepPage({ initialLane = "step1" }: { initialLane?: BlueprintLaneId }) {
  const mode = modeForBlueprintLane(initialLane);
  return (
    <>
      <BlueprintWorkbench mode={mode} initialLane={initialLane} />
      {mode === "prehealth" && <PremedExperiencePanel />}
    </>
  );
}
