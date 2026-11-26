import React, { useEffect, useState } from 'react';
import { t, errorText, fmtDate, money, dur, contactLink, openUrl } from './lib';
import { Sheet, Btn, Badge, Notice, Field, Input, TextArea, Select, Toggle, ConfirmDialog } from './ui';

export const statusTone = { pending: 'amber', confirmed: 'green', completed: 'blue', cancelled: 'red', no_show: 'red' };

/* Карточка записи: детали, связь с клиентом, смена статуса, перенос */
export default function BookingSheet({ booking: b, ctx, onClose, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [resched, setResched] = useState(false);
  const [rd, setRd] = useState(b.date);
  const [rt, setRt] = useState(b.start);
  const cur = ctx.business.currency;
  const active = b.status === 'pending' || b.status === 'confirmed';
  const contact = contactLink(b);

  const run = async (fn) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
      await onChanged();
      onClose();
    } catch (e) {
      setErr(errorText(e));
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };
  const setStatus = (status) => run(() => ctx.call('booking_status', { booking_id: b.id, status }));
  const reschedule = () => run(() => ctx.call('booking_reschedule', { booking_id: b.id, date: rd, start: rt }));

  return (
    <Sheet title={b.client_name || t('booking.noName')} onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        <Badge tone={statusTone[b.status] || 'slate'}>{t('status.' + b.status)}</Badge>
        <Badge>{t('source.' + b.source)}</Badge>
        {b.confirmed && <Badge tone="green">{t('booking.clientConfirmed')}</Badge>}
        {b.delay_minutes ? <Badge tone="amber">{t('booking.delay', { n: b.delay_minutes })}</Badge> : null}
      </div>

      <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-800">
        <div className="font-medium">
          {fmtDate(b.date)}, {b.start}–{b.end}
        </div>
        <div className="mt-1 text-slate-600">
          {dur(b.total_duration)} · {money(b.total_price, cur)}
        </div>
        {b.items && b.items.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {b.items.map((i, k) => (
              <li key={k} className="flex justify-between gap-2">
                <span>{i.title}</span>
                <span className="text-slate-500">{money(i.price, cur)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(b.client_phone || b.client_username || b.tg_username) && (
        <div className="text-sm text-slate-700">
          {b.client_phone && <div>{b.client_phone}</div>}
          {(b.tg_username || b.client_username) && <div>{b.tg_username ? '@' + b.tg_username.replace(/^@/, '') : b.client_username}</div>}
        </div>
      )}
      {b.notes && <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{b.notes}</div>}
      {err && <Notice kind="error">{err}</Notice>}

      {contact && (
        <Btn variant="secondary" className="w-full" onClick={() => openUrl(contact.url)}>
          {t('booking.contact')}
        </Btn>
      )}

      {active && !resched && (
        <div className="grid grid-cols-2 gap-2">
          {b.status === 'pending' && (
            <Btn busy={busy} className="col-span-2" onClick={() => setStatus('confirmed')}>
              {t('booking.act.confirm')}
            </Btn>
          )}
          <Btn variant="secondary" busy={busy} onClick={() => setStatus('completed')}>
            {t('booking.act.complete')}
          </Btn>
          <Btn variant="secondary" busy={busy} onClick={() => setStatus('no_show')}>
            {t('booking.act.noShow')}
          </Btn>
          <Btn variant="secondary" onClick={() => setResched(true)}>
            {t('booking.act.reschedule')}
          </Btn>
          <Btn variant="danger" onClick={() => setConfirm('cancel')}>
            {t('booking.act.cancel')}
          </Btn>
        </div>
      )}

      {active && resched && (
        <div className="space-y-3 rounded-xl border border-slate-200 p-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('common.date')}>
              <Input type="date" value={rd} onChange={(e) => setRd(e.target.value)} />
            </Field>
            <Field label={t('common.time')}>
              <Input type="time" step="300" value={rt} onChange={(e) => setRt(e.target.value)} />
            </Field>
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" className="flex-1" onClick={() => setResched(false)}>
              {t('common.cancel')}
            </Btn>
            <Btn className="flex-1" busy={busy} disabled={!rd || !rt} onClick={reschedule}>
              {t('booking.reschedule.save')}
            </Btn>
          </div>
          <p className="text-xs text-slate-500">{t('booking.reschedule.hint')}</p>
        </div>
      )}

      {confirm === 'cancel' && (
        <ConfirmDialog text={t('booking.cancel.ask')} yes={t('booking.act.cancel')} busy={busy} onNo={() => setConfirm(null)} onYes={() => setStatus('cancelled')} />
      )}
    </Sheet>
  );
}

/* Ручная запись владельца: звонок, Instagram, VK и т. д. */
export function ManualBooking({ ctx, date, onClose, onDone }) {
  const services = ctx.services.filter((s) => s.is_active);
  const [d, setD] = useState(date);
  const [tm, setTm] = useState('10:00');
  const [ids, setIds] = useState([]);
  const [custom, setCustom] = useState(services.length === 0);
  const [cDur, setCDur] = useState('60');
  const [cPrice, setCPrice] = useState('0');
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState(null);
  const [phone, setPhone] = useState('');
  const [nick, setNick] = useState('');
  const [src, setSrc] = useState('manual_phone');
  const [notes, setNotes] = useState('');
  const [sugg, setSugg] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const cur = ctx.business.currency;

  useEffect(() => {
    if (clientId || name.trim().length < 2) {
      setSugg([]);
      return undefined;
    }
    const h = setTimeout(async () => {
      try {
        const r = await ctx.call('clients_list', { q: name.trim(), limit: 5 });
        setSugg(r.clients || []);
      } catch (e) {
        setSugg([]);
      }
    }, 300);
    return () => clearTimeout(h);
  }, [name, clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const chosen = services.filter((s) => ids.includes(s.id));
  const totalDur = custom ? Number(cDur || 0) : chosen.reduce((a, s) => a + s.duration_minutes, 0);
  const totalPrice = custom ? Number(cPrice || 0) : chosen.reduce((a, s) => a + Number(s.price), 0);
  const toggle = (id) => setIds((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

  const submit = async () => {
    setErr('');
    if (!name.trim()) return setErr(t('err.client_name_required'));
    if (!custom && ids.length === 0) return setErr(t('err.services_required'));
    if (custom && !(Number(cDur) >= 5)) return setErr(t('err.duration_invalid'));
    setBusy(true);
    try {
      await ctx.call('booking_create', {
        date: d,
        start: tm,
        service_ids: custom ? [] : ids,
        custom_duration: custom ? Number(cDur) : null,
        custom_price: custom ? Number(cPrice || 0) : null,
        client_name: name.trim(),
        client_id: clientId,
        client_phone: phone,
        client_username: nick,
        source: src,
        notes,
      });
      await onDone();
      onClose();
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={t('manual.title')} onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t('common.date')}>
          <Input type="date" value={d} onChange={(e) => setD(e.target.value)} />
        </Field>
        <Field label={t('common.time')}>
          <Input type="time" step="300" value={tm} onChange={(e) => setTm(e.target.value)} />
        </Field>
      </div>

      {services.length > 0 && <Toggle checked={custom} onChange={setCustom} label={t('manual.custom')} />}
      {!custom && (
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={`rounded-full border px-3 py-1.5 text-sm ${ids.includes(s.id) ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-800'}`}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}
      {custom && (
        <div className="grid grid-cols-2 gap-2">
          <Field label={t('manual.duration')}>
            <Input type="number" inputMode="numeric" min="5" value={cDur} onChange={(e) => setCDur(e.target.value)} />
          </Field>
          <Field label={t('manual.price', { cur })}>
            <Input type="number" inputMode="decimal" min="0" value={cPrice} onChange={(e) => setCPrice(e.target.value)} />
          </Field>
        </div>
      )}
      <div className="text-sm text-slate-600">
        {t('manual.total')}: {dur(totalDur)} · {money(totalPrice, cur)}
      </div>

      <Field label={t('manual.clientName')}>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setClientId(null);
          }}
        />
      </Field>
      {sugg.length > 0 && (
        <div className="space-y-1 rounded-xl border border-slate-200 p-2">
          {sugg.map((c) => (
            <button
              key={c.id}
              type="button"
              className="block w-full rounded-lg px-2 py-1.5 text-left text-sm active:bg-slate-100"
              onClick={() => {
                setName(c.name);
                setClientId(c.id);
                setPhone(c.phone || '');
                setSugg([]);
              }}
            >
              {c.name} {c.phone ? <span className="text-slate-500">· {c.phone}</span> : null}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Field label={t('manual.phone')}>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label={t('manual.nick')}>
          <Input value={nick} onChange={(e) => setNick(e.target.value)} />
        </Field>
      </div>
      <Field label={t('manual.source')}>
        <Select value={src} onChange={(e) => setSrc(e.target.value)}>
          {['manual_phone', 'manual_instagram', 'manual_vk', 'manual_email', 'manual_other'].map((s) => (
            <option key={s} value={s}>
              {t('source.' + s)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('manual.notes')}>
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      {err && <Notice kind="error">{err}</Notice>}
      <Btn className="w-full" busy={busy} onClick={submit}>
        {t('manual.save')}
      </Btn>
      <p className="text-xs text-slate-500">{t('manual.hint', { tz: ctx.business.timezone })}</p>
    </Sheet>
  );
}
// конец файла BookingSheet.jsx
