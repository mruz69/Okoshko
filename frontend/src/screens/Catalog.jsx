import { t } from '../i18n/index.js';
import { formatMoney, formatDuration, plural, cartTotals } from '../lib/format.js';
import { Notice, Button } from '../components/ui.jsx';

export default function Catalog({ business, selected, onToggle, onNext }) {
  const services = business.services || [];
  const totals = cartTotals(services, selected);

  if (business.booking_mode === 'stay') return <Notice text={t('catalog.stay')} />;
  if (services.length === 0) return <Notice text={t('catalog.empty')} />;

  return (
    <div className="pb-28">
      <h2 className="text-lg font-semibold mb-3">{t('catalog.title')}</h2>
      <div className="space-y-2">
        {services.map((s) => {
          const on = selected.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => onToggle(s.id)}
              data-testid={'service-' + s.id}
              className={
                'w-full text-left rounded-xl border p-3 ' +
                (on ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white')
              }
            >
              <div className="flex justify-between gap-3">
                <span className="font-medium">{s.title}</span>
                <span className="whitespace-nowrap font-medium">{formatMoney(s.price, business.currency)}</span>
              </div>
              {s.description ? <p className="text-sm text-gray-500 mt-1">{s.description}</p> : null}
              <p className="text-sm text-gray-500 mt-1">
                {formatDuration(s.duration_minutes)}
                {on ? ' · ' + t('catalog.added') : ''}
              </p>
            </button>
          );
        })}
      </div>

      {totals.count > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3" data-testid="cart-bar">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-medium" data-testid="cart-count">
                {totals.count} {plural(totals.count, [t('catalog.one'), t('catalog.few'), t('catalog.many')])}
              </div>
              <div className="text-gray-500" data-testid="cart-sum">
                {formatDuration(totals.minutes)} · {formatMoney(totals.price, business.currency)}
              </div>
            </div>
            <div className="w-44">
              <Button onClick={onNext} testId="next">{t('catalog.next')}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
