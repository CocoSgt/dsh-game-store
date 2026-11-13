// Start signing in with GitHub: remember a random state, then send the visitor to GitHub.
const crypto = require('crypto')
const { SITE, configured, setCookie, send } = require('./_session')

module.exports = (req, res) => {
  if (!configured()) return send(res, 501, { error: 'sign-in is not set up' })
  const url = new URL(req.url, SITE)
  const next = url.searchParams.get('next') || '/'
  const state = crypto.randomBytes(16).toString('hex')
  // Only paths of this site are accepted as the place to come back to.
  const back = /^\/(?!\/)[^\s]*$/.test(next) ? next : '/'
  res.setHeader('set-cookie', setCookie('gs_state', `${state}|${back}`, 600))
  const to = new URL('https://github.com/login/oauth/authorize')
  to.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID)
  to.searchParams.set('redirect_uri', `${SITE}/api/callback`)
  to.searchParams.set('state', state)
  res.statusCode = 302
  res.setHeader('location', String(to))
  res.end()
}
