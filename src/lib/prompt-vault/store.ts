"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY_ID, buildSamplePrompts } from "./data";
import type {
  Category,
  Collection,
  ExportBundle,
  Prompt,
  PromptDraft,
  Security,
  SortKey,
  VaultSnapshot,
  ViewMode,
} from "./types";
import { generateId, slugify } from "./utils";
import { normalizeImportedBundle } from "./migrate";

const MAX_HISTORY = 60;
const STORAGE_KEY = "prompt-vault-store-v1";

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

interface VaultState extends VaultSnapshot {
  /* persisted prefs */
  view: ViewMode;
  sort: SortKey;
  security: Security;
  locked: boolean;
  /* history */
  past: VaultSnapshot[];
  future: VaultSnapshot[];
  /* transient ui */
  hydrated: boolean;
  filter: string; // "all" | "favorites" | category id
  query: string;
  page: number;
  pageSize: number;
  selectionMode: boolean;
  selected: string[];
  editor: { open: boolean; promptId: string | null };
  editorPrefill: PromptDraft | null;
  detailsId: string | null;
  analyticsOpen: boolean;
  templatesOpen: boolean;
  categoriesOpen: boolean;
  shortcutsOpen: boolean;
  collectionsOpen: boolean;
  openCollectionId: string | null;
  addToCollectionPromptId: string | null;
  securityOpen: boolean;
  confirm: ConfirmRequest | null;
  importing: boolean;

  /* actions */
  markHydrated: () => void;
  setView: (v: ViewMode) => void;
  setSort: (s: SortKey) => void;
  setFilter: (f: string) => void;
  setQuery: (q: string) => void;
  setPage: (p: number) => void;
  resetUi: () => void;

  addPrompt: (draft: PromptDraft) => Prompt;
  updatePrompt: (id: string, draft: PromptDraft) => void;
  deletePrompt: (id: string) => void;
  deleteMany: (ids: string[]) => void;
  duplicatePrompt: (id: string) => void;
  toggleFavorite: (id: string) => void;
  registerCopy: (id: string) => void;
  reorderPrompts: (orderedIds: string[]) => void;

  addCategory: (name: string, color: string, icon: string) => void;
  updateCategory: (id: string, patch: Partial<Pick<Category, "name" | "color" | "icon">>) => void;
  deleteCategory: (id: string) => void;

  addCollection: (name: string, description: string, color: string) => Collection;
  updateCollection: (id: string, patch: Partial<Pick<Collection, "name" | "description" | "color">>) => void;
  deleteCollection: (id: string) => void;
  togglePromptInCollection: (collectionId: string, promptId: string) => boolean;
  setCollectionPrompts: (collectionId: string, promptIds: string[]) => void;

  hashPin: (pin: string) => Promise<string>;
  setPin: (pin: string, hint: string) => Promise<void>;
  removePin: (pin: string) => Promise<boolean>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;

  importBundle: (bundle: ExportBundle | { prompts: Prompt[] }, mode: "replace" | "merge") => number;
  loadSample: () => void;
  clearAll: () => void;
  exportBundle: () => ExportBundle;

  undo: () => void;
  redo: () => void;

  /* ui actions */
  openEditor: (promptId: string | null) => void;
  openEditorWith: (draft: PromptDraft) => void;
  closeEditor: () => void;
  openDetails: (id: string) => void;
  closeDetails: () => void;
  setAnalyticsOpen: (v: boolean) => void;
  setTemplatesOpen: (v: boolean) => void;
  setCategoriesOpen: (v: boolean) => void;
  setShortcutsOpen: (v: boolean) => void;
  setCollectionsOpen: (v: boolean) => void;
  openCollection: (id: string) => void;
  closeCollection: () => void;
  openAddToCollection: (promptId: string) => void;
  closeAddToCollection: () => void;
  setSecurityOpen: (v: boolean) => void;
  requestConfirm: (req: ConfirmRequest) => void;
  cancelConfirm: () => void;
  setSelectionMode: (v: boolean) => void;
  toggleSelected: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setImporting: (v: boolean) => void;
}

