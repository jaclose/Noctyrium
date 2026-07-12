// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeSeed } from "../lib/seed";
import { useStore } from "../lib/store";
import { ProductivityPage } from "./ProductivityPage";

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    disconnect() {}
    unobserve() {}
  });
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  useStore.setState(makeSeed());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ProductivityPage daily console", () => {
  it("starts neutral and logs a practice-question quantity through the fast path", () => {
    render(<ProductivityPage />);
    expect(screen.getByText("No requirements selected")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Activity"), { target: { value: "Practice questions" } });
    fireEvent.change(screen.getByLabelText("Duration in minutes"), { target: { value: "25" } });
    fireEvent.change(screen.getByLabelText("Quantity type"), { target: { value: "questions" } });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Log" }));

    expect(useStore.getState().logs[0]).toMatchObject({
      type: "Practice questions",
      minutes: 25,
      cards: 0,
      quantity: 30,
      quantityKind: "questions",
    });
  });

  it("accepts a named completion without inventing minutes or cards", () => {
    render(<ProductivityPage />);
    fireEvent.change(screen.getByLabelText("Activity"), { target: { value: "Prayer" } });
    fireEvent.click(screen.getByRole("button", { name: "Log" }));
    expect(useStore.getState().logs[0]).toMatchObject({
      type: "Prayer",
      minutes: 0,
      cards: 0,
      unitType: "yesno",
      quantity: 1,
    });
  });

  it("keeps historical views read-only", () => {
    render(<ProductivityPage />);
    fireEvent.click(screen.getByRole("button", { name: "Yesterday" }));
    expect(screen.queryByLabelText("Activity")).toBeNull();
    expect(screen.getByText("History is read-only.")).toBeTruthy();
    expect(useStore.getState().logs).toHaveLength(0);
  });
});
