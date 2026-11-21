import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { t } from './i18n/index.js';
import { isSupabaseConfigured } from './lib/supabase.js';

// Внутри Telegram initData непустая; в обычном браузере она пустая
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

export default function App() {
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900 p-6">
      <h1 className="text-3xl font-bold">{t('app.name')}</h1>
      <p className="mt-2 text-gray-600">{t('app.tagline')}</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-2">{t('status.title')}</h2>
        <Row label={t('status.telegram')} ok={insideTelegram} />
        <Row label={t('status.supabase')} ok={isSupabaseConfigured} />
      </section>
    </main>
  );
}
