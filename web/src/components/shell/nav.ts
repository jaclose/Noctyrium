// Navigation model — the sidebar items (ported from Sidebar.items).
import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid, BookOpen, BadgeCheck, Brain, LineChart, Calendar, ListChecks,
  BookText, Share2, Library, Folder, Link, Wand2,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", subtitle: "Your command center at a glance", icon: LayoutGrid },
  { id: "courses", label: "Courses", subtitle: "Term-based course map with module-level folders", icon: BookOpen },
  { id: "tracker", label: "Course Tracker", subtitle: "Lecture, DLA, and PQ completion map", icon: BadgeCheck },
  { id: "anki", label: "Anki Lab", subtitle: "Turn lectures, DLAs & slides into Anki cards", icon: Wand2 },
  { id: "resources", label: "Resources", subtitle: "Saved hyperlinks for courses, boards, references, and tools", icon: Link },
  { id: "step", label: "Boards", subtitle: "Step, shelf, MCAT, schedule, and AI board strategy", icon: Brain },
  { id: "reports", label: "Reports", subtitle: "Traceable summaries from your data", icon: LineChart },
  { id: "productivity", label: "Productivity", subtitle: "Study time, Anki cards, lecture blocks, day usefulness", icon: Calendar },
  { id: "tasks", label: "Tasks", subtitle: "Execute — open and completed work", icon: ListChecks },
  { id: "journal", label: "Journal", subtitle: "Daily standups, review, blockers, and tomorrow's plan", icon: BookText },
  { id: "integrations", label: "Integrations", subtitle: "Connect Anki, calendar, drives, and more", icon: Share2 },
  { id: "prompts", label: "Prompt Library", subtitle: "Reusable AI prompts for study workflows", icon: Library },
  { id: "folders", label: "Hub Folders", subtitle: "Your modular folders and shortcuts", icon: Folder },
];
