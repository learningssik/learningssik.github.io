// Dark Mode Toggle Functionality
(function() {
    'use strict';

    // Dark mode state management
    const DARK_MODE_KEY = 'darkMode';
    const DARK_THEME = 'dark';
    const LIGHT_THEME = 'light';

    // Get elements
    const darkModeToggle = document.getElementById('darkModeToggle');
    const toggleText = darkModeToggle.querySelector('.toggle-text');
    const htmlElement = document.documentElement;

    // Initialize dark mode
    function initDarkMode() {
        const savedTheme = localStorage.getItem(DARK_MODE_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Use saved preference or system preference
        const shouldUseDark = savedTheme === DARK_THEME || (!savedTheme && prefersDark);
        
        if (shouldUseDark) {
            enableDarkMode();
        } else {
            enableLightMode();
        }
    }

    // Enable dark mode
    function enableDarkMode() {
        htmlElement.setAttribute('data-theme', DARK_THEME);
        localStorage.setItem(DARK_MODE_KEY, DARK_THEME);
        toggleText.textContent = '라이트모드';
        updateToggleIcon(true);
    }

    // Enable light mode
    function enableLightMode() {
        htmlElement.setAttribute('data-theme', LIGHT_THEME);
        localStorage.setItem(DARK_MODE_KEY, LIGHT_THEME);
        toggleText.textContent = '다크모드';
        updateToggleIcon(false);
    }

    // Update toggle icon animation
    function updateToggleIcon(isDark) {
        const toggleIcon = darkModeToggle.querySelector('.toggle-icon');
        if (isDark) {
            toggleIcon.style.transform = 'rotate(180deg)';
        } else {
            toggleIcon.style.transform = 'rotate(0deg)';
        }
    }

    // Toggle dark mode
    function toggleDarkMode() {
        const currentTheme = htmlElement.getAttribute('data-theme');
        if (currentTheme === DARK_THEME) {
            enableLightMode();
        } else {
            enableDarkMode();
        }
    }

    // Listen for system theme changes
    function handleSystemThemeChange(e) {
        // Only update if user hasn't manually set a preference
        const savedTheme = localStorage.getItem(DARK_MODE_KEY);
        if (!savedTheme) {
            if (e.matches) {
                enableDarkMode();
            } else {
                enableLightMode();
            }
        }
    }

    // Event listeners
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Initialize on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDarkMode);
    } else {
        initDarkMode();
    }

    // Smooth transition for theme changes
    function addTransitionClass() {
        htmlElement.classList.add('theme-transition');
        setTimeout(() => {
            htmlElement.classList.remove('theme-transition');
        }, 300);
    }

    // Override toggle functions to include transition
    const originalEnableDarkMode = enableDarkMode;
    const originalEnableLightMode = enableLightMode;

    enableDarkMode = function() {
        addTransitionClass();
        originalEnableDarkMode();
    };

    enableLightMode = function() {
        addTransitionClass();
        originalEnableLightMode();
    };

})();
