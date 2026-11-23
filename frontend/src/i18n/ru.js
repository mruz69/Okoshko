/* Все строки интерфейса живут здесь. Новый язык = новый файл с теми же ключами. */
export default {
  app: {
    name: 'Slotly',
    tagline: 'Онлайн-запись для малого бизнеса в Telegram',
  },
  status: {
    title: 'Проверка каркаса',
    telegram: 'Открыто внутри Telegram',
    supabase: 'Настройки Supabase заданы',
    yes: 'да',
    no: 'нет',
  },
  server: {
    title: 'Проверка сервера',
    forgedButton: 'Отправить поддельные данные',
    forgedOk: 'Сервер отклонил подделку (401)',
    forgedBad: 'Что-то не так',
    realButton: 'Отправить настоящие данные Telegram',
    realOk: 'Сервер узнал вас, Telegram ID',
    realBad: 'Что-то не так',
    realHint: 'Эта кнопка работает только при открытии внутри Telegram',
    waiting: 'Ждём ответ...',
  },
};
