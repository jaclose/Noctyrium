// ===========================================================================
// Block Builder (layer 4) — saved, re-runnable custom blocks. Definitions are
// filters, not snapshots, so "missed only" blocks stay current as attempt
// history changes. Building happens in the runner's setup (Save as block).
// ===========================================================================
import { Play, Plus, Trash2, Boxes } from "lucide-react";
import { useStore } from "../../lib/store";
import { buildQuizPool, type QuizBlock } from "../../lib/quiz";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../ui/primitives";
import { ICON_SIZE } from "../../lib/iconSize";

export function BlockBuilder({ onRunBlock, onNewBlock }: {
  onRunBlock: (block: QuizBlock) => void;
  onNewBlock: () => void;
}) {
  const s = useStore();
  const blocks = s.quizBlocks ?? [];
  const questions = s.questions ?? [];

  return (
    <GlassCard>
      <PanelHeader
        title="Block Builder"
        sub="Saved block definitions — filters stay live, so a 'missed only' block always pulls your current misses."
        action={<GButton size="sm" variant="primary" onClick={onNewBlock}><Plus size={ICON_SIZE.body} /> New block</GButton>}
      />
      {blocks.length === 0 ? (
        <EmptyState
          icon={<Boxes size={ICON_SIZE.emphasis} />}
          title="No saved blocks yet"
          hint='Set up a tutor or exam block and use "Save as block" — it becomes a one-click rerun here.'
        />
      ) : (
        <div className="stack gap6">
          {blocks.map((block) => {
            const available = buildQuizPool(questions, { ...block.filters, count: 9999 }, s.questionSets ?? []).length;
            return (
              <div key={block.id} className="import-draft">
                <div className="row" style={{ gap: 8 }}>
                  <div className="grow stack" style={{ gap: 2, minWidth: 0 }}>
                    <span className="truncate" style={{ fontWeight: 600 }}>{block.title}</span>
                    <span className="sub truncate">
                      {block.mode} · {block.filters.count} questions · pool: {block.filters.status}
                      {block.filters.categories?.length ? ` · ${block.filters.categories.join(", ")}` : ""}
                      {block.filters.setIds?.length ? ` · ${block.filters.setIds.length} set${block.filters.setIds.length === 1 ? "" : "s"}` : ""}
                      {block.timed ? " · timed" : ""}
                      {block.lastRunAt ? ` · last run ${block.lastRunAt.slice(0, 10)}` : ""}
                    </span>
                  </div>
                  <Tag tone={available ? "green" : "orange"}>{available} match</Tag>
                  <GButton size="sm" variant="primary" disabled={!available} onClick={() => onRunBlock(block)}>
                    <Play size={ICON_SIZE.body} /> Run
                  </GButton>
                  <GhostButton aria-label={`Delete block ${block.title}`} onClick={() => s.removeQuizBlock(block.id)}>
                    <Trash2 size={ICON_SIZE.body} />
                  </GhostButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
