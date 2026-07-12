import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleDot, Clock3, Copy, Delete, Minus, ShieldCheck } from "lucide-react";
import { GlassCard, GButton } from "../components/ui/primitives";
import {
  buildDailyWordShare,
  DAILY_WORD_MAX_GUESSES,
  deriveDailyWordStats,
  millisecondsUntilNextCalendarDate,
  resolveTimeZone,
  scoreGuess,
  selectDailyWordAnswer,
  selectDailyWordPuzzle,
  type LetterEvaluation,
} from "../lib/dailyWord";
import { useClockNow } from "../lib/clock";
import { useStore } from "../lib/store";
import "../styles/daily-games.css";

interface WordData {
  answersForVersion: (version: string) => readonly string[] | undefined;
  allowed: ReadonlySet<string>;
  version: string;
  marker: string;
}

const KEYBOARD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"] as const;
const EVALUATION_LABEL: Record<LetterEvaluation, string> = {
  correct: "correct position",
  present: "present in word, wrong position",
  absent: "not in word",
};
const EVALUATION_RANK: Record<LetterEvaluation, number> = { absent: 1, present: 2, correct: 3 };

export function DailyWordPage() {
  const profile = useStore((state) => state.profile);
  const history = useStore((state) => state.dailyWordPuzzles);
  const upsertPuzzle = useStore((state) => state.upsertDailyWordPuzzle);
  const [words, setWords] = useState<WordData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("Enter a five-letter word.");
  const [manualShare, setManualShare] = useState("");
  const submitting = useRef(false);
  const manualShareRef = useRef<HTMLTextAreaElement>(null);
  const initializedPuzzleId = useRef<string>();
  const now = useClockNow("minute");
  const timeZone = resolveTimeZone(profile.timeZonePreference);

  useEffect(() => {
    let cancelled = false;
    import("../data/dailyWordWords")
      .then((module) => {
        if (cancelled) return;
        setWords({
          answersForVersion: module.dailyWordAnswersForVersion,
          allowed: new Set(module.DAILY_WORD_ALLOWED_GUESSES),
          version: module.WORD_LIST_VERSION,
          marker: module.DAILY_WORD_LIST_SENTINEL,
        });
      })
      .catch(() => { if (!cancelled) setLoadError("The local word list could not be opened."); });
    return () => { cancelled = true; };
  }, []);

  const selection = useMemo(() => words ? selectDailyWordPuzzle({
    history,
    now,
    timeZone,
    wordListVersion: words.version,
  }) : null, [history, now, timeZone, words]);
  const puzzle = selection?.puzzle;
  const puzzleAnswers = puzzle && words ? words.answersForVersion(puzzle.wordListVersion) : undefined;
  const answer = useMemo(
    () => puzzle && puzzleAnswers ? selectDailyWordAnswer(puzzle.puzzleId, puzzleAnswers) : "",
    [puzzle, puzzleAnswers],
  );
  const evaluations = useMemo(
    () => puzzle && answer ? puzzle.guesses.map((guess) => scoreGuess(guess, answer)) : [],
    [answer, puzzle],
  );
  const keyStates = useMemo(() => deriveKeyStates(puzzle?.guesses ?? [], evaluations), [evaluations, puzzle?.guesses]);
  const stats = useMemo(() => deriveDailyWordStats(history), [history]);
  const nextPuzzleCountdown = useMemo(
    () => puzzle?.completed ? formatCountdown(millisecondsUntilNextCalendarDate(now, puzzle.timezone)) : "",
    [now, puzzle?.completed, puzzle?.timezone],
  );

  useEffect(() => {
    if (selection?.created) upsertPuzzle(selection.puzzle);
  }, [selection?.created, selection?.puzzle, upsertPuzzle]);

  useEffect(() => {
    if (!puzzle || initializedPuzzleId.current === puzzle.puzzleId) return;
    initializedPuzzleId.current = puzzle.puzzleId;
    setDraft("");
    setManualShare("");
    setStatus(puzzle.completed
      ? puzzle.won ? `Solved in ${puzzle.guesses.length} guess${puzzle.guesses.length === 1 ? "" : "es"}.` : "Puzzle complete."
      : "Enter a five-letter word.");
  }, [puzzle]);

  // Keep the synchronous guard raised until the persisted puzzle update has
  // rendered. This blocks key-repeat/double-click submissions from appending
  // the same row twice through a stale render closure.
  useEffect(() => {
    submitting.current = false;
  }, [puzzle?.updatedAt]);

  useEffect(() => {
    if (!manualShare) return;
    manualShareRef.current?.focus();
    manualShareRef.current?.select();
  }, [manualShare]);

  const submit = useCallback(() => {
    if (!puzzle || !words || !answer || puzzle.completed || submitting.current) return;
    if (draft.length !== 5) {
      setStatus("Enter exactly five letters before submitting.");
      return;
    }
    if (!words.allowed.has(draft)) {
      setStatus(`${draft} is not in the local allowed-word list.`);
      return;
    }
    submitting.current = true;
    const guesses = [...puzzle.guesses, draft];
    const won = draft === answer;
    const completed = won || guesses.length >= DAILY_WORD_MAX_GUESSES;
    const timestamp = new Date().toISOString();
    upsertPuzzle({
      ...puzzle,
      guesses,
      won,
      completed,
      completedAt: completed ? timestamp : undefined,
      updatedAt: timestamp,
    });
    const row = scoreGuess(draft, answer);
    setDraft("");
    setManualShare("");
    setStatus(won
      ? `Correct. Solved in ${guesses.length} guess${guesses.length === 1 ? "" : "es"}.`
      : completed
        ? "Six guesses used. The puzzle is complete."
        : summarizeEvaluation(row));
  }, [answer, draft, puzzle, upsertPuzzle, words]);

  const enterLetter = useCallback((letter: string) => {
    if (!puzzle || puzzle.completed || !/^[A-Z]$/.test(letter)) return;
    setDraft((current) => current.length < 5 ? `${current}${letter}` : current);
  }, [puzzle]);

  const backspace = useCallback(() => {
    if (!puzzle || puzzle.completed) return;
    setDraft((current) => current.slice(0, -1));
  }, [puzzle]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof Element
        && target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return;
      if (/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        enterLetter(event.key.toUpperCase());
      } else if (event.key === "Backspace") {
        event.preventDefault();
        backspace();
      } else if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [backspace, enterLetter, submit]);

  async function shareResult() {
    if (!puzzle?.completed) return;
    const result = buildDailyWordShare(puzzle, evaluations);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(result);
      setManualShare("");
      setStatus("Result copied. The answer and guesses were not included.");
    } catch {
      setManualShare(result);
      setStatus("Clipboard unavailable. Copy the result from the manual-copy field.");
    }
  }

  if (loadError) return <GlassCard pad><h1>AXOM Daily Word</h1><p role="alert">{loadError}</p></GlassCard>;
  if (!words || !puzzle) return <div className="route-loading" role="status">Opening the local daily puzzle…</div>;
  if (!answer) {
    return (
      <GlassCard pad>
        <h1>AXOM Daily Word</h1>
        <p role="alert">This historical puzzle uses an unavailable dictionary version. Its saved guesses were preserved and were not rescored.</p>
      </GlassCard>
    );
  }

  return (
    <div className="daily-word-page" data-list-marker={words.marker}>
      <header className="daily-word-header">
        <div>
          <div className="eyebrow">Optional daily utility</div>
          <h1>AXOM Daily Word</h1>
          <p>A daily five-letter word puzzle.</p>
        </div>
        <div className="daily-word-date">
          <b>{puzzle.puzzleDate}</b>
          <span>{puzzle.timezone}</span>
        </div>
      </header>

      <GlassCard pad className="daily-word-board-card">
        <details className="daily-word-instructions">
          <summary>How to play</summary>
          <p>Submit a valid five-letter word in six guesses. A solid check means correct position, a ring means present elsewhere, and a dash means absent.</p>
        </details>

        <div className="daily-word-grid" role="grid" aria-label={`Six-row Daily Word puzzle for ${puzzle.puzzleDate}`}>
          {Array.from({ length: DAILY_WORD_MAX_GUESSES }, (_, rowIndex) => {
            const submitted = puzzle.guesses[rowIndex];
            const current = rowIndex === puzzle.guesses.length && !puzzle.completed ? draft : "";
            const letters = (submitted ?? current).padEnd(5, " ").slice(0, 5).split("");
            return (
              <div className="daily-word-row" role="row" aria-label={`Row ${rowIndex + 1}`} key={rowIndex}>
                {letters.map((letter, columnIndex) => {
                  const evaluation = submitted ? evaluations[rowIndex]?.[columnIndex] : undefined;
                  const label = evaluation
                    ? `Row ${rowIndex + 1}, column ${columnIndex + 1}, letter ${letter}, ${EVALUATION_LABEL[evaluation]}.`
                    : `Row ${rowIndex + 1}, column ${columnIndex + 1}, ${letter.trim() ? `letter ${letter}` : "blank"}.`;
                  return (
                    <div className={`daily-word-tile ${evaluation ?? ""} ${letter.trim() ? "filled" : ""}`} role="gridcell" aria-label={label} key={columnIndex}>
                      <span>{letter.trim()}</span>
                      {evaluation === "correct" && <Check size={12} aria-hidden="true" />}
                      {evaluation === "present" && <CircleDot size={11} aria-hidden="true" />}
                      {evaluation === "absent" && <Minus size={11} aria-hidden="true" />}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="daily-word-status" role="status" aria-live="polite" aria-atomic="true">{status}</div>

        <div className="daily-word-keyboard" role="group" aria-label="On-screen keyboard">
          {KEYBOARD_ROWS.map((row) => (
            <div className="daily-word-keyboard-row" key={row}>
              {row.split("").map((letter) => (
                <button
                  type="button"
                  className={`daily-word-key ${keyStates[letter] ?? "unknown"}`}
                  aria-label={`Letter ${letter}${keyStates[letter] ? `, ${EVALUATION_LABEL[keyStates[letter]!]}` : ""}`}
                  disabled={puzzle.completed}
                  onClick={() => enterLetter(letter)}
                  key={letter}
                >{letter}</button>
              ))}
            </div>
          ))}
          <div className="daily-word-keyboard-row actions">
            <button type="button" className="daily-word-key wide" disabled={puzzle.completed} onClick={submit}>Enter</button>
            <button type="button" className="daily-word-key wide" aria-label="Backspace" disabled={puzzle.completed} onClick={backspace}><Delete size={17} aria-hidden="true" /> Backspace</button>
          </div>
        </div>
      </GlassCard>

      {puzzle.completed && (
        <GlassCard pad className="daily-word-results">
          <div className="spread wrap gap8">
            <div>
              <h2>{puzzle.won ? "Puzzle solved" : "Puzzle complete"}</h2>
              <p className="sub">Answer: <b>{answer}</b>. The next puzzle appears after the calendar date changes in {puzzle.timezone}.</p>
            </div>
            <GButton onClick={shareResult}><Copy size={15} /> Share result</GButton>
          </div>
          <div className="daily-word-countdown" aria-label={`Time until the next Daily Word puzzle: ${nextPuzzleCountdown}`}>
            <Clock3 size={15} aria-hidden="true" />
            <span>Next puzzle in <b>{nextPuzzleCountdown}</b></span>
          </div>
          <div className="daily-word-stats" aria-label="Daily Word statistics">
            <Stat label="Played" value={stats.gamesPlayed} />
            <Stat label="Wins" value={stats.wins} />
            <Stat label="Current streak" value={stats.currentStreak} />
            <Stat label="Maximum streak" value={stats.maxStreak} />
          </div>
          <div className="daily-word-distribution">
            <h3>Guess distribution</h3>
            {Array.from({ length: DAILY_WORD_MAX_GUESSES }, (_, index) => index + 1).map((guess) => (
              <div className="daily-word-distribution-row" key={guess}>
                <span>{guess}</span><div><i style={{ width: `${distributionWidth(stats.guessDistribution[guess] ?? 0, stats.wins)}%` }} /></div><b>{stats.guessDistribution[guess] ?? 0}</b>
              </div>
            ))}
          </div>
          {manualShare && <label className="stack gap6"><span className="field-label">Manual copy result</span><textarea ref={manualShareRef} className="field" readOnly value={manualShare} /></label>}
          <div className="backup-note"><ShieldCheck size={15} /><span>Sharing contains only the date, score, and symbolic grid—never the answer, guesses, or personal data.</span></div>
        </GlassCard>
      )}
    </div>
  );
}

function deriveKeyStates(
  guesses: readonly string[],
  rows: readonly (readonly LetterEvaluation[])[],
): Partial<Record<string, LetterEvaluation>> {
  const result: Partial<Record<string, LetterEvaluation>> = {};
  guesses.forEach((guess, rowIndex) => guess.split("").forEach((letter, columnIndex) => {
    const next = rows[rowIndex]?.[columnIndex];
    if (!next) return;
    const current = result[letter];
    if (!current || EVALUATION_RANK[next] > EVALUATION_RANK[current]) result[letter] = next;
  }));
  return result;
}

function summarizeEvaluation(row: readonly LetterEvaluation[]) {
  const correct = row.filter((value) => value === "correct").length;
  const present = row.filter((value) => value === "present").length;
  return `${correct} correct ${correct === 1 ? "position" : "positions"}; ${present} present elsewhere.`;
}

function distributionWidth(value: number, wins: number) {
  if (!wins) return 0;
  return Math.max(value ? 8 : 0, Math.round((value / wins) * 100));
}

function formatCountdown(milliseconds: number): string {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  if (totalMinutes < 1) return "less than a minute";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div><b>{value}</b><span>{label}</span></div>;
}
