// Who is signed in: 200 with the login and avatar, 401 when nobody, 501 when sign-in is not set up.
const { configured, session, send } = require('./_session')

module.exports = (req, res) => {
  if (!configured()) return send(res, 501, { error: 'sign-in is not set up' })
  const s = session(req)
  if (!s) return send(res, 401, { error: 'not signed in' })
  send(res, 200, { login: s.login, avatar: s.avatar })
}
