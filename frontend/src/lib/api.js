import WebApp from '@twa-dev/sdk';

const baseUrl = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/* Имя серверной функции в Supabase (у нас она называется dynamic-processor) */
const FUNCTION_NAME = 'dynamic-processor';

/* Единая точка связи с сервером. initData подписан Telegram, сервер проверяет подпись. */
export async function api(action, params = {}, initDataOverride) {
  try {
    const res = await fetch(baseUrl + '/functions/v1/' + FUNCTION_NAME, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: publishableKey },
      body: JSON.stringify({
        initData: initDataOverride !== undefined ? initDataOverride : WebApp.initData,
        action,
        params,
      }),
    });
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    return { status: res.status, ...(data || { ok: false, error: 'bad_response' }) };
  } catch (e) {
    return { status: 0, ok: false, error: 'network' };
  }
}
