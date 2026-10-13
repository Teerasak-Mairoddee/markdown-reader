// Light/dark theme toggle. Printing always uses the light code theme.

const STORAGE_KEY = 'mdr-theme';
const root = document.documentElement;
const media = window.matchMedia('(prefers-color-scheme: dark)');

const hljsLight = document.getElementById('hljs-light');
const hljsDark = document.getElementById('hljs-dark');

function currentTheme() {
  return root.dataset.theme ?? (media.matches ? 'dark' : 'light');
}

function syncCodeTheme(theme = currentTheme()) {
  hljsLight.disabled = theme === 'dark';
  hljsDark.disabled = theme !== 'dark';
}

export function initTheme(toggleButton) {
  syncCodeTheme();
  media.addEventListener('change', () => syncCodeTheme());

  toggleButton.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    syncCodeTheme();
  });

  window.addEventListener('beforeprint', () => syncCodeTheme('light'));
  window.addEventListener('afterprint', () => syncCodeTheme());
}
