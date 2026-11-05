const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }
const miniAppAvailable = Boolean(tg?.sendData);
document.body.classList.remove('access-pending');
document.body.classList.toggle('access-locked', !miniAppAvailable);

const state = { voice: 'warm', emotion: 'neutral', speed: '1.0' };
const baseVoices = [
  { id: 'warm', name: 'Алиса', description: 'Мягкий женский голос' },
  { id: 'bright', name: 'Вера', description: 'Живой женский голос' },
  { id: 'deep', name: 'Максим', description: 'Уверенный мужской голос' },
  { id: 'neutral', name: 'Андрей', description: 'Ровный голос диктора' },
];
const communityVoices = Array.isArray(window.COMMUNITY_VOICES) ? window.COMMUNITY_VOICES : [];
const voiceNames = Object.fromEntries([
  ...baseVoices.map(voice => [voice.id, voice.name]),
  ...communityVoices.map(voice => [`clone:${voice.id}`, voice.name]),
]);
const emotionNames = { neutral: 'Нейтрально', contentment: 'Спокойно', happy: 'Радостно', enthusiasm: 'Энергично', determination: 'Уверенно', anger: 'Сердито', sadness: 'Грустно', contemplation: 'Задумчиво' };
const text = document.querySelector('#text');
const counter = document.querySelector('#counter');
const generate = document.querySelector('#generate');
const studioStatus = document.querySelector('#studioStatus');
// Telegram Desktop may omit parts of initData for a keyboard Mini App.
// sendData itself is the capability that matters here.
const launchedFromBot = miniAppAvailable;

function setStatus(message) { studioStatus.textContent = message; }

function choose(container, attribute, value) {
  state[attribute] = value;
  document.querySelectorAll(`${container} [data-${attribute}]`).forEach(item => item.classList.toggle('selected', item.dataset[attribute] === value));
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function renderVoices() {
  const root = document.querySelector('#voices');
  const cards = baseVoices.map(voice => `<button class="voice ${voice.id === state.voice ? 'selected' : ''}" data-voice="${voice.id}"><b>${escapeHtml(voice.name)}</b><small>${escapeHtml(voice.description)}</small></button>`);
  if (communityVoices.length) {
    cards.push('<div class="voice-divider">Голоса сообщества</div>');
    cards.push(...communityVoices.map(voice => `<button class="voice community" data-voice="clone:${Number(voice.id)}"><b>${escapeHtml(voice.name)}</b><small>Одобрен модераторами</small></button>`));
  }
  root.innerHTML = cards.join('');
}
renderVoices();
document.querySelector('#voices').addEventListener('click', event => {
  const button = event.target.closest('[data-voice]'); if (!button) return;
  choose('#voices', 'voice', button.dataset.voice); document.querySelector('#voiceChoice').textContent = voiceNames[state.voice];
});
document.querySelector('#emotions').addEventListener('click', event => {
  const button = event.target.closest('[data-emotion]'); if (!button) return;
  choose('#emotions', 'emotion', button.dataset.emotion); document.querySelector('#emotionChoice').textContent = emotionNames[state.emotion];
});
document.querySelector('#speeds').addEventListener('click', event => {
  const button = event.target.closest('[data-speed]'); if (!button) return;
  choose('#speeds', 'speed', button.dataset.speed); document.querySelector('#speedChoice').textContent = `${state.speed}×`;
});
text.addEventListener('input', () => { counter.textContent = `${text.value.length} / 1000`; });
generate.addEventListener('click', () => {
  const value = text.value.trim();
  if (!value) { tg?.showAlert?.('Введите текст для озвучки.'); text.focus(); return; }
  if (!launchedFromBot) {
    setStatus('Studio открыта как обычная ссылка и не может передать текст боту. Вернитесь в @voicerrr_bot и откройте её кнопкой «✨ Открыть VoiceForge Studio».');
    return;
  }
  const payload = JSON.stringify({ action: 'tts', text: value, ...state });
  if (tg?.sendData) {
    generate.disabled = true;
    generate.innerHTML = '<span>ПЕРЕДАЮ В БОТ</span><b>→</b>';
    setStatus('Передаю настройки в VoiceForge…');
    try {
      tg.sendData(payload);
      window.setTimeout(() => {
        generate.disabled = false;
        generate.innerHTML = '<span>СОЗДАТЬ АУДИО</span><b>→</b>';
        setStatus('Telegram не подтвердил передачу. Закройте Studio, откройте её именно кнопкой в @voicerrr_bot и повторите попытку.');
      }, 4500);
    } catch (_) {
      generate.disabled = false;
      generate.innerHTML = '<span>СОЗДАТЬ АУДИО</span><b>→</b>';
      setStatus('Не удалось передать запрос в Telegram. Откройте Studio кнопкой внутри @voicerrr_bot.');
    }
  } else {
    setStatus('Откройте Studio кнопкой внутри Telegram-бота.');
  }
});
