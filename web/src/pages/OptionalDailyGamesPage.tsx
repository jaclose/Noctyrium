import { Gamepad2, ShieldCheck } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, Tag } from "../components/ui/primitives";

/**
 * Eager, tiny route gate. The lazy game engine and bundled word lists are not
 * requested until the user explicitly enables Daily Games.
 */
export function OptionalDailyGamesPage() {
  const profile = useStore((state) => state.profile);
  const updateProfile = useStore((state) => state.updateProfile);

  return (
    <GlassCard pad className="optional-module-page">
      <div className="stack" style={{ gap: 12 }}>
        <Tag tone="neutral"><Gamepad2 size={12} /> Optional module</Tag>
        <div>
          <h1>Daily Games is currently disabled</h1>
          <p className="sub">
            Daily Games is an optional, device-local break area. Enabling it adds
            Daily Word and the Doctordle WIP page to the sidebar. It does not use AI,
            create an account, or transmit game history.
          </p>
        </div>
        <div className="backup-note">
          <ShieldCheck size={15} />
          <span>Disabling the module later hides its navigation without deleting completed puzzles or statistics.</span>
        </div>
        <div>
          <GButton
            variant="primary"
            onClick={() => updateProfile({
              experimentalFlags: { ...(profile.experimentalFlags ?? {}), dailyGames: true },
            })}
          >
            Enable Daily Games
          </GButton>
        </div>
      </div>
    </GlassCard>
  );
}
