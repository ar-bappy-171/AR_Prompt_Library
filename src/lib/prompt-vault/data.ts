import type { Category, Prompt, PromptDraft } from "./types";
import { generateId } from "./utils";

export const FALLBACK_CATEGORY_ID = "other";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "art", name: "Art & Images", color: "#f43f5e", icon: "palette" },
  { id: "writing", name: "Writing", color: "#f59e0b", icon: "pen" },
  { id: "code", name: "Code & Tech", color: "#10b981", icon: "code" },
  { id: "analysis", name: "Analysis", color: "#14b8a6", icon: "chart" },
  { id: "creative", name: "Creative", color: "#a855f7", icon: "bulb" },
  { id: "other", name: "Other", color: "#64748b", icon: "folder" },
];

export interface StarterTemplate extends PromptDraft {
  description: string;
  icon: string;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    description: "Structured outline + draft for long-form articles.",
    icon: "pen",
    title: "Blog Post Outliner",
    category: "writing",
    tags: ["blog", "outline", "seo"],
    engine: "GPT-4o",
    rating: 4,
    notes: "Works great with claude for a more narrative tone.",
    content:
      "You are an expert content strategist. Write an outline for a blog post titled \"{{title}}\".\n\nAudience: {{audience}}\nTone: {{tone}}\n\nRequirements:\n1. A magnetic headline (max 60 chars) plus 2 alternatives\n2. A hook opening paragraph\n3. 4–6 H2 sections with 2–3 bullet takeaways each\n4. A conclusion with a clear call-to-action\n5. 5 SEO keywords to weave in naturally",
    images: [],
  },
  {
    description: "Thorough code review with severity levels.",
    icon: "code",
    title: "Code Review Assistant",
    category: "code",
    tags: ["code", "review", "best-practices"],
    engine: "GPT-4o",
    rating: 5,
    notes: "Paste the diff under the prompt.",
    content:
      "Act as a senior software engineer performing a code review.\n\nReview the following code for:\n- Correctness and edge cases\n- Security vulnerabilities\n- Performance issues\n- Readability & naming\n- Test coverage gaps\n\nFor each finding: state SEVERITY (blocker/major/minor), explain the issue, and show a corrected snippet.\n\nCode:\n```\n{{code}}\n```",
    images: [],
  },
  {
    description: "Cinematic, detailed image-generation prompt.",
    icon: "palette",
    title: "Cinematic Image Prompt",
    category: "art",
    tags: ["midjourney", "photography", "lighting"],
    engine: "Midjourney v6",
    rating: 5,
    notes: "Use --ar 16:9 for widescreen, --style raw for realism.",
    content:
      "{{subject}}, cinematic photograph, shot on 35mm film, shallow depth of field, dramatic volumetric lighting, rich color grading, ultra detailed, 8k --ar 16:9 --style raw\n\nSwap {{subject}} for your scene, e.g. \"a lone lighthouse on a cliff at dusk, storm clouds, crashing waves\".",
    images: [],
  },
  {
    description: "Turn raw data into an executive-ready summary.",
    icon: "chart",
    title: "Data Analysis Report",
    category: "analysis",
    tags: ["data", "summary", "report"],
    engine: "GPT-4o",
    rating: 4,
    notes: "",
    content:
      "You are a data analyst. Given the dataset/metrics below, produce:\n\n1. **Executive summary** (3 bullets a non-technical exec understands)\n2. **Key trends** with numbers and % changes\n3. **Anomalies** worth investigating, with hypotheses\n4. **Recommendations** ranked by expected impact\n5. **Open questions** you would ask before going further\n\nData:\n{{data}}",
    images: [],
  },
  {
    description: "Fresh story premises with twists.",
    icon: "bulb",
    title: "Story Idea Generator",
    category: "creative",
    tags: ["fiction", "ideas", "plot"],
    engine: "GPT-4o",
    rating: 3,
    notes: "",
    content:
      "Generate 5 original story premises in the {{genre}} genre.\n\nFor each premise give:\n- A one-sentence logline\n- The protagonist with a contradiction in their personality\n- The central conflict and a surprising midpoint twist\n- The tone (comparing to 1 existing work)\n\nConstraints: grounded stakes, no chosen-one tropes, ending should be bittersweet.",
    images: [],
  },
  {
    description: "Rewrite emails to be clear, kind and effective.",
    icon: "pen",
    title: "Email Polisher",
    category: "writing",
    tags: ["email", "communication"],
    engine: "GPT-4o mini",
    rating: 4,
    notes: "",
    content:
      "Rewrite the email below to be clear, concise, and warm. Keep it under 150 words.\n\nRules:\n- Lead with the ask or the key point\n- One idea per paragraph\n- No corporate filler (\"circling back\", \"per my last email\")\n- End with a specific next step\n\nEmail:\n{{email}}",
    images: [],
  },
  {
    description: "Personalized week-by-week learning plan.",
    icon: "chart",
    title: "Learning Roadmap",
    category: "analysis",
    tags: ["learning", "roadmap", "plan"],
    engine: "GPT-4o",
    rating: 5,
    notes: "",
    content:
      "Create a practical learning roadmap for {{skill}}.\n\nMy background: {{background}}\nTime available: {{hours}} hours/week\nGoal: {{goal}}\n\nOutput a week-by-week plan (max 8 weeks) with:\n- Focus theme per week\n- 2–3 concrete exercises\n- A weekly \"checkpoint project\"\n- Free resources (docs, videos, courses)\n- How to tell I'm ready to move on",
    images: [],
  },
  {
    description: "E-commerce product photography directions.",
    icon: "palette",
    title: "Product Photo Director",
    category: "art",
    tags: ["product", "ecommerce", "photography"],
    engine: "Midjourney v6",
    rating: 4,
    notes: "",
    content:
      "Studio product photograph of {{product}}, centered composition on a seamless {{color}} backdrop, soft diffused lighting with a subtle rim light, gentle reflection on a glossy surface, hyper-detailed textures, commercial photography, 85mm lens --ar 1:1 --style raw",
    images: [],
  },
];

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

