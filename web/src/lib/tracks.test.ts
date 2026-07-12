import { describe, expect, it } from "vitest";
import { ACADEMIC_STAGES_BY_TRACK, academicStagesForTrack, EDUCATION_TRACKS, resolveTrack } from "./tracks";

describe("academic stages", () => {
  it("provides the five inclusive stages for US MD and DO", () => {
    const expected = [
      "Pre-clinical",
      "Clinical rotations",
      "Dedicated board preparation",
      "Residency application",
      "Other / Custom",
    ];
    expect(academicStagesForTrack("usmd").options.map((option) => option.label)).toEqual(expected);
    expect(academicStagesForTrack("do").options.map((option) => option.label)).toEqual(expected);
  });

  it("has a valid default and custom path for every track", () => {
    for (const track of EDUCATION_TRACKS) {
      const stages = ACADEMIC_STAGES_BY_TRACK[track.id];
      expect(stages.options.some((option) => option.id === stages.defaultStageId)).toBe(true);
      expect(stages.options.some((option) => option.id === "other")).toBe(true);
    }
  });

  it("resolves the explicit international medical track instead of falling back to SGU", () => {
    expect(resolveTrack("img").id).toBe("img");
  });
});
