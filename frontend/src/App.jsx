import { useCallback, useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { t } from './i18n/index.js';
import { api } from './lib/api.js';
import { addDays, dateKey, fullDateLabel, parseSlug } from './lib/format.js';
import { tr, rescheduleError } from './i18n/reschedule.js';
import { Notice, Spinner, errorText } from './components/ui.jsx';
import Catalog from './screens/Catalog.jsx';
import Slots from './screens/Slots.jsx';
import { Confirm, Done } from './screens/Confirm.jsx';
import MyBookings from './screens/MyBookings.jsx';
import Status from './screens/Status.jsx';

const BOT_LINK = 'https://t.me/slotlyby_bot';

function readSlug() {
  const fromTelegram = WebApp.initDataUnsafe && WebApp.initDataUnsafe.start_param;
  if (fromTelegram) return parseSlug(fromTelegram);
  const q = new URLSearchParams(window.location.search);
  return parseSlug(q.get('startapp') || q.get('slug'));
}

function askWriteAccess() {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => {
      if (!done) {
        done = true;
        resolve(Boolean(v));
      }
    };
    try {
      if (typeof WebApp.requestWriteAccess !== 'function') {
        finish(false);
        return;
      }
      WebApp.requestWriteAccess((ok) => finish(ok));
      setTimeout(() => finish(false), 20000);
    } catch (e) {
      finish(false);
    }
  });
}

function confirmDialog(message) {
  return new Promise((resolve) => {
    try {
      if (typeof WebApp.showConfirm === 'function') WebApp.showConfirm(message, (ok) => resolve(Boolean(ok)));
      else resolve(window.confirm(message));
    } catch (e) {
      resolve(false);
    }
  });
}

function alertText(message) {
  try {
    if (typeof WebApp.showAlert === 'function') WebApp.showAlert(message);
    else window.alert(message);
  } catch (e) {
    console.error(message);
  }
}

function haptic(kind) {
  try {
    WebApp.HapticFeedback.notificationOccurred(kind);
  } catch (e) {
    /* вибрация необязательна */
  }
}

function Shell({ title, children }) {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-md mx-auto p-4">
        {title ? <h1 className="text-xl font-bold mb-3">{title}</h1> : null}
        {children}
      </div>
    </main>
  );
}

function Tabs({ tab, onTab, bookingsLabel }) {
  const cls = (on) =>
    'flex-1 rounded-lg py-2 text-sm font-medium ' + (on ? 'bg-white shadow text-gray-900' : 'text-gray-500');
  return (
    <div className="flex gap-1 bg-gray-200 rounded-xl p-1 mb-4" data-testid="tabs">
      <button className={cls(tab === 'book')} onClick={() => onTab('book')} data-testid="tab-book">
        {t('nav.book')}
      </button>
      <button className={cls(tab === 'bookings')} onClick={() => onTab('bookings')} data-testid="tab-bookings">
        {bookingsLabel}
      </button>
    </div>
  );
}

