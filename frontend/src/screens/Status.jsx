import { useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { t } from '../i18n/index.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { api } from '../lib/api.js';

const insideTelegram = Boolean(WebApp.initData);

function Row({ label, ok }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-200">
      <span>{label}</span>
      <span className={ok ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
        {ok ? t('status.yes') : t('status.no')}
      </span>
    </div>
  );
}

function Check({ button, onClick, result, hint }) {
  return (
    <div className="py-3 border-b border-gray-200">
      <button onClick={onClick} className="px-4 py-2 rounded bg-blue-600 text-white font-medium">
        {button}
      </button>
      {hint ? <p className="mt-2 text-sm text-gray-500">{hint}</p> : null}
      {result ? <p className="mt-2 font-medium">{result}</p> : null}
    </div>
  );
}

export default function Status() {
  const [forged, setForged] = useState('');
  const [real, setReal] = useState('');

  async function testForged() {
    setForged(t('server.waiting'));
    const r = await api('whoami', {}, 'forged=1&hash=abc');
    if (r.status === 401 && r.error === 'unauthorized') {
      setForged('✅ ' + t('server.forgedOk'));
    } else {
      setForged('❌ ' + t('server.forgedBad') + ': ' + r.status + ' ' + (r.error || ''));
    }
  }

  async function testReal() {
    setReal(t('server.waiting'));
    const r = await api('whoami');
    if (r.ok) {
      setReal('✅ ' + t('server.realOk') + ' ' + r.data.user.id);
    } else {
      setReal('❌ ' + t('server.realBad') + ': ' + r.status + ' ' + (r.error || ''));
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">{t('app.name')}</h1>
      <p className="mt-2 text-gray-600">{t('app.tagline')}</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-2">{t('status.title')}</h2>
        <Row label={t('status.telegram')} ok={insideTelegram} />
        <Row label={t('status.supabase')} ok={isSupabaseConfigured} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-2">{t('server.title')}</h2>
        <Check button={t('server.forgedButton')} onClick={testForged} result={forged} />
        <Check
          button={t('server.realButton')}
          onClick={testReal}
          result={real}
          hint={insideTelegram ? '' : t('server.realHint')}
        />
      </section>
    </div>
  );
}
