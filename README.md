# Slotly

Онлайн-запись для малого бизнеса в Telegram: Mini App + бот.
Клиент выбирает услуги и время, владелец ведёт расписание и клиентов, бот напоминает о визите.

Полное ТЗ: `Okoshko_TZ_v2.md`. Журнал работ: `PROGRESS.md`.

## Структура

```
frontend/             Mini App (React + Vite + Tailwind)
supabase/migrations/  SQL-миграции (появятся на этапе 2)
supabase/functions/   Edge Functions (появятся на этапе 3)
```

## Деплой фронтенда (Vercel)

- Root Directory: `frontend`
- Framework Preset: Vite (определяется автоматически)
- Переменные окружения: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Каждый коммит в ветку `main` запускает автодеплой.

## Секреты

В браузер попадают только `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
`BOT_TOKEN` и `service_role`/`secret` ключи Supabase хранятся только в секретах Supabase и в репозиторий не попадают.
