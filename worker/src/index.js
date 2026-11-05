const TELEGRAM_MAX_AGE_SECONDS = 24 * 60 * 60;

function cors(origin) {
  const allowed = origin === 'https://chotkof.github.io' ? origin : 'https://chotkof.github.io';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function response(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(origin) },
  });
}

function hex(bytes) {
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

async function hmac(key, value) {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(value));
}

async function verifyTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return null;
  const values = new URLSearchParams(initData);
  const receivedHash = values.get('hash');
  const authDate = Number(values.get('auth_date') || 0);
  const userRaw = values.get('user');
  if (!receivedHash || !authDate || !userRaw || Math.abs(Date.now() / 1000 - authDate) > TELEGRAM_MAX_AGE_SECONDS) return null;
  values.delete('hash');
  const checkString = [...values.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}=${value}`).join('\n');
  const secret = await hmac(new TextEncoder().encode('WebAppData'), botToken);
  const expectedHash = hex(await hmac(secret, checkString));
  if (expectedHash.length !== receivedHash.length) return null;
  let different = 0;
  for (let index = 0; index < expectedHash.length; index += 1) different |= expectedHash.charCodeAt(index) ^ receivedHash.charCodeAt(index);
  if (different !== 0) return null;
  try { return JSON.parse(userRaw); } catch { return null; }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(origin) });
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/api/sync') {
      const authorization = request.headers.get('Authorization') || '';
      if (authorization !== `Bearer ${env.TELEGRAM_BOT_TOKEN}`) return response({ error: 'Unauthorized' }, 401, origin);
      let voice;
      try { voice = await request.json(); } catch { return response({ error: 'Invalid JSON' }, 400, origin); }
      const id = Number(voice.id);
      const ownerId = String(voice.owner_id || '');
      const name = String(voice.name || '').trim();
      const status = String(voice.status || '');
      if (!Number.isInteger(id) || !ownerId || !name) return response({ error: 'Invalid voice' }, 400, origin);
      if (status !== 'personal' && status !== 'public') {
        await env.VOICEFORGE_DB.prepare('DELETE FROM voices WHERE id = ?').bind(id).run();
        return response({ ok: true, removed: true }, 200, origin);
      }
      await env.VOICEFORGE_DB.prepare(
        'INSERT INTO voices(id, owner_id, name, status, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id, name=excluded.name, status=excluded.status, updated_at=excluded.updated_at'
      ).bind(id, ownerId, name.slice(0, 64), status, Date.now()).run();
      return response({ ok: true }, 200, origin);
    }
    if (request.method !== 'POST' || url.pathname !== '/api/voices') return response({ error: 'Not found' }, 404, origin);
    let body;
    try { body = await request.json(); } catch { return response({ error: 'Invalid JSON' }, 400, origin); }
    const user = await verifyTelegramInitData(String(body.initData || ''), env.TELEGRAM_BOT_TOKEN);
    if (!user?.id) return response({ error: 'Telegram session verification failed' }, 401, origin);
    const { results = [] } = await env.VOICEFORGE_DB.prepare(
      'SELECT id, name, status FROM voices WHERE status = ? OR owner_id = ? ORDER BY status DESC, updated_at DESC'
    ).bind('public', String(user.id)).all();
    return response({ voices: results.map(voice => ({ id: voice.id, name: voice.name, personal: voice.status === 'personal' })) }, 200, origin);
  },
};
