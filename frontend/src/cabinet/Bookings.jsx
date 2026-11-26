import React, { useCallback, useEffect, useState } from 'react';
import { t, errorText, fmtDate, money } from './lib';
import { Spinner, Notice, Btn, Badge } from './ui';
import BookingSheet, { ManualBooking, statusTone } from './BookingSheet';

export function BookingRow({ b, cur, onClick }) {
  return (
    <button type="button" onClick={onClick} className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left active:bg-slate-50">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-900">
            {b.start}–{b.end} · {b.client_name || t('booking.noName')}
          </div>
          <div className="mt-0.5 text-sm text-slate-600">
            {b.items && b.items.length ? b.items.map((i) => i.title).join(', ') : t('booking.custom')}
          </div>
        </div>
        <div className="text-right text-sm text-slate-700">{money(b.total_price, cur)}</div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge tone={statusTone[b.status] || 'slate'}>{t('status.' + b.status)}</Badge>
        <Badge>{t('source.' + b.source)}</Badge>
        {b.confirmed && <Badge tone="green">{t('booking.clientConfirmed')}</Badge>}
        {b.delay_minutes ? <Badge tone="amber">{t('booking.delay', { n: b.delay_minutes })}</Badge> : null}
      </div>
    </button>
  );
}

export default function Bookings({ ctx, today }) {
  const [scope, setScope] = useState('upcoming');
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    try {
      const r = await ctx.call('bookings_list', { scope });
      setList(scope === 'history' ? [...r.bookings].reverse() : r.bookings);
    } catch (e) {
      setErr(errorText(e));
      setList([]);
    }
  }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setList(null);
    load();
  }, [load]);

  const groups = [];
  (list || []).forEach((b) => {
    const g = groups[groups.length - 1];
    if (g && g.date === b.date) g.items.push(b);
    else groups.push({ date: b.date, items: [b] });
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 rounded-xl bg-slate-100 p-1 text-sm">
          {['upcoming', 'history'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`flex-1 rounded-lg py-1.5 ${scope === s ? 'bg-white font-medium shadow-sm' : 'text-slate-600'}`}
            >
              {t('bookings.scope.' + s)}
            </button>
          ))}
        </div>
        <Btn onClick={() => setAdding(true)}>{t('bookings.add')}</Btn>
      </div>

      {err && <Notice kind="error">{err}</Notice>}
      {list === null && <Spinner />}
      {list && list.length === 0 && !err && <p className="py-8 text-center text-slate-500">{t('bookings.empty.' + scope)}</p>}
      {groups.map((g) => (
        <div key={g.date} className="space-y-2">
          <div className="pt-1 text-sm font-semibold capitalize text-slate-500">
            {g.date === today ? t('common.today') + ', ' : ''}
            {fmtDate(g.date)}
          </div>
          {g.items.map((b) => (
            <BookingRow key={b.id} b={b} cur={ctx.business.currency} onClick={() => setOpen(b)} />
          ))}
        </div>
      ))}

      {open && <BookingSheet booking={open} ctx={ctx} onClose={() => setOpen(null)} onChanged={load} />}
      {adding && <ManualBooking ctx={ctx} date={today} onClose={() => setAdding(false)} onDone={load} />}
    </div>
  );
}
// конец файла Bookings.jsx
