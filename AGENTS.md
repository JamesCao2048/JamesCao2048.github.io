# Personal website maintenance

This is Junming Cao's English personal website, built with Astro and AstroPaper. These are the agreed content and presentation decisions as of 2026-10-05. Communicate with the user in Chinese; write public website content in English. Apply later explicit user changes to these decisions and update this file when a durable preference changes.

## Facts and publication boundaries

- The latest user-approved CV PDF is the source of truth for profile, project and selected-paper claims. Supporting career notes in the parent CV workspace clarify scope; they must not override a newer explicit correction or be copied into this public repository.
- Keep personal actions separate from team results. Do not invent dates, ownership, acceptance status, evaluation settings or improvements. Describe ongoing work naturally within its project, without implying that an unpublished artifact is publicly available.
- Retain `Committer, cannbot community` as the formal role, held since July 2026 as confirmed by the user. The section's display link is `Cannbot Community`. Representative community contributions are cannbot-skills PRs 609 and 611; do not invent two separate committer appointments. Keep the two-sentence community introduction consistent between its News item and Open Source Contribution.
- Kernel migration is Ascend 910B/C to 950. Use the benchmark name CannBench 910. The team is Cannbot Lingxi-Evo, with the reported first-place result in August–September 2026; do not imply that this is a newly checked live ranking.
- SWE-bench Verified improves from 18.0% to 54.6%. Keep the same-AweAgent evaluation qualification in the detailed project explanation; omit that extra line on the homepage card. Do not append a redundant percentage-point calculation.
- DeepPerf found 488 new issues, of which 27 were fixed. Keep findings and adopted fixes distinct.
- The two unpublished operator manuscripts are reference-only and must remain outside public project, publication and blog content. Do not confuse these exclusions with other publicly available, properly labelled preprints or manuscripts.

## Homepage and navigation

- Include Home, Projects, Blogs, Publications and the direct PDF CV entry. Keep existing `/writing/` URLs when changing the visible Blogs label.
- Hero headline: `Coding Agent Harness & Post-Training`. Keep the portrait, followed by `Senior Engineer at Huawei, Shanghai, China.` and `PhD in Computer Science, Fudan University.` as separate identity lines.
- Do not restore the separate Senior Engineer eyebrow, duplicate Shanghai badge, hero CV button, Current Work section, separate ongoing-work card, or repetitive reliable-systems/contact slogans.
- News is above Selected Projects. Show the latest five news items, with older entries in a native disclosure. The user confirmed July 2026 Cannbot committer status, November 2025 attendance at EMNLP in Suzhou, and planned attendance at NeurIPS 2026 in Sydney in December. Keep the future attendance wording explicit; its October 2026 News date records the announcement month.
- Every News entry needs a verified year and month and is sorted newest first. For papers, prefer a paper-specific acceptance date from the publisher or an author's announcement; use formal publication date when acceptance cannot be verified, with wording that distinguishes accepted from published. Keep News from 2024 onward: the August 2023 ICSE acceptance item was explicitly removed, while that paper remains in Publications. Do not turn a manuscript or preprint into acceptance news or infer a paper's date from a conference-wide notification deadline.
- The September 2025 employment News names Huawei’s Applied Software Engineering Lab, 2012 Lab, using the user's agreed English wording. Keep the hero summary in the normal foreground text colour, not muted grey.
- Homepage project order and short titles: Post-Training Data & Evaluation; Kernel Agent Harness; DeepPerf. Full project pages provide the detailed case studies rather than repeating only homepage cards. The removed GPU/NPU Training Consistency project must not reappear as a standalone entry without a new request.
- Keep all three homepage project cards equal in width and height, with consistent typography and padding. Do not widen only the first card. At ordinary desktop widths, keep the first project's title and `18.0% to 54.6% on SWE-bench Verified` on single lines through typography and shared spacing. Allow wrapping on small screens; do not force horizontal overflow.
- Use `profile.featuredProjects` for homepage short titles and outcome text/highlights/detail. Give project cards a concrete, verified result when one is available, with key results in bold red-brown. DeepPerf ends with `27 issues were fixed`. Never invent a metric to fill this pattern.
- The homepage blog section is `Recent Blogs`, showing the latest three public English posts.
- Retain RSS at `/rss.xml` and its `/feed.xml` alias. It subscribes only to published Blogs, with titles, summaries and links; do not add Projects or News to this feed. The user explicitly chose to keep it on 2026-10-05 after briefly considering removal.
- Keep the Blogs page heading concise; do not restore the removed "Thoughts on coding agents, developer tools, and reliable machine-learning systems" introduction.
- Put a Search control at the top right. Search only Blogs, Projects and individual Publications, grouped in that order. Default to all three scopes selected and allow independent checkbox selection. Keep listing/homepage duplicates out of search results, and link each publication result to its own bibliography anchor.
- Use `Open Source Contribution` as the section title. Do not restore Keras/TensorFlow PRs or a Publications call-to-action to this section; those research-derived contributions can remain in the relevant project details.

