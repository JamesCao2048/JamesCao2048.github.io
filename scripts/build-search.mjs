import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as pagefind from "pagefind";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "dist");

function check(result, label) {
  assert(!result.errors?.length, `${label}: ${result.errors?.join("; ")}`);
  return result;
}

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map(entry => {
      const filename = path.join(directory, entry.name);
      return entry.isDirectory()
        ? htmlFiles(filename)
        : filename.endsWith(".html")
          ? [filename]
          : [];
    })
  );
  return groups.flat();
}

try {
  const { index } = check(await pagefind.createIndex(), "Create search index");
  assert(index, "Pagefind did not create an index");
  let articleCount = 0;
  for (const filename of await htmlFiles(dist)) {
    const content = await readFile(filename, "utf8");
    // Only rendered public article pages opt in. Listing pages and homepage
    // summaries would otherwise duplicate each blog, project and publication.
    if (!/data-search-category="(?:Blogs|Projects)"/.test(content)) continue;
    assert(
      /data-pagefind-body(?:\s|=|>)/.test(content),
      `${filename}: missing search body`
    );
    const url =
      `/${path.relative(dist, filename).split(path.sep).join("/")}`.replace(
        /index\.html$/,
        ""
      );
    check(await index.addHTMLFile({ url, content }), `Index ${url}`);
    articleCount += 1;
  }
  const publications = JSON.parse(
    await readFile(path.join(root, "src/data/publications.json"), "utf8")
  );
  for (const paper of publications) {
    check(
      await index.addCustomRecord({
        url: `/publications/#${paper.id}`,
        content: [
          paper.title,
          paper.authors,
          paper.venue,
          paper.year,
          paper.role,
          paper.award,
        ]
          .filter(Boolean)
          .join(". "),
        language: "en",
        meta: {
          title: paper.title,
          category: "Publications",
          detail: `${paper.venue} · ${paper.year}`,
        },
        filters: { category: ["Publications"] },
      }),
      `Index publication ${paper.id}`
    );
  }
  check(
    await index.writeFiles({ outputPath: path.join(dist, "pagefind") }),
    "Write search index"
  );
  process.stdout.write(
    `Indexed ${articleCount} blog/project pages and ${publications.length} individual publications.\n`
  );
} finally {
  await pagefind.close();
}
