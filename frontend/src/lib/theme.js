import WebApp from '@twa-dev/sdk';

/* Светлая и тёмная тема.
   Режим: 'auto' (как в Telegram), 'light' или 'dark'. Сохраняется на этом устройстве.
   Переключатель режима появится в настройках на шаге 7А.3, пока работает 'auto'. */

const MODE_KEY = 'slotly_theme_mode';

export function getThemeMode() {
  try {
    const m = window.localStorage.getItem(MODE_KEY);
    if (m === 'light' || m === 'dark') return m;
  } catch (e) {
    /* хранилище может быть недоступно */
  }
  return 'auto';
}

export function setThemeMode(mode) {
  try {
    if (mode === 'light' || mode === 'dark') window.localStorage.setItem(MODE_KEY, mode);
    else window.localStorage.removeItem(MODE_KEY);
  } catch (e) {
    /* не страшно: режим просто не запомнится */
  }
  applyTheme();
}

function inTelegram() {
  try {
    return Boolean(WebApp.initData);
  } catch (e) {
    return false;
  }
}

function systemScheme() {
  if (inTelegram()) {
    try {
      return WebApp.colorScheme === 'dark' ? 'dark' : 'light';
    } catch (e) {
      /* идём дальше */
    }
  }
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch (e) {
    return 'light';
  }
}

function toHex(cssColor) {
  const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(cssColor || '');
  if (!m) return null;
  return (
    '#' +
    [m[1], m[2], m[3]]
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('')
  );
}

function atLeast(v) {
  try {
    return WebApp.isVersionAtLeast(v);
  } catch (e) {
    return false;
  }
}

/* Красим шапку, фон и нижнюю панель Telegram в цвет страницы, чтобы не было полос по краям. */
function paintTelegram() {
  if (!inTelegram()) return;
  const hex = toHex(window.getComputedStyle(document.body).backgroundColor);
  if (!hex) return;
  try {
    if (atLeast('6.9')) WebApp.setHeaderColor(hex);
  } catch (e) {
    /* старая версия Telegram */
  }
  try {
    if (atLeast('6.1')) WebApp.setBackgroundColor(hex);
  } catch (e) {
    /* старая версия Telegram */
  }
  try {
    if (atLeast('7.10')) WebApp.setBottomBarColor(hex);
  } catch (e) {
    /* старая версия Telegram */
  }
}

export function applyTheme() {
  const mode = getThemeMode();
  const scheme = mode === 'auto' ? systemScheme() : mode;
  document.documentElement.classList.toggle('dark', scheme === 'dark');
  paintTelegram();
}

/* Вызывается один раз до показа экранов (из main.jsx). */
export function initTheme() {
  applyTheme();
  try {
    WebApp.onEvent('themeChanged', applyTheme);
  } catch (e) {
    /* вне Telegram события нет */
  }
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', applyTheme);
  } catch (e) {
    /* не страшно */
  }
}
// конец файла theme.js
