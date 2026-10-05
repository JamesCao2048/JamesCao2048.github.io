# Junming Cao’s website

An English personal website for engineering projects, writing, publications, and open-source contributions. Built with Astro and adapted from [AstroPaper](https://github.com/satnaing/astro-paper).

The maintained content, design, and workflow decisions are in [AGENTS.md](AGENTS.md).

## Local development

Use Node.js **22.22.0** and pnpm **10.28.0**. The committed lockfile pins the dependency tree.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

To check the site and inspect the production build:

```sh
pnpm format:check
pnpm lint
pnpm build
pnpm validate
pnpm test:publication
pnpm preview
```

`pnpm build` clears generated content caches, runs Astro’s checks, generates the static site in `dist/`, and builds the Pagefind search index. Use `pnpm preview` to inspect that index; search is unavailable in the development server. Run `pnpm format` to apply formatting.

The header Search button opens `/search/`. Results appear in Blogs, Projects, then Publications groups; all three checkbox scopes are selected by default. Only published article/project pages and individual bibliography records enter the index. Publication results link to `/publications/#<id>`, so retain each publication's stable `id`. The homepage and listing summaries are excluded to avoid duplicate results.

These are maintenance commands, not a record of completed checks. Review their actual output before publishing.

## Add blog posts

For an English adaptation, `publishedAt` uses the verified Chinese original's publication date. The homepage, Blogs listing, article header and RSS use this date and sort newest first. Keep `originalSource` with the original `url`, `title`, `platform`, and `publishedAt`; the article header identifies the English adaptation and links to that source. The displayed date records the original article's publication, not the later adaptation work. Keep source archives and image-generation prompts outside the public site. The reusable local authoring skill is `wechat-to-english-blog`.

Create a Markdown or MDX file in `src/content/writing/`. The authoritative schema is [`src/content.config.ts`](src/content.config.ts). This illustrative frontmatter requires your own title, description, slug, and real publication date:

```yaml
---
title: Your article title
description: A short description of the article.
slug: your-stable-slug
publishedAt: YYYY-MM-DD
lang: en
draft: true
---
```

Write the body below the frontmatter. Replace `YYYY-MM-DD` before setting `draft: false`; published writing requires a real date. Optional fields are `updatedAt`, `kind` (`article` or `note`), and `syndicationUrl`. Use `lang: zh` for an original Chinese article.

RSS at `/rss.xml` (also available at `/feed.xml`) subscribes only to published Blogs, newest first. It includes each article’s title, summary, original publication date and link; Projects, Publications and News are not feed entries.

The section is displayed as Blogs; its existing `/writing/` URLs and content collection remain stable. The `slug` sets `/writing/your-stable-slug/`. Keep it stable when changing a title. Slugs use lowercase letters, digits, and single hyphens; published slugs must be unique within their collection.

[`src/utils/content.ts`](src/utils/content.ts) excludes drafts and future-dated entries from generated routes. RSS, the sitemap, article metadata, and search therefore receive published content only. Publication is evaluated at build time: a future date needs a later rebuild to appear. Draft files committed to this public repository are still publicly readable, so keep private notes elsewhere.

## Update projects, publications, and the profile

| Content                                           | Edit                                  |
| ------------------------------------------------- | ------------------------------------- |
| Project pages                                     | `src/content/projects/*.md` or `.mdx` |
| Publications and author order                     | `src/data/publications.json`          |
| Profile, experience, education, and contact links | `src/data/profile.json`               |
| Optional public CV PDF path                       | `src/data/cv.json`                    |

Projects share the writing fields and additionally require `role`, `scope`, and `evidenceLinks` (an array of `{ label, url }`). `featured` controls homepage selection, and `order` controls project ordering. Project dates are optional when the actual date is unknown. Keep each existing project slug stable.

For publications, retain the published author order and accurate individual role. `selected` identifies the four homepage highlights. The full bibliography is displayed uniformly in descending year order, without research descriptions. Use verified paper or project links, and preserve earlier publications when adding new work.

The homepage introduction is in `src/pages/index.astro`; update it alongside profile identity changes. For profile updates, use current, confirmed facts and exact contact URLs. Keep shared research outcomes distinct from personal contributions. Keep draft CVs and private review notes outside this repository. The approved public PDF is the source of truth for the current profile and selected project and publication descriptions; use supporting notes only to clarify its scope.

## Maintain the public CV PDF

CV links open `/assets/pdf/Junming_Cao_CV_EN.pdf` directly. This is the user-approved, two-page English CV supplied on 2026-10-05, copied without modifying its bytes. The main navigation uses the path in `src/data/cv.json`; `/cv/` is an unindexed compatibility redirect to the PDF, not an HTML career overview.

To replace the CV, inspect the approved PDF text and links, replace `public/assets/pdf/Junming_Cao_CV_EN.pdf`, then rebuild and validate. The build rejects missing files, non-PDF content, and paths outside `/assets/`. Set `pdfPath` to `null` to hide the entries, and remove the public PDF if it should no longer be published. The compatibility redirect remains outside the sitemap and search.

The homepage highlights Post-Training Data & Evaluation, Kernel Agent Harness, and DeepPerf; the Projects page includes fuller case studies and additional research projects. Post-training is a normal project entry. Keep public-release status distinct from whether the work has been completed. Four homepage publication highlights use the CV descriptions and order in `src/components/SelectedPublications.astro`; the full bibliography retains all published work.

## Maintain news

Edit `src/data/news.json` in newest-first order. The homepage displays the first three entries above Selected Projects; remaining entries are available through the native More news disclosure, which works without JavaScript. Dates can be a confirmed year (`YYYY`) or month (`YYYY-MM`); do not invent acceptance dates, promotion dates, or conference attendance. Entries within a year without known months keep editorial order. Use ordered `content` fragments (`{ text }` or `{ text, url }`) so the full paper or project title is the link within the sentence. Do not append separate Paper or Projects links. Initial paper years and employment dates come from the approved CV; add further milestones only after their details are confirmed.

## Visual style

The palette follows the CV: warm white (`#FCFAF7`), charcoal (`#292524`), red-brown (`#7D3C32`) for achievements and section markers, and slate blue (`#36566B`) for resource links. The dark theme uses warm charcoal with lighter accent and link colours. Shared tokens live in `src/styles/global.css`; the favicon and generated social image use the same light palette.

Keep emphasis selective: project outcomes, key research numbers, and awards. `highlights` in `src/data/publications.json` names exact phrases to emphasise in homepage descriptions; these are rendered as text, not injected HTML. Ordinary links use underlines and hover/focus states without decorative arrows.

## Deployment and migration

The production address is `https://jamescao2048.github.io`. This is a GitHub user site, so `astro.config.ts` uses that `site` URL with no repository-name `base` prefix.

The redesign is prepared on a separate source branch. Existing production is served from `gh-pages`; preparing or building the redesign locally does not switch that source. Follow [MIGRATION.md](MIGRATION.md) for the approved rollout and rollback procedure, including Pages and workflow settings. Do not run competing Jekyll and Astro deployment workflows.

## Attribution

AstroPaper **6.1.0**, upstream commit `35cfa7fbe0b897306d27670d3819e55d5205f3dd`, is the template baseline. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), [`LICENSE`](LICENSE), and [`LICENSE.al-folio`](LICENSE.al-folio).
