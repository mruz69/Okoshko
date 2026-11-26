import React from 'react';
import { Notice, Badge } from './ui';
import { tm } from './moreText';

const CARDS = [
  { id: 'email', pro: true, soon: true },
  { id: 'instagram', pro: true, soon: true, works: true },
  { id: 'vk', pro: true, soon: true },
  { id: 'calendar', pro: true, soon: true },
];

export default function Integrations() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">{tm('int.title')}</h1>
      <Notice>{tm('int.intro')}</Notice>
      <div className="space-y-3">
        {CARDS.map((c) => (
          <div key={c.id} className="space-y-2 rounded-xl border border-slate-200 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-900">{tm('int.' + c.id)}</span>
              {c.pro && <Badge tone="blue">Pro</Badge>}
              {c.soon && <Badge tone="amber">{tm('int.soon')}</Badge>}
              {c.works && <Badge tone="green">{tm('int.works')}</Badge>}
            </div>
            <p className="text-sm text-slate-600">{tm('int.' + c.id + '.d')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
// конец файла Integrations.jsx
