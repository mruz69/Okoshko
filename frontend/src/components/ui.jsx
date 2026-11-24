import { t } from '../i18n/index.js';

export function errorText(code) {
  const text = t('errors.' + code);
  return text === 'errors.' + code ? t('errors.generic') : text;
}

export function Spinner({ text }) {
  return <div className="py-10 text-center text-gray-500">{text || t('nav.loading')}</div>;
}

export function Notice({ text, tone = 'info' }) {
  const cls =
    tone === 'error'
      ? 'bg-red-50 text-red-700 border-red-200'
      : tone === 'warn'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-blue-50 text-blue-800 border-blue-200';
  return <div className={'rounded-lg border p-3 text-sm ' + cls}>{text}</div>;
}

export function Button({ children, onClick, disabled, variant = 'primary', testId }) {
  const cls =
    variant === 'primary'
      ? 'bg-blue-600 text-white disabled:bg-gray-300'
      : 'bg-gray-100 text-gray-900 disabled:text-gray-400';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={'px-4 py-3 rounded-xl font-medium w-full ' + cls}
    >
      {children}
    </button>
  );
}

export function BackLink({ onBack }) {
  return (
    <button onClick={onBack} className="text-blue-600 text-sm mb-3" data-testid="back">
      {t('nav.back')}
    </button>
  );
}
