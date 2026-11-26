import React, { useCallback, useEffect, useMemo, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { t, errorText, ownerApi, todayIn, clientLink, openUrl } from './lib';
import { Spinner, Notice, Btn, Badge } from './ui';
import Onboarding from './Onboarding';
import Bookings from './Bookings';
import Schedule from './Schedule';
import Services from './Services';
import Clients from './Clients';
import Share from './Share';

const TABS = ['bookings', 'schedule', 'services', 'clients', 'more'];
const ICONS = { bookings: '📋', schedule: '🗓', services: '✂️', clients: '👥', more: '⋯' };

function More({ ctx, businesses, onSwitch }) {
  const b = ctx.business;
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">{b.name}</h1>
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-500">{t('more.link')}</h2>
        <Share slug={b.slug} name={b.name} />
        <Btn variant="secondary" className="w-full" onClick={() => openUrl(clientLink(b.slug))}>
          {t('more.openAsClient')}
        </Btn>
      </div>
      <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
        <div>
          {t('more.timezone')}: {b.timezone}
        </div>
        <div>
          {t('more.currency')}: {b.currency}
        </div>
        <div>
          {t('more.plan')}: <Badge tone="blue">{String(b.plan || 'free').toUpperCase()}</Badge>
        </div>
      </div>
      {businesses.length > 1 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-500">{t('more.switch')}</h2>
          {businesses.map((x) => (
            <Btn key={x.id} variant={x.id === b.id ? 'primary' : 'secondary'} className="w-full" onClick={() => onSwitch(x.id)}>
              {x.name}
            </Btn>
          ))}
        </div>
      )}
      <Notice>{t('more.soon')}</Notice>
    </div>
  );
}

export default function Cabinet() {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [tab, setTab] = useState('bookings');
  const insideTelegram = !!WebApp.initData;

  const load = useCallback(async (silent, id) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await ownerApi('bootstrap', id ? { business_id: id } : {});
      setState({ loading: false, error: null, data });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: errorText(e) }));
    }
  }, []);

  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
    } catch (e) {
      /* вне Telegram */
    }
    if (insideTelegram) load(false);
  }, [load, insideTelegram]);

  const data = state.data;
  const business = data && data.business;
  const ctx = useMemo(() => {
    if (!business) return null;
    return {
      business,
      services: data.services,
      reload: () => load(true, business.id),
      call: (action, params) => ownerApi(action, { business_id: business.id, ...params }),
    };
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!insideTelegram) {
    return (
      <div className="p-4">
        <Notice kind="warn">{t('cab.outside')}</Notice>
      </div>
    );
  }
  if (state.loading && !data) return <Spinner />;
  if (state.error && !data) {
    return (
      <div className="space-y-3 p-4">
        <Notice kind="error">{state.error}</Notice>
        <Btn className="w-full" onClick={() => load(false)}>
          {t('common.retry')}
        </Btn>
      </div>
    );
  }
  if (!business) {
    return (
      <div className="mx-auto max-w-md p-4">
        <Onboarding presets={data.presets} onDone={(id) => load(false, id)} />
      </div>
    );
  }

  const today = todayIn(business.timezone);
  return (
    <div className="mx-auto min-h-screen max-w-md bg-white pb-24">
      <div className="p-4">
        {tab === 'bookings' && <Bookings ctx={ctx} today={today} />}
        {tab === 'schedule' && <Schedule ctx={ctx} today={today} />}
        {tab === 'services' && <Services ctx={ctx} />}
        {tab === 'clients' && <Clients ctx={ctx} />}
        {tab === 'more' && <More ctx={ctx} businesses={data.businesses} onSwitch={(id) => load(false, id)} />}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="mx-auto flex max-w-md">
          {TABS.map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={`flex-1 py-2 text-center text-xs ${tab === k ? 'font-semibold text-blue-600' : 'text-slate-500'}`}>
              <div className="text-lg leading-6">{ICONS[k]}</div>
              {t('tab.' + k)}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
// конец файла Cabinet.jsx
