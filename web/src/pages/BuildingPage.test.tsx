// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BuildingPage } from "./BuildingPage";
afterEach(cleanup);
describe("Building preview", () => {
  it("labels concepts honestly and exposes the system map", () => {
    render(<BuildingPage />);
    expect(screen.getByText(/direction, not shipped capability/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Systems" }));
    expect(screen.getByRole("heading", { name: "Accounts & Sync" })).toBeTruthy();
    expect(screen.getAllByText("RESEARCH").length).toBeGreaterThan(1);
    expect(screen.queryByRole("button", { name: /launch|open|try/i })).toBeNull();
  });
});
