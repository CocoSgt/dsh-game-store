// A tiny complete game, to show the shape of a package. Replace it with yours.
// Rules a store game follows: every file it needs is in game/ (no network), it fills the window,
// and it keeps saves in localStorage (the store gives each game its own storage).
(() => {
  const zh = (navigator.language || '').toLowerCase().startsWith('zh')
  const T = zh ? { score: '得分', best: '最高', time: '时间', again: '按空格或点一下再来一局' } : { score: 'Score', best: 'Best', time: 'Time', again: 'Press Space or click to play again' }
  const cv = document.getElementById('c'), g = cv.getContext('2d')
  let W = 0, H = 0, x = 0.5, stars = [], score = 0, left = 30, over = false, last = performance.now()
  let best = 0
  try { best = Number(localStorage.getItem('my-game.best')) || 0 } catch (e) {}
  const keys = {}
  const fit = () => { const r = devicePixelRatio || 1; W = innerWidth; H = innerHeight; cv.width = W * r; cv.height = H * r; g.setTransform(r, 0, 0, r, 0, 0) }
  const reset = () => { stars = []; score = 0; left = 30; over = false }
  addEventListener('resize', fit); fit()
  addEventListener('pointermove', e => { x = e.clientX / W })
  addEventListener('pointerdown', e => { x = e.clientX / W; if (over) reset() })
  addEventListener('keydown', e => { keys[e.key] = true; if (over && e.key === ' ') reset() })
  addEventListener('keyup', e => { keys[e.key] = false })
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now
    const unit = Math.min(W, H) / 20
    if (!over) {
      if (keys.ArrowLeft) x -= dt * 0.9
      if (keys.ArrowRight) x += dt * 0.9
      x = Math.max(0.05, Math.min(0.95, x))
      if (Math.random() < dt * 2.2) stars.push({ x: 0.05 + Math.random() * 0.9, y: -0.05, v: 0.25 + Math.random() * 0.35 })
      for (const s of stars) s.y += s.v * dt
      stars = stars.filter(s => {
        if (s.y > 0.86 && s.y < 0.94 && Math.abs(s.x - x) * W < unit * 2.2) { score++; return false }
        return s.y < 1.1
      })
      left -= dt
      if (left <= 0) { over = true; if (score > best) { best = score; try { localStorage.setItem('my-game.best', String(best)) } catch (e) {} } }
    }
    g.fillStyle = '#101425'; g.fillRect(0, 0, W, H)
    g.fillStyle = '#ffd34d'
    for (const s of stars) { g.beginPath(); g.arc(s.x * W, s.y * H, unit * 0.35, 0, 7); g.fill() }
    g.fillStyle = '#6ea8ff'; g.fillRect(x * W - unit * 2, H * 0.9, unit * 4, unit * 0.5)
    g.fillStyle = '#fff'; g.font = `${unit * 0.8}px system-ui, sans-serif`; g.textAlign = 'left'
    g.fillText(`${T.score} ${score}   ${T.best} ${best}   ${T.time} ${Math.max(0, Math.ceil(left))}`, unit, unit * 1.5)
    if (over) { g.textAlign = 'center'; g.font = `${unit * 1.1}px system-ui, sans-serif`; g.fillText(T.again, W / 2, H / 2) }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
})()
