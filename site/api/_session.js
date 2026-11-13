// Shared by the sign-in functions. The session is one encrypted, HttpOnly cookie on dsh-game-store.com.
// Games run on other hosts (<id>.play.dsh-game-store.com), so they never receive it.
const crypto = require('crypto')

const SITE = 'https://dsh-game-store.com'
const REPO = 'CocoSgt/dsh-game-store'
const COOKIE = 'gs_session'

const configured = () => !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.SESSION_SECRET)
const key = () => crypto.createHash('sha256').update(String(process.env.SESSION_SECRET)).digest()

function seal(data) {
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const body = Buffer.concat([c.update(JSON.stringify(data), 'utf8'), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), body]).toString('base64url')
}
function open(text) {
  try {
    const raw = Buffer.from(String(text), 'base64url')
    const d = crypto.createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12))
    d.setAuthTag(raw.subarray(12, 28))
    return JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8'))
  } catch { return null }
}
const cookies = req => Object.fromEntries(String(req.headers.cookie || '').split(';').map(p => p.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]))
const setCookie = (name, value, maxAge) => `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
const session = req => { const s = open(cookies(req)[COOKIE]); return s && s.token && s.until > Date.now() ? s : null }
/** Only this site's own pages may call the functions that change something. */
const sameSite = req => { const o = req.headers.origin; return !o || o === SITE || o === 'https://www.dsh-game-store.com' }
const send = (res, status, body) => { res.statusCode = status; res.setHeader('content-type', 'application/json; charset=utf-8'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(body)) }

module.exports = { SITE, REPO, COOKIE, configured, seal, open, cookies, setCookie, session, sameSite, send }
