import "./dark_mode.css"

export function load_dark_mode() {
    // MediaQueryList object
    const useDark = window.matchMedia("(prefers-color-scheme: dark)");

    // Toggles the "dark-mode" class based on if the media query matches
    function toggleDarkMode(state) {
        document.documentElement.classList.toggle("dark-mode", state);
    }

    // Initial setting
    toggleDarkMode(useDark.matches);

    // Listen for changes in the OS settings
    useDark.addListener((evt) => toggleDarkMode(evt.matches));

    // Toggles the "dark-mode" class on click
    window.toggle_dark = () => {
        document.documentElement.classList.toggle("dark-mode");
    };
}
