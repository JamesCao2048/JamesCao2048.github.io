import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { XMLParser, XMLValidator } from "fast-xml-parser";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const dist = path.join(root, "dist");
export const site = "https://jamescao2048.github.io";
// Resolve the frontmatter parser from Astro, which declares it as a dependency.
const yaml = createRequire(import.meta.resolve("astro"))("js-yaml");

export async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map(entry => {
      const filename = path.join(directory, entry.name);
      return entry.isDirectory() ? filesUnder(filename) : [filename];
    })
  );
  return groups.flat().sort();
}

export function outputRoute(filename) {
  const relative = path.relative(dist, filename).split(path.sep).join("/");
  return `/${relative}`.replace(/index\.html$/, "");
}

export async function resolveOutput(urlPath) {
  const pathname = decodeURIComponent(new URL(urlPath, site).pathname);
  const candidate = path.resolve(dist, `.${pathname}`);
  assert(
    candidate === dist || candidate.startsWith(`${dist}${path.sep}`),
    `URL escapes output directory: ${pathname}`
  );
  for (const filename of [candidate, path.join(candidate, "index.html")]) {
    try {
      if ((await stat(filename)).isFile()) return filename;
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
    }
  }
  return null;
}

export function parseXml(source, label) {
  const validity = XMLValidator.validate(source);
  assert.equal(
    validity,
    true,
    `${label}: invalid XML: ${JSON.stringify(validity)}`
  );
  return new XMLParser({ ignoreAttributes: false }).parse(source);
}

const array = value =>
  value == null ? [] : Array.isArray(value) ? value : [value];

export async function readFeed(filename = "rss.xml") {
  const source = await readFile(path.join(dist, filename), "utf8");
  const parsed = parseXml(source, filename);
  assert.equal(
    String(parsed.rss?.["@_version"]),
    "2.0",
    `${filename}: RSS 2.0`
  );
  const channel = parsed.rss?.channel;
  assert(
    channel?.title && channel.description && channel.link,
    `${filename}: channel metadata`
  );
  assert.equal(
    new URL(channel.link).origin,
    site,
    `${filename}: channel origin`
  );
  return { source, items: array(channel.item), channel };
}

export async function readSitemap() {
  const sitemapFiles = (await filesUnder(dist)).filter(filename =>
    /^sitemap(?:-[\w-]+)?\.xml$/.test(path.basename(filename))
  );
  assert(sitemapFiles.length >= 2, "Missing sitemap index or URL sitemap");
  const urls = new Set();
  let foundIndex = false;
  for (const filename of sitemapFiles) {
    const parsed = parseXml(
      await readFile(filename, "utf8"),
      path.basename(filename)
    );
    if (parsed.sitemapindex) {
      foundIndex = true;
      for (const entry of array(parsed.sitemapindex.sitemap)) {
        assert.equal(new URL(entry.loc).origin, site, "Sitemap index origin");
        assert(
          await resolveOutput(entry.loc),
          `Missing sitemap target: ${entry.loc}`
        );
      }
    } else {
      assert(parsed.urlset, `${filename}: expected a sitemap URL set`);
      for (const entry of array(parsed.urlset.url)) {
        assert.equal(new URL(entry.loc).origin, site, "Sitemap URL origin");
        assert(!urls.has(entry.loc), `Duplicate sitemap URL: ${entry.loc}`);
        urls.add(entry.loc);
      }
    }
  }
  assert(foundIndex, "Missing sitemap index");
  return urls;
}

export async function readPagefind() {
  const files = await filesUnder(path.join(dist, "pagefind"));
  assert(
    files.some(filename => path.basename(filename) === "pagefind.js"),
    "Missing Pagefind runtime"
  );
  const fragments = [];
  for (const filename of files.filter(filename =>
    filename.endsWith(".pf_fragment")
  )) {
    const source = gunzipSync(await readFile(filename)).toString("utf8");
    assert(
      source.startsWith("pagefind_dcd"),
      `Unknown Pagefind fragment format: ${filename}`
    );
    const fragment = JSON.parse(source.slice("pagefind_dcd".length));
    assert.equal(typeof fragment.url, "string", "Pagefind fragment URL");
    assert.equal(
      typeof fragment.content,
      "string",
      "Pagefind searchable content"
    );
    fragments.push(fragment);
  }
  assert(fragments.length > 0, "No searchable Pagefind fragments");
  return fragments;
}

