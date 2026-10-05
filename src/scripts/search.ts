const categories = ["Blogs", "Projects", "Publications"] as const;
type Category = (typeof categories)[number];
interface SearchResult {
  url: string;
  excerpt: string;
  meta: { title: string; category: Category; detail?: string };
}
interface Pagefind {
  search: (
    term: string,
    options: { filters: { category: { any: Category[] } } }
  ) => Promise<{ results: { data: () => Promise<SearchResult> }[] }>;
}

const form = document.querySelector<HTMLFormElement>("#site-search")!;
const input = document.querySelector<HTMLInputElement>("#search-query")!;
const scopes = [
  ...form.querySelectorAll<HTMLInputElement>('input[name="scope"]'),
];
const searchStatus = document.querySelector<HTMLElement>("#search-status")!;
const results = document.querySelector<HTMLElement>("#search-results")!;
const fallback = document.querySelector<HTMLElement>("#search-fallback")!;
let runtime: Promise<Pagefind> | undefined;
let requestVersion = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

function loadSearch(): Promise<Pagefind> {
  if (!runtime) {
    const bundleUrl = "/pagefind/pagefind.js";
    runtime = import(/* @vite-ignore */ bundleUrl).catch(error => {
      runtime = undefined;
      throw error;
    });
  }
  return runtime!;
}

function selectedCategories(): Category[] {
  return categories.filter(category =>
    scopes.some(
      scope => scope.value === category.toLowerCase() && scope.checked
    )
  );
}

function updateUrl(query: string, selected: Category[]) {
  const url = new URL(window.location.href);
  if (query) url.searchParams.set("q", query);
  else url.searchParams.delete("q");
  url.searchParams.delete("scope");
  if (selected.length !== categories.length) {
    for (const category of selected)
      url.searchParams.append("scope", category.toLowerCase());
    if (!selected.length) url.searchParams.set("scope", "none");
  }
  window.history.replaceState(null, "", url);
}

function renderGroups(matches: SearchResult[], selected: Category[]) {
  const fragment = document.createDocumentFragment();
  for (const category of selected) {
    const items = matches.filter(result => result.meta.category === category);
    const section = document.createElement("section");
    section.className = "search-result-group";
    const heading = document.createElement("h2");
    heading.id = `search-${category.toLowerCase()}`;
    heading.textContent = `${category} (${items.length})`;
    section.setAttribute("aria-labelledby", heading.id);
    section.append(heading);
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "search-empty";
      empty.textContent = "No matches in this section.";
      section.append(empty);
    } else {
      const list = document.createElement("ol");
      list.className = "search-result-list";
      for (const result of items) {
        const item = document.createElement("li");
        const title = document.createElement("h3");
        const link = document.createElement("a");
        link.href = result.url;
        link.textContent = result.meta.title;
        title.append(link);
        item.append(title);
        if (result.meta.detail) {
          const detail = document.createElement("p");
          detail.className = "search-result-detail";
          detail.textContent = result.meta.detail;
          item.append(detail);
        }
        const excerpt = document.createElement("p");
        excerpt.className = "search-result-excerpt";
        // Pagefind escapes content before inserting its <mark> highlighting.
        excerpt.innerHTML = result.excerpt;
        item.append(excerpt);
        list.append(item);
      }
      section.append(list);
    }
    fragment.append(section);
  }
  results.replaceChildren(fragment);
}

async function search(version: number) {
  const query = input.value.trim();
  const selected = selectedCategories();
  updateUrl(query, selected);
  fallback.hidden = true;
  results.replaceChildren();
  results.setAttribute("aria-busy", "false");
  if (!selected.length) {
    searchStatus.textContent = "Select at least one section to search.";
    return;
  }
  if (!query) {
    searchStatus.textContent = "Enter a search term.";
    return;
  }
  results.setAttribute("aria-busy", "true");
  searchStatus.textContent = "Searching…";
  try {
    const pagefind = await loadSearch();
    if (version !== requestVersion) return;
    const response = await pagefind.search(query, {
      filters: { category: { any: selected } },
    });
    const matches = await Promise.all(
      response.results.map(result => result.data())
    );
    if (version !== requestVersion) return;
    const validMatches = matches.filter(result => {
      const url = new URL(result.url, window.location.origin);
      return (
        url.origin === window.location.origin &&
        selected.includes(result.meta.category)
      );
    });
    renderGroups(validMatches, selected);
    searchStatus.textContent = `${validMatches.length} ${validMatches.length === 1 ? "result" : "results"} for “${query}”.`;
  } catch {
    if (version !== requestVersion) return;
    searchStatus.textContent = "Search is temporarily unavailable.";
    fallback.hidden = false;
  } finally {
    if (version === requestVersion) results.setAttribute("aria-busy", "false");
  }
}

function scheduleSearch(delay = 180) {
  clearTimeout(timer);
  const version = ++requestVersion;
  timer = setTimeout(() => void search(version), delay);
}

const params = new URL(window.location.href).searchParams;
input.value = params.get("q") || "";
if (params.has("scope")) {
  const selected = params.getAll("scope");
  scopes.forEach(scope => {
    scope.checked = selected.includes(scope.value);
  });
}
input.addEventListener("input", () => scheduleSearch());
scopes.forEach(scope =>
  scope.addEventListener("change", () => scheduleSearch(0))
);
form.addEventListener("submit", event => {
  event.preventDefault();
  scheduleSearch(0);
});
if (input.value || params.has("scope")) scheduleSearch(0);

export {};
