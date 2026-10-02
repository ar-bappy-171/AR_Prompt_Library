"use client";

import {
  BarChart3,
  Bot,
  Braces,
  Briefcase,
  Camera,
  Code2,
  FlaskConical,
  Folder,
  Gamepad2,
  Globe,
  Heart,
  Layers,
  Lightbulb,
  Mic,
  Palette,
  PenLine,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  palette: Palette,
  pen: PenLine,
  code: Code2,
  chart: BarChart3,
  bulb: Lightbulb,
  folder: Folder,
  sparkles: Sparkles,
  globe: Globe,
  book: Layers,
  mic: Mic,
  camera: Camera,
  briefcase: Briefcase,
  bot: Bot,
  braces: Braces,
  flask: FlaskConical,
  gamepad: Gamepad2,
  heart: Heart,
  layers: Layers,
};

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS);

export function CategoryIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[icon] ?? Folder;
  return <Icon className={className} aria-hidden="true" />;
}
