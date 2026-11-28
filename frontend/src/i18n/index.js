import ru from './ru.js';
import { termForms } from './terms.js';

const dictionaries = { ru };
let current = 'ru';
let terms = termForms(null);

export function setLocale(locale) {
  if (dictionaries[locale]) current = locale;
}

/* Подписи бизнеса (businesses.terminology). Вызывается один раз, когда бизнес загружен.
   Без вызова действуют подписи по умолчанию: «мастер», «запись». */
export function setTerms(terminology) {
  terms = termForms(terminology);
}

/* Подставляет подписи в текст: {staff}, {staff_gen}, {staff_dat}, {staff_ins}, {booking_acc} и т. д.
   Незнакомые скобки (например, {date}) остаются как есть. */
export function applyTerms(text) {
  return String(text).replace(/\{(\w+)\}/g, (m, k) =>
    Object.prototype.hasOwnProperty.call(terms, k) ? terms[k] : m
  );
}

// t('status.title') -> строка из словаря; если ключа нет, вернётся сам ключ
export function t(key) {
  const value = key
    .split('.')
    .reduce((acc, part) => (acc ? acc[part] : undefined), dictionaries[current]);
  return typeof value === 'string' ? applyTerms(value) : key;
}
// конец файла index.js
