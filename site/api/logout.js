// End the session.
const { COOKIE, setCookie, sameSite, send } = require('./_session')

module.exports = (req, res) => {
  if (req.method !== 'POST' || !sameSite(req)) return send(res, 405, { error: 'POST from this site only' })
  res.setHeader('set-cookie', setCookie(COOKIE, '', 0))
  send(res, 200, {})
}