## News, links and visual identity

- News uses ordered `content` fragments in `src/data/news.json`: `{ text }` or `{ text, url }`. Put the full paper or project name inside the sentence and make that name the link. Do not append isolated `Paper` or `Projects` links.
- Use link colour plus hover/focus underlines; do not decorate every link with an arrow.
- Follow the CV's palette: warm white, charcoal, red-brown `#7D3C32` for selective emphasis, slate blue for resource links. Keep the dark theme, favicon, browser theme colour and generated social card coordinated. Do not reintroduce the green identity or a pink gradient.
- Use colour for meaningful outcomes, selected-paper highlights, section markers and awards, rather than colouring all prose. Render highlight phrases as escaped text; do not inject arbitrary HTML from JSON.
- Keep `jc.` as the favicon/wordmark unless asked to redesign it. Version the favicon URL when its appearance changes so browser caches do not keep the old branding.

## Publications and CV

- Homepage Selected Publications are the four approved CV papers in the CV order: Code Refinement, DeepPerf, CodeMap, RegTrieve. Include their substantive CV descriptions.
- The full Publications page is one bibliography sorted by descending year, without descriptions or Selected/Earlier subgroups. Do not restore the generic introductory research slogan.
- Include the user's co-authored work as well as first-authored work. Google Scholar is an inventory source; verify identity, author order, venue and formal versions using publisher or author records. Do not import unrelated papers by namesakes or every paper written by a collaborator.
- Deduplicate preprint and published versions. Prefer confirmed formal publication metadata, record online/print-year choices, and label unverified-venue manuscripts or arXiv preprints honestly. Do not attach a venue from a different similarly titled paper.
- CV navigation opens the approved PDF directly. `/cv/` is only a compatibility redirect, excluded from search/sitemap. Do not rebuild an HTML resume or edit/re-export the canonical LaTeX as part of ordinary website changes. Copy replacement user-approved PDFs byte-for-byte to the configured public path.

## Blogs and audience

- Use the global `wechat-to-english-blog` skill for adaptations of the user's own WeChat articles. The default audience here is software engineers using or building coding agents, with general development knowledge but no assumed familiarity with the author's projects, Ascend, or research-specific evaluation.
- Preserve complete source archives privately, use established English terminology, and introduce specialist examples with a plain explanation. Distinguish personal experience, illustrative examples, recommendations and measured results.
- For English adaptations, use the verified Chinese original's publication date as the public `publishedAt`, as requested on 2026-10-05. Homepage, Blogs listing, article header and RSS use this same date and sort newest first. Keep the original URL, title, platform and date in `originalSource`; do not imply the English adaptation was created on that original date. Use explicit time zones that display the intended calendar date in the site formatter. If an original date cannot be verified, ask instead of inventing one.
- Maintain the established hand-drawn diagram style with English labels. Simplify dense figures around their main mechanism; preserve secondary evidence in nearby prose/captions. A full-size link is not a substitute for a readable inline overview.
- Audit implications as well as words: experiments can fail or regress; passing tests do not prove total correctness; a workflow must show meaningful failure/repair/stop paths and acceptance before completion. Synchronize figure labels, alt text, captions and dimensions.
- For requested audience audits, inspect the actual posts and final images. Fix and recheck the artifacts first, then update the skill only for demonstrated reusable lessons. Do not rewrite unaffected posts merely to create audit findings.

## Workflow and checks

- Keep stable slugs, preserved paper PDFs and legacy URL handling intact. Avoid reviving the deleted legacy blog content or a competing Jekyll build.
- Use Node 22.22.0 and pnpm 10.28.0 with the lockfile. `pnpm build` runs Astro checks, generates the site and builds search; `pnpm validate` verifies generated links, bibliography, PDF, feed and indexing. Run format/lint checks appropriate to changed files.
- Run `pnpm test:publication` when publication filters, article metadata/source attribution, feeds or indexing behavior changes. It restores a clean build after synthetic fixtures; never leave test content in deployable output. Do not rerun it for every purely cosmetic label edit.
- When changing search, run `pnpm test:search` against the completed build to exercise actual Pagefind records, category unions/isolation, and publication title/anchor matches. Verify the search interface's grouping and scope controls in an authorized local preview.
- Validate drafts/future content against actual generated routes, feeds, sitemap and search. Draft files committed to a public repository are still public; keep private drafts and review materials outside the repo.
- Browser/desktop automation requires explicit user authorization; a URL alone does not grant it. Honour any existing authorization's scope. Prefer ordinary HTTP, local file and build checks otherwise.
- Do not expose credentials. Creating or reviewing local changes is separate from pushing or deploying; follow the user's current authorization and `MIGRATION.md`. Do not change the production Pages source just to preview a redesign.
- New Git commits use `caojunming4@huawei.com` for both author and committer; verify the effective identity. Do not rewrite old commits without an explicit request.
- About, working principles, quotes and a short homepage interests section are deferred in `FOLLOW_UPS.md`. Wait for the author's personal content before implementing them.