export async function publicContent(collection) {
  const entries = [];
  const directory = path.join(root, "src/content", collection);
  for (const filename of await filesUnder(directory)) {
    if (!/\.mdx?$/.test(filename) || path.basename(filename).startsWith("_"))
      continue;
    const source = await readFile(filename, "utf8");
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    assert(
      frontmatter,
      `Missing frontmatter: ${path.relative(root, filename)}`
    );
    const data = yaml.load(frontmatter[1]);
    const publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    const published =
      data.draft === false && (!publishedAt || publishedAt <= new Date());
    entries.push({ filename, data, published });
  }
  return entries;
}

function decodeEntities(value) {
  return value.replace(
    /&(?:amp|lt|gt|quot|apos|#39|#(\d+)|#x([a-f\d]+));/gi,
    (match, decimal, hex) => {
      if (decimal || hex)
        return String.fromCodePoint(parseInt(decimal || hex, hex ? 16 : 10));
      return {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&apos;": "'",
        "&#39;": "'",
      }[match.toLowerCase()];
    }
  );
}

function htmlTags(html) {
  const withoutCode = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/(<script\b[^>]*>)[\s\S]*?<\/script\s*>/gi, "$1</script>")
    .replace(/(<style\b[^>]*>)[\s\S]*?<\/style\s*>/gi, "$1</style>");
  return [
    ...withoutCode.matchAll(
      /<([a-z][\w:-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi
    ),
  ].map(match => {
    const attributes = {};
    for (const attribute of match[2].matchAll(
      /([^\s=/'">]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g
    )) {
      attributes[attribute[1].toLowerCase()] = decodeEntities(
        attribute[2] ?? attribute[3] ?? attribute[4] ?? ""
      );
    }
    return { name: match[1].toLowerCase(), attributes };
  });
}

const normalizeText = value =>
  value.normalize("NFC").replace(/\s+/g, " ").trim();

function readableText(html) {
  return normalizeText(
    decodeEntities(
      html
        .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(
          /<\/(?:p|div|article|section|h[1-6]|li|time)>|<br\b[^>]*>/gi,
          " "
        )
        .replace(/<[^>]+>/g, "")
    )
  );
}

// These targeted checks use non-nested article/heading/time elements in the
// generated site. They verify visible content, not source data or meta tags.
function elementContents(html, name) {
  return [
    ...html.matchAll(
      new RegExp(`<${name}\\b[^>]*>[\\s\\S]*?<\\/${name}\\s*>`, "gi")
    ),
  ].map(match => match[0]);
}

function assertWritingRendered(listing, detail, entry) {
  const route = `/writing/${entry.data.slug}/`;
  const hasLink = html =>
    htmlTags(html).some(
      tag =>
        tag.name === "a" &&
        new URL(tag.attributes.href, site).pathname === route
    );
  const row = elementContents(listing, "article").find(hasLink);
  assert(row, `${route}: missing writing list row`);
  const linkedHeading = elementContents(row, "h2").find(hasLink);
  assert(linkedHeading, `${route}: title must be a linked heading`);
  assert.equal(
    readableText(linkedHeading),
    normalizeText(entry.data.title),
    `${route}: rendered linked title`
  );
  const title = elementContents(detail, "h1")[0];
  assert(title, `${route}: article heading missing`);
  assert.equal(
    readableText(title),
    normalizeText(entry.data.title),
    `${route}: rendered article title`
  );
  const date = new Date(entry.data.publishedAt);
  const dateLabel = new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
  for (const [label, html] of [
    ["listing", row],
    ["article", detail],
  ]) {
    const time = elementContents(html, "time").find(
      element => htmlTags(element)[0].attributes.datetime === date.toISOString()
    );
    assert(time, `${route}: ${label} publication date missing`);
    assert.equal(
      readableText(time),
      dateLabel,
      `${route}: ${label} visible date`
    );
  }
  const sourceNotes = elementContents(detail, "p").filter(element =>
    htmlTags(element).some(tag => "data-original-source" in tag.attributes)
  );
  const original = entry.data.originalSource;
  assert.equal(
    sourceNotes.length,
    original ? 1 : 0,
    `${route}: original-source note matches article metadata`
  );
  if (original) {
    const note = sourceNotes[0];
    const text = readableText(note);
    assert(text.includes("English adaptation"), `${route}: adaptation label`);
    assert(
      text.includes(normalizeText(original.platform)),
      `${route}: original platform`
    );
    assert(
      htmlTags(note).some(
        tag =>
          tag.name === "a" &&
          tag.attributes.href === original.url &&
          tag.attributes.title === original.title &&
          /^https?:\/\//.test(tag.attributes.href)
      ),
      `${route}: original article link and title`
    );
    const dates = elementContents(note, "time");
    assert.equal(
      dates.length,
      original.publishedAt ? 1 : 0,
      `${route}: show original date only when known`
    );
    if (original.publishedAt) {
      const originalDate = new Date(original.publishedAt);
      assert.equal(
        htmlTags(dates[0])[0].attributes.datetime,
        originalDate.toISOString(),
        `${route}: original publication date`
      );
      assert.equal(
        readableText(dates[0]),
        new Intl.DateTimeFormat("en", {
          dateStyle: "long",
          timeZone: "UTC",
        }).format(originalDate),
        `${route}: visible original date`
      );
    }
  }
}

export function excludedRoute(url) {
  return (
    /^\/(?:blog|back_posts|news|teaching|search|cv)(?:\/|$)/.test(
      new URL(url, site).pathname
    ) ||
    /^\/404(?:\.html|\/|$)/.test(new URL(url, site).pathname) ||
    /^\/projects\/\d_project\//.test(new URL(url, site).pathname)
  );
}

const legacyRoutes = [
  "/blog/",
  "/blog/2021/mindspore1/",
  "/blog/2021/mindspore2/",
  "/blog/2021/mindspore3/",
  "/blog/2021/mindspore/2",
  ...[1, 2, 3, 4, 5, 6].map(number => `/projects/${number}_project/`),
  ...[1, 2, 3].map(number => `/news/announcement_${number}/`),
  "/teaching/",
  ...[
    "2015-03-15-formatting-and-links",
    "2015-05-15-images",
    "2015-07-15-code",
    "2015-10-20-comments",
    "2015-10-20-math",
    "2018-12-22-distill",
    "2020-09-28-github-metadata",
  ].map(slug => `/back_posts/${slug}/`),
];

const preservedPdfHashes = {
  "BugPecker.pdf":
    "6ec3aed8f4cb57773882c81d2528ae15d19bc4a1446fc2a0762fb741e5fee52a",
  "CocoQa.pdf":
    "96a85a5f59b440a5347a3c615f1b798bf481eafe7bd7504f0813bb1e456c9e77",
  "DNNLocator.pdf":
    "cbdc8e50ac9f388d484ebbe11d38f43a4db6a6b84dd16f686b63c1298ea9c139",
  "dlperf.pdf":
    "e10472c2b01e41272804f9caeeabc8d86d54640e83dcae215c7f1f3f3d1fbe47",
  "dlstack.pdf":
    "ff2aba9f8bf629adfa355968cc50bd1a2e77856ebe2f02a5b73c32a5747c1b50",
};

// These are generic leak indicators, never copies of private CV facts or values.
const disallowedText = [
  ["template author", /\b(?:Sat Naing|Your Name|John Doe|Jane Doe)\b/i],
  [
    "template prose",
    /(?:lorem ipsum|Every project has a beautiful feature showcase|Replace this text with your description|a minimal, responsive, accessible and SEO-friendly Astro blog theme)/i,
  ],
  [
    "unpublished paper status",
    /\b(?:under review|manuscript in preparation|submitted to (?:ICSE|FSE|ASE|ISSTA|NeurIPS|ICLR)|unpublished manuscript)\b/i,
  ],
  ["local filesystem path", /(?:\/Users\/|\/home\/|[A-Z]:\\Users\\)/],
  [
    "private URL",
    /(?:https?:\/\/(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(?::|\/)|https?:\/\/[^\s<>"']+\.(?:internal|local)(?:\/|:))/i,
  ],
  [
    "access token",
    /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-[A-Za-z0-9_-]{30,})\b/,
  ],
  ["private key", /-----BEGIN (?:OPENSSH |RSA |EC )?PRIVATE KEY-----/],
  ["phone contact", /(?:href\s*=\s*["']tel:|(?:\+86[ -]?)?\b1[3-9]\d{9}\b)/i],
  [
    "private result label",
    /\b(?:internal|confidential|unpublished)\s+(?:benchmark|metrics?|results?|score|dataset)\b/i,
  ],
];

export async function validateSite() {
  const { pdfPath: cvPdfPath } = JSON.parse(
    await readFile(path.join(root, "src/data/cv.json"), "utf8")
  );
  assert(
    cvPdfPath === null ||
      (typeof cvPdfPath === "string" &&
        /^\/assets\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$/.test(
          cvPdfPath
        )),
    "CV must be disabled or point to a local PDF asset"
  );
  const cvRoute = await resolveOutput("/cv/");
  if (cvPdfPath) {
    assert(cvRoute, "Configured CV requires a compatibility redirect");
    const pdf = await resolveOutput(cvPdfPath);
    assert(pdf, "Configured CV PDF missing from output");
    assert.equal(
      (await readFile(pdf)).subarray(0, 5).toString(),
      "%PDF-",
      "CV PDF signature"
    );
  } else {
    assert.equal(cvRoute, null, "No CV page without an approved PDF");
  }
  const files = await filesUnder(dist);
  const htmlFiles = files.filter(filename => filename.endsWith(".html"));
  assert(htmlFiles.length > 0, "Run pnpm build before validation");
  const pages = new Map();
  for (const filename of htmlFiles) {
    const html = await readFile(filename, "utf8");
    const tags = htmlTags(html);
    const ids = new Set(tags.map(tag => tag.attributes.id).filter(Boolean));
    pages.set(filename, { html, tags, ids, route: outputRoute(filename) });
  }
  let referenceCount = 0;
  for (const [filename, page] of pages) {
    const { html, tags, route } = page;
    if (route === "/cv/") {
      // Astro generates a minimal static redirect, not a career overview.
      assert(cvPdfPath, "Unexpected CV route without a configured PDF");
      for (const [name, attribute, value] of [
        ["meta", "http-equiv", "refresh"],
        ["meta", "name", "robots"],
        ["link", "rel", "canonical"],
      ]) {
        const matches = tags.filter(
          tag => tag.name === name && tag.attributes[attribute] === value
        );
        assert.equal(matches.length, 1, `CV redirect: one ${value} tag`);
        if (value === "refresh")
          assert.equal(
            matches[0].attributes.content,
            `0;url=${cvPdfPath}`,
            "CV redirects directly to PDF"
          );
        if (value === "robots")
          assert.equal(
            matches[0].attributes.content,
            "noindex",
            "CV redirect stays out of search"
          );
        if (value === "canonical")
          assert.equal(
            matches[0].attributes.href,
            new URL(cvPdfPath, site).href,
            "CV canonical points to PDF"
          );
      }
      assert(
        !tags.some(
          tag =>
            ["h1", "article", "nav"].includes(tag.name) ||
            "data-pagefind-body" in tag.attributes
        ),
        "CV route must contain only a redirect"
      );
      assert(
        tags.some(tag => tag.name === "a" && tag.attributes.href === cvPdfPath),
        "CV redirect provides a direct PDF fallback"
      );
      continue;
    }
    assert(
      !tags.some(
        tag =>
          tag.name === "a" &&
          ["/cv", "/cv/"].includes(new URL(tag.attributes.href, site).pathname)
      ),
      `${route}: CV links must point directly to the PDF`
    );
    if (cvPdfPath && route === "/") {
      assert(
        tags.some(tag => tag.name === "a" && tag.attributes.href === cvPdfPath),
        "Homepage must expose the configured PDF"
      );
    }
    assert(
      tags.some(tag => tag.name === "html" && tag.attributes.lang === "en"),
      `${route}: English document language`
    );
    const canonical = tags.filter(
      tag => tag.name === "link" && tag.attributes.rel === "canonical"
    );
    assert.equal(canonical.length, 1, `${route}: exactly one canonical URL`);
    assert.equal(
      new URL(canonical[0].attributes.href).origin,
      site,
      `${route}: production canonical origin`
    );
    assert.equal(
      tags.filter(tag => tag.name === "title").length,
      1,
      `${route}: one title`
    );
    assert(
      tags.some(
        tag =>
          tag.name === "meta" &&
          tag.attributes.name === "description" &&
          tag.attributes.content
      ),
      `${route}: meta description`
    );
    const noindex = tags.some(
      tag =>
        tag.name === "meta" &&
        tag.attributes.name === "robots" &&
        /\bnoindex\b/i.test(tag.attributes.content)
    );
    if (excludedRoute(route)) {
      assert(
        noindex,
        `${route}: legacy, search and error pages must be noindex`
      );
      assert(
        !tags.some(tag => "data-pagefind-body" in tag.attributes),
        `${route}: excluded from Pagefind body`
      );
    } else {
      assert(!noindex, `${route}: current page unexpectedly noindex`);
      assert.equal(
        tags.filter(tag => tag.name === "h1").length,
        1,
        `${route}: exactly one H1`
      );
      assert.equal(
        new URL(canonical[0].attributes.href).pathname,
        route,
        `${route}: self canonical`
      );
      const searchCategory = /^\/writing\/.+\/$/.test(route)
        ? "Blogs"
        : /^\/projects\/.+\/$/.test(route)
          ? "Projects"
          : null;
      assert.equal(
        tags.some(tag => "data-pagefind-body" in tag.attributes),
        Boolean(searchCategory),
        `${route}: only article pages have a searchable body`
      );
      if (searchCategory)
        assert(
          tags.some(
            tag => tag.attributes["data-search-category"] === searchCategory
          ),
          `${route}: search category metadata`
        );
    }
    const readable = decodeEntities(
      html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "")
        .replace(/<[^>]+>/g, " ")
    );
    for (const [label, pattern] of disallowedText) {
      assert(
        !pattern.test(readable) && !pattern.test(html),
        `${route}: unexpected ${label}`
      );
    }
    for (const tag of tags) {
      const references = [
        tag.attributes.href,
        tag.attributes.src,
        tag.attributes.poster,
      ];
      if (tag.attributes.srcset && !tag.attributes.srcset.includes("data:")) {
        references.push(
          ...tag.attributes.srcset
            .split(",")
            .map(value => value.trim().split(/\s+/)[0])
        );
      }
      if (
        tag.name === "meta" &&
        ["og:image", "og:url", "twitter:image"].includes(
          tag.attributes.property || tag.attributes.name
        )
      )
        references.push(tag.attributes.content);
      for (const reference of references.filter(value => value !== undefined)) {
        assert(reference.trim(), `${route}: empty ${tag.name} URL`);
        assert(!/^javascript:/i.test(reference), `${route}: JavaScript URL`);
        const url = new URL(reference, new URL(route, site));
        if (url.origin !== site || !["http:", "https:"].includes(url.protocol))
          continue;
        const target = await resolveOutput(url.href);
        assert(target, `${route}: broken local reference ${reference}`);
        referenceCount += 1;
        if (url.hash && pages.has(target)) {
          const fragment = decodeURIComponent(
            url.hash.slice(1).split(":~:text=")[0]
          );
          if (fragment)
            assert(
              pages.get(target).ids.has(fragment),
              `${route}: missing fragment ${reference}`
            );
        }
      }
    }
    assert.equal(path.extname(filename), ".html");
  }
  for (const route of [
    "/",
    "/projects/",
    "/writing/",
    "/publications/",
    "/search/",
    "/404.html",
    ...legacyRoutes,
  ]) {
    assert(await resolveOutput(route), `Missing required route: ${route}`);
  }
  for (const [filename, expectedHash] of Object.entries(preservedPdfHashes)) {
    const buffer = await readFile(path.join(dist, "assets/pdf", filename));
    assert.equal(
      buffer.subarray(0, 5).toString(),
      "%PDF-",
      `${filename}: PDF signature`
    );
    assert.equal(
      createHash("sha256").update(buffer).digest("hex"),
      expectedHash,
      `${filename}: legacy bytes changed`
    );
  }
  const originalPortrait = await readFile(
    path.join(dist, "assets/img/profile.jpeg")
  );
  assert.equal(
    createHash("sha256").update(originalPortrait).digest("hex"),
    "8f796ab53c1d42c5bdc135f7f1e816ad02f4e1f0fe7bbbb5c45ee5edd5a9b142",
    "Legacy portrait URL must keep the original bytes"
  );

  const sitemap = await readSitemap();
  const fragments = await readPagefind();
  const searchRoutes = new Set(
    fragments.map(fragment => new URL(fragment.url, site).pathname)
  );
  const searchUrls = new Set(fragments.map(fragment => fragment.url));
  assert.equal(
    searchUrls.size,
    fragments.length,
    "No duplicate search records"
  );
  for (const url of sitemap) {
    assert(!excludedRoute(url), `Excluded page in sitemap: ${url}`);
    assert(
      await resolveOutput(url),
      `Sitemap points to missing output: ${url}`
    );
  }
  for (const fragment of fragments) {
    assert(
      ["Blogs", "Projects", "Publications"].includes(fragment.meta.category),
      `Uncategorised search record: ${fragment.url}`
    );
    assert(
      !excludedRoute(fragment.url),
      `Excluded page in Pagefind: ${fragment.url}`
    );
    assert(
      await resolveOutput(fragment.url),
      `Pagefind points to missing output: ${fragment.url}`
    );
    for (const [label, pattern] of disallowedText)
      assert(
        !pattern.test(JSON.stringify(fragment)),
        `Pagefind: unexpected ${label}`
      );
  }
  for (const page of pages.values()) {
    if (!excludedRoute(page.route)) {
      assert(
        sitemap.has(new URL(page.route, site).href),
        `${page.route}: missing from sitemap`
      );
      if (
        /^\/(?:writing|projects)\/.+\/$/.test(page.route) ||
        page.route === "/publications/"
      )
        assert(
          searchRoutes.has(page.route),
          `${page.route}: missing from Pagefind`
        );
      else
        assert(
          !searchRoutes.has(page.route),
          `${page.route}: duplicate listing page in Pagefind`
        );
    }
  }

  const writing = await publicContent("writing");
  const expectedWriting = writing.filter(entry => entry.published);
  const newestWriting = [...expectedWriting].sort(
    (a, b) => new Date(b.data.publishedAt) - new Date(a.data.publishedAt)
  );
  const writingListing = await readFile(
    path.join(dist, "writing/index.html"),
    "utf8"
  );
  const homepage = await readFile(path.join(dist, "index.html"), "utf8");
  for (const [label, html, entries] of [
    ["Blogs listing", writingListing, newestWriting],
    ["Recent Blogs", homepage, newestWriting.slice(0, 3)],
  ]) {
    const positions = entries.map(entry =>
      html.indexOf(`href="/writing/${entry.data.slug}/"`)
    );
    assert(
      positions.every(position => position >= 0),
      `${label}: missing article`
    );
    assert(
      positions.every(
        (position, index) => index === 0 || position > positions[index - 1]
      ),
      `${label}: newest publication dates first`
    );
  }
  for (const entry of expectedWriting) {
    const filename = await resolveOutput(`/writing/${entry.data.slug}/`);
    assert(filename, `Missing published writing: ${entry.data.slug}`);
    assertWritingRendered(
      writingListing,
      await readFile(filename, "utf8"),
      entry
    );
  }
  const feeds = await Promise.all([readFeed(), readFeed("feed.xml")]);
  for (const feed of feeds) {
    assert.equal(
      feed.items.length,
      expectedWriting.length,
      "Feed must contain exactly the published Blogs; no Projects, Publications or News entries"
    );
    const links = new Set(
      feed.items.map(item => new URL(item.link, site).pathname)
    );
    assert.equal(links.size, feed.items.length, "No duplicate feed items");
    for (const entry of expectedWriting) {
      assert(
        links.has(`/writing/${entry.data.slug}/`),
        `Published writing missing from feed: ${entry.data.slug}`
      );
      const item = feed.items.find(
        item =>
          new URL(item.link, site).pathname === `/writing/${entry.data.slug}/`
      );
      assert.equal(
        new Date(item.pubDate).getTime(),
        new Date(entry.data.publishedAt).getTime(),
        `${entry.data.slug}: RSS uses article publication date`
      );
    }
    assert.deepEqual(
      feed.items.map(item => new URL(item.link, site).pathname),
      newestWriting.map(entry => `/writing/${entry.data.slug}/`),
      "RSS articles ordered by newest publication date"
    );
    for (const item of feed.items) {
      assert(
        item.title && item.description && item.pubDate,
        "Feed item metadata"
      );
      assert(new Date(item.pubDate) <= new Date(), "Future date in RSS");
      assert(await resolveOutput(item.link), "RSS points to missing article");
    }
  }
  for (const collection of ["writing", "projects"]) {
    for (const entry of await publicContent(collection)) {
      const route = `/${collection}/${entry.data.slug}/`;
      if (!entry.published) {
        assert.equal(
          await resolveOutput(route),
          null,
          `Unpublished content has a route: ${route}`
        );
        assert(
          !sitemap.has(new URL(route, site).href),
          `Unpublished content in sitemap: ${route}`
        );
        assert(
          !searchRoutes.has(route),
          `Unpublished content in search: ${route}`
        );
      }
    }
  }
  // Every locally linked paper/download must exist, including future selected PDFs.
  const publications = JSON.parse(
    await readFile(path.join(root, "src/data/publications.json"), "utf8")
  );
  const publicationArticles = elementContents(
    await readFile(path.join(dist, "publications/index.html"), "utf8"),
    "article"
  );
  for (const publication of publications) {
    const searchRecord = fragments.find(
      fragment => fragment.url === `/publications/#${publication.id}`
    );
    assert(
      searchRecord,
      `${publication.id}: missing individual publication search record`
    );
    assert.equal(
      searchRecord.meta.title,
      publication.title,
      `${publication.id}: search title`
    );
    assert.equal(
      searchRecord.meta.category,
      "Publications",
      `${publication.id}: search category`
    );
    const publicationOutput = await resolveOutput("/publications/");
    assert(
      pages.get(publicationOutput).ids.has(publication.id),
      `${publication.id}: missing publication anchor`
    );
    assert(
      publication.title && publication.year && publication.links.length,
      "Publication evidence metadata"
    );
    const article = publicationArticles.find(html =>
      elementContents(html, "h3").some(
        heading => readableText(heading) === normalizeText(publication.title)
      )
    );
    assert(
      article,
      `${publication.id}: publication title missing from rendered heading`
    );
    for (const field of ["authors", "role", "venue"]) {
      assert(
        readableText(article).includes(normalizeText(publication[field])),
        `${publication.id}: ${field} missing from rendered publication`
      );
    }
    for (const link of publication.links) {
      const url = new URL(link.url, site);
      if (url.origin === site)
        assert(
          await resolveOutput(url.href),
          `Missing publication asset: ${url.pathname}`
        );
    }
  }
  process.stdout.write(
    `Validated ${htmlFiles.length} HTML pages, ${referenceCount} local references, ${sitemap.size} sitemap URLs, ${fragments.length} search fragments, 5 preserved PDFs, and ${expectedWriting.length} Blog-only RSS items.\n`
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  validateSite().catch(error => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  });
}
