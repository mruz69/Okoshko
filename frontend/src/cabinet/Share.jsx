import React, { useState } from 'react';
import { t, clientLink, copyText, openUrl } from './lib';
import { Btn } from './ui';

/* Ссылка для клиентов, копирование, отправка и QR-код (картинку рисует сервис api.qrserver.com) */
export default function Share({ slug, name }) {
  const link = clientLink(slug);
  const [copied, setCopied] = useState(false);
  const [noQr, setNoQr] = useState(false);
  const copy = async () => {
    setCopied(await copyText(link));
    setTimeout(() => setCopied(false), 2000);
  };
  const share = () => openUrl(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(t('share.text', { name }))}`);
  return (
    <div className="space-y-3">
      <div className="break-all rounded-xl bg-slate-50 p-3 text-sm text-slate-800 select-all">{link}</div>
      <div className="grid grid-cols-2 gap-2">
        <Btn variant="secondary" onClick={copy}>
          {copied ? t('share.copied') : t('share.copy')}
        </Btn>
        <Btn onClick={share}>{t('share.send')}</Btn>
      </div>
      {!noQr && (
        <div className="flex flex-col items-center gap-1">
          <img
            alt="QR"
            width="220"
            height="220"
            className="rounded-xl border border-slate-200 bg-white"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=440x440&margin=8&data=${encodeURIComponent(link)}`}
            onError={() => setNoQr(true)}
          />
          <span className="text-xs text-slate-500">{t('share.qrHint')}</span>
        </div>
      )}
    </div>
  );
}
// конец файла Share.jsx
