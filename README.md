# Meloan — P2P Платформа частного кредитования

Meloan — это веб-приложение для оформления и учёта частных займов между физическими лицами. Кредитор создаёт заём и отправляет ссылку заёмщику, заёмщик подписывает условия через браузер без регистрации. Все расчёты, платёжный график и история платежей хранятся в облаке.

---

## Содержание

- [Основные возможности](#основные-возможности)
- [Технологический стек](#технологический-стек)
- [Архитектура](#архитектура)
- [Структура проекта](#структура-проекта)
- [База данных](#база-данных)
- [Аутентификация](#аутентификация)
- [API](#api)
- [Монетизация](#монетизация)
- [Push-уведомления](#push-уведомления)
- [PWA](#pwa)
- [Переменные окружения](#переменные-окружения)
- [Запуск локально](#запуск-локально)

---

## Основные возможности

### Для кредитора
- Регистрация через Telegram или Google / GitHub / Apple / email
- Заполнение профиля (ФИО, паспорт, адрес, реквизиты)
- Создание займа с аннуитетным расчётом: сумма, срок, ставка, периодичность
- Автоматическая генерация платёжного графика на сервере
- Отправка приглашения заёмщику через Telegram или WhatsApp
- Подтверждение платежей с пересчётом остатка и процентов
- Обработка досрочных и частичных платежей (bank-style amortization)
- Аналитика портфеля (в тарифе PRO)
- Формирование и скачивание юридической расписки в HTML/PDF
- Взаимный рейтинг после закрытия займа (1–5 звёзд)
- Push-уведомления о платёжных запросах

### Для заёмщика
- Вход без регистрации — только по номеру телефона
- Просмотр всех своих займов (если их несколько)
- Подписание условий займа онлайн
- Отправка платёжного запроса кредитору
- Push-уведомления о предстоящих платежах и подтверждениях

---

## Технологический стек

| Слой | Технологии |
|------|-----------|
| **Frontend** | React 19, Vite 7, TanStack Query, wouter, Framer Motion, Tailwind CSS v4, shadcn/ui |
| **Backend** | Node.js, Express.js, TypeScript |
| **ORM** | Drizzle ORM |
| **База данных** | PostgreSQL |
| **Аутентификация** | Telegram Login Widget + Replit Auth (OIDC) |
| **Состояние** | Zustand (только для сессии заёмщика) |
| **Push** | Web Push API + VAPID |
| **PWA** | Service Worker, Web App Manifest |

---

## Архитектура

```
┌─────────────────────────────────────┐
│           React Frontend            │
│  (Vite, TanStack Query, wouter)     │
│                                     │
│  /welcome        — главная          │
│  /login          — вход             │
│  /master/*       — кредитор         │
│  /borrower/*     — заёмщик          │
└──────────────┬──────────────────────┘
               │ HTTP / REST API
┌──────────────▼──────────────────────┐
│          Express.js Backend         │
│                                     │
│  routes.ts    — API роуты           │
│  storage.ts   — бизнес-логика       │
│  telegramAuth — верификация TG      │
│  replit auth  — OIDC провайдер      │
│  pushNotif.   — Web Push            │
└──────────────┬──────────────────────┘
               │ Drizzle ORM
┌──────────────▼──────────────────────┐
│           PostgreSQL                │
└─────────────────────────────────────┘
```

**Роли пользователей:**
- **Кредитор (Lender)** — требует аутентификации (Telegram или OIDC)
- **Заёмщик (Borrower)** — без регистрации, доступ по номеру телефона

---

## Структура проекта

```
meloan/
├── client/
│   ├── public/
│   │   ├── logo.png              # логотип
│   │   ├── logo-shield.png       # альтернативный логотип
│   │   ├── icon-192.png          # PWA иконка
│   │   ├── icon-512.png          # PWA иконка
│   │   ├── manifest.json         # PWA манифест
│   │   └── sw.js                 # Service Worker (push-уведомления)
│   └── src/
│       ├── App.tsx               # роутинг
│       ├── hooks/
│       │   ├── use-auth.ts       # хук состояния аутентификации
│       │   └── use-toast.ts
│       ├── lib/
│       │   ├── api.ts            # клиент для API запросов
│       │   ├── auth-utils.ts     # утилиты авторизации
│       │   ├── loanCalculator.ts # аннуитетный калькулятор (клиент)
│       │   ├── pushNotifications.ts # подписка на push
│       │   ├── receiptGenerator.ts  # генерация расписки
│       │   ├── queryClient.ts    # TanStack Query конфиг
│       │   └── store.ts          # Zustand + переводы (i18n)
│       ├── pages/
│       │   ├── welcome.tsx       # главная страница
│       │   ├── login.tsx         # страница входа
│       │   ├── master/
│       │   │   ├── dashboard.tsx    # дашборд кредитора
│       │   │   ├── create-loan.tsx  # создание займа
│       │   │   ├── loan-details.tsx # детали займа
│       │   │   └── profile.tsx      # профиль кредитора
│       │   └── borrower/
│       │       ├── dashboard.tsx    # дашборд заёмщика
│       │       └── invite.tsx       # принятие приглашения
│       └── components/
│           ├── layout.tsx        # общий layout
│           └── ui/               # shadcn/ui компоненты
├── server/
│   ├── index.ts                  # точка входа Express
│   ├── routes.ts                 # все API маршруты
│   ├── storage.ts                # интерфейс хранилища + Drizzle
│   ├── db.ts                     # подключение к PostgreSQL
│   ├── telegramAuth.ts           # верификация Telegram Login
│   ├── pushNotifications.ts      # отправка push + планировщик
│   └── replit_integrations/
│       └── auth/                 # Replit Auth (OIDC + passport)
├── shared/
│   ├── schema.ts                 # Drizzle схема + Zod валидация
│   └── models/
│       └── auth.ts               # схемы users и sessions
├── script/
│   └── build.ts                  # скрипт сборки
└── README.md
```

---

## База данных

### `users`
| Поле | Тип | Описание |
|------|-----|----------|
| id | text PK | UUID пользователя |
| email | text | Email (из OIDC) |
| firstName | text | Имя |
| lastName | text | Фамилия |
| profileImageUrl | text | Аватар |
| telegramId | text | Telegram user ID |
| createdAt | timestamp | Дата регистрации |
| updatedAt | timestamp | Последнее обновление |

### `lender_profiles`
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| userId | text FK | Ссылка на users |
| name | text | ФИО кредитора |
| passport | text | Паспортные данные |
| address | text | Адрес |
| paymentInfo | text | Реквизиты для оплаты |
| phone | text | Телефон |

### `loans`
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| lenderProfileId | uuid FK | |
| borrowerName | text | ФИО заёмщика |
| borrowerContact | text | Телефон заёмщика |
| amount | integer | Сумма займа (₽) |
| termMonths | integer | Срок (мес.) |
| ratePercent | numeric | Годовая ставка (%) |
| startDate | date | Дата выдачи |
| frequency | text | Периодичность (monthly / weekly) |
| monthlyPayment | integer | Аннуитетный платёж |
| totalRepayment | integer | Итого к возврату |
| remainingAmount | integer | Остаток долга |
| status | text | pending / active / closed |
| signedAt | timestamp | Дата подписания заёмщиком |
| borrowerRating | integer | Оценка заёмщику (1–5) |
| lenderRating | integer | Оценка кредитору (1–5) |

### `schedule_items`
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| loanId | uuid FK | |
| itemIndex | integer | Порядковый номер платежа |
| date | date | Дата платежа |
| amount | integer | Сумма платежа |
| principalPart | integer | Часть основного долга |
| interestPart | integer | Часть процентов |
| remainingAfter | integer | Остаток после платежа |
| status | text | upcoming / paid / overdue |
| paidDate | timestamp | Дата фактической оплаты |
| paidAmount | integer | Фактическая сумма |

### `payment_requests`
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| loanId | uuid FK | |
| amount | integer | Сумма запроса |
| status | text | pending / confirmed / rejected |
| createdAt | timestamp | |

### `push_subscriptions`
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| endpoint | text | Push endpoint URL |
| p256dh | text | Ключ шифрования |
| auth | text | Ключ аутентификации |
| type | text | lender / borrower |
| userId | text | Для кредитора |
| phone | text | Для заёмщика |

---

## Аутентификация

### Telegram Login Widget (основной способ)
- Виджет встраивается на страницу `/login`
- Бот: `@meloan_auth_bot`
- При входе браузер отправляет данные на `POST /api/auth/telegram`
- Сервер верифицирует HMAC-SHA256 подпись по `TELEGRAM_BOT_TOKEN`
- Создаётся/обновляется запись в таблице `users`

### Replit Auth / OIDC (альтернативный)
- Поддерживает Google, GitHub, Apple, email
- Флоу: `GET /api/login` → OIDC провайдер → `GET /api/callback`
- Сессии хранятся в PostgreSQL через `connect-pg-simple`

### Middleware
Хелпер `getUserId(req)` определяет userId независимо от провайдера:
- Replit Auth: `req.user.claims.sub`
- Telegram: `req.user.userId`

---

## API

### Аутентификация
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/auth/user` | Текущий пользователь (protected) |
| POST | `/api/auth/telegram` | Вход через Telegram |
| GET | `/api/telegram-bot-username` | Имя бота для виджета |
| GET | `/api/login` | Начало OIDC входа |
| GET | `/api/logout` | Выход |

### Профиль кредитора
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/my-profile` | Профиль текущего пользователя |
| POST | `/api/lender-profile` | Создать профиль |
| GET | `/api/lender-profile/:id` | Профиль по ID |
| PUT | `/api/lender-profile/:id` | Обновить профиль |

### Займы
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/loans` | Создать заём (с расчётом графика) |
| GET | `/api/loans` | Все займы кредитора |
| GET | `/api/loans/:id` | Заём с графиком |
| GET | `/api/loans/by-phone/:phone` | Поиск займов по телефону |
| POST | `/api/loans/:id/accept` | Подписать заём (заёмщик) |
| POST | `/api/loans/:id/rate` | Оставить рейтинг |

### Платёжные запросы
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/payment-requests` | Создать запрос на оплату |
| GET | `/api/payment-requests/:loanId` | Запросы по займу |
| POST | `/api/payment-requests/:id/confirm` | Подтвердить с пересчётом |

### Push-уведомления
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/vapid-public-key` | VAPID публичный ключ |
| POST | `/api/push/subscribe` | Подписаться |
| POST | `/api/push/unsubscribe` | Отписаться |

---

## Финансовые расчёты

### Аннуитетный платёж
```
PMT = P × r / (1 − (1 + r)^−n)
```
где: `P` — сумма займа, `r` — месячная ставка, `n` — число периодов

Расчёт производится **на сервере** при создании займа. Каждый элемент графика содержит разбивку: основной долг + проценты за период.

### Досрочное погашение
При подтверждении платежа, превышающего плановый:
1. Начисляются проценты с даты последнего платежа до сегодня
2. Остаток долга пересчитывается
3. Оставшийся график пересчитывается заново
4. При `remainingAmount = 0` заём автоматически закрывается

---

## Push-уведомления

- **Заёмщику**: напоминание за день до платежа (планировщик на сервере)
- **Кредитору**: новый платёжный запрос от заёмщика
- **Заёмщику**: подтверждение платежа кредитором

Подписка хранится в таблице `push_subscriptions`. Отправка через Web Push API с VAPID-ключами.

---

## PWA

Приложение работает как Progressive Web App:
- `client/public/manifest.json` — конфигурация приложения
- `client/public/sw.js` — Service Worker для push-уведомлений
- Иконки 192×192 и 512×512
- Инструкция по установке на iOS/Android встроена в истории на главной странице

---

## Монетизация

Тарифная сетка уже реализована в UI (интеграция с платёжной системой в разработке):

| Тариф | Цена | Возможности |
|-------|------|-------------|
| **Free** | Бесплатно | До 2 займов у кредитора |
| **Expert** | 149 ₽/мес | До 10 займов, досудебная претензия |
| **PRO** | 399 ₽/мес | Безлимит, аналитика портфеля, учёт средств |

Планируемый платёжный шлюз: **ЮKassa** (поддержка карт Мир/Visa/MC, СБП, рекуррентные платежи).

---

## Переменные окружения

| Переменная | Описание |
|-----------|----------|
| `DATABASE_URL` | PostgreSQL строка подключения |
| `SESSION_SECRET` | Секрет для Express-сессий |
| `TELEGRAM_BOT_TOKEN` | Токен бота от @BotFather |
| `TELEGRAM_BOT_USERNAME` | Имя бота без @ |
| `VAPID_PUBLIC_KEY` | VAPID публичный ключ (Web Push) |
| `VAPID_PRIVATE_KEY` | VAPID приватный ключ (Web Push) |

---

## Запуск локально

```bash
# Установить зависимости
npm install

# Применить схему к базе данных
npm run db:push

# Запустить в режиме разработки
npm run dev
```

Приложение будет доступно на `http://localhost:5000`.

### Сборка для продакшена

```bash
npm run build
npm run start
```

---

## Деплой

Приложение задеплоено на [Replit Autoscale](https://replit.com) и доступно по адресу [meloan.ru](https://meloan.ru).

Конфигурация деплоя (`.replit`):
```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["node", "./dist/index.cjs"]
```
