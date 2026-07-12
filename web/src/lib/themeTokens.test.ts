import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const themeCss = readFileSync(new URL("../styles/theme.css", import.meta.url), "utf8");
const componentCss = readFileSync(new URL("../styles/components.css", import.meta.url), "utf8");
const globalCss = readFileSync(new URL("../styles/global.css", import.meta.url), "utf8");

function block(css: string, selector: string): string {
  const start = css.indexOf(selector);
  if (start < 0) return "";
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

describe("restrained semantic theme tokens", () => {
  it("keeps explicit gold while mapping ordinary interaction to cool-mineral tokens in both themes", () => {
    const dark = block(themeCss, ":root {");
    const light = block(themeCss, ':root[data-theme="light"]');
    expect(dark).toContain("--gold: #c8a96a");
    expect(dark).toContain("--cyan: var(--cool-accent)");
    expect(dark).toContain("--glass-card-border-hover: var(--neutral-border-hover)");
    expect(light).toContain("--cyan: var(--cool-accent)");
    expect(light).toContain("--glass-card-border-hover: var(--neutral-border-hover)");
  });

  it("uses neutral treatment for ordinary card hover and default metadata tags", () => {
    expect(block(componentCss, ".glass-card.hoverable:hover")).not.toContain("200,169,106");
    const tag = block(componentCss, ".tag {");
    expect(tag).toContain("var(--cool-accent-soft)");
    expect(tag).toContain("var(--cool-accent-line)");
  });

  it("allows only a one-shot shell luster instead of looping while idle", () => {
    expect(block(globalCss, ".shell::after")).toContain("animation: luster 1.8s ease-out 0.35s 1 both");
  });
});
