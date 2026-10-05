import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
const base = {
  title: z.string(),
  description: z.string(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  lang: z.enum(["en", "zh"]).default("en"),
  draft: z.boolean().default(true),
  publishedAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
};
const projects = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.{md,mdx}",
    base: "./src/content/projects",
  }),
  schema: z.object({
    ...base,
    role: z.string(),
    scope: z.string(),
    featured: z.boolean().default(false),
    order: z.number().default(99),
    evidenceLinks: z.array(z.object({ label: z.string(), url: z.url() })),
  }),
});
const writing = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/writing" }),
  schema: z
    .object({
      ...base,
      kind: z.enum(["article", "note"]).default("article"),
      syndicationUrl: z.url().optional(),
      originalSource: z
        .object({
          url: z.url().refine(value => /^https?:\/\//.test(value), {
            message: "Original source must use an HTTP or HTTPS URL.",
          }),
          title: z.string().min(1),
          platform: z.string().min(1),
          publishedAt: z.coerce.date().optional(),
        })
        .optional(),
    })
    .refine(data => data.draft || !!data.publishedAt, {
      message: "Published writing needs its real publication date.",
    }),
});
export const collections = { projects, writing };
