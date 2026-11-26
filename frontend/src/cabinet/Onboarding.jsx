import React, { useState } from 'react';
import { t, errorText, ownerApi, slugify, todayIn, deviceTimezone, money, dur } from './lib';
import { Notice, Btn, Field, Input, Select, WeekEditor, defaultWeek, weekToApi } from './ui';
import { ServiceForm } from './Services';
import Share from './Share';

const TZS = ['Europe/Minsk', 'Europe/Moscow', 'Europe/Kiev', 'Europe/Vilnius', 'Europe/Riga', 'Europe/Tallinn', 'Europe/Warsaw', 'Europe/Berlin', 'Europe/London', 'Asia/Tbilisi', 'Asia/Yerevan', 'Asia/Almaty', 'Asia/Tashkent', 'Asia/Dubai'];
const CURS = ['BYN', 'RUB', 'UAH', 'KZT', 'PLN', 'EUR', 'USD', 'GEL', 'UZS'];
const CUR_BY_TZ = { 'Europe/Minsk': 'BYN', 'Europe/Moscow': 'RUB', 'Europe/Kiev': 'UAH', 'Europe/Warsaw': 'PLN', 'Asia/Almaty': 'KZT', 'Asia/Tbilisi': 'GEL', 'Asia/Tashkent': 'UZS' };

const presetKey = (p) => p.code ?? p.vertical ?? p.key ?? p.slug ?? p.id;
const presetTitle = (p) => p.title ?? p.name ?? p.label ?? String(presetKey(p));
const tzLabel = (v) => {
  const s = t('tz.' + v);
  return s.startsWith('tz.') ? v : s;
};

function sampleServices(p) {
  const raw = p && p.sample_services;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => ({
      title: s.title ?? s.name ?? '',
      price: s.price ?? s.price_from ?? 0,
      duration_minutes: s.duration_minutes ?? s.duration ?? 60,
      buffer_minutes: s.buffer_minutes ?? 0,
    }))
    .filter((s) => s.title);
}

function Steps({ n }) {
  return (
    <div className="flex gap-1.5 pb-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= n ? 'bg-blue-600' : 'bg-slate-200'}`} />
      ))}
    </div>
  );
}

