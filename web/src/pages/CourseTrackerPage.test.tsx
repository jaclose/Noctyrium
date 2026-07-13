// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../lib/brand";
import { makeSeed } from "../lib/seed";
import { useStore } from "../lib/store";
import { useToasts } from "../lib/toast";
import {
  announceCourseTrackerIntroOnce,
  CourseTrackerPage,
  extractTrackerImportFile,
  TRACKER_IMPORT_EXAMPLE,
} from "./CourseTrackerPage";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

beforeEach(() => {
  useStore.setState(makeSeed());
  useToasts.setState({ toasts: [] });
  vi.stubGlobal("localStorage", memoryStorage());
  vi.stubGlobal("prompt", vi.fn());
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Course Tracker comprehension layout", () => {
  it("places immediate import/add controls before a separate suggestions card and preserves tracker data", () => {
    const before = structuredClone(useStore.getState().tracker);
    const { container } = render(<CourseTrackerPage />);
    const utilities = screen.getByRole("complementary", { name: "Course Tracker utilities" });
    const workArea = screen.getByRole("region", { name: "Selected Course Tracker scope" });
    const importButton = within(utilities).getByRole("button", { name: "Import lectures or items" });
    const addButton = within(utilities).getByRole("button", { name: "Add course or module" });
    const suggestions = within(utilities).getByText("Suggested next moves").closest(".glass-card")!;

    expect(importButton.compareDocumentPosition(suggestions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(addButton.compareDocumentPosition(suggestions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(workArea).getByText("Items")).toBeTruthy();
    expect(container.querySelectorAll("[data-module-tour]").length).toBeGreaterThanOrEqual(5);
    expect(useStore.getState().tracker).toEqual(before);
  });

  it("opens import and module workflows immediately", () => {
    render(<CourseTrackerPage />);
    fireEvent.click(screen.getByRole("button", { name: "Import lectures or items" }));
    expect(screen.getByRole("dialog", { name: "Import tracker items" })).toBeTruthy();
    expect((screen.getByRole("textbox", { name: "Structured tracker import example" }) as HTMLTextAreaElement).value).toBe(TRACKER_IMPORT_EXAMPLE);
    expect(screen.getByText(/No GPT or provider is required/)).toBeTruthy();
    expect(screen.getByText(/sensitive or private information/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.click(screen.getByRole("button", { name: "Add course or module" }));
    expect(screen.getByRole("dialog", { name: "Add course module" })).toBeTruthy();
  });

  it("opens suggestions for inspection without mutating pass history", () => {
    const before = useStore.getState().tracker.map((item) => ({ id: item.id, passes: item.passes }));
    render(<CourseTrackerPage />);
    fireEvent.click(screen.getAllByRole("button", { name: "Open" })[0]);
    expect(useStore.getState().tracker.map((item) => ({ id: item.id, passes: item.passes }))).toEqual(before);
  });

  it("exposes a plain Help entry point and stable module-tour anchors", () => {
    const { container } = render(<CourseTrackerPage />);
    fireEvent.click(screen.getByRole("button", { name: "Help" }));
    expect(screen.getByText(/A short guide to importing, organizing, passes, weak items, and suggestions/)).toBeTruthy();
    expect(container.querySelector('[data-module-tour="tracker-import-add"]')).toBeTruthy();
    expect(container.querySelector('[data-module-tour="tracker-structure"]')).toBeTruthy();
    expect(container.querySelector('[data-module-tour="tracker-passes"]')).toBeTruthy();
    expect(container.querySelector('[data-module-tour="tracker-weak-items"]')).toBeTruthy();
    expect(container.querySelector('[data-module-tour="tracker-suggestions"]')).toBeTruthy();
    expect(screen.getByText("How passes work").closest("details")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start short tour" }));
    expect(screen.getByRole("dialog", { name: "Import or add" })).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Import or add" })).toBeNull();
    expect(useStore.getState().profile.promisePromptStatus).toBeUndefined();
  });

  it("uses utility/work-area regions that can stack without changing DOM order at mobile width", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    render(<CourseTrackerPage />);
    const utilities = screen.getByRole("complementary", { name: "Course Tracker utilities" });
    const workArea = screen.getByRole("region", { name: "Selected Course Tracker scope" });
    expect(utilities.compareDocumentPosition(workArea) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(utilities).getByRole("button", { name: "Import lectures or items" })).toBeTruthy();
  });
});

describe("Course Tracker local intro and file extraction", () => {
  it("shows the exact intro once and stores only its stable announcement id", () => {
    const storage = memoryStorage();
    const session = new Set<string>();
    const notify = vi.fn();

    expect(announceCourseTrackerIntroOnce({ storage, session, notify })).toBe(true);
    expect(announceCourseTrackerIntroOnce({ storage, session, notify })).toBe(false);
    expect(notify).toHaveBeenCalledOnce();
    expect(notify.mock.calls[0][0].body).toBe("Course Tracker keeps lectures, DLAs, practice questions, and passes in one place. Start by importing or adding a module.");
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.dismissedAnnouncements)!)).toEqual(["course-tracker-intro-v1"]);
  });

  it("uses an in-memory guard when device storage is blocked", () => {
    const storage = {
      getItem: vi.fn(() => { throw new Error("blocked"); }),
      setItem: vi.fn(() => { throw new Error("blocked"); }),
    };
    const session = new Set<string>();
    const notify = vi.fn();
    expect(announceCourseTrackerIntroOnce({ storage, session, notify })).toBe(true);
    expect(announceCourseTrackerIntroOnce({ storage, session, notify })).toBe(false);
    expect(notify).toHaveBeenCalledOnce();
  });

  it("routes a PDF through the production extractor seam and preserves its filename and warnings", async () => {
    const buffer = new Uint8Array([37, 80, 68, 70]).buffer;
    const file = { name: "course schedule.pdf", type: "application/pdf", arrayBuffer: vi.fn(async () => buffer) } as unknown as File;
    const pdfExtractor = vi.fn(async () => ({ pages: ["Week 1"], text: "Week 1", empty: false, warnings: ["review extraction"] }));

    const result = await extractTrackerImportFile(file, pdfExtractor);
    expect(pdfExtractor).toHaveBeenCalledWith(buffer);
    expect(result).toEqual({
      fileName: "course schedule.pdf",
      extraction: { pages: ["Week 1"], text: "Week 1", empty: false, warnings: ["review extraction"] },
    });
  });

  it("reads Markdown locally without a provider", async () => {
    const file = { name: "modules.md", type: "text/markdown", text: vi.fn(async () => "Week 1:\r\n- Cardiac cycle") } as unknown as File;
    await expect(extractTrackerImportFile(file)).resolves.toMatchObject({
      fileName: "modules.md",
      extraction: { text: "Week 1:\n- Cardiac cycle", warnings: [] },
    });
  });
});
