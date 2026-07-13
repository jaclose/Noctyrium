// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PromisePrompt } from "./PromisePrompt";

afterEach(cleanup);

describe("PromisePrompt", () => {
  it("presents the AXOM promise honestly and keeps all three choices available", () => {
    const onSign = vi.fn();
    const onReviewLater = vi.fn();
    const onSkip = vi.fn();
    render(<PromisePrompt onSign={onSign} onReviewLater={onReviewLater} onSkip={onSkip} />);

    expect(screen.getByRole("dialog", { name: "A promise to yourself" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "AXOM" })).toBeTruthy();
    expect(screen.getByText(/not a legal contract/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sign now" }));
    fireEvent.click(screen.getByRole("button", { name: "Review later" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(onSign).toHaveBeenCalledOnce();
    expect(onReviewLater).toHaveBeenCalledOnce();
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("treats Escape as Review later and restores the prior focus", () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const onReviewLater = vi.fn();
    const view = render(<PromisePrompt onSign={() => {}} onReviewLater={onReviewLater} onSkip={() => {}} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onReviewLater).toHaveBeenCalledOnce();
    view.unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
