// Mounted once at the app root. Watches the Pomodoro store for a completed focus
// sprint and fires the whole-page glow + a completion toast (and an OS
// notification if the user granted permission), so it works on any page.
import { useEffect, useState } from "react";
import { usePomodoro } from "../../lib/pomodoro";
import { pushToast } from "../../lib/toast";

export function PomodoroFx() {
  const completedAt = usePomodoro((s) => s.completedAt);
  const completedMinutes = usePomodoro((s) => s.completedMinutes);
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    if (!completedAt) return;
    setGlow(true);
    const minutes = completedMinutes;
    pushToast({
      title: "Focus sprint complete",
      body: minutes ? `${minutes}m logged to today — take your break.` : "Nice work — take your break.",
      tone: "success",
      href: "#productivity",
      actionLabel: "Productivity",
      duration: 7000,
    });
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Noctyrium — focus sprint complete", {
          body: minutes ? `${minutes} minutes logged. Take your break.` : "Take your break.",
          icon: "./icon-192.png",
        });
      }
    } catch { /* ignore */ }
    const timer = setTimeout(() => setGlow(false), 2800);
    return () => clearTimeout(timer);
  }, [completedAt, completedMinutes]);

  return <div className={`pomo-page-glow ${glow ? "active" : ""}`} aria-hidden="true" />;
}
