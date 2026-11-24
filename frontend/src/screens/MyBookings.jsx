import { t } from '../i18n/index.js';
import { formatMoney, fullDateLabel } from '../lib/format.js';
import { Notice, Spinner, Button, errorText } from '../components/ui.jsx';

export default function MyBookings({ state, onCancel, onReload }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">{t('bookings.title')}</h2>

      {state.loading ? <Spinner /> : null}

      {!state.loading && state.error ? (
        <div className="space-y-3">
          <Notice tone="error" text={errorText(state.error)} />
          <Button variant="secondary" onClick={onReload}>{t('nav.retry')}</Button>
        </div>
      ) : null}

      {!state.loading && !state.error && state.bookings.length === 0 ? <Notice text={t('bookings.empty')} /> : null}

      <div className="space-y-3">
        {!state.loading && !state.error
          ? state.bookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-gray-200 bg-white p-3" data-testid={'booking-' + b.id}>
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{b.business_name}</span>
                  <span className="text-xs rounded-full bg-gray-100 px-2 py-1 h-fit">{t('status_names.' + b.status)}</span>
                </div>
                <div className="text-sm mt-1">{fullDateLabel(b.starts_at, b.timezone)}</div>
                <div className="text-sm text-gray-500">{(b.items || []).join(', ')}</div>
                <div className="text-sm font-medium mt-1">{formatMoney(b.total_price, b.currency)}</div>
                <div className="mt-2">
                  <Button variant="secondary" onClick={() => onCancel(b)} testId={'cancel-' + b.id}>
                    {t('bookings.cancel')}
                  </Button>
                </div>
              </div>
            ))
          : null}
      </div>
    </div>
  );
}
