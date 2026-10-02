"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY_ID, buildSamplePrompts } from "./data";
import type {
  Category,
  ExportBundle,
  Prompt,
  PromptDraft,
  SortKey,
  VaultSnapshot,
  ViewMode,
} from "./types";
import { generateId, slugify } from "./utils";

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
        const idArr = Array.from(ids);
        const favSet = new Set(s.favorites);
        idArr.forEach((id) => favSet.delete(id));
        return {
          favorites: s.favorites.filter((id) => !ids.has(id)),
          customOrder: s.customOrder.filter((id) => !ids.has(id)),
          selected: s.selected.filter((id) => !ids.has(id)),
        };
      };

      return {
        prompts: [],
        categories: DEFAULT_CATEGORIES,
        favorites: [],
        customOrder: [],
        view: "grid",
        sort: "newest",
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
        confirm: null,
        importing: false,

        markHydrated: () => set({ hydrated: true }),
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

        importBundle: (bundle, mode) => {
          const incomingPrompts = Array.isArray(bundle.prompts) ? bundle.prompts : [];
          if (incomingPrompts.length === 0) return 0;
          const categories =
            "categories" in bundle && Array.isArray(bundle.categories) && bundle.categories.length
              ? bundle.categories
              : DEFAULT_CATEGORIES;
          const favorites =
            "favorites" in bundle && Array.isArray(bundle.favorites) ? bundle.favorites : [];
          const customOrder =
            "customOrder" in bundle && Array.isArray(bundle.customOrder) ? bundle.customOrder : [];

          commit((s) => {
            if (mode === "replace") {
              return {
                prompts: incomingPrompts,
                categories,
                favorites,
                customOrder,
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
              })
              .map((p) => ({
                ...p,
                tags: Array.isArray(p.tags) ? p.tags : [],
                images: Array.isArray(p.images) ? p.images : [],
                rating: Number(p.rating) || 0,
                usageCount: Number(p.usageCount) || 0,
              }));
            const catIds = new Set(categories.map((c) => c.id));
            return {
              prompts: [...merged, ...s.prompts],
              categories: [...s.categories, ...categories.filter((c) => !s.categories.some((x) => x.id === c.id) && catIds.has(c.id))],
              favorites: Array.from(new Set([...s.favorites, ...favorites])),
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
            page: 1,
            selectionMode: false,
            selected: [],
          })),

        exportBundle: () => {
          const s = get();
          return {
            app: "prompt-vault" as const,
            version: 1,
            exportedAt: new Date().toISOString(),
            prompts: s.prompts,
            categories: s.categories,
            favorites: s.favorites,
            customOrder: s.customOrder,
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
        view: s.view,
        sort: s.sort,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);
