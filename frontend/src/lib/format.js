/* Чистые вспомогательные функции: форматирование денег, времени, дат, слотов. */

export function plural(n, forms) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export function formatMoney(amount, currency) {
  const n = Number(amount || 0);
  const s = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return s + ' ' + (currency || '');
}

export function formatDuration(minutes) {
  const m = Number(minutes || 0);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h && r) return h + ' ч ' + r + ' мин';
  if (h) return h + ' ч';
  return r + ' мин';
}

function part(parts, type) {
  const p = parts.find((x) => x.type === type);
  return p ? p.value : '';
}

/* Дата в часовом поясе бизнеса: YYYY-MM-DD */
export function dateKey(dateLike, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(dateLike));
  return part(parts, 'year') + '-' + part(parts, 'month') + '-' + part(parts, 'day');
}

/* Время в часовом поясе бизнеса: ЧЧ:ММ */
export function timeLabel(dateLike, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(dateLike));
  return part(parts, 'hour') + ':' + part(parts, 'minute');
}

export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/* Подпись дня для выбора: «пн, 25 нояб.» */
export function dayLabel(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short',
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

/* Полная подпись: «понедельник, 25 ноября, 10:00» */
export function fullDateLabel(dateLike, timeZone) {
  const day = new Intl.DateTimeFormat('ru-RU', {
    timeZone, weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date(dateLike));
  return day + ', ' + timeLabel(dateLike, timeZone);
}

/* Сгруппировать слоты по дням, убрать дубли (несколько специалистов на одно время) */
export function groupSlotsByDay(slots, timeZone) {
  const days = new Map();
  const seen = new Set();
  const sorted = [...(slots || [])].sort((a, b) => new Date(a.start) - new Date(b.start));
  for (const s of sorted) {
    const iso = new Date(s.start).toISOString();
    if (seen.has(iso)) continue;
    seen.add(iso);
    const key = dateKey(iso, timeZone);
    if (!days.has(key)) days.set(key, []);
    days.get(key).push({ start: iso, staffId: s.staff_id, label: timeLabel(iso, timeZone) });
  }
  return Array.from(days.entries()).map(([key, times]) => ({ key, times }));
}

export function cartTotals(services, ids) {
  const chosen = (services || []).filter((s) => ids.includes(s.id));
  return {
    chosen,
    count: chosen.length,
    minutes: chosen.reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0),
    price: chosen.reduce((sum, s) => sum + Number(s.price || 0), 0),
  };
}

/* Ссылка бизнеса из start_param */
export function parseSlug(value) {
  const s = String(value || '').toLowerCase();
  return /^[a-z0-9][a-z0-9-]{2,39}$/.test(s) ? s : null;
}
