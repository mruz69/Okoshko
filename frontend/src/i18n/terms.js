/* Подписи пресета с падежами.
   В базе (businesses.terminology) хранится только именительный падеж: «Мастер», «Сеанс».
   Здесь лежат остальные формы для известных слов. Для незнакомого слова
   (если подпись когда-нибудь введут вручную) берётся нейтральное «специалист» / «запись»,
   чтобы фраза осталась грамматически верной. */

/* исполнитель: родительный (кого), дательный (кому), творительный (с кем) */
const STAFF = {
  мастер: ['мастера', 'мастеру', 'мастером'],
  специалист: ['специалиста', 'специалисту', 'специалистом'],
  преподаватель: ['преподавателя', 'преподавателю', 'преподавателем'],
  фотограф: ['фотографа', 'фотографу', 'фотографом'],
  тренер: ['тренера', 'тренеру', 'тренером'],
  хозяин: ['хозяина', 'хозяину', 'хозяином'],
};

/* запись: винительный, родительный множественного, «этот/эта/это», окончание «отменена» */
const BOOKING = {
  запись: ['запись', 'записей', 'эту запись', 'отменена'],
  сеанс: ['сеанс', 'сеансов', 'этот сеанс', 'отменён'],
  занятие: ['занятие', 'занятий', 'это занятие', 'отменено'],
  сессия: ['сессию', 'сессий', 'эту сессию', 'отменена'],
  съемка: ['съёмку', 'съёмок', 'эту съёмку', 'отменена'],
  тренировка: ['тренировку', 'тренировок', 'эту тренировку', 'отменена'],
  прием: ['приём', 'приёмов', 'этот приём', 'отменён'],
  бронь: ['бронь', 'броней', 'эту бронь', 'отменена'],
};

function key(word) {
  return String(word || '').trim().toLowerCase().replace(/ё/g, 'е');
}

function cap(word) {
  const s = String(word || '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function termForms(terminology) {
  const tm = terminology || {};
  const staffKnown = STAFF[key(tm.staff || 'Мастер')];
  const bookingKnown = BOOKING[key(tm.booking || 'Запись')];
  /* Незнакомое слово заменяем нейтральным целиком, чтобы падежи и роды не путались. */
  const staff = staffKnown ? String(tm.staff || 'Мастер').trim() : 'Специалист';
  const booking = bookingKnown ? String(tm.booking || 'Запись').trim() : 'Запись';
  const sf = staffKnown || STAFF['специалист'];
  const bf = bookingKnown || BOOKING['запись'];
  const ins = sf[2];
  return {
    staff: staff.toLowerCase(),
    staff_gen: sf[0],
    staff_dat: sf[1],
    staff_ins: ins,
    with_staff: (ins.charAt(0) === 'с' ? 'со ' : 'с ') + ins,
    staff_plural: String(tm.staff_plural || 'Мастера').trim().toLowerCase(),
    client: String(tm.client || 'Клиент').trim().toLowerCase(),
    client_plural: String(tm.client_plural || 'Клиенты').trim().toLowerCase(),
    booking: booking.toLowerCase(),
    booking_cap: cap(booking),
    booking_plural: bookingKnown
      ? String(tm.booking_plural || 'Записи').trim().toLowerCase()
      : 'записи',
    booking_acc: bf[0],
    booking_plural_gen: bf[1],
    booking_this: bf[2],
    booking_cancelled: bf[3],
  };
}
// конец файла terms.js
