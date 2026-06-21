// Navigation model — sidebar items + Alpha 2 grouping (Tools folder + order).
import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid, BookOpen, BadgeCheck, Brain, LineChart, Calendar, ListChecks,
  BookText, Share2, Library, Folder, Link, Wand2, LifeBuoy, ClipboardCheck, Trophy, Compass, Info,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
}

// All routable pages, keyed for lookup. Order here is not the sidebar order
// (that lives in the SIDEBAR_* groups below).
export const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", subtitle: "Your command center at a glance", icon: LayoutGrid },
  { id: "courses", label: "Courses", subtitle: "Term-based course map with module-level folders", icon: BookOpen },
  { id: "tracker", label: "Course Tracker", subtitle: "Lecture, DLA, and PQ completion map", icon: BadgeCheck },
  { id: "productivity", label: "Productivity", subtitle: "Study time, Anki cards, lecture blocks, day usefulness", icon: Calendar },
  { id: "journal", label: "Journal", subtitle: "Daily standups, intention follow-up, blockers, and tomorrow's plan", icon: BookText },
  { id: "reports", label: "Reports", subtitle: "Traceable statistics, energy, and performance vs. your goals", icon: LineChart },
  { id: "resources", label: "Resources", subtitle: "Saved hyperlinks for courses, boards, references, and tools", icon: Link },
  { id: "step", label: "USMLE / Shelf Prep", subtitle: "Step 1, Step 2, Step 3, shelf exams, and blueprint strategy", icon: Brain },
  { id: "premed", label: "Pre-Med / MCAT", subtitle: "Clinical hours, service, research, applications, and MCAT runway", icon: Compass },
  { id: "appchecker", label: "Application Checker", subtitle: "Med school + residency application tracking", icon: ClipboardCheck },
  // Tools folder
  { id: "tasks", label: "Tasks", subtitle: "Execute — open and completed work", icon: ListChecks },
  { id: "anki", label: "Anki Lab", subtitle: "Turn lectures, DLAs & slides into Anki cards", icon: Wand2 },
  { id: "prompts", label: "Prompt Library", subtitle: "Reusable AI prompts for study workflows", icon: Library },
  { id: "integrations", label: "Integrations", subtitle: "Connect Anki, calendar, drives, and more", icon: Share2 },
  { id: "leaderboards", label: "Leaderboards", subtitle: "Opt-in, friendly accountability (coming soon)", icon: Trophy },
  // After Tools
  { id: "about", label: "About", subtitle: "What Noctyrium is, where it is headed, and the live project preview", icon: Info },
  { id: "folders", label: "Hub Folders", subtitle: "Your modular folders and shortcuts", icon: Folder },
  // Footer (Help is a page; Settings + Account open the modal)
  { id: "help", label: "Help", subtitle: "Guided tour, master guide, Anki import, and feedback", icon: LifeBuoy },
];

export const navById = (id: string): NavItem | undefined => NAV.find((n) => n.id === id);

// Sidebar order (Alpha 2). Tools is a collapsible folder.
export const SIDEBAR_TOP = [
  "dashboard", "courses", "tracker", "productivity", "journal", "reports",
];
export const SIDEBAR_PREP = ["step", "premed", "appchecker"];
export const SIDEBAR_TOOLS = ["tasks", "resources", "anki", "prompts", "integrations", "leaderboards"];
export const SIDEBAR_BOTTOM = ["folders"];
// Dashboard can't be hidden; everything else is subscribe/unsubscribe-able.
export const SIDEBAR_LOCKED = new Set(["dashboard"]);
