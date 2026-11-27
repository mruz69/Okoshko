/* Строки кнопки «Поделиться номером» (отдельно от ru.js, чтобы не менять его) */
const ru = {
  'phone.share': 'Поделиться номером из Telegram',
  'phone.waiting': 'Ждём номер…',
  'phone.failed': 'Не удалось получить номер. Введите его вручную.',
  'phone.filled': 'Номер подставлен из Telegram. Его можно изменить.',
};

export function tp(key) {
  return ru[key] !== undefined ? ru[key] : key;
}
// конец файла phone.js
