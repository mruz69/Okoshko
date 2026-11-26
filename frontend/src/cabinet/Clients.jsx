import React, { useCallback, useEffect, useState } from 'react';
import { t, errorText, fmtDate, money, openUrl } from './lib';
import { Spinner, Notice, Btn, Sheet, Field, Input, TextArea, Toggle, Badge } from './ui';
import { statusTone } from './BookingSheet';

function ClientSheet({ ctx, id, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [tag, setTag] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const cur = ctx.business.currency;

  useEffect(() => {
    if (!id) {
      setForm({ name: '', phone: '', email: '', notes: '', tags: [], is_blocked: false });
      return;
    }
    ctx
      .call('client_get', { id })
      .then((r) => {
        setData(r);
        const c = r.client;
        setForm({ name: c.name || '', phone: c.phone || '', email: c.email || '', notes: c.notes || '', tags: c.tags || [], is_blocked: !!c.is_blocked });
      })
      .catch((e) => setErr(errorText(e)));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const addTag = () => {
    const v = tag.trim();
    if (v && !form.tags.includes(v)) set({ tags: [...form.tags, v] });
    setTag('');
  };
  const save = async () => {
    if (!form.name.trim()) return setErr(t('err.client_name_required'));
    setBusy(true);
    setErr('');
    try {
      await ctx.call('client_save', { id, ...form, name: form.name.trim() });
      await onChanged();
      onClose();
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const tg = data && data.identities.find((i) => i.channel === 'telegram');
  const contacts = [];
  if (tg && tg.username) contacts.push({ label: 'Telegram', url: `https://t.me/${tg.username.replace(/^@/, '')}` });
  else if (tg) contacts.push({ label: 'Telegram', url: `tg://user?id=${tg.external_id}` });
  if (form && form.phone) contacts.push({ label: t('clients.call'), url: `tel:${form.phone.replace(/[^\d+]/g, '')}` });

  return (
    <Sheet title={id ? t('clients.card') : t('clients.new')} onClose={onClose}>
      {!form ? (
        err ? <Notice kind="error">{err}</Notice> : <Spinner />
      ) : (
        <>
          <Field label={t('clients.name')}>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('clients.phone')}>
              <Input type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
            <Field label={t('clients.email')}>
              <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </Field>
          </div>
          <Field label={t('clients.tags')}>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {form.tags.map((x) => (
                <button key={x} type="button" className="rounded-full bg-blue-100 px-2.5 py-1 text-xs text-blue-800" onClick={() => set({ tags: form.tags.filter((y) => y !== x) })}>
                  {x} ×
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={tag} placeholder={t('clients.tagPlaceholder')} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
              <Btn variant="secondary" onClick={addTag}>
                +
              </Btn>
            </div>
          </Field>
          <Field label={t('clients.notes')}>
            <TextArea value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>
          <Toggle checked={form.is_blocked} onChange={(v) => set({ is_blocked: v })} label={t('clients.blocked')} />
          {err && <Notice kind="error">{err}</Notice>}
          {contacts.length > 0 && (
            <div className="flex gap-2">
              {contacts.map((c) => (
                <Btn key={c.label} variant="secondary" className="flex-1" onClick={() => openUrl(c.url)}>
                  {c.label}
                </Btn>
              ))}
            </div>
          )}
          <Btn className="w-full" busy={busy} onClick={save}>
            {t('common.save')}
          </Btn>

          {data && (
            <div className="space-y-2 pt-2">
              <div className="text-sm font-semibold text-slate-500">{t('clients.history')}</div>
              {data.bookings.length === 0 && <p className="text-sm text-slate-500">{t('clients.noVisits')}</p>}
              {[...data.bookings].reverse().map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5 text-sm">
                  <div>
                    <div className="font-medium text-slate-800">
                      {fmtDate(b.date, { day: 'numeric', month: 'short', year: 'numeric' })}, {b.start}
                    </div>
                    <div className="text-slate-500">{(b.items || []).map((i) => i.title).join(', ') || t('booking.custom')}</div>
                  </div>
                  <div className="text-right">
                    <div>{money(b.total_price, cur)}</div>
                    <Badge tone={statusTone[b.status] || 'slate'}>{t('status.' + b.status)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}

export default function Clients({ ctx }) {
  const [q, setQ] = useState('');
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(undefined); // undefined: закрыто, null: новый, id: карточка

  const load = useCallback(async () => {
    setErr('');
    try {
      const r = await ctx.call('clients_list', { q: q.trim() });
      setList(r);
    } catch (e) {
      setErr(errorText(e));
      setList({ clients: [], total: 0 });
    }
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const h = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(h);
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t('tab.clients')}</h1>
        <Btn onClick={() => setOpen(null)}>{t('clients.add')}</Btn>
      </div>
      <Input placeholder={t('clients.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      {err && <Notice kind="error">{err}</Notice>}
      {list === null && <Spinner />}
      {list && list.clients.length === 0 && !err && <p className="py-8 text-center text-slate-500">{t('clients.empty')}</p>}
      {list &&
        list.clients.map((c) => (
          <button key={c.id} type="button" onClick={() => setOpen(c.id)} className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left active:bg-slate-50">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">{c.name}</span>
              {c.is_blocked && <Badge tone="red">{t('clients.blockedShort')}</Badge>}
            </div>
            <div className="mt-0.5 text-sm text-slate-600">
              {[c.phone, t('clients.visits', { n: c.visits }), c.no_shows ? t('clients.noShows', { n: c.no_shows }) : null].filter(Boolean).join(' · ')}
            </div>
            {c.tags && c.tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {c.tags.map((x) => (
                  <Badge key={x} tone="blue">
                    {x}
                  </Badge>
                ))}
              </div>
            )}
          </button>
        ))}
      {open !== undefined && <ClientSheet ctx={ctx} id={open} onClose={() => setOpen(undefined)} onChanged={load} />}
    </div>
  );
}
// конец файла Clients.jsx
