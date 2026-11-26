import React from 'react';
import { t } from './lib';

export function Spinner() {
  return (
    <div className="flex justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
    </div>
  );
}

export function Notice({ kind = 'info', children }) {
  const styles = {
    info: 'bg-blue-50 text-blue-900',
    error: 'bg-red-50 text-red-800',
    ok: 'bg-green-50 text-green-800',
    warn: 'bg-amber-50 text-amber-900',
  };
  return <div className={`rounded-xl p-3 text-sm ${styles[kind]}`}>{children}</div>;
}

export function Btn({ variant = 'primary', className = '', busy, disabled, children, ...rest }) {
  const styles = {
    primary: 'bg-blue-600 text-white active:bg-blue-700',
    secondary: 'bg-slate-100 text-slate-800 active:bg-slate-200',
    danger: 'bg-red-50 text-red-700 active:bg-red-100',
    ghost: 'text-blue-600 active:bg-blue-50',
  };
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={`rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    >
      {busy ? '…' : children}
    </button>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const inputCls = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-blue-500';
export function Input(props) {
  return <input {...props} className={`${inputCls} ${props.className || ''}`} />;
}
export function TextArea(props) {
  return <textarea rows={3} {...props} className={`${inputCls} ${props.className || ''}`} />;
}
export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${inputCls} ${props.className || ''}`}>
      {children}
    </select>
  );
}

export function Badge({ tone = 'slate', children }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-green-100 text-green-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-800',
  };
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 text-sm text-slate-800">
      <input type="checkbox" className="h-5 w-5 accent-blue-600" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/* Нижняя шторка поверх экрана */
export function Sheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full space-y-3 overflow-y-auto rounded-t-2xl bg-white p-4 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="px-2 text-2xl leading-none text-slate-400" aria-label={t('common.close')}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ text, yes, onYes, onNo, busy }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5">
        <p className="text-slate-900">{text}</p>
        <div className="flex gap-2">
          <Btn variant="secondary" className="flex-1" onClick={onNo}>
            {t('common.no')}
          </Btn>
          <Btn variant="danger" className="flex-1" busy={busy} onClick={onYes}>
            {yes || t('common.yes')}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ---------- недельный шаблон графика (используется в онбординге и в расписании) ---------- */
const DAYS = [1, 2, 3, 4, 5, 6, 7];

export function defaultWeek() {
  const w = {};
  DAYS.forEach((d) => {
    w[d] = { on: d <= 5, start: '10:00', end: '19:00', br: true, bs: '13:00', be: '14:00' };
  });
  return w;
}

export function weekFromTemplate(tpl) {
  if (!tpl || typeof tpl !== 'object') return defaultWeek();
  const w = {};
  DAYS.forEach((d) => {
    const x = tpl[String(d)];
    if (x && typeof x === 'object') {
      const b = Array.isArray(x.breaks) && x.breaks[0] ? x.breaks[0] : null;
      w[d] = { on: true, start: x.start || '10:00', end: x.end || '19:00', br: !!b, bs: b ? b.start : '13:00', be: b ? b.end : '14:00' };
    } else {
      w[d] = { on: false, start: '10:00', end: '19:00', br: false, bs: '13:00', be: '14:00' };
    }
  });
  return w;
}

export function weekToApi(w) {
  const out = {};
  DAYS.forEach((d) => {
    const x = w[d];
    out[String(d)] = x.on ? { start: x.start, end: x.end, breaks: x.br ? [{ start: x.bs, end: x.be }] : [] } : null;
  });
  return out;
}

export function WeekEditor({ value, onChange }) {
  const set = (d, patch) => onChange({ ...value, [d]: { ...value[d], ...patch } });
  return (
    <div className="space-y-2">
      {DAYS.map((d) => {
        const x = value[d];
        return (
          <div key={d} className="rounded-xl border border-slate-200 p-3">
            <Toggle checked={x.on} onChange={(v) => set(d, { on: v })} label={t('dow.' + d)} />
            {x.on && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Input type="time" step="900" value={x.start} onChange={(e) => set(d, { start: e.target.value })} />
                  <span className="text-slate-400">–</span>
                  <Input type="time" step="900" value={x.end} onChange={(e) => set(d, { end: e.target.value })} />
                </div>
                <Toggle checked={x.br} onChange={(v) => set(d, { br: v })} label={t('week.break')} />
                {x.br && (
                  <div className="flex items-center gap-2">
                    <Input type="time" step="900" value={x.bs} onChange={(e) => set(d, { bs: e.target.value })} />
                    <span className="text-slate-400">–</span>
                    <Input type="time" step="900" value={x.be} onChange={(e) => set(d, { be: e.target.value })} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
// конец файла ui.jsx
