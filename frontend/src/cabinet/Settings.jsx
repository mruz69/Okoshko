import React, { useEffect, useState } from 'react';
import { Spinner, Notice, Btn, Field, Input, Select, Badge } from './ui';
import { tm, errMsg } from './moreText';

const STEPS = [5, 10, 15, 20, 30, 60];
const LEADS = [0, 30, 60, 120, 180, 360, 720, 1440, 2880];
const HORIZONS = [7, 14, 30, 60, 90, 180, 365];
const CANCELS = [0, 1, 2, 3, 6, 12, 24, 48, 72];
const CURRENCIES = ['EUR', 'USD', 'BYN', 'RUB', 'PLN', 'UAH', 'KZT', 'GEL', 'AMD', 'UZS'];

/* Список вариантов; текущее значение добавляется, если его нет в списке */
function withCurrent(list, cur) {
  const s = new Set(list);
  if (cur !== undefined && cur !== null && cur !== '') s.add(cur);
  return [...s].sort((a, b) => (typeof a === 'number' ? a - b : String(a).localeCompare(String(b))));
}

function minLabel(m) {
  if (m === 0) return tm('set.none');
  if (m < 60) return tm('set.v.min', { n: m });
  if (m % 1440 === 0) return tm('set.v.d', { n: m / 1440 });
  if (m % 60 === 0) return tm('set.v.h', { n: m / 60 });
  return tm('set.v.hm', { h: Math.floor(m / 60), m: m % 60 });
}

function hoursLabel(h) {
  if (h === 0) return tm('set.none');
  const v = h % 24 === 0 ? tm('set.v.d', { n: h / 24 }) : tm('set.v.h', { n: h });
  return tm('set.cancelBefore', { v });
}

function toForm(d) {
  return {
    name: d.name,
    currency: d.currency,
    lead: d.min_lead_minutes,
    hor: d.horizon_days,
    step: d.grid_step_minutes,
    cancel: d.cancel_min_hours,
  };
}

export default function Settings({ ctx }) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () => {
    setState({ loading: true, error: null, data: null });
    ctx
      .call('settings_get')
      .then((d) => {
        setState({ loading: false, error: null, data: d });
        setForm(toForm(d));
      })
      .catch((e) => setState({ loading: false, error: errMsg(e), data: null }));
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.loading) return <Spinner />;
  if (state.error || !form) {
    return (
      <div className="space-y-3">
        <Notice kind="error">{state.error}</Notice>
        <Btn className="w-full" onClick={load}>
          {tm('more2.retry')}
        </Btn>
      </div>
    );
  }

  const data = state.data;
  const set = (patch) => {
    setMsg(null);
    setForm({ ...form, ...patch });
  };
  const num = (e) => Number(e.target.value);
  const cancelLocked = !data.cancel_policy_allowed && form.cancel === 0;

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const d = await ctx.call('settings_save', {
        name: form.name,
        currency: form.currency,
        min_lead_minutes: form.lead,
        horizon_days: form.hor,
        grid_step_minutes: form.step,
        cancel_min_hours: form.cancel,
      });
      setState({ loading: false, error: null, data: d });
      setForm(toForm(d));
      setMsg({ kind: 'ok', text: tm('set.saved') });
      ctx.reload();
    } catch (e) {
      setMsg({ kind: 'error', text: errMsg(e) });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">{tm('set.title')}</h1>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500">{tm('set.profile')}</h2>
        <Field label={tm('set.name')}>
          <Input value={form.name} maxLength={80} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label={tm('set.currency')}>
          <Select value={form.currency} onChange={(e) => set({ currency: e.target.value })}>
            {withCurrent(CURRENCIES, form.currency).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tm('set.timezone')} hint={tm('set.timezoneHint')}>
          <Input value={data.timezone} disabled readOnly />
        </Field>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500">{tm('set.rules')}</h2>
        <Field label={tm('set.lead')} hint={tm('set.leadHint')}>
          <Select value={form.lead} onChange={(e) => set({ lead: num(e) })}>
            {withCurrent(LEADS, form.lead).map((v) => (
              <option key={v} value={v}>
                {minLabel(v)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tm('set.horizon')}>
          <Select value={form.hor} onChange={(e) => set({ hor: num(e) })}>
            {withCurrent(HORIZONS, form.hor).map((v) => (
              <option key={v} value={v}>
                {tm('set.v.d', { n: v })}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tm('set.step')} hint={tm('set.stepHint')}>
          <Select value={form.step} onChange={(e) => set({ step: num(e) })}>
            {withCurrent(STEPS, form.step).map((v) => (
              <option key={v} value={v}>
                {tm('set.v.min', { n: v })}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={
            <>
              {tm('set.cancel')} {!data.cancel_policy_allowed && <Badge tone="blue">Pro</Badge>}
            </>
          }
          hint={cancelLocked ? tm('set.cancelLocked') : tm('set.cancelHint')}
        >
          <Select value={form.cancel} disabled={cancelLocked} onChange={(e) => set({ cancel: num(e) })}>
            {withCurrent(CANCELS, form.cancel).map((v) => (
              <option key={v} value={v}>
                {hoursLabel(v)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <Btn className="w-full" busy={busy} disabled={!form.name.trim()} onClick={save}>
        {tm('set.save')}
      </Btn>
    </div>
  );
}
// конец файла Settings.jsx
