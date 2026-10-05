import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

// Astro 7.0.3's glob loader returns before removing stale entries when a
// collection becomes empty. A deleted last article can otherwise survive in
// RSS, HTML and search. The production content store lives in cacheDir, which
// defaults to node_modules/.astro; deleting root .astro alone is insufficient.
// Keep these paths aligned if outDir or cacheDir changes in astro.config.ts.
const generatedPaths = [
  ".astro", // Development store, generated types and content-module imports.
  "node_modules/.astro/data-store.json", // Production collection data/rendered HTML.
  "dist", // Previous HTML, feeds, sitemap and Pagefind output.
];

for (const relative of generatedPaths) {
  await rm(path.join(root, relative), { recursive: true, force: true });
}

process.stdout.write(
  "Cleared generated content stores and previous site output.\n"
);
