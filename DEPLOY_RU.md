# Деплой Meloan PWA на российский VPS

Подходит для Ubuntu 22.04/24.04 на Selectel, Timeweb Cloud, Reg.ru, FirstVDS и аналогичных VPS. Приложение запускается как Node.js сервер за Nginx: один процесс обслуживает `/api`, PWA-файлы, `manifest.json`, `sw.js` и fallback для SPA-маршрутов.

## 1. Подготовить сервер

```bash
sudo apt update
sudo apt install -y git curl nginx postgresql postgresql-contrib certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2. Создать базу PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE USER meloan WITH PASSWORD 'CHANGE_ME';
CREATE DATABASE meloan OWNER meloan;
\q
```

`DATABASE_URL` будет таким:

```text
postgresql://meloan:CHANGE_ME@127.0.0.1:5432/meloan
```

## 3. Скопировать приложение

```bash
sudo mkdir -p /var/www/meloan
sudo chown -R $USER:www-data /var/www/meloan
git clone https://github.com/stgor31-arch/meloan-replit.git /var/www/meloan
cd /var/www/meloan
npm ci
cp .env.production.example .env.production
nano .env.production
```

Минимально заполнить:

- `DATABASE_URL`
- `SESSION_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

Секрет сессии:

```bash
openssl rand -base64 32
```

VAPID-ключи для push:

```bash
npx web-push generate-vapid-keys
```

## 4. Создать таблицы и собрать проект

```bash
cd /var/www/meloan
set -a
. ./.env.production
set +a
npm run db:push
npm run build
```

## 5. Запустить через systemd

```bash
sudo cp ops/meloan.service /etc/systemd/system/meloan.service
sudo chown -R www-data:www-data /var/www/meloan
sudo systemctl daemon-reload
sudo systemctl enable --now meloan
sudo systemctl status meloan
```

Логи:

```bash
journalctl -u meloan -f
```

## 6. Настроить Nginx и HTTPS

Заменить `example.ru` в `ops/nginx-meloan.conf` на ваш домен.

```bash
sudo cp ops/nginx-meloan.conf /etc/nginx/sites-available/meloan
sudo ln -s /etc/nginx/sites-available/meloan /etc/nginx/sites-enabled/meloan
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d example.ru -d www.example.ru
```

PWA, service worker, push-уведомления и OAuth требуют HTTPS. Без HTTPS установка PWA и push в браузерах работать не будут.

## 7. OAuth callback URLs

Если используете Яндекс:

```text
https://example.ru/api/auth/yandex/callback
```

Если используете VK ID:

```text
https://example.ru/api/auth/vk/callback
```

Telegram Login Widget должен быть привязан к домену у BotFather.

## 8. Обновление приложения

```bash
cd /var/www/meloan
sudo -u www-data git pull
sudo -u www-data npm ci
set -a
. ./.env.production
set +a
npm run db:push
npm run build
sudo systemctl restart meloan
```
