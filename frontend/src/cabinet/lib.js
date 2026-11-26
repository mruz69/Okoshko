import WebApp from '@twa-dev/sdk';
import { OWNER_FUNCTION, BOT_USERNAME } from './config';
import ru from './ru';

/* Строки интерфейса: t('раздел.ключ', {переменная: значение}) */
export function t(key, vars) {
  let s = ru[key];
  if (s === undefined) return key;
  if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
}

export class ApiError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export function errorText(e) {
  const code = (e && (e.code || e.message)) || 'server';
  const text = ru['err.' + code];
  return text !== undefined ? text : t('err.unknown', { code });
}

/* Запрос к серверной функции кабинета. Подпись Telegram проверяется на сервере. */
export async function ownerApi(action, params = {}) {
  if (!OWNER_FUNCTION || OWNER_FUNCTION.startsWith('ВСТАВЬ')) throw new ApiError('config_missing');
  let res;
  try {
    res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${OWNER_FUNCTION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({ initData: WebApp.initData, action, params }),
    });
  } catch (e) {
    throw new ApiError('network');
  }
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    /* не json */
  }
  if (!json || !json.ok) throw new ApiError((json && json.error) || (res.status === 401 ? 'unauthorized' : 'server'));
  return json.data;
}

export const clientLink = (slug) => `https://t.me/${BOT_USERNAME}/app?startapp=${slug}`;

/* ---------- даты: все даты это строки YYYY-MM-DD в часовом поясе бизнеса ---------- */
export function todayIn(tz) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}
export function addDays(s, n) {
  const d = new Date(s + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function isoDow(s) {
  const d = new Date(s + 'T00:00:00Z').getUTCDay();
  return d === 0 ? 7 : d;
}
export function fmtDate(s, opts = { weekday: 'short', day: 'numeric', month: 'long' }) {
  return new Intl.DateTimeFormat('ru', { ...opts, timeZone: 'UTC' }).format(new Date(s + 'T00:00:00Z'));
}
export function money(n, cur) {
  const v = Number(n || 0);
  try {
    return new Intl.NumberFormat('ru', { style: 'currency', currency: cur, maximumFractionDigits: v % 1 ? 2 : 0 }).format(v);
  } catch (e) {
    return `${v} ${cur}`;
  }
}
export function dur(min) {
  const m = Number(min || 0);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} ${t('unit.min')}`;
  return r ? `${h} ${t('unit.h')} ${r} ${t('unit.min')}` : `${h} ${t('unit.h')}`;
}
export function deviceTimezone() {
  try {
    const z = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return z === 'Europe/Kyiv' ? 'Europe/Kiev' : z;
  } catch (e) {
    return 'Europe/Minsk';
  }
}

/* ---------- адрес клиентской ссылки из названия ---------- */
const MAP = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', і: 'i', ў: 'u' };
export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .split('')
    .map((c) => (MAP[c] !== undefined ? MAP[c] : c))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 34);
}

/* ---------- кнопка «Связаться» ---------- */
export function contactLink(b) {
  const u = (b.client_username || '').trim();
  const src = b.source || '';
  const clean = (x) => x.replace(/^@/, '');
  if (b.tg_username) return { url: `https://t.me/${clean(b.tg_username)}`, kind: 'tg' };
  if (b.tg_id && src === 'telegram_app') return { url: `tg://user?id=${b.tg_id}`, kind: 'tgid' };
  if (u && /^https?:\/\//i.test(u)) return { url: u, kind: 'web' };
  if (u && src === 'manual_instagram') return { url: `https://instagram.com/${clean(u)}`, kind: 'web' };
  if (u && src === 'manual_vk') return { url: `https://vk.com/${clean(u)}`, kind: 'web' };
  if (b.client_phone) return { url: `tel:${b.client_phone.replace(/[^\d+]/g, '')}`, kind: 'tel' };
  if (u) return { url: `https://t.me/${clean(u)}`, kind: 'tg' };
  return null;
}
export function openUrl(url) {
  try {
    if (url.startsWith('https://t.me/')) WebApp.openTelegramLink(url);
    else if (url.startsWith('http')) WebApp.openLink(url);
    else window.location.href = url;
  } catch (e) {
    window.location.href = url;
  }
}
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}
// конец файла lib.js
