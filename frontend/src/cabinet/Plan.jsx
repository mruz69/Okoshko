import React, { useEffect, useState } from 'react';
import { Spinner, Notice, Btn, Badge } from './ui';
import { tm, errMsg } from './moreText';

/* soon: функция в тарифе есть, но ещё не реализована. tier: с какого тарифа доступна */
const FEATURES = [
  { key: 'core_booking', tier: 'Free' },
  { key: 'manual_booking', tier: 'Free' },
  { key: 'reminders_basic', tier: 'Free' },
  { key: 'booking_rules', tier: 'Free' },
  { key: 'buffers', tier: 'Free' },
  { key: 'share_link', tier: 'Free' },
  { key: 'instagram_link', tier: 'Free' },
  { key: 'crm_basic', tier: 'Free' },
  { key: 'no_show', tier: 'Free' },
  { key: 'reminders_templates', tier: 'Free' },
  { key: 'templates_unlimited', tier: 'Pro' },
  { key: 'cancel_policy', tier: 'Pro' },
  { key: 'manual_approval', tier: 'Pro', soon: true },
  { key: 'ics_export', tier: 'Pro', soon: true },
  { key: 'channel_email', tier: 'Pro', soon: true },
  { key: 'channel_instagram', tier: 'Pro', soon: true },
  { key: 'channel_vk', tier: 'Pro', soon: true },
  { key: 'custom_fields', tier: 'Pro', soon: true },
  { key: 'group_sessions', tier: 'Pro', soon: true },
  { key: 'prepayment', tier: 'Pro', soon: true },
  { key: 'multi_staff', tier: 'Business', soon: true },
];

function limitLabel(key) {
  const k = 'plan.lim.' + key;
  const s = tm(k);
  return s === k ? key : s;
}

function LimitRow({ name, limit, used }) {
  const unlimited = limit === null || limit === undefined || Number(limit) < 0;
  const hasUsage = used !== undefined && used !== null;
  const pct = !unlimited && hasUsage && Number(limit) > 0 ? Math.min(100, Math.round((Number(used) / Number(limit)) * 100)) : 0;
  const right = unlimited ? tm('plan.unlimited') : hasUsage ? `${used} / ${limit}` : tm('plan.upTo', { n: limit });
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-800">{name}</span>
        <span className="text-slate-600">{right}</span>
      </div>
      {!unlimited && hasUsage && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full ${pct >= 100 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: pct + '%' }} />
        </div>
      )}
    </div>
  );
}

export default function Plan({ ctx }) {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  const load = () => {
    setState({ loading: true, error: null, data: null });
    ctx
      .call('plan_info')
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

  const d = state.data;
  const features = Array.isArray(d.features) ? d.features : [];
  const limits = d.limits || {};
  const usage = d.usage || {};
  const until = d.plan_expires_at ? new Date(d.plan_expires_at).toLocaleDateString('ru') : null;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">{tm('plan.title')}</h1>

      <div className="space-y-1 rounded-xl bg-slate-50 p-3">
        <div className="text-sm text-slate-600">{tm('plan.current')}</div>
        <div>
          <Badge tone="blue">{String(d.plan || 'free').toUpperCase()}</Badge>
        </div>
        {until && <div className="text-xs text-slate-500">{tm('plan.until', { date: until })}</div>}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500">{tm('plan.limits')}</h2>
        {Object.keys(limits).map((k) => (
          <LimitRow key={k} name={limitLabel(k)} limit={limits[k]} used={usage[k]} />
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-500">{tm('plan.features')}</h2>
        {FEATURES.map((f) => {
          const on = features.includes(f.key);
          return (
            <div key={f.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
              <span className="text-sm text-slate-800">{tm('feat.' + f.key)}</span>
              <span className="shrink-0 text-right">
                {on && !f.soon && <Badge tone="green">{tm('plan.included')}</Badge>}
                {on && f.soon && <Badge tone="amber">{tm('plan.soon')}</Badge>}
                {!on && (
                  <span className="space-x-1">
                    <Badge tone="blue">{f.tier}</Badge>
                    {f.soon && <span className="text-xs text-slate-400">{tm('plan.soonSmall')}</span>}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <Notice>{tm('plan.pay')}</Notice>
    </div>
  );
}
// конец файла Plan.jsx
