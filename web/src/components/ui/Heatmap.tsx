import { heatColor, lastNDays, isoDate, dayTotals } from "../../lib/scoring";
import type { StudyLog } from "../../lib/types";

// 56-day calendar heatmap — ported from the Swift Heatmap. Cells are clickable.
export function Heatmap({
  logs, onPick,
}: {
  logs: StudyLog[];
  onPick?: (key: string) => void;
}) {
  const days = lastNDays(56);
  return (
    <div className="heatmap">
      {days.map((d) => {
        const key = isoDate(d);
        const { minutes, cards } = dayTotals(logs, key);
        const crown = minutes >= 480 || cards >= 350;
        const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        return (
          <div
            key={key}
            className="heat-cell"
            style={{ background: heatColor(minutes, cards) }}
            title={`${label}: ${minutes} min, ${cards} cards — click to open`}
            onClick={() => onPick?.(key)}
          >
            {crown ? "👑" : ""}
          </div>
        );
      })}
    </div>
  );
}
