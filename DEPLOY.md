# Развёртывание через интернет

Пошаговая инструкция, чтобы мессенджер работал на двух устройствах в разных сетях.

---

## Вариант 1: Railway (проще всего)

### Способ A: Через GitHub (рекомендуется)

**1. Загрузите проект на GitHub**

⚠️ **Важно:** Папка `node_modules` не должна попадать в Git (тысячи файлов). Проверьте, что в корне есть `.gitignore` с `node_modules/`.

Если проект ещё не в Git:
```bash
git init
git add .
git status
```
Перед `git commit` убедитесь, что `node_modules` не в списке. Если видите — выполните:
```bash
git rm -r --cached node_modules
git rm -r --cached dist
```
```bash
git commit -m "Initial commit"
```

Создайте репозиторий на [github.com/new](https://github.com/new) и отправьте код:
```bash
git remote add origin https://github.com/ваш-логин/whatsapp-messenger.git
git branch -M main
git push -u origin main
```

**2. Деплой на Railway**

1. Зайдите на [railway.app](https://railway.app) и войдите через GitHub.
2. Нажмите **"New Project"**.
3. Выберите **"Deploy from GitHub repo"**.
4. Разрешите доступ к GitHub и выберите репозиторий `whatsapp-messenger`.
5. Railway создаст проект и начнёт сборку.

### Способ B: Через Railway CLI (без GitHub)

1. Установите [Railway CLI](https://docs.railway.app/develop/cli): `npm i -g @railway/cli`
2. Войдите: `railway login`
3. В папке проекта: `railway init` → создайте новый проект.
4. Деплой: `railway up`
5. В панели Railway откройте сервис → Settings → Generate Domain.

### Шаг 3: Настройка сервера сигналов

1. Откройте созданный сервис (клик по нему).
2. Перейдите во вкладку **Settings** (⚙️).
3. В **Build**:
   - **Build Command**: оставьте пустым
   - **Root Directory**: оставьте пустым
4. В **Deploy**:
   - **Start Command**: `node server/index.js`
5. В **Variables** добавьте (если нужно):
   - Railway сам задаёт `PORT`, дополнительно ничего не требуется.

### Шаг 4: Публичный URL

1. В **Settings** найдите раздел **Networking**.
2. Нажмите **Generate Domain**.
3. Railway присвоит URL вида `whatsapp-messenger-production-xxxx.up.railway.app`.
4. Скопируйте этот URL.

### Шаг 5: URL для WebSocket

1. Берём URL Railway (например `https://whatsapp-messenger-production-xxxx.up.railway.app`).
2. Меняем `https://` на `wss://` → `wss://whatsapp-messenger-production-xxxx.up.railway.app`.
3. Это значение переменной `VITE_SIGNALING_URL` для деплоя фронтенда.

### Шаг 6: Деплой приложения (Vercel или Netlify)

**Через Vercel:**
1. [vercel.com](https://vercel.com) → New Project → импортируйте репозиторий.
2. В **Environment Variables** добавьте `VITE_SIGNALING_URL` = `wss://ваш-railway-домен.up.railway.app`.
3. Deploy.

**Через Netlify:**
1. [netlify.com](https://netlify.com) → Add new site → Import from Git.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. В **Environment variables** добавьте `VITE_SIGNALING_URL` = `wss://ваш-railway-домен.up.railway.app`.

### Шаг 7: Использование

1. Откройте развёрнутое приложение на телефоне (по ссылке Vercel/Netlify).
2. Откройте там же на компьютере (или другом устройстве).
3. Обменяйтесь Peer ID и создайте чат.

---

## Вариант 2: Render

### Сервер сигналов

1. [render.com](https://render.com) → New → Web Service.
2. Подключите репозиторий.
3. Настройки:
   - **Build Command**: оставьте пустым
   - **Start Command**: `node server/index.js`
   - **Instance Type**: Free

4. Add Environment Variable: `PORT` = `3005` (или Render сам назначит порт — проверьте в логах).
5. Deploy и скопируйте URL вида `https://your-app.onrender.com`.

### Приложение

1. Render → New → Static Site.
2. Build: `npm run build`
3. Publish: `dist`
4. Environment: `VITE_SIGNALING_URL` = `wss://your-app.onrender.com` (замените https на wss).

---

## Вариант 3: Свой VPS (VPS, VDS)

1. Разместите проект на сервере (Ubuntu и т.п.).
2. Установите Node.js.
3. Для сервера сигналов:
   ```bash
   cd /path/to/whatsapp-messenger
   node server/index.js
   ```
   (лучше через PM2 или systemd).
4. Настройте Nginx: прокси на `localhost:3005` для WebSocket.
5. Соберите фронтенд:
   ```bash
   npm run build
   ```
6. Создайте `.env` с `VITE_SIGNALING_URL=wss://ваш-домен.com`.
7. Раздайте статику из `dist/` через Nginx.
8. Включите HTTPS (Let's Encrypt).

---

## Важно

- **HTTPS обязателен** — WebRTC в браузере требует HTTPS (кроме localhost).
- **WebSocket** — URL должен быть `wss://` (не `ws://`) на продакшене.
- **Сервер сигналов** — должен быть доступен по публичному URL.

---

## Возможные проблемы

**"GitHub не загружает, слишком много файлов"**  
- В репозиторий попала папка `node_modules` (десятки тысяч файлов). Она не нужна — зависимости ставятся через `npm install`.
- Исправление:
  ```bash
  git rm -r --cached node_modules
  git rm -r --cached dist
  git commit -m "Remove node_modules and dist"
  git push
  ```
- Убедитесь, что в `.gitignore` есть строки `node_modules/` и `dist/`.
- Если не помогло — удалите папку `.git`, выполните `git init` заново и снова `git add .` (с правильным `.gitignore`).

**"Не могу подключиться"**  
- Убедитесь, что `VITE_SIGNALING_URL` начинается с `wss://` (не `https://`).
- Проверьте, что сервер сигналов запущен и доступен по этому URL.

**"Соединение не устанавливается"**  
- В бесплатных тарифах (Render и др.) сервер может «засыпать» — первое подключение бывает медленным.
- Попробуйте открыть приложение ещё раз через 30–60 секунд.

**Работает только на localhost**  
- Нужен HTTPS. На Vercel/Netlify он включается автоматически.
- Убедитесь, что в `.env` указан публичный URL сервера сигналов.

---

## Проверка

1. Откройте приложение на телефоне (по ссылке).
2. Откройте на компьютере (или другом телефоне).
3. У каждого устройства будет свой Peer ID.
4. Создайте чат, введя Peer ID другого устройства.
5. Отправьте сообщение — оно должно пройти через интернет.
