import { describe, expect, it } from "vitest";
import { mergeStates, parseImport, toPortableState } from "./backup";
import { makeSeed } from "./seed";

describe("portable backup safety", () => {
  it("round-trips notebook metadata, autosaved writing, and bounded local attachments on schema v32", () => {
    const state = makeSeed();
    state.profile.journalNotebook = {
      title: "Clinical notebook",
      subtitle: "Daily rounds",
      coverTone: "forest",
      paperTone: "cream",
    };
    state.journal = [{
      id: "journal-notebook-page",
      date: "2026-07-13T12:00:00.000Z",
      today: "Protected a focus block.",
      tomorrow: "Review renal questions.",
      blockers: "Late start.",
      energy: "Medium",
      rating: "Useful",
      freeWriting: "A local notebook paragraph.",
      wins: ["Finished the lecture"],
      losses: ["Carry flashcards"],
      attachments: [{
        id: "journal-image",
        name: "study-desk.png",
        type: "image/png",
        size: 4,
        createdAt: "2026-07-13T12:01:00.000Z",
        dataUrl: "data:image/png;base64,YXhvbQ==",
      }],
      dayAtAGlance: {
        hiddenSections: ["energy"],
        corrections: { focus: "75 min" },
        includedText: "Focused time: 75 min",
        includedAt: "2026-07-13T12:02:00.000Z",
      },
      notebookStatus: "draft",
      updatedAt: "2026-07-13T12:03:00.000Z",
    }];

    const parsed = parseImport(JSON.stringify({ _app: "AXOM", ...toPortableState(state) }));
    expect(parsed.schemaVersion).toBe(32);
    expect(parsed.profile.journalNotebook).toEqual(state.profile.journalNotebook);
    expect(parsed.journal).toEqual(state.journal);
    expect(JSON.stringify(parsed.journal)).not.toContain("https://");

    const merged = mergeStates(state, makeSeed());
    expect(merged.journal).toEqual(state.journal);
    expect(merged.profile.journalNotebook).toEqual(state.profile.journalNotebook);
  });

  it("round-trips additive dashboard layouts and preserves current layout on non-destructive merge", () => {
    const state = makeSeed();
    state.profile.dashboardLayout = {
      version: 1,
      preset: "custom",
      order: ["welcome", "todayScore", "future-widget"],
      hiddenWidgetIds: ["future-hidden"],
      widgets: {
        welcome: { size: "large", enabledFields: ["date", "quote"] },
        todayScore: { size: "extra-large", enabledFields: [], preferences: { style: "rings" } },
        "future-widget": { size: "medium", enabledFields: ["future-field"], futurePreference: { safe: true } },
      },
      dismissedExtraLargeRecommendation: true,
      updatedAt: "2026-07-13T12:00:00.000Z",
      futureLayoutField: "preserved",
    };

    const parsed = parseImport(JSON.stringify({ _app: "AXOM", ...toPortableState(state) }));
    expect(parsed.schemaVersion).toBe(32);
    expect(parsed.profile.dashboardLayout).toMatchObject(state.profile.dashboardLayout);
    const reparsed = parseImport(JSON.stringify({ _app: "AXOM", ...toPortableState(parsed) }));
    expect(reparsed.profile.dashboardLayout).toEqual(parsed.profile.dashboardLayout);

    const imported = makeSeed();
    imported.profile.dashboardLayout = {
      ...state.profile.dashboardLayout,
      preset: "study-heavy",
      order: ["questionBank"],
      widgets: { questionBank: { size: "large", enabledFields: ["due"] } },
    };
    expect(mergeStates(state, imported).profile.dashboardLayout).toEqual(state.profile.dashboardLayout);
  });

  it("round-trips a legacy AI widget preference without restoring it to current defaults", () => {
    const state = makeSeed();
    state.profile.dashboardWidgetOrder = ["aiActions", ...(state.profile.dashboardWidgetOrder ?? [])];
    state.profile.hiddenDashboardWidgets = ["aiActions"];
    const portable = toPortableState(state) as unknown as Record<string, unknown>;
    const profile = portable.profile as Record<string, unknown>;
    profile.dashboardWidgetOrder = [...(profile.dashboardWidgetOrder as string[]), "future-unknown-widget"];

    const restored = parseImport(JSON.stringify({ _app: "AXOM", ...portable }));
    expect(restored.profile.dashboardWidgetOrder?.[0]).toBe("aiActions");
    expect(restored.profile.dashboardWidgetOrder).not.toContain("future-unknown-widget");
    expect(restored.profile.hiddenDashboardWidgets).toEqual(["aiActions"]);
    expect(makeSeed().profile.dashboardWidgetOrder).not.toContain("aiActions");
  });

  it("round-trips versioned promise prompt suppression without a schema change", () => {
    const state = makeSeed();
    state.profile.promisePromptStatus = {
      state: "skipped",
      updatedAt: "2026-07-12T12:00:00.000Z",
      promptVersion: "promise-prompt-v1",
    };
    const parsed = parseImport(JSON.stringify({ _app: "AXOM", ...toPortableState(state) }));
    expect(parsed.schemaVersion).toBe(32);
    expect(parsed.profile.promisePromptStatus).toEqual(state.profile.promisePromptStatus);
  });

  it("round-trips optional daily-loop preferences without exporting delivery metadata", () => {
    const state = makeSeed();
    state.profile.dailyLoopReminders = {
      checkInEnabled: false,
      checkInTime: "09:15",
      closeoutEnabled: true,
      closeoutTime: "21:00",
      quietHoursEnabled: true,
      quietHoursStart: "23:00",
      quietHoursEnd: "06:30",
    };
    const portable = toPortableState(state) as unknown as Record<string, unknown>;
    expect(JSON.stringify(portable)).not.toContain("snoozedUntil");

    const parsed = parseImport(JSON.stringify({ _app: "AXOM", ...portable }));
    expect(parsed.schemaVersion).toBe(32);
    expect(parsed.profile.dailyLoopReminders).toEqual(state.profile.dailyLoopReminders);
  });

  it("keeps question-bank records and import diagnostics in the portable state", () => {
    const state = makeSeed();
    state.questions = [{
      id: "q1",
      source: "imported",
      stem: "Stem",
      options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }],
      correctKey: "B",
      correctAnswerText: "Beta",
      explanation: "Because beta.",
      status: "unseen",
      tags: [],
      attempts: [],
      extraction: {
        confidence: "high",
        reviewed: true,
        overallImportConfidence: 0.96,
        parserRuleIds: ["ANSWER.INLINE_LETTER_TEXT"],
        sourceSnippet: "Answer: B. Beta",
        questionSourceSnippet: "Stem\nA. Alpha\nB. Beta",
        questionSourcePage: 2,
        answerEvidenceSnippet: "Answer: B. Beta",
        answerEvidencePage: 7,
        explanationSourceSnippet: "Because beta.",
        explanationSourcePage: 8,
      },
      createdAt: "2026-07-10T00:00:00.000Z",
      updatedAt: "2026-07-10T00:00:00.000Z",
    }];
    const portable = toPortableState(state);
    expect(portable.questions[0].extraction?.sourceSnippet).toContain("Answer: B");
    expect(portable.questions[0].extraction).toMatchObject({
      questionSourcePage: 2,
      answerEvidencePage: 7,
      explanationSourcePage: 8,
    });
    expect(portable.questions[0].correctAnswerText).toBe("Beta");
    const restored = parseImport(JSON.stringify({ _app: "AXOM", ...portable }));
    expect(restored.questions[0].extraction).toMatchObject({
      questionSourceSnippet: "Stem\nA. Alpha\nB. Beta",
      answerEvidenceSnippet: "Answer: B. Beta",
      explanationSourceSnippet: "Because beta.",
      questionSourcePage: 2,
      answerEvidencePage: 7,
      explanationSourcePage: 8,
    });
  });

  it("round-trips question notes and annotation metadata", () => {
    const state = makeSeed();
    state.questions = [{
      id: "q-annotation", source: "manual", stem: "Highlight this text", options: [],
      status: "unseen", tags: [], attempts: [], notes: "Private learner note",
      annotations: [{
        id: "ann-1", target: "stem", startOffset: 10, endOffset: 14,
        exactText: "this", prefix: "Highlight ", suffix: " text", tone: "yellow",
        createdAt: "2026-07-16T10:00:00.000Z", updatedAt: "2026-07-16T10:00:00.000Z",
        sourceTextHash: "fnv1a-test", status: "active",
      }],
      createdAt: "2026-07-16T10:00:00.000Z", updatedAt: "2026-07-16T10:00:00.000Z",
    }];
    const restored = parseImport(JSON.stringify({ _app: "AXOM", ...toPortableState(state) }));
    expect(restored.questions[0].notes).toBe("Private learner note");
    expect(restored.questions[0].annotations).toEqual(state.questions[0].annotations);
  });

  it("merges annotation ids without duplication and keeps the later update", () => {
    const current = makeSeed();
    const base = {
      id: "q1", source: "manual" as const, stem: "Stem", options: [], status: "unseen" as const,
      tags: [], attempts: [], createdAt: "2026-07-16T09:00:00.000Z", updatedAt: "2026-07-16T12:00:00.000Z",
    };
    const annotation = {
      id: "ann-1", target: "stem" as const, startOffset: 0, endOffset: 4, exactText: "Stem",
      prefix: "", suffix: "", tone: "yellow" as const, createdAt: "2026-07-16T09:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z", sourceTextHash: "fnv1a-test", status: "active" as const,
    };
    current.questions = [{ ...base, annotations: [annotation] }];
    const imported = makeSeed();
    imported.questions = [{
      ...base,
      updatedAt: "2026-07-16T11:00:00.000Z",
      annotations: [{ ...annotation, tone: "cyan", updatedAt: "2026-07-16T11:00:00.000Z" }],
    }];
    const merged = mergeStates(current, imported);
    expect(merged.questions[0].annotations).toHaveLength(1);
    expect(merged.questions[0].annotations?.[0]).toMatchObject({ id: "ann-1", tone: "cyan" });
  });

  it("loads a legacy schema-v32 question without annotations unchanged", () => {
    const state = makeSeed();
    state.questions = [{
      id: "legacy", source: "manual", stem: "Legacy", options: [], status: "unseen",
      tags: [], attempts: [], createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
    }];
    const restored = parseImport(JSON.stringify({ ...toPortableState(state), schemaVersion: 32 }));
    expect(restored.questions[0].annotations).toBeUndefined();
    expect(restored.questions[0].stem).toBe("Legacy");
  });

  it("parses an exported payload without dropping question-bank collections", () => {
    const state = makeSeed();
    state.documents = [{
      id: "doc1", title: "Source", fileName: "source.txt", fileType: "text",
      uploadedAt: "2026-07-10T00:00:00.000Z", rawText: "text", sizeBytes: 4,
      checksum: "abc", tags: [], linkedQuestionSetIds: ["set1"], libraryOnly: false,
    }];
    state.questionSets = [{
      id: "set1", title: "Set", sourceDocumentIds: ["doc1"], createdAt: "2026-07-10T00:00:00.000Z",
      questionIds: [], tags: [], aiEnhanced: false, parserWarnings: [],
    }];
    const parsed = parseImport(JSON.stringify({ _app: "AXOM", ...toPortableState(state) }));
    expect(parsed.documents[0].checksum).toBe("abc");
    expect(parsed.questionSets[0].sourceDocumentIds).toEqual(["doc1"]);
  });

  it("merge import is additive, keeps the current profile, and lets newer records win", () => {
    const current = makeSeed();
    current.profile.name = "Current user";
    current.questions = [{
      id: "q1", source: "manual", stem: "Current stem", options: [], status: "unseen", tags: [], attempts: [],
      createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-02T00:00:00.000Z",
    }];
    const imported = makeSeed();
    imported.profile.name = "Imported user";
    imported.questions = [
      { ...current.questions[0], stem: "Older imported stem", updatedAt: "2026-07-01T00:00:00.000Z" },
      { ...current.questions[0], id: "q2", stem: "New question", updatedAt: "2026-07-03T00:00:00.000Z" },
    ];
    const merged = mergeStates(current, imported);
    expect(merged.profile.name).toBe("Current user");
    expect(merged.questions).toHaveLength(2);
    expect(merged.questions.find((question) => question.id === "q1")?.stem).toBe("Current stem");
    expect(merged.questions.find((question) => question.id === "q2")?.stem).toBe("New question");
  });

  it("merges unique attempt history for the same question instead of dropping the older side", () => {
    const current = makeSeed();
    current.questions = [{
      id: "q1", source: "manual", stem: "Current", options: [], status: "correct", tags: [],
      attempts: [{ at: "2026-07-01T00:00:00.000Z", status: "correct", answerKey: "A" }],
      createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-03T00:00:00.000Z",
    }];
    const imported = makeSeed();
    imported.questions = [{
      ...current.questions[0], stem: "Imported older", status: "incorrect",
      attempts: [{ at: "2026-07-02T00:00:00.000Z", status: "incorrect", answerKey: "B" }],
      updatedAt: "2026-07-02T00:00:00.000Z",
    }];
    const merged = mergeStates(current, imported);
    expect(merged.questions[0].stem).toBe("Current");
    expect(merged.questions[0].attempts.map((attempt) => attempt.answerKey)).toEqual(["A", "B"]);
  });

  it("upgrades a v31 portable import to v32 without erasing answer text", () => {
    const legacy = makeSeed() as unknown as Record<string, unknown>;
    legacy.schemaVersion = 31;
    legacy.questions = [{
      id: "q1", stem: "Legacy", options: [{ key: "A", text: "Alpha" }], correctKey: "B",
      correctAnswerText: "Legacy answer", extraction: { confidence: "medium", reviewed: false },
      source: "manual", status: "unseen", tags: [], attempts: [],
      createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
    }];
    const parsed = parseImport(JSON.stringify(legacy));
    expect(parsed.schemaVersion).toBe(32);
    expect(parsed.questions[0].correctAnswerText).toBe("Legacy answer");
    expect(parsed.questions[0].extraction?.overallImportConfidence).toBe(0.65);
  });

  it("round-trips Daily Games history and shared clock preferences without enabling legacy imports", () => {
    const state = makeSeed();
    state.profile.experimentalFlags = { habits: true, dailyGames: true };
    state.profile.dailyGamesCollapsed = true;
    state.profile.timeZonePreference = { mode: "custom", customTimezone: "America/Grenada" };
    state.profile.clockPreferences = {
      enabled: false,
      showDigital: true,
      showAnalog: true,
      showDigitalSeconds: true,
      showAnalogSeconds: false,
      showDate: true,
      showTimezoneLabel: true,
      hourCycle: "24",
    };
    state.dailyWordPuzzles = [{
      puzzleId: "daily-word:general-1:2026-07-12",
      puzzleDate: "2026-07-12",
      timezone: "America/Grenada",
      wordListVersion: "general-1",
      guesses: ["apple"],
      completed: false,
      won: false,
      startedAt: "2026-07-12T10:00:00.000Z",
      updatedAt: "2026-07-12T10:01:00.000Z",
    }];

    const parsed = parseImport(JSON.stringify({ _app: "AXOM", ...toPortableState(state) }));
    expect(parsed.profile.experimentalFlags).toEqual({ habits: true, dailyGames: true });
    expect(parsed.profile.dailyGamesCollapsed).toBe(true);
    expect(parsed.profile.timeZonePreference).toEqual({ mode: "custom", customTimezone: "America/Grenada" });
    expect(parsed.profile.clockPreferences?.hourCycle).toBe("24");
    expect(parsed.dailyWordPuzzles).toMatchObject([{
      puzzleId: "daily-word:general-1:2026-07-12",
      guesses: ["APPLE"],
    }]);

    const legacy = toPortableState(makeSeed()) as unknown as Record<string, unknown>;
    const legacyProfile = { ...(legacy.profile as Record<string, unknown>) };
    delete legacyProfile.experimentalFlags;
    delete legacyProfile.timeZonePreference;
    delete legacyProfile.clockPreferences;
    legacy.profile = legacyProfile;
    delete legacy.dailyWordPuzzles;
    const normalizedLegacy = parseImport(JSON.stringify(legacy));
    expect(normalizedLegacy.profile.experimentalFlags?.dailyGames).toBe(false);
    expect(normalizedLegacy.dailyWordPuzzles).toEqual([]);
  });

  it("merges Daily Word puzzles once by puzzleId and deterministically prefers completed progress", () => {
    const current = makeSeed();
    current.profile.experimentalFlags = { dailyGames: false };
    current.profile.timeZonePreference = { mode: "system" };
    current.dailyWordPuzzles = [{
      puzzleId: "daily-word:general-1:2026-07-12",
      puzzleDate: "2026-07-12",
      timezone: "America/Grenada",
      wordListVersion: "general-1",
      guesses: ["APPLE", "BERRY"],
      completed: false,
      won: false,
      startedAt: "2026-07-12T10:00:00.000Z",
      updatedAt: "2026-07-12T10:05:00.000Z",
    }];
    const imported = makeSeed();
    imported.profile.experimentalFlags = { dailyGames: true };
    imported.profile.timeZonePreference = { mode: "custom", customTimezone: "UTC" };
    imported.dailyWordPuzzles = [{
      ...current.dailyWordPuzzles[0],
      guesses: ["APPLE", "BERRY", "CHIME"],
      completed: true,
      won: true,
      completedAt: "2026-07-12T10:04:00.000Z",
      updatedAt: "2026-07-12T10:04:00.000Z",
    }];

    const merged = mergeStates(current, imported);
    expect(merged.dailyWordPuzzles).toHaveLength(1);
    expect(merged.dailyWordPuzzles[0]).toMatchObject({ completed: true, won: true, guesses: ["APPLE", "BERRY", "CHIME"] });
    // Merge imports intentionally keep current profile/preferences.
    expect(merged.profile.experimentalFlags?.dailyGames).toBe(false);
    expect(merged.profile.timeZonePreference).toEqual({ mode: "system" });

    const reverse = mergeStates(imported, current);
    expect(reverse.dailyWordPuzzles).toEqual(merged.dailyWordPuzzles);
  });

  it("round-trips daily requirements, saved Pomodoro presets, and academic stage", () => {
    const state = makeSeed();
    state.profile.academicStageId = "dedicated-board-prep";
    state.profile.customAcademicStage = undefined;
    state.profile.dailySuccess = {
      version: 1,
      configuredAt: "2026-07-12",
      requirements: [{
        id: "req-questions",
        label: "Practice questions",
        enabled: true,
        source: { kind: "practice-questions" },
        aliases: ["UWorld block"],
        excludedSourceRecordIds: ["wrong-match-log"],
        includedSourceRecordIds: ["reassigned-log"],
        weight: 2,
        manualContributions: [{
          id: "manual-questions",
          requirementId: "req-questions",
          dayKey: "2026-07-12",
          value: 15,
          unit: "questions",
          mode: "override",
          createdAt: "2026-07-12T12:00:00.000Z",
          updatedAt: "2026-07-12T12:00:00.000Z",
        }],
        target: 20,
        unit: "questions",
        schedule: { kind: "weekdays", weekdays: [1, 3, 5] },
        trackingStartsAt: "2026-07-12",
        createdAt: "2026-07-12T12:00:00.000Z",
        updatedAt: "2026-07-12T12:00:00.000Z",
      }],
    };
    state.profile.pomodoroPreferences = {
      autoStartBreak: false,
      autoStartFocus: true,
      savedPresets: [{
        id: "preset-deep",
        label: "Deep 90",
        focus: 90,
        break: 20,
        longBreak: 30,
        cyclesBeforeLongBreak: 2,
        intention: "No tabs",
        createdAt: "2026-07-12T12:00:00.000Z",
        updatedAt: "2026-07-12T12:00:00.000Z",
        useCount: 4,
        lastUsedAt: "2026-07-12T13:00:00.000Z",
      }],
    };

    const parsed = parseImport(JSON.stringify({ _app: "AXOM", ...toPortableState(state) }));
    expect(parsed.profile.academicStageId).toBe("dedicated-board-prep");
    expect(parsed.profile.dailySuccess?.requirements).toHaveLength(1);
    expect(parsed.profile.dailySuccess?.requirements[0]).toMatchObject({
      id: "req-questions",
      target: 20,
      aliases: ["UWorld block"],
      excludedSourceRecordIds: ["wrong-match-log"],
      includedSourceRecordIds: ["reassigned-log"],
      weight: 2,
      trackingStartsAt: "2026-07-12",
      schedule: { kind: "weekdays", weekdays: [1, 3, 5] },
    });
    expect(parsed.profile.dailySuccess?.requirements[0].manualContributions).toEqual([
      expect.objectContaining({
        id: "manual-questions",
        requirementId: "req-questions",
        dayKey: "2026-07-12",
        value: 15,
        mode: "override",
      }),
    ]);
    const reparsed = parseImport(JSON.stringify({ _app: "AXOM", ...toPortableState(parsed) }));
    expect(reparsed.profile.dailySuccess).toEqual(parsed.profile.dailySuccess);
    expect(parsed.profile.pomodoroPreferences?.savedPresets).toHaveLength(1);
    expect(parsed.profile.pomodoroPreferences?.savedPresets[0]).toMatchObject({
      id: "preset-deep", focus: 90, break: 20, longBreak: 30, cyclesBeforeLongBreak: 2, useCount: 4,
    });
    expect(parsed.profile.pomodoroPreferences?.autoStartFocus).toBe(true);

    // A legacy import without the new optional fields hydrates without inventing them.
    const legacy = makeSeed();
    delete (legacy.profile as Partial<typeof legacy.profile>).dailySuccess;
    delete (legacy.profile as Partial<typeof legacy.profile>).pomodoroPreferences;
    delete (legacy.profile as Partial<typeof legacy.profile>).academicStageId;
    const parsedLegacy = parseImport(JSON.stringify({ _app: "AXOM", ...toPortableState(legacy) }));
    expect(parsedLegacy.profile.dailySuccess).toBeUndefined();
    expect(parsedLegacy.profile.academicStageId).toBeUndefined();

    // Merge keeps the current device's requirements/presets and duplicates nothing.
    const merged = mergeStates(state, parsedLegacy);
    expect(merged.profile.dailySuccess?.requirements).toHaveLength(1);
    expect(merged.profile.pomodoroPreferences?.savedPresets).toHaveLength(1);
  });
});
