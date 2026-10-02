import { DEFAULT_CATEGORIES } from "./data";
import { generateId } from "./utils";
import type { Category, Collection, Prompt, PromptImage } from "./types";

/* ------------------------------------------------------------------ */
/*  Legacy import migration                                            */
/*  Older Prompt Vault exports stored pictures under different field   */
/*  names / shapes (e.g. `imageUrl: "https://…"` or `images: ["…"]`).  */
/*  This layer normalizes any known variant into the current schema    */
/*  so nothing is lost when importing an old backup.                   */
/* ------------------------------------------------------------------ */

type Unknown = Record<string, unknown>;

const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const str = (v: unknown, fallback = ""): string => (isStr(v) ? v.trim() : fallback);
const isObj = (v: unknown): v is Unknown => typeof v === "object" && v !== null && !Array.isArray(v);

const asNumber = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const asIso = (v: unknown, fallback: string): string => {
  if (!isStr(v)) return fallback;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
};

/** Fields that may hold a single picture URL in older exports. */
const SINGLE_IMAGE_FIELDS: Array<{ key: string; type: PromptImage["type"] }> = [
  { key: "imageUrl", type: "result" },
  { key: "image_url", type: "result" },
  { key: "image", type: "result" },
  { key: "coverImage", type: "result" },
  { key: "cover", type: "result" },
  { key: "picture", type: "result" },
  { key: "photo", type: "result" },
  { key: "thumbnail", type: "result" },
  { key: "thumb", type: "result" },
  { key: "resultImage", type: "result" },
  { key: "outputImage", type: "result" },
  { key: "inputImage", type: "input" },
  { key: "referenceImage", type: "input" },
  { key: "refImage", type: "input" },
];

/** Fields that may hold a list of pictures (strings or partial objects). */
const LIST_IMAGE_FIELDS = ["images", "imageUrls", "image_urls", "pictures", "photos", "gallery"] as const;

function makeImage(src: string, type: PromptImage["type"], id?: unknown): PromptImage {
  return { id: isStr(id) ? id : generateId(), src, type };
}

/** Best-effort conversion of one legacy image entry (string / {src|url} / partial PromptImage). */
function imageFromEntry(entry: unknown, fallbackType: PromptImage["type"]): PromptImage | null {
  if (isStr(entry)) return makeImage(entry.trim(), fallbackType);
  if (!isObj(entry)) return null;
  const src = str(entry.src) || str(entry.url) || str(entry.dataUrl) || str(entry.href);
  if (!src) return null;
  const type = entry.type === "input" || entry.type === "result" ? entry.type : fallbackType;
  return makeImage(src, type, entry.id);
}

/** Collects pictures from every legacy field shape we know about. */
function collectImages(raw: Unknown): PromptImage[] {
  const out: PromptImage[] = [];
  const seen = new Set<string>();

  const push = (img: PromptImage | null) => {
    if (img && !seen.has(img.src)) {
      seen.add(img.src);
      out.push(img);
    }
  };

  // single-URL legacy fields
  for (const { key, type } of SINGLE_IMAGE_FIELDS) {
    const v = raw[key];
    if (isStr(v)) push(imageFromEntry(v, type));
    else if (Array.isArray(v)) v.forEach((e) => push(imageFromEntry(e, type)));
  }

  // list fields — strings, {src|url} objects, or already-typed PromptImage objects
  for (const key of LIST_IMAGE_FIELDS) {
    const v = raw[key];
    if (!Array.isArray(v)) continue;
    v.forEach((e) => push(imageFromEntry(e, "result")));
  }

  return out;
}

