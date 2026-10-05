import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { dist, publicContent, root } from "./validate-site.mjs";

// Exercise the generated Pagefind JavaScript + WASM against the real build,
// without a browser or a mocked search response.
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const filename = path.resolve(dist, `.${decodeURIComponent(url.pathname)}`);
    if (!filename.startsWith(`${path.join(dist, "pagefind")}${path.sep}`)) {
      response.writeHead(404).end();
      return;
    }
    response.setHeader(
      "content-type",
      filename.endsWith(".wasm")
        ? "application/wasm"
        : "application/octet-stream"
    );
    response.end(await readFile(filename));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const pagefind = await import(
  pathToFileURL(path.join(dist, "pagefind/pagefind.js"))
);
await pagefind.options({
  basePath: `http://127.0.0.1:${port}/pagefind/`,
  baseUrl: "/",
});

async function search(term, selected) {
  const response = await pagefind.search(term, {
    filters: { category: { any: selected } },
  });
  return Promise.all(response.results.map(result => result.data()));
}

try {
  const categories = ["Blogs", "Projects", "Publications"];
  const publications = JSON.parse(
    await readFile(path.join(root, "src/data/publications.json"), "utf8")
  );
  const all = await search(null, categories);
  const expectedCounts = {
    Blogs: (await publicContent("writing")).filter(entry => entry.published)
      .length,
    Projects: (await publicContent("projects")).filter(entry => entry.published)
      .length,
    Publications: publications.length,
  };
  assert.equal(
    all.length,
    Object.values(expectedCounts).reduce((sum, count) => sum + count, 0),
    "All-scope search includes only individual public content"
  );
  assert.equal(
    new Set(all.map(result => result.url)).size,
    all.length,
    "No duplicate search URLs"
  );
  for (const category of categories) {
    const matches = await search(null, [category]);
    assert.equal(
      matches.length,
      expectedCounts[category],
      `${category}: complete inventory`
    );
    assert(
      matches.every(result => result.meta.category === category),
      `${category}: scope isolation`
    );
  }
  const pair = await search(null, ["Blogs", "Projects"]);
  assert.equal(
    pair.length,
    expectedCounts.Blogs + expectedCounts.Projects,
    "Multiple checked scopes use OR, not AND"
  );
  for (const paper of publications) {
    const matches = await search(paper.title, ["Publications"]);
    assert(
      matches.some(result => result.url === `/publications/#${paper.id}`),
      `${paper.id}: exact title finds its own anchored result`
    );
  }
  for (const query of ["coding", "machine", "Junming Cao"]) {
    const matches = await search(query, categories);
    assert(matches.length > 0, `${query}: expected matches`);
    assert(
      matches.every(result => categories.includes(result.meta.category)),
      `${query}: every result has a supported category`
    );
  }
  const absent = await search("zzunmatchableqasearchtokenzz", categories);
  assert.equal(absent.length, 0, "Unknown term gives an empty result");
  process.stdout.write(
    `Search checks passed: ${all.length} records; category isolation and unions; ${publications.length} individual paper title/anchor matches; mixed and empty queries.\n`
  );
} finally {
  await pagefind.destroy();
  await new Promise((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve()))
  );
}
