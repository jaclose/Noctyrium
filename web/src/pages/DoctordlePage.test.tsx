// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DoctordlePage } from "./DoctordlePage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Doctordle WIP boundary", () => {
  it("is accessible and contains no executable integration surface", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { container } = render(<DoctordlePage />);

    expect(screen.getByRole("heading", { level: 1, name: "Doctordle" })).toBeTruthy();
    expect(screen.getByText(/Integration pending collaboration approval/i)).toBeTruthy();
    expect(screen.getByText("WIP")).toBeTruthy();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("a[href]")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
