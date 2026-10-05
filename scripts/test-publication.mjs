import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import {
  dist,
  filesUnder,
  readFeed,
  readPagefind,
  readSitemap,
  resolveOutput,
  root,
  site,
  validateSite,
} from "./validate-site.mjs";

// Fixtures contain synthetic, non-sensitive prose only. Each run owns unique paths.
// The final rebuild is intentional: never leave test articles in deployable output.
const runId = randomUUID().replaceAll("-", "");
const directoryKey = createHash("sha256")
  .update(root)
  .digest("hex")
  .slice(0, 16);
const lockPath = path.join(
  tmpdir(),
  `junming-publication-test-${directoryKey}.lock`
);
const createdFiles = [];
let activeBuild;
let interrupted = false;

function onSignal(signal) {
  interrupted = true;
  activeBuild?.kill(signal);
}
const onInterrupt = () => onSignal("SIGINT");
const onTerminate = () => onSignal("SIGTERM");

async function build() {
  const executable = process.env.npm_execpath ? process.execPath : "pnpm";
  const args = process.env.npm_execpath
    ? [process.env.npm_execpath, "run", "build"]
    : ["run", "build"];
  await new Promise((resolve, reject) => {
    activeBuild = spawn(executable, args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    activeBuild.once("error", reject);
    activeBuild.once("close", (code, signal) => {
      activeBuild = null;
      if (code === 0) resolve();
      else
        reject(new Error(`Publication test build failed (${signal || code})`));
    });
  });
}

function fixture(collection, kind, { draft, date, omitDraft = false }) {
  const slug = `qa-${collection}-${kind}-${runId}`;
  const marker = `qapublication${collection}${kind}${runId}`;
  const attributes = [
    `title: "Publication test ${kind} ${runId}"`,
    `description: "Synthetic publication regression fixture ${marker}."`,
    `slug: ${slug}`,
    "lang: en",
    ...(!omitDraft ? [`draft: ${draft}`] : []),
    ...(date ? [`publishedAt: "${date}"`] : []),
    ...(collection === "projects"
      ? [
          "role: Test fixture",
          "scope: Synthetic example",
          "evidenceLinks: []",
          "order: 999",
        ]
      : ["kind: note"]),
    ...(collection === "writing" && kind === "published"
      ? [
          "originalSource:",
          "  url: https://example.com/original-article",
          "  title: Synthetic original article",
          "  platform: WeChat",
          '  publishedAt: "1999-06-01T00:00:00.000Z"',
        ]
      : []),
  ];
  const body = [
    "## Synthetic content",
    "",
    marker,
    "",
    "| Check | Expected outcome |",
    "| --- | --- |",
    "| Publication | Explicitly controlled |",
    "| Isolation | No private information |",
    "",
    "```text",
    `${marker} ${"wide-code-sample-".repeat(18)}`,
    "```",
    "",
    "[Projects](/projects/) · [This section](#synthetic-content)",
    "",
  ];
  return {
    collection,
    kind,
    slug,
    marker,
    route: `/${collection}/${slug}/`,
    filename: path.join(root, "src/content", collection, `${slug}.md`),
    source: `---\n${attributes.join("\n")}\n---\n\n${body.join("\n")}`,
  };
}

async function assertAbsentFromOutput(fixtures) {
  for (const filename of await filesUnder(dist)) {
    let bytes = await readFile(filename);
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = gunzipSync(bytes);
    const content = bytes.toString("utf8").toLowerCase();
    for (const entry of fixtures) {
      assert(
        !content.includes(entry.marker),
        `${entry.kind} fixture content leaked into ${path.relative(dist, filename)}`
      );
      assert(
        !content.includes(entry.slug),
        `${entry.kind} fixture URL leaked into ${path.relative(dist, filename)}`
      );
    }
  }
}

async function main() {
  const lock = await open(lockPath, "wx").catch(error => {
    if (error.code === "EEXIST")
      throw new Error(
        `Another publication test may be running. Inspect ${lockPath} before removing a stale lock.`
      );
    throw error;
  });
  await lock.writeFile(`${process.pid}\n`);
  process.on("SIGINT", onInterrupt);
  process.on("SIGTERM", onTerminate);
  const future = new Date(Date.now() + 366 * 24 * 60 * 60 * 1000).toISOString();
  const fixtures = [
    fixture("writing", "published", {
      draft: false,
      date: "2000-01-02T00:00:00.000Z",
    }),
    fixture("writing", "draft", {
      draft: true,
      date: "2000-01-02T00:00:00.000Z",
    }),
    fixture("writing", "future", { draft: false, date: future }),
    fixture("writing", "defaultdraft", { omitDraft: true }),
    fixture("projects", "draft", { draft: true }),
    fixture("projects", "future", { draft: false, date: future }),
  ];
  const published = fixtures[0];
  const excluded = fixtures.slice(1);
  let primaryError;
  let cleanupError;
  try {
    for (const entry of fixtures) {
      await mkdir(path.dirname(entry.filename), { recursive: true });
      await writeFile(entry.filename, entry.source, { flag: "wx" });
      createdFiles.push(entry.filename);
    }
    process.stdout.write(
      "Building with synthetic published, draft, default-draft and future content.\n"
    );
    await build();
    if (interrupted) throw new Error("Publication test interrupted");
    await validateSite();
    const output = await resolveOutput(published.route);
    assert(output, "Published writing fixture has no route");
    const html = await readFile(output, "utf8");
    assert(html.includes(published.marker), "Published article body missing");
    assert(/<table(?:\s|>)/.test(html), "Markdown table did not render");
    assert(
      /<pre(?:\s|>)/.test(html) && html.includes("wide-code-sample-"),
      "Long code block did not render"
    );
    assert(
      (await readFile(path.join(dist, "writing/index.html"), "utf8")).includes(
        published.slug
      ),
      "Published article missing from writing listing"
    );
    const sitemap = await readSitemap();
    assert(
      sitemap.has(new URL(published.route, site).href),
      "Published article missing from sitemap"
    );
    const fragments = await readPagefind();
    assert(
      fragments.some(
        fragment =>
          new URL(fragment.url, site).pathname === published.route &&
          fragment.content.includes(published.marker)
      ),
      "Published article missing from actual search fragments"
    );
    for (const filename of ["rss.xml", "feed.xml"]) {
      const { items } = await readFeed(filename);
      assert(
        items.some(
          item => new URL(item.link, site).pathname === published.route
        ),
        `Published article missing from ${filename}`
      );
    }
    for (const entry of excluded) {
      assert.equal(
        await resolveOutput(entry.route),
        null,
        `${entry.kind} fixture acquired a route`
      );
      assert(
        !sitemap.has(new URL(entry.route, site).href),
        `${entry.kind} fixture leaked into sitemap`
      );
      assert(
        !fragments.some(
          fragment => new URL(fragment.url, site).pathname === entry.route
        ),
        `${entry.kind} fixture leaked into Pagefind`
      );
    }
    await assertAbsentFromOutput(excluded);
  } catch (error) {
    primaryError = error;
  } finally {
    try {
      await Promise.all(
        createdFiles.map(filename => rm(filename, { force: true }))
      );
      process.stdout.write(
        "Removed synthetic fixtures; rebuilding clean deployable output.\n"
      );
      await build();
      await assertAbsentFromOutput(fixtures);
      await validateSite();
    } catch (error) {
      cleanupError = error;
    } finally {
      process.removeListener("SIGINT", onInterrupt);
      process.removeListener("SIGTERM", onTerminate);
      await lock.close();
      await rm(lockPath, { force: true });
    }
  }
  if (primaryError || cleanupError) {
    throw new AggregateError(
      [primaryError, cleanupError].filter(Boolean),
      "Publication regression test failed; inspect build/cleanup errors before deploying."
    );
  }
  process.stdout.write(
    "Publication checks passed: published content is discoverable; draft and future writing/projects are absent from HTML, RSS, sitemap and search. Clean output restored.\n"
  );
}

main().catch(error => {
  process.stderr.write(`${error.stack || error}\n`);
  for (const cause of error.errors || [])
    process.stderr.write(`${cause.stack || cause}\n`);
  process.exitCode = 1;
});
