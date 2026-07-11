// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Modal } from "./Modal";

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open editor</button>
      {open && (
        <Modal title="Edit mapping" onClose={() => setOpen(false)} footer={<button>Save mapping</button>}>
          <input aria-label="Answer key" />
        </Modal>
      )}
    </>
  );
}

describe("Modal keyboard accessibility", () => {
  it("moves focus inside, traps Tab, closes on Escape, and restores the opener", () => {
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Open editor" });
    opener.focus();
    fireEvent.click(opener);

    const close = screen.getByRole("button", { name: "Close" });
    const save = screen.getByRole("button", { name: "Save mapping" });
    expect(document.activeElement).toBe(close);

    save.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(save);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});
