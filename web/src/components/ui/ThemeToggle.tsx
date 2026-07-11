import { useEffect, useId, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  THEME_CHANGE_EVENT,
  readThemePreference,
  setThemePreference,
  type ThemeChangeDetail,
  type ThemePreference,
} from "../../lib/theme";

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
  const [preference, setPreference] = useState<ThemePreference>(() => readThemePreference());

  useEffect(() => {
    const onThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<ThemeChangeDetail>).detail;
      setPreference(detail?.preference ?? readThemePreference());
    };
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
  }, []);

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
                onChange={() => {
                  setThemePreference(option.value);
                  setPreference(option.value);
                }}
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
