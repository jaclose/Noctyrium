import { useEffect, useState } from "react";
import { Sidebar } from "./components/shell/Sidebar";
import { TopBar } from "./components/shell/TopBar";
import { SettingsModal, type SettingsTab } from "./components/shell/SettingsModal";
import { OnboardingWizard } from "./components/shell/OnboardingWizard";
import { GuidedTour } from "./components/shell/GuidedTour";
import { NAV } from "./components/shell/nav";
import { useStore } from "./lib/store";

import { DashboardPage } from "./pages/DashboardPage";
import { CoursesPage } from "./pages/CoursesPage";
import { CourseTrackerPage } from "./pages/CourseTrackerPage";
import { AnkiLabPage } from "./pages/AnkiLabPage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { StepPage } from "./pages/StepPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ProductivityPage } from "./pages/ProductivityPage";
import { TasksPage } from "./pages/TasksPage";
import { JournalPage } from "./pages/JournalPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { PromptLibraryPage } from "./pages/PromptLibraryPage";
import { HubFoldersPage } from "./pages/HubFoldersPage";
import { HelpPage } from "./pages/HelpPage";

const PAGES: Record<string, () => JSX.Element> = {
  dashboard: DashboardPage,
  courses: CoursesPage,
  tracker: CourseTrackerPage,
  anki: AnkiLabPage,
  resources: ResourcesPage,
  step: StepPage,
  reports: ReportsPage,
  productivity: ProductivityPage,
  tasks: TasksPage,
  journal: JournalPage,
  integrations: IntegrationsPage,
  prompts: PromptLibraryPage,
  folders: HubFoldersPage,
  help: HelpPage,
};

export default function App() {
  // route via the URL hash so deep-links + the standalone page work
  const [route, setRoute] = useState<string>(() => location.hash.replace("#", "") || "dashboard");
  const [drawer, setDrawer] = useState(false);
  const [settings, setSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [refreshing, setRefreshing] = useState(false);
  const onboarded = useStore((s) => s.profile.onboarded);
  const tourDone = useStore((s) => s.profile.tourDone);
  const updateProfile = useStore((s) => s.updateProfile);
  // Show the tour once after onboarding; "Replay tour" simply clears tourDone.
  const showTour = onboarded && !tourDone;

  function endTour() {
    updateProfile({ tourDone: true });
    location.hash = "dashboard";
  }

  useEffect(() => {
    const onHash = () => setRoute(location.hash.replace("#", "") || "dashboard");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function go(id: string) {
    location.hash = id;
    setRoute(id);
  }

  // The guided tour navigates through React state directly (deterministic, same
  // render cycle) and updates the URL with replaceState so it never creates
  // Back-button history traps or depends on the async hashchange event.
  function navigateTour(id: string) {
    setRoute(id);
    try { window.history.replaceState(null, "", `#${id}`); } catch { location.hash = id; }
  }

  function refresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 650);
  }

  const nav = NAV.find((n) => n.id === route) ?? NAV[0];
  const Page = PAGES[route] ?? DashboardPage;

  if (!onboarded) {
    return (
      <div className="app-root">
        <div className="backdrop">
          <div className="orb cyan" />
          <div className="orb purple" />
          <div className="orb blue" />
        </div>
        <OnboardingWizard />
      </div>
    );
  }

  return (
    <div className="app-root">
      <div className="backdrop">
        <div className="orb cyan" />
        <div className="orb purple" />
        <div className="orb blue" />
      </div>

      <div className="shell">
        <Sidebar
          active={route}
          onSelect={go}
          onOpenSettings={(tab) => { setSettingsTab(tab ?? "general"); setSettings(true); }}
          collapsed={drawer}
          onClose={() => setDrawer(false)}
        />

        <div className="surface">
          <TopBar
            title={nav.label}
            subtitle={nav.subtitle}
            onMenu={() => setDrawer(true)}
            onRefresh={refresh}
            refreshing={refreshing}
          />
          <div className="surface-scroll">
            <div className="page">
              <Page />
            </div>
          </div>
        </div>
      </div>

      {settings && <SettingsModal onClose={() => setSettings(false)} initialTab={settingsTab} />}
      {showTour && <GuidedTour onExit={endTour} onNavigate={navigateTour} currentRoute={route} />}
    </div>
  );
}
