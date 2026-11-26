import React, { useState } from 'react';
import { t, errorText, money, dur } from './lib';
import { Notice, Btn, Sheet, Field, Input, TextArea, Select, Badge } from './ui';

const DURATIONS = [15, 20, 30, 45, 60, 75, 90, 105, 120, 150, 180, 240, 300, 360, 480];
const BUFFERS = [0, 5, 10, 15, 20, 30, 45, 60];

export function ServiceForm({ service, onSave, onClose, saveLabel }) {
  const s = service || {};
  const [title, setTitle] = useState(s.title || '');
  const [desc, setDesc] = useState(s.description || '');
  const [price, setPrice] = useState(s.price !== undefined && s.price !== null ? String(s.price) : '');
  const [d, setD] = useState(String(s.duration_minutes || 60));
  const [buf, setBuf] = useState(String(s.buffer_minutes || 0));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const durs = DURATIONS.includes(Number(d)) ? DURATIONS : [...DURATIONS, Number(d)].sort((a, b) => a - b);
  const bufs = BUFFERS.includes(Number(buf)) ? BUFFERS : [...BUFFERS, Number(buf)].sort((a, b) => a - b);

  const submit = async () => {
    if (!title.trim()) return setErr(t('err.title_required'));
    setBusy(true);
    setErr('');
    try {
      await onSave({ id: s.id, title: title.trim(), description: desc, price: price === '' ? 0 : Number(price), duration_minutes: Number(d), buffer_minutes: Number(buf) });
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <Field label={t('svc.title')}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label={t('svc.desc')}>
        <TextArea value={desc} onChange={(e) => setDesc(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t('svc.price')}>
          <Input type="number" inputMode="decimal" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label={t('svc.duration')}>
          <Select value={d} onChange={(e) => setD(e.target.value)}>
            {durs.map((m) => (
              <option key={m} value={m}>
                {dur(m)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={t('svc.buffer')} hint={t('svc.bufferHint')}>
        <Select value={buf} onChange={(e) => setBuf(e.target.value)}>
          {bufs.map((m) => (
            <option key={m} value={m}>
              {m === 0 ? t('svc.noBuffer') : dur(m)}
            </option>
          ))}
        </Select>
      </Field>
      {err && <Notice kind="error">{err}</Notice>}
      <div className="flex gap-2">
        {onClose && (
          <Btn variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Btn>
        )}
        <Btn className="flex-1" busy={busy} onClick={submit}>
          {saveLabel || t('common.save')}
        </Btn>
      </div>
    </div>
  );
}

export default function Services({ ctx }) {
  const [edit, setEdit] = useState(null); // null | {} (новая) | услуга
  const [err, setErr] = useState('');
  const cur = ctx.business.currency;
  const active = ctx.services.filter((s) => s.is_active);
  const archived = ctx.services.filter((s) => !s.is_active);

  const save = async (data) => {
    await ctx.call('service_save', data);
    await ctx.reload();
    setEdit(null);
  };
  const setActive = async (s, flag) => {
    setErr('');
    try {
      await ctx.call('service_active', { id: s.id, active: flag });
      await ctx.reload();
      setEdit(null);
    } catch (e) {
      setErr(errorText(e));
    }
  };

  const row = (s) => (
    <button key={s.id} type="button" onClick={() => setEdit(s)} className={`block w-full rounded-xl border border-slate-200 bg-white p-3 text-left active:bg-slate-50 ${s.is_active ? '' : 'opacity-60'}`}>
      <div className="flex justify-between gap-2">
        <span className="font-semibold text-slate-900">{s.title}</span>
        <span className="text-slate-700">{money(s.price, cur)}</span>
      </div>
      <div className="mt-0.5 text-sm text-slate-600">
        {dur(s.duration_minutes)}
        {s.buffer_minutes ? ` + ${dur(s.buffer_minutes)} ${t('svc.bufferShort')}` : ''}
      </div>
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t('tab.services')}</h1>
        <Btn onClick={() => setEdit({})}>{t('svc.add')}</Btn>
      </div>
      {err && <Notice kind="error">{err}</Notice>}
      {active.length === 0 && <p className="py-8 text-center text-slate-500">{t('svc.empty')}</p>}
      {active.map(row)}
      {archived.length > 0 && (
        <>
          <div className="pt-2 text-sm font-semibold text-slate-500">{t('svc.archived')}</div>
          {archived.map(row)}
        </>
      )}
      {edit && (
        <Sheet title={edit.id ? t('svc.edit') : t('svc.new')} onClose={() => setEdit(null)}>
          <ServiceForm service={edit.id ? edit : null} onSave={save} onClose={() => setEdit(null)} />
          {edit.id && (
            <div className="flex items-center gap-2 pt-1">
              <Badge tone={edit.is_active ? 'green' : 'slate'}>{edit.is_active ? t('svc.active') : t('svc.inArchive')}</Badge>
              <Btn variant={edit.is_active ? 'danger' : 'secondary'} className="ml-auto" onClick={() => setActive(edit, !edit.is_active)}>
                {edit.is_active ? t('svc.archive') : t('svc.restore')}
              </Btn>
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}
// конец файла Services.jsx
