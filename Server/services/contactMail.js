const validEmail = value => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
function parse(body = {}) {
  const result = {};
  for (const [key, maximum] of [['description',5000],['name',80],['email',254]]) {
    const value = body[key] ?? '';
    if (typeof value !== 'string' || value.length > maximum) return null;
    result[key] = value.trim();
  }
  if (!result.description || !result.name || !validEmail(result.email)) return null;
  return result;
}
async function sendContact(value, { env = process.env, transport = fetch } = {}) {
  if (!env.BREVO_API_KEY || !validEmail(env.BREVO_SENDER_EMAIL || '')) return false;
  try {
    const response = await transport('https://api.brevo.com/v3/smtp/email', {
      method:'POST', signal:AbortSignal.timeout(10000),
      headers:{'api-key':env.BREVO_API_KEY,'content-type':'application/json'},
      body:JSON.stringify({sender:{email:env.BREVO_SENDER_EMAIL,name:'ColorLab'},
        to:[{email:'yehpty@gmail.com'}],subject:'ColorLab｜新的網站訊息',
        ...(value.email?{replyTo:{email:value.email}}:{}),
        textContent:`稱呼：${value.name || '未提供'}\n回覆信箱：${value.email || '未提供'}\n\n${value.description}`})
    });
    return response.ok;
  } catch { return false; }
}
module.exports = {parse,sendContact};