export function buildSamplePrompts(): Prompt[] {
  const raw: Array<Omit<Prompt, "id" | "createdAt" | "updatedAt" | "lastUsedAt"> & { ageDays: number; usedDaysAgo: number | null }> = [
    {
      title: "Fantasy Landscape Generator",
      category: "art",
      content:
        "Create a breathtaking fantasy landscape with towering mountains, mystical forests, and a crystal-clear river flowing through a magical valley. Digital painting style, highly detailed, epic scale, cinematic lighting, 8K resolution, trending on ArtStation.",
      tags: ["fantasy", "landscape", "digital-painting", "epic"],
      notes: "Works best with DALL·E 3 or Midjourney v6. Use --ar 16:9 for widescreen and --style raw for more creative control.",
      rating: 5,
      engine: "Midjourney v6",
      usageCount: 14,
      images: [],
      ageDays: 21,
      usedDaysAgo: 2,
    },
    {
      title: "Regex Explainer & Fixer",
      category: "code",
      content:
        "Explain this regular expression line by line in plain English. Then point out any bugs, catastrophic backtracking risks, or edge cases it misses, and provide an improved version with test cases.\n\nRegex: {{regex}}\nSample inputs: {{samples}}",
      tags: ["regex", "explain", "debug"],
      notes: "",
      rating: 4,
      engine: "GPT-4o",
      usageCount: 9,
      images: [],
      ageDays: 18,
      usedDaysAgo: 1,
    },
    {
      title: "Weekly Newsletter Digest",
      category: "writing",
      content:
        "Turn my rough notes into a friendly newsletter section. Voice: smart, warm, zero fluff. Structure: catchy opener (1 line), 3 curated items with a one-sentence \"why it matters\", closing tease for next week.\n\nNotes: {{notes}}",
      tags: ["newsletter", "curation", "voice"],
      notes: "Keeps my voice consistent — add an example of past intro for tone-matching.",
      rating: 4,
      engine: "GPT-4o mini",
      usageCount: 22,
      images: [],
      ageDays: 14,
      usedDaysAgo: 4,
    },
    {
      title: "Competitor SWOT Snapshot",
      category: "analysis",
      content:
        "Build a SWOT analysis for {{company}} in the {{industry}} market. Use only well-known, pre-2023 facts and clearly mark anything uncertain. Finish with the single biggest strategic risk and one bold opportunity.",
      tags: ["swot", "strategy", "market"],
      notes: "",
      rating: 3,
      engine: "GPT-4o",
      usageCount: 5,
      images: [],
      ageDays: 9,
      usedDaysAgo: 9,
    },
    {
      title: "Character Voice Tester",
      category: "creative",
      content:
        "Write the same dialogue line (\"You shouldn't have come back.\") in 6 distinct character voices: noir detective, cheerful grandma, burned-out captain, sly merchant, shy prodigy, cult leader. 1–2 sentences each, capturing rhythm and word choice unique to each.",
      tags: ["dialogue", "characters", "voice"],
      notes: "Great warm-up exercise before fiction sessions.",
      rating: 5,
      engine: "Claude",
      usageCount: 7,
      images: [],
      ageDays: 6,
      usedDaysAgo: 3,
    },
    {
      title: "SQL Query Optimizer",
      category: "code",
      content:
        "Here is a slow SQL query and the table schemas. Explain why it is slow (index usage, join order, row estimates), then rewrite it. Provide: optimized query, required indexes with CREATE INDEX statements, and the expected complexity before/after.\n\nQuery:\n{{query}}\n\nSchema:\n{{schema}}",
      tags: ["sql", "performance", "database"],
      notes: "",
      rating: 4,
      engine: "GPT-4o",
      usageCount: 3,
      images: [],
      ageDays: 3,
      usedDaysAgo: null,
    },
  ];

  return raw.map((r) => {
    const { ageDays, usedDaysAgo, ...rest } = r;
    const createdAt = daysAgo(ageDays);
    return {
      ...rest,
      id: generateId(),
      createdAt,
      updatedAt: daysAgo(Math.max(0, ageDays - 2)),
      lastUsedAt: usedDaysAgo === null ? null : daysAgo(usedDaysAgo),
    };
  });
}
