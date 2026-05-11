# ✦ АКИ · Sky Hearts Tracker

## Быстрый старт

### 1. Заполни `.env`
Открой файл `.env` в корне проекта и вставь значения:

```
SUPABASE_URL=https://qhcwpzdrtlbwerdjuiyh.supabase.co
SUPABASE_SERVICE_KEY=  ← из Vercel: STORAGE_SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD=        ← придумай сам
PORT=3000
```

**Где взять SUPABASE_SERVICE_KEY:**
- Vercel → Storage → твой Supabase → вкладка «.env.local»  
- Или: Supabase Dashboard → Settings → API → `service_role` (secret)

### 2. Создай таблицы в Supabase
- Открой Supabase Dashboard → SQL Editor
- Вставь и запусти содержимое файла `supabase_schema.sql`

### 3. Установи зависимости и запусти
```bash
npm install
npm run dev      # разработка (с авто-перезапуском)
# или
npm start        # продакшн
```

Открой http://localhost:3000

## Структура
```
├── server/
│   ├── index.js          # Express сервер
│   ├── db.js             # Supabase клиент
│   └── routes/
│       ├── orders.js     # /api/orders
│       └── history.js    # /api/history
├── public/
│   └── index.html        # Фронтенд (SPA)
├── supabase_schema.sql   # SQL схема для Supabase
└── .env                  # ← ЗАПОЛНИ ЭТО
