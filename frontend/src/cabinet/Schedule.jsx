import React, { useCallback, useEffect, useState } from 'react';
import { t, errorText, fmtDate, addDays, isoDow } from './lib';
import { Spinner, Notice, Btn, Sheet, Field, Input, Select, Toggle, WeekEditor, weekFromTemplate, weekToApi } from './ui';
import BookingSheet, { ManualBooking } from './BookingSheet';
import { BookingRow } from './Bookings';

/* Шторка «График»: недельный шаблон и генерация дней вперёд */
function GenerateSheet({ ctx, today, onClose, onDone }) {
  const [week, setWeek] = useState(() => weekFromTemplate(ctx.business.settings && ctx.business.settings.week_template));
  const [days, setDays] = useState('14');
  const [from, setFrom] = useState(today);
  const [over, setOver] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      await ctx.call('schedule_generate', { from, days: Number(days), week: weekToApi(week), overwrite: over });
      await onDone();
      onClose();
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title={t('sched.gen.title')} onClose={onClose}>
      <WeekEditor value={week} onChange={setWeek} />
      <div className="grid grid-cols-2 gap-2">
        <Field label={t('sched.gen.from')}>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label={t('sched.gen.period')}>
          <Select value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="14">{t('sched.gen.14')}</option>
            <option value="30">{t('sched.gen.30')}</option>
            <option value="60">{t('sched.gen.60')}</option>
          </Select>
        </Field>
      </div>
      <Toggle checked={over} onChange={setOver} label={t('sched.gen.overwrite')} />
      {err && <Notice kind="error">{err}</Notice>}
      <Btn className="w-full" busy={busy} onClick={save}>
        {t('sched.gen.save')}
      </Btn>
    </Sheet>
  );
}

/* Шторка «Изменить день» */
function DaySheet({ ctx, date, wd, onClose, onDone }) {
  const b0 = wd && wd.breaks && wd.breaks[0];
  const [on, setOn] = useState(!!wd);
  const [st, setSt] = useState(wd ? wd.start : '10:00');
  const [en, setEn] = useState(wd ? wd.end : '19:00');
  const [br, setBr] = useState(!!b0);
  const [bs, setBs] = useState(b0 ? b0.start : '13:00');
  const [be, setBe] = useState(b0 ? b0.end : '14:00');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      await ctx.call('work_day_set', on ? { date, start: st, end: en, breaks: br ? [{ start: bs, end: be }] : [] } : { date, off: true });
      await onDone();
      onClose();
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title={fmtDate(date)} onClose={onClose}>
      <Toggle checked={on} onChange={setOn} label={t('sched.day.work')} />
      {on && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input type="time" step="900" value={st} onChange={(e) => setSt(e.target.value)} />
            <span className="text-slate-400">–</span>
            <Input type="time" step="900" value={en} onChange={(e) => setEn(e.target.value)} />
          </div>
          <Toggle checked={br} onChange={setBr} label={t('week.break')} />
          {br && (
            <div className="flex items-center gap-2">
              <Input type="time" step="900" value={bs} onChange={(e) => setBs(e.target.value)} />
              <span className="text-slate-400">–</span>
              <Input type="time" step="900" value={be} onChange={(e) => setBe(e.target.value)} />
            </div>
          )}
        </div>
      )}
      {err && <Notice kind="error">{err}</Notice>}
      <Btn className="w-full" busy={busy} onClick={save}>
        {t('common.save')}
      </Btn>
    </Sheet>
  );
}

/* Шторка «Закрыть время» */
function BlockSheet({ ctx, date, onClose, onDone }) {
  const [d, setD] = useState(date);
  const [allDay, setAllDay] = useState(false);
  const [until, setUntil] = useState('');
  const [st, setSt] = useState('14:00');
  const [en, setEn] = useState('15:00');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      await ctx.call('block_add', { date: d, end_date: allDay && until ? until : null, all_day: allDay, start: st, end: en, reason });
      await onDone();
      onClose();
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title={t('sched.block.title')} onClose={onClose}>
      <Field label={t('common.date')}>
        <Input type="date" value={d} onChange={(e) => setD(e.target.value)} />
      </Field>
      <Toggle checked={allDay} onChange={setAllDay} label={t('sched.block.allDay')} />
      {allDay ? (
        <Field label={t('sched.block.until')} hint={t('sched.block.untilHint')}>
          <Input type="date" min={d} value={until} onChange={(e) => setUntil(e.target.value)} />
        </Field>
      ) : (
        <div className="flex items-center gap-2">
          <Input type="time" step="300" value={st} onChange={(e) => setSt(e.target.value)} />
          <span className="text-slate-400">–</span>
          <Input type="time" step="300" value={en} onChange={(e) => setEn(e.target.value)} />
        </div>
      )}
      <Field label={t('sched.block.reason')}>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      {err && <Notice kind="error">{err}</Notice>}
      <Btn className="w-full" busy={busy} onClick={save}>
        {t('sched.block.save')}
      </Btn>
    </Sheet>
  );
}

function blockCoversDay(bl, day) {
  const last = bl.end === '00:00' && bl.end_date > bl.date ? addDays(bl.end_date, -1) : bl.end_date;
  return bl.date <= day && day <= last;
}

