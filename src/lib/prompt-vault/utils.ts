import { format, formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";
import type { Category, Prompt, SortKey, VaultSnapshot } from "./types";

/* ---------------------------------- ids ---------------------------------- */

export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/* --------------------------------- metrics -------------------------------- */

export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Rough creative-complexity score 1–5 based on length, structure and richness. */
export function complexityScore(prompt: Pick<Prompt, "content">): number {
  const words = wordCount(prompt.content);
  const lines = prompt.content.split(/\n/).filter(Boolean).length;
  const markers = (prompt.content.match(/[{}\[\]<>/\\|`*#]/g) || []).length;
  let score = 1;
  if (words > 40) score = 2;
  if (words > 90 || markers > 6) score = 3;
  if (words > 160 || lines > 8 || markers > 14) score = 4;
  if (words > 280 || lines > 16 || markers > 24) score = 5;
  return score;
}

/* --------------------------------- format --------------------------------- */

export function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return "—";
  }
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  try {
    return `${formatDistanceToNowStrict(new Date(iso))} ago`;
  } catch {
    return "—";
  }
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/* -------------------------------- clipboard ------------------------------- */

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export async function shareOrCopy(title: string, text: string): Promise<"shared" | "copied"> {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch {
      /* user cancelled or unsupported – fall back to copy */
    }
  }
  await copyText(text);
  return "copied";
}

/* ---------------------------------- files --------------------------------- */

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Exports a vault bundle as a dated JSON download (shared by sidebar + mobile menu). */
export function exportVaultToFile(bundle: unknown) {
  downloadJson(`prompt-vault-${new Date().toISOString().slice(0, 10)}.json`, bundle);
  toast.success("Vault exported as JSON");
}

/* --------------------------------- images --------------------------------- */

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Reads an image file and downsizes it (max 1280px, JPEG q≈0.85) so vaults stay
 * small enough for localStorage. Small files are kept as-is to preserve PNG
 * transparency.
 */
export async function fileToStoredImage(file: File): Promise<string> {
  const raw = await readAsDataUrl(file);
  if (raw.length < 200_000) return raw;
  try {
    const img = await loadImg(raw);
    const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return raw;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL("image/jpeg", 0.85);
    return out.length < raw.length ? out : raw;
  } catch {
    return raw;
  }
}

/** Fetches a remote image URL and converts it to a stored data-url. */
export async function urlToStoredImage(url: string): Promise<string> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`Could not load image (${res.status})`);
  const blob = await res.blob();
  if (!blob.type.startsWith("image/")) throw new Error("URL is not an image");
  const file = new File([blob], "image", { type: blob.type });
  return fileToStoredImage(file);
}

/* -------------------------------- filtering ------------------------------- */

export interface FilterOptions {
  query: string;
  filter: string; // "all" | "favorites" | category id
  favorites: string[];
  sort: SortKey;
  customOrder: string[];
}

export function filterAndSortPrompts(prompts: Prompt[], opts: FilterOptions): Prompt[] {
  const q = opts.query.trim().toLowerCase();
  let list = prompts;

  if (opts.filter === "favorites") {
    const fav = new Set(opts.favorites);
    list = list.filter((p) => fav.has(p.id));
  } else if (opts.filter !== "all") {
    list = list.filter((p) => p.category === opts.filter);
  }

  if (q) {
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        (p.engine && p.engine.toLowerCase().includes(q))
    );
  }

  const sorted = [...list];
  switch (opts.sort) {
    case "oldest":
      sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      break;
    case "title":
      sorted.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
      break;
    case "rating":
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.updatedAt.localeCompare(a.updatedAt));
      break;
    case "usage":
      sorted.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
      break;
    case "custom": {
      const pos = new Map(opts.customOrder.map((id, i) => [id, i]));
      sorted.sort(
        (a, b) => (pos.has(a.id) ? pos.get(a.id)! : 999_999) - (pos.has(b.id) ? pos.get(b.id)! : 999_999)
      );
      break;
    }
    case "newest":
    default:
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
  }
  return sorted;
}

/* ------------------------------- misc helpers ------------------------------ */

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || `cat-${generateId().slice(0, 6)}`;
}

export function storageSizeOf(snapshot: VaultSnapshot): string {
  try {
    const bytes = new Blob([JSON.stringify(snapshot)]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } catch {
    return "—";
  }
}

export function categoryById(categories: Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
