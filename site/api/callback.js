// GitHub sends the visitor back here with a code. Exchange it, read who they are, start the session.
const { SITE, COOKIE, configured, seal, cookies, setCookie, send } = require('./_session')

module.exports = async (req, res) => {
  if (!configured()) return send(res, 501, { error: 'sign-in is not set up' })
  const url = new URL(req.url, SITE)
  const [state, back = '/'] = String(cookies(req).gs_state || '').split('|')
  if (!state || state !== url.searchParams.get('state') || !url.searchParams.get('code')) return send(res, 400, { error: 'sign-in expired, try again' })
  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code: url.searchParams.get('code'), redirect_uri: `${SITE}/api/callback` }),
    })
    const tok = await r.json()
    if (!tok.access_token) throw new Error(tok.error_description || 'no token')
    const gh = path => fetch(`https://api.github.com${path}`, { headers: { authorization: `Bearer ${tok.access_token}`, accept: 'application/vnd.github+json', 'user-agent': 'dsh-game-store' } }).then(x => (x.ok ? x.json() : null))
    const user = await gh('/user')
    if (!user || !user.login) throw new Error('GitHub did not say who you are')
    // The verified primary email, when the visitor allowed it. Kept inside the encrypted session only.
    const emails = await gh('/user/emails')
    const email = Array.isArray(emails) ? (emails.find(e => e.primary && e.verified) || {}).email : undefined
    const hours = Math.min(8, Math.max(1, Math.floor((Number(tok.expires_in) || 28800) / 3600)))
    const s = seal({ token: tok.access_token, login: user.login, avatar: user.avatar_url, email, until: Date.now() + hours * 3600_000 })
    res.setHeader('set-cookie', [setCookie(COOKIE, s, hours * 3600), setCookie('gs_state', '', 0)])
    res.statusCode = 302
    res.setHeader('location', /^\/(?!\/)/.test(back) ? back : '/')
    res.end()
  } catch (err) { send(res, 502, { error: String(err.message || err) }) }
}
