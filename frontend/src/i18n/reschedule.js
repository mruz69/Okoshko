import { errorText } from '../components/ui.jsx';

const S = {
  btn: 'Перенести',
  info: 'Перенос записи',
  ask: 'Перенести запись на {date}?',
  done: 'Запись перенесена',
};

const E = {
  too_late_to_reschedule: 'Слишком поздно для переноса. Свяжитесь с организацией.',
  reschedule_unavailable: 'Эту запись нельзя перенести онлайн. Свяжитесь с организацией.',
  booking_not_active: 'Запись уже неактивна. Список обновлён.',
};

export function tr(key) {
  return S[key] || key;
}

export function rescheduleError(code) {
  return E[code] || errorText(code);
}

// конец файла reschedule.js
