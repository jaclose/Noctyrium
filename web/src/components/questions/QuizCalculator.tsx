import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { GhostButton } from "../ui/primitives";
import { ICON_SIZE } from "../../lib/iconSize";

// Basic, keyboard-accessible calculator for the quiz toolkit (Q2a). Session
// scoped — no persistence, no history leaves the panel. Deliberately minimal:
// exam-realistic basic arithmetic, not a scientific suite.
const KEYS: string[][] = [
  ["C", "←", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
];
const OPS: Record<string, string> = { "÷": "/", "×": "*", "−": "-", "+": "+" };

function evaluate(expr: string): string {
  const cleaned = expr.replace(/[×]/g, "*").replace(/[÷]/g, "/").replace(/[−]/g, "-").replace(/%/g, "/100");
  if (!/^[-+*/.()\d\s]+$/.test(cleaned)) return "Error";
  try {
    const value = Function(`"use strict"; return (${cleaned})`)() as number;
    if (!Number.isFinite(value)) return "Error";
    return String(Math.round(value * 1e10) / 1e10);
  } catch {
    return "Error";
  }
}

export function QuizCalculator({ onClose }: { onClose: () => void }) {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const press = (k: string) => {
    if (k === "C") { setExpr(""); setResult(""); return; }
    if (k === "←") { setExpr((e) => e.slice(0, -1)); return; }
    if (k === "=") { setResult(evaluate(expr)); return; }
    setExpr((e) => e + (OPS[k] ? k : k));
  };

  useEffect(() => {
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (/^[0-9.]$/.test(e.key)) { setExpr((v) => v + e.key); e.preventDefault(); }
      else if (["+", "-", "*", "/"].includes(e.key)) {
        const disp = { "+": "+", "-": "−", "*": "×", "/": "÷" }[e.key]!;
        setExpr((v) => v + disp); e.preventDefault();
      } else if (e.key === "Enter" || e.key === "=") { setResult(evaluate(expr)); e.preventDefault(); }
      else if (e.key === "Backspace") { setExpr((v) => v.slice(0, -1)); e.preventDefault(); }
    }
    const node = panelRef.current;
    node?.addEventListener("keydown", onKey);
    return () => node?.removeEventListener("keydown", onKey);
  }, [expr, onClose]);

  return (
    <div className="quiz-calculator" ref={panelRef} role="dialog" aria-label="Calculator">
      <div className="quiz-calc-head">
        <span className="field-label">Calculator</span>
        <GhostButton className="icon-only" aria-label="Close calculator" onClick={onClose}><X size={ICON_SIZE.body} /></GhostButton>
      </div>
      <div className="quiz-calc-display" aria-live="polite">
        <div className="quiz-calc-expr">{expr || "0"}</div>
        {result !== "" && <div className="quiz-calc-result">= {result}</div>}
      </div>
      <div className="quiz-calc-keys">
        {KEYS.flat().map((k) => (
          <button
            type="button"
            key={k}
            className={`quiz-calc-key${k === "=" ? " span2 primary" : ""}${/[0-9.]/.test(k) ? "" : " op"}`}
            aria-label={k === "←" ? "Backspace" : k === "C" ? "Clear" : k}
            onClick={() => press(k)}
          >{k}</button>
        ))}
      </div>
    </div>
  );
}
