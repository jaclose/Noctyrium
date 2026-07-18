// ===========================================================================
// Q2b-3: tag management. Rename, merge duplicates, and remove tags with live
// counts. Tags are already canonical on records, so counts are exact and a tag
// that reaches zero questions simply disappears — no orphan registry to prune.
// ===========================================================================
import { useMemo, useState } from "react";
import { GitMerge, Pencil, Trash2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { GButton, GhostButton, EmptyState } from "../ui/primitives";
import { ICON_SIZE } from "../../lib/iconSize";
import { useStore } from "../../lib/store";
import { computeTagCounts, normalizeTag } from "../../lib/questionTags";
import type { QuestionRecord } from "../../lib/questions";

export function QuestionTagManager({
  questions,
  onClose,
}: {
  questions: readonly QuestionRecord[];
  onClose: () => void;
}) {
  const s = useStore();
  const counts = useMemo(() => computeTagCounts(questions), [questions]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mergeTarget, setMergeTarget] = useState("");
  const [status, setStatus] = useState("");

  function toggle(tag: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function rename(tag: string) {
    const next = typeof window !== "undefined" ? window.prompt(`Rename "${tag}" to:`, tag) : null;
    if (next === null) return;
    const target = normalizeTag(next);
    if (!target || target === tag) return;
    s.renameTag(tag, target);
    setStatus(`Renamed "${tag}" to "${target}".`);
  }

  function remove(tag: string, count: number) {
    const ok = typeof window === "undefined"
      ? true
      : window.confirm(`Remove "${tag}" from ${count} question${count === 1 ? "" : "s"}? The questions are kept.`);
    if (!ok) return;
    s.removeTag(tag);
    setSelected((prev) => { const next = new Set(prev); next.delete(tag); return next; });
    setStatus(`Removed "${tag}".`);
  }

  function mergeSelected() {
    const target = normalizeTag(mergeTarget);
    const from = [...selected].filter((tag) => tag !== target);
    if (!target || from.length === 0) return;
    s.mergeTags(from, target);
    setStatus(`Merged ${from.length} tag${from.length === 1 ? "" : "s"} into "${target}".`);
    setSelected(new Set());
    setMergeTarget("");
  }

  const mergeReady = normalizeTag(mergeTarget).length > 0 && [...selected].some((tag) => tag !== normalizeTag(mergeTarget));

  return (
    <Modal title="Manage tags" onClose={onClose} className="qb-tag-manager-modal">
      <div className="stack gap12">
        <span className="sub" role="status" aria-live="polite">{status || `${counts.length} tag${counts.length === 1 ? "" : "s"} in use.`}</span>

        {selected.size > 0 && (
          <div className="qb-tag-merge-bar">
            <GitMerge size={ICON_SIZE.body} aria-hidden="true" />
            <span className="sub">{selected.size} selected →</span>
            <input
              className="field grow"
              placeholder="merge into tag…"
              aria-label="Merge selected tags into"
              value={mergeTarget}
              list="qb-tag-merge-options"
              onChange={(event) => setMergeTarget(event.target.value)}
            />
            <datalist id="qb-tag-merge-options">
              {counts.map((entry) => <option key={entry.tag} value={entry.tag} />)}
            </datalist>
            <GButton size="sm" variant="primary" disabled={!mergeReady} onClick={mergeSelected}>Merge</GButton>
            <GhostButton onClick={() => setSelected(new Set())}>Clear</GhostButton>
          </div>
        )}

        {counts.length === 0 ? (
          <EmptyState title="No tags yet" hint="Add tags to questions from the bulk toolbar or a question's detail." />
        ) : (
          <ul className="qb-tag-manager-list" aria-label="Tags in use">
            {counts.map((entry) => (
              <li key={entry.tag} className={`qb-tag-manager-row ${selected.has(entry.tag) ? "selected" : ""}`}>
                <label className="qb-tag-manager-select">
                  <input
                    type="checkbox"
                    checked={selected.has(entry.tag)}
                    onChange={() => toggle(entry.tag)}
                    aria-label={`Select "${entry.tag}" for merge`}
                  />
                  <span className="qb-tag-manager-name">{entry.tag}</span>
                </label>
                <span className="qb-tag-manager-count sub">{entry.count}</span>
                <GhostButton className="icon-only" aria-label={`Rename "${entry.tag}"`} onClick={() => rename(entry.tag)}>
                  <Pencil size={ICON_SIZE.body} />
                </GhostButton>
                <GhostButton className="icon-only" aria-label={`Remove "${entry.tag}"`} onClick={() => remove(entry.tag, entry.count)}>
                  <Trash2 size={ICON_SIZE.body} />
                </GhostButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
