# Migration and release

The redesign replaces Jekyll/al-folio with AstroPaper. It stays at
`https://jamescao2048.github.io/`, with no repository-name URL prefix.

## Recorded baseline

| Setting               | Before migration                           |
| --------------------- | ------------------------------------------ |
| Source/default branch | `master`                                   |
| Source commit         | `a1535cccab1a7feeef389d02733758d8350ffc56` |
| Published branch      | `gh-pages`                                 |
| Published commit      | `6f5ea0e9789cfff55e27977637b8cb0f2e2354a3` |
| Pages build type      | `legacy`                                   |
| Pages source          | `gh-pages`, `/`                            |
| Custom domain         | None                                       |
| HTTPS                 | Enabled                                    |
| Local backup tag      | `website-before-astro-2026-10-03`          |
| Local working branch  | `codex/astropaper-redesign`                |

The old Jekyll workflow is removed from the new source. The replacement deployment workflow
runs **manually, from master only**. The validation workflow cannot publish.

## URL decisions

The complete inventory is in [`src/data/legacy-routes.json`](src/data/legacy-routes.json).
It is also the input for generated compatibility pages.

- `/`, `/projects/`, and `/publications/` keep their established URLs.
- CV is PDF-only. The user-approved English CV is included at
  `/assets/pdf/Junming_Cao_CV_EN.pdf`; navigation links open it directly.
  `/cv/` is an unindexed static meta-refresh compatibility redirect, not an HTML
  career overview. It is excluded from the sitemap and search. The PDF and these
  links are included in the static site.
- `/blog/` and the three historical `/blog/2021/mindsporeN/` articles now have
  retirement notices. Old post bodies and screenshots are removed as requested.
- The known broken `/blog/2021/mindspore/2` link receives the same notice.
- Seven template posts, six template projects, three template announcements,
  and the template teaching page also receive retirement notices.
- Notices have ordinary navigation links, `noindex`, and no sitemap/search entry.
  They are static HTML served with HTTP 200, not server-side 301/410 responses.
- Five scholarly PDFs and the historical portrait retain their URLs and exact bytes.
  `DNNLocator.pdf` actually contains the MRAM paper; its old filename stays for compatibility.
- The new RSS URL is `/rss.xml`; `/feed.xml` is a compatibility alias.
- Unknown URLs continue to use the dedicated `404.html` page.

No unpublished writing or draft CV is copied into this repository. The approved public CV PDF is included. A public Git
branch is public even when a Markdown entry has `draft: true`.

## Release after content approval

1. Review the built English pages and confirm they are ready to publish. Run:

   ```sh
   pnpm install --frozen-lockfile
   pnpm format:check
   pnpm lint
   pnpm test:publication
   pnpm test:search
   pnpm preview --host 127.0.0.1
   ```

   The publication test performs both fixture and clean builds. `pnpm build`
   clears generated content stores before building; this prevents deleted last
   entries from surviving in Astro's cached collections.

2. Record the reviewed commit IDs, then push the working branch and create a PR.
   Keep author and committer email set to `caojunming4@huawei.com`, verify with
   `git var GIT_AUTHOR_IDENT` and `git var GIT_COMMITTER_IDENT`, and never force push.
   Keep the old `gh-pages` branch intact. Merge the reviewed change into `master`.
   Create that merge locally with the same verified author/committer identity,
   then push `master` without force; this also preserves the email rule for the
   merge commit.
3. In repository Settings → Pages, choose **GitHub Actions** as the source.
   Equivalent API command, only at the approved cutover:

   ```sh
   gh api --method PUT repos/JamesCao2048/JamesCao2048.github.io/pages --input - <<'JSON'
   {"build_type":"workflow"}
   JSON
   gh workflow run deploy.yml --ref master --repo JamesCao2048/JamesCao2048.github.io
   ```

4. Follow that actual run to completion. Check live home, project details,
   known retired URLs, PDFs, RSS, sitemap, and an unknown URL. Record the actual
   deployment URL and run ID. Do not infer deployment success from a local build.
   If a CV PDF is configured, check the direct PDF links and `/cv/` redirect;
   otherwise confirm that CV links and the former HTML overview are absent.

The workflow uses the [official Astro Pages action](https://docs.astro.build/en/guides/deploy/github/),
with action revisions pinned and Node/package-manager versions declared in the repo.
No personal access token is stored in source; deployment uses GitHub's workflow token.

## Roll back the live site

First disable the new deployment workflow and cancel its in-progress or queued
runs so that they cannot race the rollback:

```sh
gh workflow disable deploy.yml --repo JamesCao2048/JamesCao2048.github.io
gh run list --workflow deploy.yml --repo JamesCao2048/JamesCao2048.github.io
# For each active or queued run: gh run cancel RUN_ID --repo JamesCao2048/JamesCao2048.github.io
```

Restore the original Pages source without rewriting any Git history:

```sh
git fetch origin gh-pages
test "$(git rev-parse origin/gh-pages)" = 6f5ea0e9789cfff55e27977637b8cb0f2e2354a3
gh api --method PUT repos/JamesCao2048/JamesCao2048.github.io/pages --input - <<'JSON'
{"build_type":"legacy","source":{"branch":"gh-pages","path":"/"}}
JSON
gh api --method POST repos/JamesCao2048/JamesCao2048.github.io/pages/builds
gh api repos/JamesCao2048/JamesCao2048.github.io/pages/builds/latest
curl --fail --silent --show-error https://jamescao2048.github.io/
```

If the commit assertion fails, inspect the changed branch before proceeding.
Create a new rollback branch at the recorded published commit, push that new
branch, and point Pages at it instead of overwriting someone else's work.

To restore the source as well, open a new branch from current `master` and revert
the recorded migration commit(s) through the normal PR process. Review the revert
sequence if the migration is a merge; do not guess its mainline. The revert
restores the Jekyll workflow and source files. Keep Astro deployment disabled while
the restored legacy site uses its original `gh-pages` snapshot. Never run the
old `bin/deploy` script: it contains a force push.
