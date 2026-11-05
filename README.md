# VoiceForge Studio

Статический Telegram Mini App для GitHub Pages. Он не хранит ключи и не делает
запросов к локальному компьютеру: настройки и текст передаются VoiceForge через
`Telegram.WebApp.sendData`, после чего бот сам отправляет готовое аудио в чат.

Перед публикацией укажите итоговый адрес Pages в `C:\c\voiceforge-bot\.env`:

```env
VOICEFORGE_WEBAPP_URL=https://<github-user>.github.io/voiceforge-miniapp/
```

После изменения перезапустите `VoiceForgeBot`.
# VoiceForge Mini App

## Personal voices API

The `worker/` folder is a Cloudflare Worker that verifies Telegram Mini App sessions and returns each user's personal voices together with public ones. The app only activates this API after `config.js` has a deployed Worker URL.

Deployment requires a Cloudflare account, a D1 database, and the `TELEGRAM_BOT_TOKEN` Worker secret. The bot's local SQLite data is never exposed to a browser.
