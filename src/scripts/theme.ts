// Adapted from AstroPaper. A stored choice wins; the initial default is light.
const root = document.documentElement;
const button = document.querySelector<HTMLButtonElement>("#theme-btn");
function reflect() {
  const dark = root.dataset.theme === "dark";
  button?.setAttribute(
    "aria-label",
    `Switch to ${dark ? "light" : "dark"} theme`
  );
  button?.setAttribute("aria-pressed", String(dark));
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#201d1c" : "#fcfaf7");
}
if (button) {
  button.hidden = false;
  button.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("theme", root.dataset.theme);
    } catch {
      /* Theme still works when storage is disabled. */
    }
    reflect();
  });
}
reflect();
