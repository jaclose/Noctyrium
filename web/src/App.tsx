import { useEffect, useState } from "react";
import { Sidebar } from "./components/shell/Sidebar";
import { TopBar } from "./components/shell/TopBar";
import { SettingsModal } from "./components/shell/SettingsModal";
import { NAV } from "./components/shell/nav";

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
};

export default function App() {
  // route via the URL hash so deep-links + the standalone page work
  const [route, setRoute] = useState<string>(() => location.hash.replace("#", "") || "dashboard");
  const [drawer, setDrawer] = useState(false);
  const [settings, setSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const onHash = () => setRoute(location.hash.replace("#", "") || "dashboard");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function go(id: string) {
    location.hash = id;
    setRoute(id);
  }

  function refresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 650);
  }

  const nav = NAV.find((n) => n.id === route) ?? NAV[0];
  const Page = PAGES[route] ?? DashboardPage;

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
          onOpenSettings={() => setSettings(true)}
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

      {settings && <SettingsModal onClose={() => setSettings(false)} />}
    </div>
  );
}
