import React, { useEffect, useState } from 'react';
import { Spinner, Notice, Btn, Badge, TextArea, Sheet, ConfirmDialog } from './ui';
import { tm, errMsg } from './moreText';

const ALLOWED = ['client_name', 'business_name', 'date', 'time', 'services', 'total_price', 'delay'];
const CHIPS = ['client_name', 'date', 'time', 'services', 'total_price', 'business_name'];
const REMINDERS = ['reminder_24h', 'reminder_3h'];
const MAX = 1000;

function sampleVars(name, currency) {
  return {
    client_name: 'Анна',
    business_name: name,
    date: '15.12.2026',
    time: '14:30',
    services: 'Маникюр, Покрытие гель-лак',
    total_price: '45 ' + currency,
    delay: '15',
  };
}

function renderText(body, vars) {
  return body.replace(/\{(\w+)\}/g, (_m, k) => (vars[k] !== undefined ? vars[k] : ''));
}

function unknownVars(body) {
  const bad = [];
  body.replace(/\{(\w+)\}/g, (m, k) => {
    if (!ALLOWED.includes(k) && !bad.includes(k)) bad.push(k);
    return m;
  });
  return bad;
}

function Editor({ item, data, ctx, onClose, onChanged }) {
  const [text, setText] = useState(item.body);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [askReset, setAskReset] = useState(false);

  const bad = unknownVars(text);
  const locked = !data.unlimited && !item.is_custom && data.items.some((x) => x.is_custom && x.kind !== item.kind);
  const tooLong = text.length > MAX;
  const canSave = !locked && !busy && text.trim() !== '' && bad.length === 0 && !tooLong && text !== item.body;
  const vars = sampleVars(ctx.business.name, ctx.business.currency);

  const addVar = (k) => {
    setMsg(null);
    setText((s) => s + (s && !/\s$/.test(s) ? ' ' : '') + '{' + k + '}');
  };

  const run = async (action, params, close) => {
    setBusy(true);
    setMsg(null);
    try {
      const d = await ctx.call(action, params);
      onChanged(d);
      if (close) onClose();
      else setText(d.items.find((x) => x.kind === item.kind).body);
    } catch (e) {
      setMsg({ kind: 'error', text: errMsg(e) });
    }
    setBusy(false);
    setAskReset(false);
  };

  return (
    <Sheet title={tm('tpl.kind.' + item.kind)} onClose={onClose}>
      <p className="text-sm text-slate-500">{tm('tpl.when.' + item.kind)}</p>
      {locked && (
        <Notice kind="warn">
          <Badge tone="blue">Pro</Badge> {tm('tpl.limitFree')}
        </Notice>
      )}
      <TextArea
        rows={8}
        value={text}
        disabled={locked}
        onChange={(e) => {
          setMsg(null);
          setText(e.target.value);
        }}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{tm('tpl.addVar')}</span>
        <span className={tooLong ? 'text-red-600' : ''}>
          {text.length} / {MAX}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((k) => (
          <button key={k} type="button" disabled={locked} onClick={() => addVar(k)} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-800 active:bg-slate-200 disabled:opacity-50">
            {tm('tpl.var.' + k)}
          </button>
        ))}
      </div>
      {bad.length > 0 && (
        <Notice kind="error">
          {tm('tpl.unknown', { vars: bad.map((k) => '{' + k + '}').join(', ') })}
        </Notice>
      )}
      <div className="space-y-1">
        <div className="text-sm font-medium text-slate-700">{tm('tpl.preview')}</div>
        <div className="whitespace-pre-wrap rounded-xl bg-slate-100 p-3 text-sm text-slate-900">{renderText(text, vars) || '…'}</div>
        {REMINDERS.includes(item.kind) && <div className="text-xs text-slate-500">{tm('tpl.buttonsNote')}</div>}
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <Btn className="w-full" busy={busy} disabled={!canSave} onClick={() => run('template_save', { kind: item.kind, body: text }, true)}>
        {tm('tpl.save')}
      </Btn>
      {item.is_custom && (
        <Btn variant="secondary" className="w-full" disabled={busy} onClick={() => setAskReset(true)}>
          {tm('tpl.reset')}
        </Btn>
      )}
      {askReset && (
        <ConfirmDialog
          text={tm('tpl.resetAsk')}
          yes={tm('tpl.resetYes')}
          busy={busy}
          onNo={() => setAskReset(false)}
          onYes={() => run('template_reset', { kind: item.kind }, true)}
        />
      )}
    </Sheet>
  );
}

export default function Templates({ ctx }) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [open, setOpen] = useState(null);

  const load = () => {
    setState({ loading: true, error: null, data: null });
    ctx
      .call('templates_list')
      .then((d) => setState({ loading: false, error: null, data: d }))
      .catch((e) => setState({ loading: false, error: errMsg(e), data: null }));
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.loading) return <Spinner />;
  if (state.error) {
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
  const item = open ? data.items.find((x) => x.kind === open) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">{tm('tpl.title')}</h1>
      <Notice>{data.unlimited ? tm('tpl.introPro') : tm('tpl.introFree')}</Notice>
      <div className="space-y-2">
        {data.items.map((x) => (
          <button key={x.kind} type="button" onClick={() => setOpen(x.kind)} className="w-full space-y-1 rounded-xl border border-slate-200 p-3 text-left active:bg-slate-50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-900">{tm('tpl.kind.' + x.kind)}</span>
              {x.is_custom ? <Badge tone="green">{tm('tpl.custom')}</Badge> : <Badge>{tm('tpl.standard')}</Badge>}
            </div>
            <div className="line-clamp-2 whitespace-pre-line text-xs text-slate-500">{x.body}</div>
          </button>
        ))}
      </div>
      {item && (
        <Editor
          key={item.kind}
          item={item}
          data={data}
          ctx={ctx}
          onClose={() => setOpen(null)}
          onChanged={(d) => setState({ loading: false, error: null, data: d })}
        />
      )}
    </div>
  );
}
// конец файла Templates.jsx
