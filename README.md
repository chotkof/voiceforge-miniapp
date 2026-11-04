# VoiceForge Studio

Статический Telegram Mini App для GitHub Pages. Он не хранит ключи и не делает
запросов к локальному компьютеру: настройки и текст передаются VoiceForge через
`Telegram.WebApp.sendData`, после чего бот сам отправляет готовое аудио в чат.

Перед публикацией укажите итоговый адрес Pages в `C:\c\voiceforge-bot\.env`:

```env
VOICEFORGE_WEBAPP_URL=https://<github-user>.github.io/voiceforge-miniapp/
```

После изменения перезапустите `VoiceForgeBot`.
