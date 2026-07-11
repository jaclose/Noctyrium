// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AxomBrandLockup, AxomWordmark } from "./BrandMark";

afterEach(cleanup);

describe("AXOM wordmark", () => {
  it("renders the scalable lettering geometry with an accessible name", () => {
    const { container } = render(<AxomWordmark />);
    const wordmark = screen.getByRole("img", { name: "AXOM" });

    expect(wordmark.getAttribute("viewBox")).toBe("0 0 410 92");
    expect(wordmark.querySelector("path.axom-wordmark__lettering")).not.toBeNull();
    expect(wordmark.querySelector("circle.axom-wordmark__lettering")).not.toBeNull();
    expect(container.textContent).toBe("");
  });

  it("keeps the symbol decorative beside the labeled wordmark", () => {
    const { container, rerender } = render(<AxomBrandLockup />);
    const svgs = container.querySelectorAll("svg");

    expect(screen.getAllByRole("img", { name: "AXOM" })).toHaveLength(1);
    expect(svgs[0]?.getAttribute("aria-hidden")).toBe("true");

    rerender(<AxomBrandLockup showWordmark={false} />);
    expect(screen.getByRole("img", { name: "AXOM" })).not.toBeNull();
  });
});
