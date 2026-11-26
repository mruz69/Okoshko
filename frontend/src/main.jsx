import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from '@twa-dev/sdk';
import App from './App.jsx';
import './index.css';

/* Кабинет открывается ссылкой t.me/<бот>/app?startapp=cabinet (или адресом сайта с ?cabinet=1).
   Все остальные ссылки открывают запись для клиента, как и раньше. */
const Cabinet = React.lazy(() => import('./cabinet/Cabinet.jsx'));

function isCabinet() {
  try {
    if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.start_param === 'cabinet') return true;
  } catch (e) {
    /* вне Telegram SDK может быть недоступен */
  }
  return new URLSearchParams(window.location.search).has('cabinet');
}

function Root() {
  if (isCabinet()) {
    return (
      <Suspense fallback={<div className="p-6 text-center text-slate-500">…</div>}>
        <Cabinet />
      </Suspense>
    );
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
// конец файла main.jsx
