import { useMemo, useState } from 'react';
import { t } from '../i18n/index.js';
import { dayLabel, groupSlotsByDay } from '../lib/format.js';
import { Notice, Spinner, Button, BackLink, errorText } from '../components/ui.jsx';

export default function Slots({ business, state, notice, onPick, onBack, onRetry }) {
  const days = useMemo(() => groupSlotsByDay(state.slots, business.timezone), [state.slots, business.timezone]);
  const [dayKeyChosen, setDayKeyChosen] = useState(null);
  const current = days.find((d) => d.key === dayKeyChosen) || days[0];

  return (
    <div>
      <BackLink onBack={onBack} />
      <h2 className="text-lg font-semibold mb-3">{t('slots.title')}</h2>
      {notice ? <div className="mb-3"><Notice tone="warn" text={t('slots.taken')} /></div> : null}

      {state.loading ? <Spinner /> : null}

      {!state.loading && state.error ? (
        <div className="space-y-3">
          <Notice tone="error" text={errorText(state.error)} />
          <Button variant="secondary" onClick={onRetry}>{t('nav.retry')}</Button>
        </div>
      ) : null}

      {!state.loading && !state.error && days.length === 0 ? <Notice text={t('slots.empty')} /> : null}

      {!state.loading && !state.error && days.length > 0 ? (
        <div>
          <div className="flex gap-2 overflow-x-auto pb-2" data-testid="days">
            {days.map((d) => (
              <button
                key={d.key}
                onClick={() => setDayKeyChosen(d.key)}
                data-testid={'day-' + d.key}
                className={
                  'whitespace-nowrap rounded-xl border px-3 py-2 text-sm ' +
                  (current && current.key === d.key
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white')
                }
              >
                {dayLabel(d.key)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 mt-3" data-testid="times">
            {current.times.map((s) => (
              <button
                key={s.start}
                onClick={() => onPick(s)}
                data-testid={'time-' + s.start}
                className="rounded-xl border border-gray-200 bg-white py-2 text-sm font-medium"
              >
                {s.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-4">
            {t('slots.timeNote')} {business.timezone}
          </p>
        </div>
      ) : null}
    </div>
  );
}
