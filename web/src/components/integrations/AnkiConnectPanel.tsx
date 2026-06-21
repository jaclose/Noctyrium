// Anki integration via AnkiConnect. Connects to the local Anki app, shows
// today's reviews + deck stats, and syncs review counts into the productivity
// log (only the new reviews since the last sync, so it never double-counts).
import { useEffect, useState } from "react";
import { Layers, Plug, RefreshCw, CheckCircle2, AlertTriangle, Wand2, ExternalLink, Copy } from "lucide-react";
import { useStore } from "../../lib/store";
import { GlassCard, GButton, PanelHeader, Tag } from "../ui/primitives";
import {
  AnkiError, DEFAULT_ANKI_ENDPOINT, fetchAnkiSnapshot, getAnkiAutoSync, getAnkiEndpoint,
  setAnkiAutoSync, setAnkiEndpoint, pendingSyncDelta, commitSync, alreadySyncedToday,
} from "../../lib/ankiConnect";
import type { AnkiSnapshot } from "../../lib/ankiConnect";

type Status = "idle" | "connecting" | "connected" | "error";

export function AnkiConnectPanel() {
  const logStudy = useStore((s) => s.logStudy);
  const [endpoint, setEndpointState] = useState(getAnkiEndpoint());
  const [status, setStatus] = useState<Status>("idle");
  const [snapshot, setSnapshot] = useState<AnkiSnapshot | null>(null);
  const [error, setError] = useState<{ message: string; kind: AnkiError["kind"] } | null>(null);
  const [autoSync, setAutoSyncState] = useState(getAnkiAutoSync());
  const [syncNote, setSyncNote] = useState("");
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "your origin";
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  const localEndpoint = /^https?:\/\/(127\.0\.0\.1|localhost)/i.test(endpoint);
  const mixedContentRisk = isHttps && localEndpoint && endpoint.startsWith("http://");
  const corsListPatch = JSON.stringify(["http://localhost", "http://localhost:5173", "http://127.0.0.1:5173", origin], null, 2);

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied((current) => (current === label ? "" : current)), 2500);
    } catch {
      setCopied("");
    }
  }

  async function connect(silentSync = autoSync) {
    setStatus("connecting");
    setError(null);
    setSyncNote("");
    setAnkiEndpoint(endpoint);
    try {
      const snap = await fetchAnkiSnapshot(endpoint);
      setSnapshot(snap);
      setStatus("connected");
      if (silentSync) doSync(snap.today, true);
    } catch (err) {
      const e = err as AnkiError;
      setError({ message: e.message, kind: e.kind ?? "network" });
      setStatus("error");
    }
  }

  function doSync(reviewsToday: number, silent = false) {
    const delta = pendingSyncDelta(reviewsToday);
    if (delta <= 0) {
      if (!silent) setSyncNote(`Already up to date — ${alreadySyncedToday()} review${alreadySyncedToday() === 1 ? "" : "s"} synced today.`);
      return;
    }
    logStudy({ type: "Anki", cards: delta, note: "Anki review sync" });
    commitSync(reviewsToday);
    setSyncNote(`Logged ${delta} review${delta === 1 ? "" : "s"} to today's productivity.`);
  }

  async function refresh() {
    setBusy(true);
    try { await connect(false); } finally { setBusy(false); }
  }

  // Reflect the manual auto-sync toggle to storage.
  useEffect(() => { setAnkiAutoSync(autoSync); }, [autoSync]);

  const reviewedRecent = (snapshot?.byDay ?? []).slice(-7);
  const maxReviewed = Math.max(1, ...reviewedRecent.map(([, n]) => n));
  const pending = snapshot ? pendingSyncDelta(snapshot.today) : 0;

  return (
    <GlassCard pad className="anki-connect-card">
      <PanelHeader
        title="Anki"
        sub="Connect the desktop Anki app through AnkiConnect. It is a local HTTP bridge, not a public HTTPS API."
        action={
          status === "connected"
            ? <Tag tone="green"><CheckCircle2 size={12} /> Connected</Tag>
            : status === "error"
              ? <Tag tone="orange">Not connected</Tag>
              : <Tag tone="neutral">Available</Tag>
        }
      />

      <div className="anki-endpoint-row">
        <label className="stack gap6 grow">
          <span className="field-label">AnkiConnect endpoint</span>
          <input className="field" value={endpoint} onChange={(e) => setEndpointState(e.target.value)}
            placeholder={DEFAULT_ANKI_ENDPOINT} spellCheck={false} />
        </label>
        <GButton variant="primary" onClick={() => connect()} disabled={status === "connecting"}>
          {status === "connecting" ? <><RefreshCw size={14} className="spin" /> Connecting…</> : <><Plug size={14} /> Connect</>}
        </GButton>
      </div>

      <div className="anki-origin-box">
        <div>
          <b>Allow-list this exact site</b>
          <span className="mono">{origin}</span>
          <small>Vercel preview URLs are different from production URLs. Add the URL shown here, exactly, then restart Anki.</small>
        </div>
        <div className="anki-origin-actions">
          <GButton size="sm" onClick={() => copyText(origin, "origin")}><Copy size={13} /> {copied === "origin" ? "Copied" : "Copy origin"}</GButton>
          <GButton size="sm" onClick={() => copyText(corsListPatch, "cors")}><Copy size={13} /> {copied === "cors" ? "Copied" : "Copy CORS list"}</GButton>
          <a className="gbtn sm" href={endpoint} target="_blank" rel="noreferrer noopener">Open local check <ExternalLink size={13} /></a>
        </div>
      </div>

      {mixedContentRisk && (
        <div className="anki-warn">
          <AlertTriangle size={15} />
          <span>This hosted app is calling your local Anki at <b>{endpoint}</b>. If the local check opens but Connect fails, the usual cause is an exact-origin mismatch in <b>webCorsOriginList</b>.</span>
        </div>
      )}

      {status === "error" && error && (
        <div className="anki-setup">
          <div className="anki-setup-head"><AlertTriangle size={15} /> <b>Couldn't reach Anki</b></div>
          <p className="sub">{error.message}</p>
          <ol className="anki-steps">
            <li>Open the Anki desktop app and keep it running.</li>
            <li>Install the <b>AnkiConnect</b> add-on (Tools → Add-ons → Get Add-ons → code <span className="mono">2055492159</span>), then restart Anki.</li>
            <li>Allow this site: AnkiConnect config → add <span className="mono">{origin}</span> to <span className="mono">webCorsOriginList</span>.</li>
            <li>Use the local endpoint above (default <span className="mono">{DEFAULT_ANKI_ENDPOINT}</span>). You will not find an HTTPS URL inside Anki.</li>
          </ol>
          <a className="gbtn sm" href="https://ankiweb.net/shared/info/2055492159" target="_blank" rel="noreferrer noopener">AnkiConnect add-on <ExternalLink size={13} /></a>
        </div>
      )}

      {status === "connected" && snapshot && (
        <>
          <div className="trend-widget anki-stat-row">
            <div><b>{snapshot.today}</b><span>reviews today</span></div>
            <div><b>{snapshot.decks.length}</b><span>decks</span></div>
            <div><b>{snapshot.decks.reduce((sum, d) => sum + d.review_count + d.new_count + d.learn_count, 0)}</b><span>due + new</span></div>
          </div>

          <div className="anki-sync-row">
            <GButton variant={pending > 0 ? "primary" : "default"} onClick={() => doSync(snapshot.today)} disabled={pending <= 0}>
              <Wand2 size={14} /> {pending > 0 ? `Sync ${pending} review${pending === 1 ? "" : "s"} to productivity` : "Productivity is in sync"}
            </GButton>
            <GButton size="sm" onClick={refresh} disabled={busy}><RefreshCw size={14} className={busy ? "spin" : ""} /> Refresh</GButton>
            <label className="anki-autosync">
              <input type="checkbox" checked={autoSync} onChange={(e) => setAutoSyncState(e.target.checked)} />
              <span>Auto-sync on connect</span>
            </label>
          </div>
          {syncNote && <div className="anki-sync-note"><CheckCircle2 size={13} /> {syncNote}</div>}

          {reviewedRecent.length > 0 && (
            <div className="anki-byday">
              <div className="field-label">Reviews — last 7 days</div>
              <div className="anki-byday-bars">
                {reviewedRecent.map(([date, n]) => (
                  <div className="anki-byday-col" key={date} title={`${date}: ${n} reviews`}>
                    <div className="anki-byday-track">
                      <div className="anki-byday-fill" style={{ height: `${Math.max(4, (n / maxReviewed) * 100)}%` }} />
                    </div>
                    <small>{date.slice(5)}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="anki-deck-list">
            {snapshot.decks.slice(0, 8).map((deck) => (
              <div className="anki-deck-row" key={deck.deck_id}>
                <span className="anki-deck-mark"><Layers size={15} /></span>
                <div className="grow"><b>{deck.name}</b><span>{deck.total_in_deck} cards</span></div>
                <span className="anki-deck-counts">
                  <em className="due">{deck.review_count}</em>
                  <em className="learn">{deck.learn_count}</em>
                  <em className="new">{deck.new_count}</em>
                </span>
              </div>
            ))}
            {snapshot.decks.length > 8 && <div className="sub">…and {snapshot.decks.length - 8} more decks</div>}
            <div className="anki-deck-legend">
              <span><i className="due" /> due</span>
              <span><i className="learn" /> learning</span>
              <span><i className="new" /> new</span>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
}
