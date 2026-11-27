import { useEffect, useRef, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { t } from '../i18n/index.js';
import { tp } from '../i18n/phone.js';
import * as apiModule from '../lib/api.js';
import { formatMoney, formatDuration, fullDateLabel, cartTotals } from '../lib/format.js';
import { Notice, Button, BackLink, errorText } from '../components/ui.jsx';

const apiNs = Object(apiModule);
const callApi = apiNs.api || apiNs.default;

/* Можно ли запросить номер: внутри Telegram и версия 6.9 или новее */
function canAskContact() {
  try {
    return !!WebApp.initData && WebApp.isVersionAtLeast('6.9') && typeof WebApp.requestContact === 'function';
  } catch (e) {
    return false;
  }
}

/* Номер, который клиент уже передал боту (пустая строка, если нет или ошибка) */
async function fetchPhone() {
  try {
    const r = await callApi('my_phone', {});
    const d = r && r.data !== undefined ? r.data : r;
    return (d && d.phone) || '';
  } catch (e) {
    return '';
  }
}

export function Confirm({ business, services, slot, defaultName, submitting, error, onSubmit, onBack }) {
  const [name, setName] = useState(defaultName || '');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [canAsk] = useState(canAskContact);
  const [saved, setSaved] = useState(false);
  const [phoneState, setPhoneState] = useState('idle');
  const alive = useRef(true);
  const totals = cartTotals(services, services.map((s) => s.id));
  const field = 'w-full rounded-xl border border-gray-300 p-3 bg-white';

  useEffect(() => {
    alive.current = true;
    (async () => {
      const p = await fetchPhone();
      if (alive.current && p) {
        setPhone((cur) => cur || p);
        setSaved(true);
      }
    })();
    return () => {
      alive.current = false;
    };
  }, []);

  const askContact = () => {
    setPhoneState('waiting');
    try {
      WebApp.requestContact(async (res) => {
        const ok = res === true || res === 'sent' || (res && res.status === 'sent');
        if (!ok) {
          if (alive.current) setPhoneState('idle');
          return;
        }
        /* номер приходит боту отдельным сообщением: ждём до 8 секунд */
        for (let i = 0; i < 8; i++) {
          const p = await fetchPhone();
          if (!alive.current) return;
          if (p) {
            setPhone(p);
            setSaved(true);
            setPhoneState('idle');
            return;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
        if (alive.current) setPhoneState('failed');
      });
    } catch (e) {
      setPhoneState('failed');
    }
  };

  return (
    <div className="pb-8">
      <BackLink onBack={onBack} />
      <h2 className="text-lg font-semibold mb-3">{t('confirm.title')}</h2>

      <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2 mb-4" data-testid="summary">
        <div>
          <div className="text-xs text-gray-500">{t('confirm.when')}</div>
          <div className="font-medium" data-testid="when">{fullDateLabel(slot.start, business.timezone)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">{t('confirm.services')}</div>
          {totals.chosen.map((s) => (
            <div key={s.id} className="flex justify-between gap-3 text-sm">
              <span>{s.title}</span>
              <span className="whitespace-nowrap">{formatMoney(s.price, business.currency)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between border-t border-gray-100 pt-2 font-medium">
          <span>{t('confirm.total')} · {formatDuration(totals.minutes)}</span>
          <span data-testid="total">{formatMoney(totals.price, business.currency)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm">
          {t('confirm.name')}
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} data-testid="name" />
        </label>
        <div className="space-y-2">
          <label className="block text-sm">
            {t('confirm.phone')}
            <input
              className={field}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              data-testid="phone"
            />
          </label>
          {canAsk && !saved ? (
            <Button variant="secondary" testId="share-phone" disabled={phoneState === 'waiting'} onClick={askContact}>
              {phoneState === 'waiting' ? tp('phone.waiting') : tp('phone.share')}
            </Button>
          ) : null}
          {saved ? <p className="text-xs text-gray-400" data-testid="phone-filled">{tp('phone.filled')}</p> : null}
          {phoneState === 'failed' ? <Notice tone="warn" text={tp('phone.failed')} /> : null}
        </div>
        <label className="block text-sm">
          {t('confirm.notes')}
          <textarea
            className={field}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            data-testid="notes"
          />
        </label>
      </div>

      {error ? <div className="mt-3"><Notice tone="error" text={errorText(error)} /></div> : null}

      <p className="text-xs text-gray-400 mt-3 mb-3">{t('confirm.consent')}</p>
      <Button
        testId="submit"
        disabled={submitting || !name.trim()}
        onClick={() => onSubmit({ name: name.trim(), phone: phone.trim(), notes: notes.trim() })}
      >
        {submitting ? t('confirm.sending') : t('confirm.submit')}
      </Button>
    </div>
  );
}

export function Done({ business, result, onBookings, onAgain, onOpenBot }) {
  const totals = cartTotals(result.services, result.services.map((s) => s.id));
  return (
    <div className="text-center" data-testid="done">
      <div className="text-5xl mt-4">✅</div>
      <h2 className="text-xl font-semibold mt-2 mb-4">{t('done.title')}</h2>

      <div className="text-left rounded-xl border border-gray-200 bg-white p-3 space-y-2 mb-4">
        <div>
          <div className="text-xs text-gray-500">{t('done.when')}</div>
          <div className="font-medium">{fullDateLabel(result.slot.start, business.timezone)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">{t('done.services')}</div>
          <div className="text-sm">{totals.chosen.map((s) => s.title).join(', ')}</div>
        </div>
        <div className="flex justify-between border-t border-gray-100 pt-2 font-medium">
          <span>{t('done.total')}</span>
          <span>{formatMoney(totals.price, business.currency)}</span>
        </div>
      </div>

      {!result.canMessage ? (
        <div className="mb-4 space-y-2" data-testid="no-messages">
          <Notice tone="warn" text={t('done.noMessages')} />
          <Button variant="secondary" onClick={onOpenBot}>{t('done.openBot')}</Button>
        </div>
      ) : null}

      <div className="space-y-2">
        <Button onClick={onBookings} testId="to-bookings">{t('done.myBookings')}</Button>
        <Button variant="secondary" onClick={onAgain} testId="again">{t('done.again')}</Button>
      </div>
    </div>
  );
}
// конец файла Confirm.jsx
