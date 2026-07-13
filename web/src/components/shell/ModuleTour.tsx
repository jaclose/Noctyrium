import { useMemo } from "react";
import { GuidedTour, type TourExitReason, type TourStep } from "./GuidedTour";

export interface ModuleTourStep {
  target?: string;
  title: string;
  body: string;
}

/** Same-route guide that reuses the accepted global tour accessibility shell. */
export function ModuleTour({
  name,
  route,
  steps,
  onExit,
}: {
  name: string;
  route: string;
  steps: readonly ModuleTourStep[];
  onExit: (reason: TourExitReason) => void;
}) {
  const routedSteps = useMemo<readonly TourStep[]>(
    () => steps.map((step) => ({ ...step, route })),
    [route, steps],
  );

  return (
    <GuidedTour
      currentRoute={route}
      onNavigate={() => { /* module tours never navigate */ }}
      onExit={onExit}
      steps={routedSteps}
      persistProgress={false}
      targetAttribute="data-module-tour"
      skipLabel={`Skip ${name} tour`}
      progressLabel={`${name} tour progress`}
    />
  );
}