export default function Onboarding({ presets, onDone }) {
  const [step, setStep] = useState(1);
  const [preset, setPreset] = useState(null);
  const [name, setName] = useState('');
  const initTz = TZS.includes(deviceTimezone()) ? deviceTimezone() : 'Europe/Minsk';
  const [tz, setTz] = useState(initTz);
  const [cur, setCur] = useState(CUR_BY_TZ[initTz] || 'EUR');
  const [biz, setBiz] = useState(null);
  const [added, setAdded] = useState([]);
  const [prefill, setPrefill] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [week, setWeek] = useState(defaultWeek);
  const [days, setDays] = useState('14');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const guard = async (fn) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  /* шаг 1: тип бизнеса */
  if (step === 1) {
    return (
      <div className="space-y-3">
        <Steps n={1} />
        <h1 className="text-xl font-semibold">{t('onb.welcome')}</h1>
        <p className="text-slate-600">{t('onb.pickType')}</p>
        {(presets || []).map((p) => {
          const stay = p.booking_mode === 'stay';
          return (
            <button
              key={String(presetKey(p))}
              type="button"
              disabled={stay}
              onClick={() => {
                setPreset(p);
                setStep(2);
              }}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left disabled:opacity-50"
            >
              <span className="font-medium text-slate-900">{presetTitle(p)}</span>
              {stay && <span className="text-xs text-slate-500">{t('onb.soon')}</span>}
            </button>
          );
        })}
        {(!presets || presets.length === 0) && <Notice kind="warn">{t('onb.noPresets')}</Notice>}
      </div>
    );
  }

  /* шаг 2: название, часовой пояс, валюта; здесь создаётся бизнес */
  if (step === 2) {
    const create = () =>
      guard(async () => {
        if (!name.trim()) throw new Error('name_required');
        const r = await ownerApi('create_business', { name: name.trim(), preset_key: presetKey(preset), timezone: tz, currency: cur, slug: slugify(name) });
        setBiz(r);
        setStep(3);
      });
    const tzs = TZS.includes(tz) ? TZS : [tz, ...TZS];
    return (
      <div className="space-y-3">
        <Steps n={2} />
        <h1 className="text-xl font-semibold">{presetTitle(preset)}</h1>
        <Field label={t('onb.bizName')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('onb.bizNamePh')} />
        </Field>
        <Field label={t('onb.timezone')}>
          <Select
            value={tz}
            onChange={(e) => {
              setTz(e.target.value);
              if (CUR_BY_TZ[e.target.value]) setCur(CUR_BY_TZ[e.target.value]);
            }}
          >
            {tzs.map((z) => (
              <option key={z} value={z}>
                {tzLabel(z)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('onb.currency')}>
          <Select value={cur} onChange={(e) => setCur(e.target.value)}>
            {CURS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        {err && <Notice kind="error">{err}</Notice>}
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={() => setStep(1)}>
            {t('common.back')}
          </Btn>
          <Btn className="flex-1" busy={busy} onClick={create}>
            {t('common.next')}
          </Btn>
        </div>
      </div>
    );
  }

  /* шаг 3: первая услуга */
  if (step === 3) {
    const samples = sampleServices(preset);
    const save = async (data) => {
      const r = await ownerApi('service_save', { business_id: biz.business_id, ...data });
      setAdded((a) => [...a, r]);
      setPrefill(null);
      setFormKey((k) => k + 1);
    };
    return (
      <div className="space-y-3">
        <Steps n={3} />
        <h1 className="text-xl font-semibold">{t('onb.service.title')}</h1>
        {samples.length > 0 && (
          <div>
            <p className="mb-1.5 text-sm text-slate-600">{t('onb.service.samples')}</p>
            <div className="flex flex-wrap gap-2">
              {samples.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-sm"
                  onClick={() => {
                    setPrefill(s);
                    setFormKey((k) => k + 1);
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        )}
        {added.map((s) => (
          <div key={s.id} className="rounded-xl bg-green-50 p-2.5 text-sm text-green-900">
            ✓ {s.title} · {dur(s.duration_minutes)} · {money(s.price, cur)}
          </div>
        ))}
        <ServiceForm key={formKey} service={prefill} onSave={save} saveLabel={added.length ? t('onb.service.addMore') : t('onb.service.add')} />
        <Btn className="w-full" disabled={added.length === 0} onClick={() => setStep(4)}>
          {t('common.next')}
        </Btn>
      </div>
    );
  }

  /* шаг 4: график */
  if (step === 4) {
    const gen = () =>
      guard(async () => {
        await ownerApi('schedule_generate', { business_id: biz.business_id, from: todayIn(tz), days: Number(days), week: weekToApi(week), overwrite: true });
        setStep(5);
      });
    return (
      <div className="space-y-3">
        <Steps n={4} />
        <h1 className="text-xl font-semibold">{t('onb.schedule.title')}</h1>
        <p className="text-sm text-slate-600">{t('onb.schedule.hint')}</p>
        <WeekEditor value={week} onChange={setWeek} />
        <Field label={t('sched.gen.period')}>
          <Select value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="14">{t('sched.gen.14')}</option>
            <option value="30">{t('sched.gen.30')}</option>
          </Select>
        </Field>
        {err && <Notice kind="error">{err}</Notice>}
        <Btn className="w-full" busy={busy} onClick={gen}>
          {t('common.next')}
        </Btn>
      </div>
    );
  }

  /* шаг 5: ссылка и QR */
  return (
    <div className="space-y-3">
      <Steps n={5} />
      <h1 className="text-xl font-semibold">{t('onb.done.title')}</h1>
      <p className="text-slate-600">{t('onb.done.text')}</p>
      <Share slug={biz.slug} name={name} />
      <Btn className="w-full" onClick={() => onDone(biz.business_id)}>
        {t('onb.done.open')}
      </Btn>
    </div>
  );
}
// конец файла Onboarding.jsx