const snapshotOf = (s: VaultState): VaultSnapshot => ({
  prompts: s.prompts,
  categories: s.categories,
  favorites: s.favorites,
  customOrder: s.customOrder,
  collections: s.collections,
});

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => {
      /** apply a mutation while pushing an undo snapshot */
      const commit = (mutate: (s: VaultState) => Partial<VaultState>) => {
        const s = get();
        const snap = snapshotOf(s);
        set({
          past: [...s.past, snap].slice(-MAX_HISTORY),
          future: [],
          ...mutate(s),
        });
      };

      const prunePromptRefs = (s: VaultState, ids: Set<string>) => {
        return {
          favorites: s.favorites.filter((id) => !ids.has(id)),
          customOrder: s.customOrder.filter((id) => !ids.has(id)),
          selected: s.selected.filter((id) => !ids.has(id)),
          collections: s.collections.map((c) =>
            c.promptIds.some((id) => ids.has(id))
              ? { ...c, promptIds: c.promptIds.filter((id) => !ids.has(id)) }
              : c
          ),
        };
      };

      return {
        prompts: [],
        categories: DEFAULT_CATEGORIES,
        favorites: [],
        customOrder: [],
        collections: [],
        view: "grid",
        sort: "newest",
        security: { pinHash: null, hint: "" },
        locked: false,
        past: [],
        future: [],
        hydrated: false,
        filter: "all",
        query: "",
        page: 1,
        pageSize: 12,
        selectionMode: false,
        selected: [],
        editor: { open: false, promptId: null },
        editorPrefill: null,
        detailsId: null,
        analyticsOpen: false,
        templatesOpen: false,
        categoriesOpen: false,
        shortcutsOpen: false,
        collectionsOpen: false,
        openCollectionId: null,
        addToCollectionPromptId: null,
        securityOpen: false,
        confirm: null,
        importing: false,

        markHydrated: () =>
          set((s) => ({ hydrated: true, locked: Boolean(s.security?.pinHash) })),
        setView: (v) => set({ view: v }),
        setSort: (sort) => set({ sort, page: 1 }),
        setFilter: (filter) => set({ filter, page: 1 }),
        setQuery: (query) => set({ query, page: 1 }),
        setPage: (page) => set({ page }),
        resetUi: () =>
          set({ filter: "all", query: "", page: 1, selectionMode: false, selected: [] }),

        addPrompt: (draft) => {
          const now = new Date().toISOString();
          const prompt: Prompt = {
            ...draft,
            id: generateId(),
            usageCount: 0,
            lastUsedAt: null,
            createdAt: now,
            updatedAt: now,
          };
          commit((s) => ({
            prompts: [prompt, ...s.prompts],
            customOrder: [...s.customOrder, prompt.id],
          }));
          return prompt;
        },

        updatePrompt: (id, draft) =>
          commit((s) => ({
            prompts: s.prompts.map((p) =>
              p.id === id ? { ...p, ...draft, updatedAt: new Date().toISOString() } : p
            ),
          })),

        deletePrompt: (id) =>
          commit((s) => ({
            prompts: s.prompts.filter((p) => p.id !== id),
            ...prunePromptRefs(s, new Set([id])),
          })),

        deleteMany: (ids) =>
          commit((s) => {
            const idSet = new Set(ids);
            return {
              prompts: s.prompts.filter((p) => !idSet.has(p.id)),
              ...prunePromptRefs(s, idSet),
            };
          }),

        duplicatePrompt: (id) => {
          const s = get();
          const src = s.prompts.find((p) => p.id === id);
          if (!src) return;
          const now = new Date().toISOString();
          const copy: Prompt = {
            ...src,
            id: generateId(),
            title: `${src.title} (copy)`,
            usageCount: 0,
            lastUsedAt: null,
            createdAt: now,
            updatedAt: now,
          };
          commit(() => ({ prompts: [copy, ...get().prompts] }));
        },

        toggleFavorite: (id) =>
          set((s) => ({
            favorites: s.favorites.includes(id)
              ? s.favorites.filter((f) => f !== id)
              : [...s.favorites, id],
          })),

        registerCopy: (id) =>
          set((s) => ({
            prompts: s.prompts.map((p) =>
              p.id === id
                ? { ...p, usageCount: (p.usageCount || 0) + 1, lastUsedAt: new Date().toISOString() }
                : p
            ),
          })),

        reorderPrompts: (orderedIds) =>
          commit(() => ({ customOrder: orderedIds, sort: "custom" })),

        addCategory: (name, color, icon) => {
          const s = get();
          const base = slugify(name);
          let id = base;
          let i = 2;
          while (s.categories.some((c) => c.id === id)) id = `${base}-${i++}`;
          commit(() => ({
            categories: [...get().categories, { id, name: name.trim(), color, icon }],
          }));
        },

        updateCategory: (id, patch) =>
          commit((s) => ({
            categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          })),

        deleteCategory: (id) => {
          const fallback = get().categories.find((c) => c.id === FALLBACK_CATEGORY_ID)
            ? FALLBACK_CATEGORY_ID
            : get().categories.find((c) => c.id !== id)?.id;
          if (!fallback) return;
          commit((s) => ({
            categories: s.categories.filter((c) => c.id !== id),
            prompts: s.prompts.map((p) => (p.category === id ? { ...p, category: fallback } : p)),
          }));
        },

        /* ------------------------------ collections ------------------------------ */
        addCollection: (name, description, color) => {
          const s = get();
          const base = slugify(name);
          let id = base;
          let i = 2;
          while (s.collections.some((c) => c.id === id)) id = `${base}-${i++}`;
          const collection: Collection = {
            id,
            name: name.trim(),
            description: description.trim(),
            color,
            promptIds: [],
            createdAt: new Date().toISOString(),
          };
          commit(() => ({ collections: [...get().collections, collection] }));
          return collection;
        },

        updateCollection: (id, patch) =>
          commit((s) => ({
            collections: s.collections.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          })),

        deleteCollection: (id) =>
          commit((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),

        togglePromptInCollection: (collectionId, promptId) => {
          let added = false;
          set((s) => ({
            collections: s.collections.map((c) => {
              if (c.id !== collectionId) return c;
              if (c.promptIds.includes(promptId)) {
                added = false;
                return { ...c, promptIds: c.promptIds.filter((x) => x !== promptId) };
              }
              added = true;
              return { ...c, promptIds: [...c.promptIds, promptId] };
            }),
          }));
          return added;
        },

        setCollectionPrompts: (collectionId, promptIds) =>
          commit((s) => ({
            collections: s.collections.map((c) =>
              c.id === collectionId ? { ...c, promptIds } : c
            ),
          })),

        /* ------------------------------ privacy lock ----------------------------- */
        hashPin: async (pin) => {
          const data = new TextEncoder().encode(`prompt-vault::${pin}`);
          try {
            if (typeof crypto !== "undefined" && crypto.subtle) {
              const buf = await crypto.subtle.digest("SHA-256", data);
              return Array.from(new Uint8Array(buf))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
            }
          } catch {
            /* fall through to fallback */
          }
          let h = 2166136261;
          for (const b of data) {
            h ^= b;
            h = Math.imul(h, 16777619);
          }
          return (h >>> 0).toString(16);
        },

        setPin: async (pin, hint) => {
          const pinHash = await get().hashPin(pin);
          set({ security: { pinHash, hint: hint.trim() }, locked: false });
        },

        removePin: async (pin) => {
          const s = get();
          const h = await s.hashPin(pin);
          if (!s.security?.pinHash || h !== s.security.pinHash) return false;
          set({ security: { pinHash: null, hint: "" }, locked: false });
          return true;
        },

        unlock: async (pin) => {
          const s = get();
          if (!s.security?.pinHash) return true;
          const h = await s.hashPin(pin);
          if (h !== s.security.pinHash) return false;
          set({ locked: false });
          return true;
        },

        lock: () => {
          if (get().security?.pinHash) set({ locked: true });
        },

        importBundle: (bundle, mode) => {
          /* normalize any legacy export shape (old picture fields, favorites,
             category names, missing dates) into the current schema first */
          const normalized = normalizeImportedBundle(bundle as Record<string, unknown>);
          const incomingPrompts = normalized.prompts;
          if (incomingPrompts.length === 0) return 0;
          const categories =
            normalized.categories.length > 0 ? normalized.categories : DEFAULT_CATEGORIES;
          const favorites = normalized.favorites;
          const customOrder = normalized.customOrder;
          const incomingCollections = normalized.collections;

          commit((s) => {
            if (mode === "replace") {
              return {
                prompts: incomingPrompts,
                categories,
                favorites,
                customOrder,
                collections: incomingCollections,
                page: 1,
              };
            }
            const existingIds = new Set(s.prompts.map((p) => p.id));
            const existingSlug = new Set(s.prompts.map((p) => `${p.title}|${p.content.slice(0, 80)}`));
            const merged = incomingPrompts
              .filter((p) => p && p.id)
              .map((p) => (existingIds.has(p.id) ? { ...p, id: generateId() } : p))
              .filter((p) => {
                const key = `${p.title}|${(p.content || "").slice(0, 80)}`;
                if (existingSlug.has(key)) return false;
                existingSlug.add(key);
                return true;
              });
            const catIds = new Set(categories.map((c) => c.id));
            const mergedCollections = [
              ...s.collections,
              ...incomingCollections.filter(
                (c) => c && c.id && !s.collections.some((x) => x.id === c.id)
              ),
            ];
            return {
              prompts: [...merged, ...s.prompts],
              categories: [...s.categories, ...categories.filter((c) => !s.categories.some((x) => x.id === c.id) && catIds.has(c.id))],
              favorites: Array.from(new Set([...s.favorites, ...favorites])),
              collections: mergedCollections,
              page: 1,
            };
          });
          return incomingPrompts.length;
        },

        loadSample: () =>
          commit(() => ({
            prompts: [...buildSamplePrompts(), ...get().prompts],
          })),

        clearAll: () =>
          commit(() => ({
            prompts: [],
            favorites: [],
            customOrder: [],
            collections: [],
            page: 1,
            selectionMode: false,
            selected: [],
          })),

        exportBundle: () => {
          const s = get();
          return {
            app: "prompt-vault" as const,
            version: 2,
            exportedAt: new Date().toISOString(),
            prompts: s.prompts,
            categories: s.categories,
            favorites: s.favorites,
            customOrder: s.customOrder,
            collections: s.collections,
          };
        },

        undo: () => {
          const s = get();
          if (s.past.length === 0) return;
          const prev = s.past[s.past.length - 1];
          set({
            past: s.past.slice(0, -1),
            future: [snapshotOf(s), ...s.future].slice(0, MAX_HISTORY),
            ...prev,
            page: 1,
          });
        },

        redo: () => {
          const s = get();
          if (s.future.length === 0) return;
          const next = s.future[0];
          set({
            past: [...s.past, snapshotOf(s)].slice(-MAX_HISTORY),
            future: s.future.slice(1),
            ...next,
            page: 1,
          });
        },

        openEditor: (promptId) =>
          set({ editor: { open: true, promptId }, editorPrefill: null }),
        openEditorWith: (draft) =>
          set({ editor: { open: true, promptId: null }, editorPrefill: draft }),
        closeEditor: () => set({ editor: { open: false, promptId: null }, editorPrefill: null }),
        openDetails: (id) => set({ detailsId: id }),
        closeDetails: () => set({ detailsId: null }),
        setAnalyticsOpen: (v) => set({ analyticsOpen: v }),
        setTemplatesOpen: (v) => set({ templatesOpen: v }),
        setCategoriesOpen: (v) => set({ categoriesOpen: v }),
        setShortcutsOpen: (v) => set({ shortcutsOpen: v }),
        setCollectionsOpen: (v) => set({ collectionsOpen: v }),
        openCollection: (id) => set({ openCollectionId: id }),
        closeCollection: () => set({ openCollectionId: null }),
        openAddToCollection: (promptId) => set({ addToCollectionPromptId: promptId }),
        closeAddToCollection: () => set({ addToCollectionPromptId: null }),
        setSecurityOpen: (v) => set({ securityOpen: v }),
        requestConfirm: (req) => set({ confirm: req }),
        cancelConfirm: () => set({ confirm: null }),

        setSelectionMode: (v) => set({ selectionMode: v, selected: v ? get().selected : [] }),
        toggleSelected: (id) =>
          set((s) => ({
            selected: s.selected.includes(id)
              ? s.selected.filter((x) => x !== id)
              : [...s.selected, id],
          })),
        selectAll: (ids) => set({ selected: ids }),
        clearSelection: () => set({ selectionMode: false, selected: [] }),
        setImporting: (v) => set({ importing: v }),
      };
    },
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        prompts: s.prompts,
        categories: s.categories,
        favorites: s.favorites,
        customOrder: s.customOrder,
        collections: s.collections,
        view: s.view,
        sort: s.sort,
        security: s.security,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);
