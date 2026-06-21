// Mounted once in the app shell. On load, if there are active days with no
// standup, it raises the "Oh no — you missed your standup" toast (once per
// calendar day, so it nudges daily until remediated without nagging on every
// navigation). Renders nothing.
import { useEffect } from "react";
import { useStore } from "../../lib/store";
import { missedStandupDays } from "../../lib/journal";
import { pushToast } from "../../lib/toast";
import { isoDate } from "../../lib/scoring";

const ALERT_KEY = "noctyrium-missed-standup-alert";

export function StandupWatcher() {
  const journal = useStore((s) => s.journal);
  const logs = useStore((s) => s.logs);
  const dayPlans = useStore((s) => s.dayPlans);

  useEffect(() => {
    const missed = missedStandupDays({ journal, logs, dayPlans });
    if (!missed.length) return;
    const today = isoDate(new Date());
    try {
      if (localStorage.getItem(ALERT_KEY) === today) return;
      localStorage.setItem(ALERT_KEY, today);
    } catch { /* storage unavailable — still show once this session via dedupe */ }
    pushToast({
      title: "Oh no — you missed your standup",
      body: `${missed.length} active day${missed.length === 1 ? "" : "s"} ${missed.length === 1 ? "is" : "are"} waiting to be remediated.`,
      tone: "warn",
      href: "#journal",
      actionLabel: "Remediate now",
      duration: 11000,
      dedupe: "missed-standup",
    });
  }, [journal, logs, dayPlans]);

  return null;
}
