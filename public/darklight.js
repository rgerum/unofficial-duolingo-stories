function get_current_theme() {
  // it's currently saved in the document?
  if (document.body.dataset.theme) {
    return document.body.dataset.theme;
  }
  // it has been previously saved in the window?
  if (
    window.localStorage.getItem("theme") !== undefined &&
    window.localStorage.getItem("theme") !== "undefined"
  ) {
    return window.localStorage.getItem("theme");
  }
  // or the user has a preference?
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

console.log("activeTheme...");
function load() {
  let activeTheme = get_current_theme();
  console.log("activeTheme", activeTheme);
  document.body.dataset.theme = activeTheme;
  window.localStorage.setItem("theme", activeTheme);
}
load();

document.addEventListener("DOMContentLoaded", load);
