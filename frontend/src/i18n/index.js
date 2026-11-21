import ru from './ru.js';

const dictionaries = { ru };
let current = 'ru';

export function setLocale(locale) {
  if (dictionaries[locale]) current = locale;
}

// t('status.title') -> строка из словаря; если ключа нет, вернётся сам ключ
export function t(key) {
  const value = key
    .split('.')
    .reduce((acc, part) => (acc ? acc[part] : undefined), dictionaries[current]);
  return typeof value === 'string' ? value : key;
}
