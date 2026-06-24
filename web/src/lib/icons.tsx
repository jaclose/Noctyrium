// Central lucide icon resolver so folders/resources/integrations can store an icon by name.
import {
  LayoutGrid, BookOpen, BadgeCheck, Brain, LineChart, Calendar, ListChecks,
  BookText, Share2, Library, Folder, Inbox, Layers, FlaskConical, FileText,
  HardDrive, Database, Settings, Link, Wand2, Flame, Star, BookMarked,
  GraduationCap, Stethoscope, Globe, Video, NotebookPen, Code2, Dumbbell,
  Languages, Activity, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  LayoutGrid, BookOpen, BadgeCheck, Brain, LineChart, Calendar, ListChecks,
  BookText, Share2, Library, Folder, Inbox, Layers, FlaskConical, FileText,
  HardDrive, Database, Settings, Link, Wand2, Flame, Star, BookMarked,
  GraduationCap, Stethoscope, Globe, Video, NotebookPen, Code2, Dumbbell,
  Languages, Activity,
};

export function Icon({ name, size = 18 }: { name?: string; size?: number }) {
  const Cmp = (name && MAP[name]) || Folder;
  return <Cmp size={size} />;
}

export const ICON_NAMES = Object.keys(MAP);
