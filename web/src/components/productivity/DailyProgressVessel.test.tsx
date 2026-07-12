// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DailySuccessResult } from "../../lib/dailySuccess";
import { DailyProgressVessel } from "./DailyProgressVessel";

const neutral: DailySuccessResult = {
  mode: "configured",
  dayKey: "2026-07-12",
  requirements: [],
  eligibleCount: 0,
  metCount: 0,
  progress: 0,
  status: "neutral",
  statusLabel: "No requirements selected",
};

describe("DailyProgressVessel", () => {
  it("exposes deterministic textual progress and a neutral initial state", () => {
    const { rerender, container } = render(<DailyProgressVessel result={neutral} />);
    const progress = screen.getByRole("progressbar", { name: "Daily success progress" });
    expect(progress.getAttribute("aria-valuenow")).toBe("0");
    expect(progress.getAttribute("aria-valuetext")).toContain("No requirements selected");

    rerender(<DailyProgressVessel result={{ ...neutral, eligibleCount: 2, metCount: 1, progress: 50, status: "in-progress", statusLabel: "In progress" }} />);
    expect(progress.getAttribute("aria-valuenow")).toBe("50");
    expect(progress.getAttribute("aria-valuetext")).toContain("1 of 2");
    expect(container.querySelector(".daily-progress-fill")?.getAttribute("style")).toContain("50%");
  });
});
