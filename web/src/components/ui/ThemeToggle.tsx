import { useId } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  setThemePreference,
  type ThemePreference,
} from "../../lib/theme";
import { useThemePreference } from "../../lib/useThemePreference";

const OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  detail: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light", detail: "Warm paper", icon: Sun },
  { value: "dark", label: "Dark", detail: "Graphite", icon: Moon },
  { value: "system", label: "System", detail: "Match device", icon: Monitor },
];

export function ThemeToggle() {
  const groupId = useId();
  const preference = useThemePreference();

  return (
    <fieldset className="theme-setting">
      <legend>Appearance</legend>
      <p>Choose a device theme. System follows your operating-system setting automatically.</p>
      <div className="theme-options">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const id = `${groupId}-${option.value}`;
          return (
            <label className={`theme-option ${preference === option.value ? "on" : ""}`} htmlFor={id} key={option.value}>
              <input
                id={id}
                type="radio"
                name={`${groupId}-theme`}
                value={option.value}
                checked={preference === option.value}
                onChange={() => setThemePreference(option.value)}
              />
              <Icon size={16} aria-hidden="true" />
              <span><b>{option.label}</b><small>{option.detail}</small></span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
