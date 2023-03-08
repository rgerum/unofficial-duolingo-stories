import "./dark_mode.css"

export function load_dark_mode() {
    // CSS class name for dark-mode
    const darkMode_className = "dark-mode";

    // Key of the saved dark-mode setting in localStorage
    const isDarkMode_key = "isDarkMode";

    // MediaQueryList object
    const useDark = window.matchMedia("(prefers-color-scheme: dark)");

    // Inital dark-mode setting — prefer the localStorage setting, if available
    const initialDarkModeSetting = localStorage.getItem(isDarkMode_key) ? localStorage.getItem(isDarkMode_key) === (true).toString() : useDark.matches;

    // Save user's dark-mode setting to localStorage
    function saveDarkModeSetting() {
        localStorage.setItem(isDarkMode_key, (document.documentElement.classList.contains(darkMode_className)).toString());
    }
    
    // Toggles the "dark-mode" class based on if the media query matches
    function toggleDarkMode(state) {
        document.documentElement.classList.toggle(darkMode_className, state);
        saveDarkModeSetting();
    }

    // Initial setting
    toggleDarkMode(initialDarkModeSetting);

    // Listen for changes in the OS settings
    useDark.addListener((evt) => toggleDarkMode(evt.matches));

    // Toggles the "dark-mode" class on click, and saves change to localStorage
    window.toggle_dark = () => {
        document.documentElement.classList.toggle(darkMode_className);
        saveDarkModeSetting();
    };

    // Returns the current "dark-mode" state (true/false)
    window.get_isDarkMode = () => { return document.documentElement.classList.contains(darkMode_className); };
}
