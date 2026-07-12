// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeDailyRequirement } from "../../lib/dailySuccess";
import { makeSeed } from "../../lib/seed";
import { useStore } from "../../lib/store";
import type { DailySuccessSchedule } from "../../lib/types";
import { DailyRequirementsEditor } from "./DailyRequirementsEditor";

let today = "";

function seedRequirement(schedule: DailySuccessSchedule = { kind: "daily" }) {
  const seed = makeSeed();
  today = seed.activeDayKey;
  seed.profile.dailySuccess = {
    version: 1,
    configuredAt: "2026-07-01",
    requirements: [makeDailyRequirement({
      id: "minutes",
      label: "Focused study",
      source: { kind: "study-minutes" },
      target: 60,
      unit: "minutes",
      schedule,
      trackingStartsAt: "2026-07-01",
    }, "2026-07-01")],
  };
  useStore.setState(seed);
}

function currentRequirement() {
  return useStore.getState().profile.dailySuccess!.requirements[0];
}

beforeEach(() => seedRequirement());
afterEach(cleanup);

describe("DailyRequirementsEditor scoring boundaries", () => {
  it("starts a target change today instead of rescoring older dates", () => {
    render(<DailyRequirementsEditor />);
    fireEvent.change(screen.getAllByLabelText("Target")[0], { target: { value: "90" } });
    expect(currentRequirement()).toMatchObject({ target: 90, trackingStartsAt: today });
  });

  it("starts a schedule change today instead of rescoring older dates", () => {
    render(<DailyRequirementsEditor />);
    fireEvent.change(screen.getAllByLabelText("Schedule")[0], { target: { value: "weekdays" } });
    expect(currentRequirement()).toMatchObject({
      trackingStartsAt: today,
      schedule: { kind: "weekdays", weekdays: [1, 2, 3, 4, 5] },
    });
  });

  it("never stores an empty selected-weekday schedule and starts weekday edits today", () => {
    seedRequirement({ kind: "weekdays", weekdays: [1, 2] });
    render(<DailyRequirementsEditor />);

    fireEvent.click(screen.getByLabelText("Monday"));
    expect(currentRequirement()).toMatchObject({
      trackingStartsAt: today,
      schedule: { kind: "weekdays", weekdays: [2] },
    });
    expect((screen.getByLabelText("Tuesday") as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText("Tuesday"));
    expect(currentRequirement().schedule).toEqual({ kind: "weekdays", weekdays: [2] });
  });

  it("starts a changed weekly quota today", () => {
    seedRequirement({ kind: "times-per-week", times: 3, weekStartsOn: 1 });
    render(<DailyRequirementsEditor />);
    fireEvent.change(screen.getByLabelText("Times"), { target: { value: "4" } });
    expect(currentRequirement()).toMatchObject({
      trackingStartsAt: today,
      schedule: { kind: "times-per-week", times: 4, weekStartsOn: 1 },
    });
  });
});