function Home({ slug, businesses }) {
  if (slug) return <Notice tone="warn" text={t('home.notFound')} />;
  return (
    <div className="space-y-3">
      <Notice text={t('home.noLink')} />
      {businesses.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm space-y-1" data-testid="owner-info">
          <div className="font-medium">{t('home.ownerTitle')}</div>
          <div className="text-gray-500">{t('home.ownerText')}</div>
          {businesses.map((b) => (
            <div key={b.id} className="break-all">
              {b.name}: {BOT_LINK}/app?startapp={b.slug}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const insideTelegram = Boolean(WebApp.initData);
  const [slug] = useState(readSlug);
  const [phase, setPhase] = useState('loading');
  const [boot, setBoot] = useState(null);
  const [bootError, setBootError] = useState(null);
  const [tab, setTab] = useState('book');
  const [view, setView] = useState('catalog');
  const [selected, setSelected] = useState([]);
  const [slotsState, setSlotsState] = useState({ loading: false, error: null, slots: [] });
  const [notice, setNotice] = useState(false);
  const [slot, setSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);
  const [bookings, setBookings] = useState({ loading: false, error: null, bookings: [] });
  const [resch, setResch] = useState(null);
  const [reschSlots, setReschSlots] = useState({ loading: false, error: null, slots: [] });
  const [reschNotice, setReschNotice] = useState(false);
  const [reschBusy, setReschBusy] = useState(false);

  const business = boot ? boot.business : null;

  useEffect(() => {
    if (!insideTelegram) return;
    WebApp.ready();
    WebApp.expand();
    api('bootstrap', slug ? { slug } : {}).then((r) => {
      if (r.ok) {
        setBoot(r.data);
        setPhase('ready');
      } else {
        setBootError(r.error || 'generic');
        setPhase('error');
      }
    });
  }, []);

  useEffect(() => {
    const back = () => {
      if (tab === 'bookings' && resch) setResch(null);
      else if (view === 'confirm') setView('slots');
      else if (view === 'slots') setView('catalog');
    };
    const canBack = (tab === 'bookings' && Boolean(resch)) || (tab === 'book' && (view === 'slots' || view === 'confirm'));
    try {
      if (canBack) {
        WebApp.BackButton.show();
        WebApp.BackButton.onClick(back);
      } else {
        WebApp.BackButton.hide();
      }
    } catch (e) {
      /* кнопка «назад» доступна только в Telegram */
    }
    return () => {
      try {
        WebApp.BackButton.offClick(back);
      } catch (e) {
        /* без Telegram ничего не делаем */
      }
    };
  }, [tab, view, resch]);

  const loadSlots = useCallback(
    async (ids) => {
      if (!business) return;
      setSlotsState({ loading: true, error: null, slots: [] });
      const today = dateKey(new Date(), business.timezone);
      const rules = business.booking_rules || {};
      const horizon = Number(rules.horizon_days || 30);
      const r = await api('available_slots', {
        business_id: business.id,
        service_ids: ids,
        from: today,
        to: addDays(today, horizon),
      });
      setSlotsState(
        r.ok
          ? { loading: false, error: null, slots: r.data.slots }
          : { loading: false, error: r.error || 'generic', slots: [] }
      );
    },
    [business]
  );

  const loadBookings = useCallback(async () => {
    setBookings((s) => ({ ...s, loading: true, error: null }));
    const r = await api('my_bookings');
    setBookings(
      r.ok
        ? { loading: false, error: null, bookings: r.data.bookings }
        : { loading: false, error: r.error || 'generic', bookings: [] }
    );
  }, []);

  useEffect(() => {
    if (phase === 'ready' && tab === 'bookings') loadBookings();
  }, [phase, tab]);

  const loadReschSlots = useCallback(async (b) => {
    setReschSlots({ loading: true, error: null, slots: [] });
    const today = dateKey(new Date(), b.timezone);
    const r = await api('available_slots', {
      business_id: b.business_id,
      service_ids: b.service_ids,
      from: today,
      to: addDays(today, 60),
      staff_id: b.staff_id,
    });
    setReschSlots(
      r.ok
        ? { loading: false, error: null, slots: r.data.slots }
        : { loading: false, error: r.error || 'generic', slots: [] }
    );
  }, []);

  function startReschedule(b) {
    setReschNotice(false);
    setResch(b);
    loadReschSlots(b);
  }

  async function pickReschedule(s) {
    if (!resch || reschBusy) return;
    const ok = await confirmDialog(tr('ask').replace('{date}', fullDateLabel(s.start, resch.timezone)));
    if (!ok) return;
    setReschBusy(true);
    const r = await api('reschedule_booking', { booking_id: resch.id, starts_at: s.start });
    setReschBusy(false);
    if (r.ok) {
      haptic('success');
      setResch(null);
      loadBookings();
      alertText(tr('done'));
      return;
    }
    if (r.error === 'slot_unavailable' || r.error === 'slot_taken') {
      setReschNotice(true);
      loadReschSlots(resch);
      return;
    }
    alertText(rescheduleError(r.error));
    if (r.error === 'too_late_to_reschedule' || r.error === 'booking_not_active' || r.error === 'reschedule_unavailable') {
      setResch(null);
      loadBookings();
    }
  }

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function goSlots() {
    setNotice(false);
    setView('slots');
    loadSlots(selected);
  }

  function pickSlot(s) {
    setSlot(s);
    setSubmitError(null);
    setNotice(false);
    setView('confirm');
  }

  async function submit(form) {
    setSubmitting(true);
    setSubmitError(null);
    const allowed = await askWriteAccess();
    const r = await api('create_booking', {
      business_id: business.id,
      staff_id: slot.staffId,
      service_ids: selected,
      starts_at: slot.start,
      client_name: form.name,
      client_phone: form.phone || null,
      notes: form.notes || null,
      consent: true,
      can_message: allowed,
    });
    setSubmitting(false);
    if (r.ok) {
      haptic('success');
      setResult({
        services: (business.services || []).filter((s) => selected.includes(s.id)),
        slot,
        canMessage: allowed,
      });
      setSelected([]);
      setSlot(null);
      setView('done');
      return;
    }
    if (r.error === 'slot_unavailable' || r.error === 'slot_taken') {
      setNotice(true);
      setSlot(null);
      setView('slots');
      loadSlots(selected);
      return;
    }
    setSubmitError(r.error || 'generic');
  }

  async function cancelBooking(b) {
    const ok = await confirmDialog(t('bookings.cancelAsk'));
    if (!ok) return;
    const r = await api('change_booking_status', { booking_id: b.id, status: 'cancelled' });
    if (r.ok) loadBookings();
    else alertText(errorText(r.error));
  }

  if (!insideTelegram) {
    return (
      <Shell>
        <div className="mb-4"><Notice text={t('status.openInTelegram')} /></div>
        <Status />
      </Shell>
    );
  }
  if (phase === 'loading') {
    return <Shell><Spinner /></Shell>;
  }
  if (phase === 'error') {
    return <Shell title={t('app.name')}><Notice tone="error" text={errorText(bootError)} /></Shell>;
  }

  const terms = (business && business.terminology) || {};
  const plural = String(terms.booking_plural || 'Записи').toLowerCase();
  const user = (boot.user && boot.user.first_name) || '';
  const tg = (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) || {};
  const defaultName = [tg.first_name, tg.last_name].filter(Boolean).join(' ') || user;

  return (
    <Shell title={business ? business.name : t('app.name')}>
      <Tabs tab={tab} onTab={(x) => { setResch(null); setTab(x); }} bookingsLabel={t('nav.my') + ' ' + plural} />

      {tab === 'bookings' && resch ? (
        <div>
          <div className="mb-3">
            <Notice text={tr('info') + ': ' + resch.business_name + ', ' + fullDateLabel(resch.starts_at, resch.timezone)} />
          </div>
          <Slots
            business={{ timezone: resch.timezone }}
            state={reschSlots}
            notice={reschNotice}
            onPick={pickReschedule}
            onBack={() => setResch(null)}
            onRetry={() => loadReschSlots(resch)}
          />
        </div>
      ) : tab === 'bookings' ? (
        <MyBookings state={bookings} onCancel={cancelBooking} onReload={loadBookings} onReschedule={startReschedule} />
      ) : !business ? (
        <Home slug={slug} businesses={boot.businesses || []} />
      ) : view === 'catalog' ? (
        <Catalog business={business} selected={selected} onToggle={toggle} onNext={goSlots} />
      ) : view === 'slots' ? (
        <Slots
          business={business}
          state={slotsState}
          notice={notice}
          onPick={pickSlot}
          onBack={() => setView('catalog')}
          onRetry={() => loadSlots(selected)}
        />
      ) : view === 'confirm' && slot ? (
        <Confirm
          business={business}
          services={(business.services || []).filter((s) => selected.includes(s.id))}
          slot={slot}
          defaultName={defaultName}
          submitting={submitting}
          error={submitError}
          onSubmit={submit}
          onBack={() => setView('slots')}
        />
      ) : view === 'done' && result ? (
        <Done
          business={business}
          result={result}
          onBookings={() => setTab('bookings')}
          onAgain={() => setView('catalog')}
          onOpenBot={() => WebApp.openTelegramLink(BOT_LINK)}
        />
      ) : (
        <Catalog business={business} selected={selected} onToggle={toggle} onNext={goSlots} />
      )}
    </Shell>
  );
}
