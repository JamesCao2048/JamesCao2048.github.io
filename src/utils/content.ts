import { getCollection } from "astro:content";
// One publication filter feeds routes, RSS and search (which indexes built HTML).
// Drafts and future posts never acquire routes, so sitemap and OG cannot leak them.
export function isPublished(data: {
  draft: boolean;
  publishedAt?: Date;
}): boolean {
  return (
    !data.draft &&
    (!data.publishedAt || data.publishedAt.getTime() <= Date.now())
  );
}
export async function getProjects() {
  const entries = await getCollection("projects", ({ data }) =>
    isPublished(data)
  );
  ensureUniqueSlugs(entries);
  return entries.sort((a, b) => a.data.order - b.data.order);
}
export async function getWriting() {
  const entries = await getCollection("writing", ({ data }) =>
    isPublished(data)
  );
  ensureUniqueSlugs(entries);
  return entries.sort(
    (a, b) => b.data.publishedAt!.getTime() - a.data.publishedAt!.getTime()
  );
}
function ensureUniqueSlugs(entries: { data: { slug: string } }[]) {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.data.slug))
      throw new Error(`Duplicate published slug: ${entry.data.slug}`);
    seen.add(entry.data.slug);
  }
}
export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(
    date
  );
