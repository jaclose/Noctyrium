// ===========================================================================
// Bank Browser (rehaul phase 5/7) — searchable, filterable question bank with
// bulk category/tag editing and selection. Text search across stems/options/
// topics; category + status filters; multi-select → bulk assign category,
// add/replace tags. Deletion is never silent — handled elsewhere with confirm.
// ===========================================================================
import { useMemo, useState } from "react";
import { Search, SquareCheck, Square, Tags } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  filterForMode, MODE_META, QUESTION_CATEGORIES,
  type QuestionMode, type QuestionRecord,
} from "../../lib/questions";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../ui/primitives";
import { Field, SelectField } from "../ui/Modal";
import { pushToast } from "../../lib/toast";

const MODES = Object.keys(MODE_META) as QuestionMode[];
const NO_QUESTIONS: QuestionRecord[] = [];

export function BankBrowser({ onOpen }: { onOpen: (q: QuestionRecord) => void }) {
  const s = useStore();
  const questions = s.questions ?? NO_QUESTIONS;
  const [mode, setMode] = useState<QuestionMode | "all">("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkTags, setBulkTags] = useState("");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const q of questions) if (q.category) set.add(q.category);
    return [...set].sort();
  }, [questions]);

  const filtered = useMemo(() => {
    let pool = mode === "all" ? questions : filterForMode(questions, mode);
    if (category) pool = pool.filter((q) => q.category === category);
    const term = query.trim().toLowerCase();
    if (term) {
      pool = pool.filter((q) =>
        q.stem.toLowerCase().includes(term)
        || q.options.some((o) => o.text.toLowerCase().includes(term))
        || q.topic?.toLowerCase().includes(term)
        || q.bank?.toLowerCase().includes(term)
        || q.tags.some((t) => t.toLowerCase().includes(term)));
    }
    return pool;
  }, [questions, mode, category, query]);

  const visible = filtered.slice(0, 80);
  const allVisibleSelected = visible.length > 0 && visible.every((q) => selected.has(q.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) => {
      if (allVisibleSelected) return new Set([...prev].filter((id) => !visible.some((q) => q.id === id)));
      const next = new Set(prev);
      for (const q of visible) next.add(q.id);
      return next;
    });
  }
  function applyBulk() {
    const ids = [...selected];
    if (!ids.length) return;
    const tags = bulkTags.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
    s.bulkUpdateQuestions(ids, {
      category: bulkCategory || undefined,
      addTags: tags.length ? tags : undefined,
    });
    pushToast({ title: `Updated ${ids.length} question${ids.length === 1 ? "" : "s"}`, tone: "success" });
    setSelected(new Set());
    setBulkCategory("");
    setBulkTags("");
  }

  return (
    <GlassCard>
      <PanelHeader
        title="Browse the bank"
        sub="Search, filter, and bulk-edit. Modes filter by what each attempt recorded."
        action={
          <div className="row" style={{ gap: 6 }}>
            <GhostButton onClick={toggleAll}>
              {allVisibleSelected ? <SquareCheck size={14} /> : <Square size={14} />} {allVisibleSelected ? "Clear" : "Select shown"}
            </GhostButton>
          </div>
        }
      />

      <div className="row" style={{ gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <div className="row grow" style={{ gap: 6, minWidth: 220 }}>
          <Search size={15} className="dim" />
          <input className="field grow" placeholder="Search stems, options, topics, tags…" aria-label="Search question bank"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {categories.length > 0 && (
          <select className="field" style={{ width: "auto" }} aria-label="Filter by category"
            value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      <div className="row" style={{ flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        <button className={`filter-pill ${mode === "all" ? "on" : ""}`} onClick={() => setMode("all")}>All ({questions.length})</button>
        {MODES.map((m) => {
          const meta = MODE_META[m];
          const count = filterForMode(questions, m).length;
          return (
            <button key={m} className={`filter-pill ${mode === m ? "on" : ""}`} disabled={!meta.ready} title={meta.note}
              onClick={() => meta.ready && setMode(m)}>
              {meta.label}{meta.ready ? ` (${count})` : " · soon"}
            </button>
          );
        })}
      </div>

      {selected.size > 0 && (
        <div className="import-draft" style={{ marginBottom: 10 }}>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <Tag tone="cyan"><Tags size={12} /> {selected.size} selected</Tag>
            <SelectField label="" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
              <option value="">Set category…</option>
              {QUESTION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectField>
            <Field label="" placeholder="add tags (comma-separated)" value={bulkTags} onChange={(e) => setBulkTags(e.target.value)} />
            <GButton size="sm" variant="primary" disabled={!bulkCategory && !bulkTags.trim()} onClick={applyBulk}>Apply to {selected.size}</GButton>
            <GhostButton onClick={() => setSelected(new Set())}>Cancel</GhostButton>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={questions.length === 0 ? "No questions yet" : "Nothing matches"}
          hint={questions.length === 0
            ? "Import questions in the Import Center — misses become review items and repair cards."
            : "Adjust the search or filters."}
        />
      ) : (
        <div className="stack gap6">
          {visible.map((q) => (
            <div key={q.id} className={`question-row ${selected.has(q.id) ? "selected" : ""}`}>
              <button className="qrow-check" aria-label={selected.has(q.id) ? "Deselect" : "Select"} onClick={() => toggle(q.id)}>
                {selected.has(q.id) ? <SquareCheck size={15} /> : <Square size={15} className="dim" />}
              </button>
              <button className="grow truncate qrow-open" onClick={() => onOpen(q)}>{q.stem}</button>
              {q.needsReview && <Tag tone="red">review</Tag>}
              {q.marked && <Tag tone="purple">marked</Tag>}
              {q.category && <Tag tone="neutral">{q.category}</Tag>}
              {!q.category && q.topic && <Tag tone="neutral">{q.topic}</Tag>}
              <Tag tone={q.status === "correct" ? "green" : q.status === "incorrect" ? "red" : q.status === "unseen" ? "cyan" : "orange"}>
                {q.status}
              </Tag>
            </div>
          ))}
          {filtered.length > visible.length && <div className="sub">Showing {visible.length} of {filtered.length}. Refine the search to see more.</div>}
        </div>
      )}
    </GlassCard>
  );
}
