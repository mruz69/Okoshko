import { errorText } from './lib';

/* Строки новых экранов вкладки «Ещё»: настройки, тариф, интеграции.
   Лежат отдельно от ru.js, чтобы не менять существующие файлы. */
const ru = {
  'more2.settings': 'Настройки',
  'more2.settingsHint': 'Название, валюта, правила записи',
  'more2.templates': 'Шаблоны уведомлений',
  'more2.templatesHint': 'Тексты напоминаний и сообщений клиентам',
  'more2.plan': 'Тариф',
  'more2.planHint': 'Лимиты и доступные функции',
  'more2.integrations': 'Интеграции',
  'more2.integrationsHint': 'Email, Instagram, VK и другие',
  'more2.back': '← Назад',
  'more2.retry': 'Повторить',

  'set.title': 'Настройки',
  'set.profile': 'Профиль бизнеса',
  'set.name': 'Название',
  'set.currency': 'Валюта',
  'set.timezone': 'Часовой пояс',
  'set.timezoneHint': 'Изменить нельзя: от него зависят график и записи.',
  'set.rules': 'Правила записи',
  'set.lead': 'Минимум до визита',
  'set.leadHint': 'Раньше этого срока клиент не сможет записаться.',
  'set.horizon': 'Как далеко вперёд можно записаться',
  'set.step': 'Шаг сетки времени',
  'set.stepHint': 'Через сколько минут начинаются свободные окна.',
  'set.cancel': 'Отмена записи клиентом',
  'set.cancelHint': 'Клиент не сможет отменить запись позже, чем за указанное время до визита.',
  'set.cancelLocked': 'Доступно на тарифе Pro.',
  'set.cancelBefore': 'за {v} до визита',
  'set.none': 'Без ограничений',
  'set.v.min': '{n} мин',
  'set.v.h': '{n} ч',
  'set.v.d': '{n} дн.',
  'set.v.hm': '{h} ч {m} мин',
  'set.save': 'Сохранить',
  'set.saved': 'Сохранено',

  'plan.title': 'Тариф',
  'plan.current': 'Ваш тариф',
  'plan.until': 'Действует до {date}',
  'plan.limits': 'Лимиты',
  'plan.unlimited': 'без лимита',
  'plan.upTo': 'до {n}',
  'plan.lim.staff': 'Специалисты',
  'plan.lim.resources': 'Объекты',
  'plan.lim.services': 'Услуги',
  'plan.lim.bookings_per_month': 'Записи в этом месяце',
  'plan.features': 'Функции',
  'plan.included': 'Включено',
  'plan.soon': 'Скоро',
  'plan.soonSmall': 'скоро',
  'plan.pay': 'Оплата тарифов Pro и Business появится позже, через Telegram Stars. Сейчас доступен тариф Free.',
  'feat.core_booking': 'Онлайн-запись: каталог услуг, корзина, умный подбор времени',
  'feat.manual_booking': 'Ручная запись и блокировка времени',
  'feat.reminders_basic': 'Напоминания клиентам за 24 ч и 3 ч',
  'feat.booking_rules': 'Правила записи',
  'feat.buffers': 'Буфер между клиентами',
  'feat.share_link': 'Персональная ссылка и QR',
  'feat.instagram_link': 'Ссылка для Instagram и учёт источника записи',
  'feat.crm_basic': 'Клиенты: контакты, заметки, история',
  'feat.no_show': 'Метка «не пришёл»',
  'feat.reminders_templates': 'Свой текст уведомления (один шаблон)',
  'feat.templates_unlimited': 'Свои тексты для всех уведомлений',
  'feat.cancel_policy': 'Политика отмены записи',
  'feat.manual_approval': 'Ручное подтверждение записей',
  'feat.ics_export': 'Экспорт расписания в календарь',
  'feat.channel_email': 'Email-уведомления',
  'feat.channel_instagram': 'Instagram: входящие сообщения',
  'feat.channel_vk': 'VK: бот сообщества',
  'feat.custom_fields': 'Свои поля в форме записи',
  'feat.group_sessions': 'Групповые занятия',
  'feat.prepayment': 'Предоплата за запись',
  'feat.multi_staff': 'Несколько специалистов',

  'int.title': 'Интеграции',
  'int.intro': 'Подключения к внешним сервисам. Пока это витрина: сами интеграции появятся на следующих этапах.',
  'int.soon': 'Скоро',
  'int.works': 'Ссылка и QR работают',
  'int.email': 'Email',
  'int.email.d': 'Письма клиентам и вам: подтверждение, напоминание, отмена, файл для календаря.',
  'int.instagram': 'Instagram',
  'int.instagram.d': 'Ссылка и QR для шапки профиля уже работают: они на вкладке «Ещё», в блоке со ссылкой. Приём сообщений из директа появится позже. Instagram не разрешает писать клиенту первым, поэтому напоминания идут через Telegram.',
  'int.vk': 'VK',
  'int.vk.d': 'Бот сообщества VK. Решение по срокам примем после запуска Telegram и Email.',
  'int.calendar': 'Календарь (.ics)',
  'int.calendar.d': 'Подписка на расписание в Google Календаре или Apple Календаре.',

  'tpl.title': 'Шаблоны уведомлений',
  'tpl.introFree': 'Здесь можно поменять тексты сообщений клиентам. На тарифе Free доступен один свой текст, остальные остаются стандартными. Изменения действуют на все ещё не отправленные сообщения.',
  'tpl.introPro': 'Здесь можно поменять тексты сообщений клиентам. Изменения действуют на все ещё не отправленные сообщения.',
  'tpl.custom': 'Свой текст',
  'tpl.standard': 'Стандартный',
  'tpl.kind.reminder_24h': 'Напоминание за 24 часа',
  'tpl.kind.reminder_3h': 'Напоминание за 3 часа',
  'tpl.kind.booking_created': 'Подтверждение записи',
  'tpl.kind.booking_cancelled_by_owner': 'Отмена записи вами',
  'tpl.kind.booking_rescheduled': 'Перенос записи вами',
  'tpl.when.reminder_24h': 'Уходит клиенту за сутки до визита.',
  'tpl.when.reminder_3h': 'Уходит клиенту за 3 часа до визита.',
  'tpl.when.booking_created': 'Уходит сразу после того, как клиент записался.',
  'tpl.when.booking_cancelled_by_owner': 'Уходит клиенту, когда вы отменяете его запись.',
  'tpl.when.booking_rescheduled': 'Уходит клиенту, когда вы переносите его запись на другое время.',
  'tpl.addVar': 'Добавить в конец текста:',
  'tpl.var.client_name': 'Имя клиента',
  'tpl.var.date': 'Дата',
  'tpl.var.time': 'Время',
  'tpl.var.services': 'Услуги',
  'tpl.var.total_price': 'Сумма',
  'tpl.var.business_name': 'Название бизнеса',
  'tpl.unknown': 'Неизвестные переменные: {vars}. Используйте кнопки выше.',
  'tpl.preview': 'Так увидит клиент (пример)',
  'tpl.buttonsNote': 'Под напоминанием автоматически добавятся кнопки: подтвердить визит, задерживаюсь, отменить запись.',
  'tpl.limitFree': 'На тарифе Free можно изменить только один шаблон. Верните стандартный текст у другого шаблона или перейдите на Pro.',
  'tpl.save': 'Сохранить',
  'tpl.reset': 'Вернуть стандартный текст',
  'tpl.resetAsk': 'Вернуть стандартный текст? Ваш вариант будет удалён.',
  'tpl.resetYes': 'Вернуть',

  'err.feature_locked': 'Эта функция доступна на тарифе Pro.',
  'err.invalid_rules': 'Проверьте значения правил записи.',
  'err.limit_templates': 'На тарифе Free можно изменить только один шаблон.',
  'err.invalid_template': 'Текст шаблона не подходит: он пустой или длиннее 1000 знаков.',
  'err.unknown_variable': 'В тексте есть неизвестная переменная в фигурных скобках.',
};

/* Строка по ключу, как t() в lib.js */
export function tm(key, vars) {
  let s = ru[key];
  if (s === undefined) return key;
  if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
}

/* Текст ошибки: сначала новые коды, затем общий словарь */
export function errMsg(e) {
  const code = (e && (e.code || e.message)) || 'server';
  const s = ru['err.' + code];
  return s !== undefined ? s : errorText(e);
}

export default ru;
// конец файла moreText.js
