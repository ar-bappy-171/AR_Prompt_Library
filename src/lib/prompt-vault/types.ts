export interface PromptImage {
  id: string;
  src: string;
  type: "input" | "result";
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  notes: string;
  images: PromptImage[];
  rating: number; // 0–5
  engine: string;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export type PromptDraft = Pick<
  Prompt,
  "title" | "content" | "category" | "tags" | "notes" | "images" | "rating" | "engine"
>;

export type SortKey = "newest" | "oldest" | "title" | "rating" | "usage" | "custom";
export type ViewMode = "grid" | "list";

export interface VaultSnapshot {
  prompts: Prompt[];
  categories: Category[];
  favorites: string[];
  customOrder: string[];
}

export interface ExportBundle extends VaultSnapshot {
  app: "prompt-vault";
  version: number;
  exportedAt: string;
}