export default function Schedule({ ctx, today }) {
  const [anchor, setAnchor] = useState(today);
  const [sel, setSel] = useState(today);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [sheet, setSheet] = useState(null);
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    setErr('');
    try {
      setData(await ctx.call('schedule_get', { from: anchor, to: addDays(anchor, 13) }));
    } catch (e) {
      setErr(errorText(e));
      setData({ work_days: [], blocks: [], bookings: [] });
    }
  }, [anchor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  const reloadAll = async () => {
    await load();
    await ctx.reload();
  };

  const strip = Array.from({ length: 14 }, (_, i) => addDays(anchor, i));
  const wdOf = (d) => (data ? data.work_days.find((w) => w.date === d) : null);
  const activeOn = (d) => (data ? data.bookings.filter((b) => b.date === d && (b.status === 'pending' || b.status === 'confirmed')) : []);
  const wd = wdOf(sel);
  const dayBookings = data ? data.bookings.filter((b) => b.date === sel && b.status !== 'cancelled') : [];
  const dayBlocks = data ? data.blocks.filter((b) => blockCoversDay(b, sel)) : [];
  const items = [
    ...dayBookings.map((b) => ({ k: 'b', time: b.start, b })),
    ...dayBlocks.map((bl) => ({ k: 'x', time: bl.date === sel ? bl.start : '00:00', bl })),
  ].sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));

  const delBlock = async (id) => {
    try {
      await ctx.call('block_delete', { id });
      await load();
    } catch (e) {
      setErr(errorText(e));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t('tab.schedule')}</h1>
        <Btn variant="secondary" onClick={() => setSheet('gen')}>
          {t('sched.gen.open')}
        </Btn>
      </div>

      <div className="flex items-center gap-1">
        <button type="button" className="px-2 py-3 text-slate-500" onClick={() => setAnchor(addDays(anchor, -7))} aria-label="‹">
          ‹
        </button>
        <div className="flex flex-1 gap-1 overflow-x-auto pb-1">
          {strip.map((d) => {
            const has = activeOn(d).length > 0;
            const dow = isoDow(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSel(d)}
                className={`min-w-[3.1rem] rounded-xl px-1 py-2 text-center ${d === sel ? 'bg-blue-600 text-white' : wdOf(d) ? 'bg-slate-100 text-slate-900' : 'bg-white text-slate-400 ring-1 ring-slate-200'}`}
              >
                <div className="text-xs">{t('dow.short.' + dow)}</div>
                <div className="text-base font-semibold">{Number(d.slice(8))}</div>
                <div className={`mx-auto h-1.5 w-1.5 rounded-full ${has ? (d === sel ? 'bg-white' : 'bg-blue-600') : 'bg-transparent'}`} />
              </button>
            );
          })}
        </div>
        <button type="button" className="px-2 py-3 text-slate-500" onClick={() => setAnchor(addDays(anchor, 7))} aria-label="›">
          ›
        </button>
      </div>

      {err && <Notice kind="error">{err}</Notice>}
      {data === null ? (
        <Spinner />
      ) : (
        <>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
            <div>
              <div className="font-semibold capitalize text-slate-900">{fmtDate(sel)}</div>
              <div className="text-slate-600">
                {wd
                  ? `${wd.start}–${wd.end}` + (wd.breaks && wd.breaks.length ? ` · ${t('week.breakShort')} ${wd.breaks.map((b) => `${b.start}–${b.end}`).join(', ')}` : '')
                  : t('sched.dayOff')}
              </div>
            </div>
            <Btn variant="ghost" onClick={() => setSheet('day')}>
              {t('sched.day.edit')}
            </Btn>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Btn onClick={() => setSheet('add')}>{t('bookings.add')}</Btn>
            <Btn variant="secondary" onClick={() => setSheet('block')}>
              {t('sched.block.open')}
            </Btn>
          </div>

          {items.length === 0 && <p className="py-6 text-center text-slate-500">{t('sched.empty')}</p>}
          {items.map((it) =>
            it.k === 'b' ? (
              <BookingRow key={it.b.id} b={it.b} cur={ctx.business.currency} onClick={() => setOpen(it.b)} />
            ) : (
              <div key={it.bl.id} className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm">
                <div>
                  <div className="font-medium text-slate-800">
                    {it.bl.start === '00:00' && it.bl.end === '00:00'
                      ? t('sched.block.fullDay')
                      : it.bl.date === it.bl.end_date
                        ? `${it.bl.start}–${it.bl.end}`
                        : `${fmtDate(it.bl.date, { day: 'numeric', month: 'short' })} ${it.bl.start} → ${fmtDate(it.bl.end_date, { day: 'numeric', month: 'short' })} ${it.bl.end}`}
                  </div>
                  <div className="text-slate-500">{it.bl.reason || t('sched.block.default')}</div>
                </div>
                <Btn variant="danger" onClick={() => delBlock(it.bl.id)}>
                  {t('common.delete')}
                </Btn>
              </div>
            )
          )}
        </>
      )}

      {sheet === 'gen' && <GenerateSheet ctx={ctx} today={today} onClose={() => setSheet(null)} onDone={reloadAll} />}
      {sheet === 'day' && <DaySheet ctx={ctx} date={sel} wd={wd} onClose={() => setSheet(null)} onDone={load} />}
      {sheet === 'block' && <BlockSheet ctx={ctx} date={sel} onClose={() => setSheet(null)} onDone={load} />}
      {sheet === 'add' && <ManualBooking ctx={ctx} date={sel} onClose={() => setSheet(null)} onDone={load} />}
      {open && <BookingSheet booking={open} ctx={ctx} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}
// конец файла Schedule.jsx
