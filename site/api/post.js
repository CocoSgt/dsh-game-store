// Post a message on a game's board: an issue in the store repository, created as the signed-in visitor.
// The repository's "Message board" workflow adds the game:<id> label.
const { SITE, REPO, configured, session, sameSite, send } = require('./_session')

module.exports = async (req, res) => {
  if (!configured()) return send(res, 501, { error: 'sign-in is not set up' })
  if (req.method !== 'POST' || !sameSite(req)) return send(res, 405, { error: 'POST from this site only' })
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return send(res, 415, { error: 'JSON only' })
  const s = session(req)
  if (!s) return send(res, 401, { error: 'not signed in' })
  const b = typeof req.body === 'object' && req.body ? req.body : {}
  const game = String(b.game || ''), title = String(b.title || '').trim(), body = String(b.body || '').trim()
  if (!/^[a-z][a-z0-9-]{0,39}$/.test(game)) return send(res, 400, { error: 'unknown game' })
  if (!title || title.length > 120 || !body || body.length > 4000) return send(res, 400, { error: 'a title (up to 120 characters) and a message (up to 4000) are needed' })
  // Only games that are in the catalog have a board.
  const catalog = await fetch(`${SITE}/catalog.json`).then(r => r.json()).catch(() => null)
  if (!catalog || !(catalog.games || []).some(g => g.id === game)) return send(res, 400, { error: 'unknown game' })
  const r = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: { authorization: `Bearer ${s.token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json', 'user-agent': 'dsh-game-store' },
    body: JSON.stringify({ title, body: `### Game\n\n${game}\n\n### Message\n\n${body}` }),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) return send(res, 502, { error: j.message || `GitHub answered ${r.status}` })
  send(res, 200, { url: j.html_url })
}