function collectTags(v: unknown): string[] {
  if (Array.isArray(v)) {
    return Array.from(
      new Set(
        v
          .map((t) => (typeof t === "string" ? t.trim() : isObj(t) && isStr(t.name) ? t.name : ""))
          .filter(Boolean)
      )
    );
  }
  if (isStr(v)) {
    // e.g. "ai, art, landscape"
    return v
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Normalizes one imported prompt of any known legacy shape into the current
 * `Prompt` schema. Returns null only if the entry has no usable text.
 */
export function normalizeImportedPrompt(raw: unknown, index = 0): Prompt | null {
  if (!isObj(raw)) return null;

  const title = str(raw.title) || str(raw.name) || `Imported prompt ${index + 1}`;
  const content = str(raw.content) || str(raw.prompt) || str(raw.text) || str(raw.body);
  if (!title && !content) return null;

  const now = new Date().toISOString();
  const createdAt = asIso(raw.createdAt ?? raw.created_at ?? raw.date, now);
  const updatedAt = asIso(raw.updatedAt ?? raw.updated_at, createdAt);

  const ratingRaw = asNumber(raw.rating ?? raw.stars, 0);
  const rating = Math.max(0, Math.min(5, ratingRaw));

  const category = str(raw.category) || str(raw.categoryId) || str(raw.category_id) || "other";

  return {
    id: str(raw.id) || generateId(),
    title: title || "Untitled prompt",
    content,
    category,
    tags: collectTags(raw.tags),
    notes: str(raw.notes) || str(raw.note),
    images: collectImages(raw),
    rating,
    engine: str(raw.engine) || str(raw.model) || str(raw.aiEngine) || "",
    usageCount: Math.max(0, Math.floor(asNumber(raw.usageCount ?? raw.usage_count ?? raw.uses, 0))),
    lastUsedAt: raw.lastUsedAt == null ? null : asIso(raw.lastUsedAt, now),
    createdAt,
    updatedAt,
  };
}

/** True when the value looks like a usable category record. */
function asCategory(raw: unknown): Category | null {
  if (!isObj(raw)) return null;
  const id = str(raw.id);
  const name = str(raw.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    color: str(raw.color, "#64748b"),
    icon: str(raw.icon, "folder"),
  };
}

function asCollection(raw: unknown): Collection | null {
  if (!isObj(raw)) return null;
  const id = str(raw.id);
  const name = str(raw.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    description: str(raw.description),
    color: str(raw.color, "#7c3aed"),
    promptIds: Array.isArray(raw.promptIds) ? raw.promptIds.filter(isStr) : [],
    createdAt: asIso(raw.createdAt, new Date().toISOString()),
  };
}

export interface NormalizedBundle {
  prompts: Prompt[];
  categories: Category[];
  favorites: string[];
  customOrder: string[];
  collections: Collection[];
}

/**
 * Normalizes a whole imported bundle (any legacy shape) into the current
 * schema — including pictures stored under old field names, per-prompt
 * `favorite: true` flags, and category-name → id remapping.
 */
export function normalizeImportedBundle(bundle: Unknown): NormalizedBundle {
  const rawPrompts = Array.isArray(bundle.prompts) ? bundle.prompts : [];
  const prompts: Prompt[] = [];
  const favoriteIds = new Set<string>();

  rawPrompts.forEach((p, i) => {
    const prompt = normalizeImportedPrompt(p, i);
    if (!prompt) return;
    prompts.push(prompt);
    if (isObj(p) && (p.favorite === true || p.isFavorite === true)) favoriteIds.add(prompt.id);
  });

  // categories — fill defaults for malformed entries
  const rawCategories = Array.isArray(bundle.categories) ? bundle.categories : [];
  const categories = rawCategories.map(asCategory).filter((c): c is Category => c !== null);

  // if a prompt references a category NAME (or an id from the app's default set
  // while the bundle has no categories), remap it to a known category id
  const effective = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const byId = new Map(effective.map((c) => [c.id, c]));
  const byName = new Map(effective.map((c) => [c.name.toLowerCase(), c]));
  for (const p of prompts) {
    const hit = byId.get(p.category) ?? byName.get(p.category.toLowerCase());
    p.category = hit ? hit.id : categories.length > 0 ? p.category : "other";
  }

  const favorites = Array.from(
    new Set([
      ...favoriteIds,
      ...(Array.isArray(bundle.favorites) ? bundle.favorites.filter(isStr) : []),
    ])
  ).filter((id) => prompts.some((p) => p.id === id));

  const customOrder = (Array.isArray(bundle.customOrder) ? bundle.customOrder : []).filter(isStr);
  const collections = (Array.isArray(bundle.collections) ? bundle.collections : [])
    .map(asCollection)
    .filter((c): c is Collection => c !== null)
    .map((c) => ({ ...c, promptIds: c.promptIds.filter((id) => prompts.some((p) => p.id === id)) }));

  return { prompts, categories, favorites, customOrder, collections };
}
