// dsh-game-store.com: copy buttons, picture galleries, GitHub sign-in, message boards.
// Text from GitHub is always put on the page as text, never as HTML.
(() => {
  // ---- copy buttons
  for (const b of document.querySelectorAll('[data-copy]')) b.addEventListener('click', () => {
    const done = () => { const old = b.textContent; b.textContent = b.dataset.done; setTimeout(() => { b.textContent = old }, 1600) }
    if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done, () => {})
    else { const a = document.createElement('textarea'); a.value = b.dataset.copy; document.body.append(a); a.select(); document.execCommand('copy'); a.remove(); done() }
  })

  // ---- GitHub stars: the count beside every GitHub link (asked once per repository per visit)
  const starEls = [...document.querySelectorAll('[data-stars]')]
  for (const repo of new Set(starEls.map(e => e.dataset.stars))) {
    const put = n => { for (const e of starEls) if (e.dataset.stars === repo) e.textContent = `★ ${n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n}` }
    const key = `stars:${repo}`
    let saved; try { saved = sessionStorage.getItem(key) } catch (e) {}
    if (saved !== null && saved !== undefined) { put(Number(saved)); continue }
    fetch(`https://api.github.com/repos/${repo}`, { headers: { accept: 'application/vnd.github+json' } }).then(r => (r.ok ? r.json() : null)).then(j => {
      if (!j || typeof j.stargazers_count !== 'number') return
      put(j.stargazers_count); try { sessionStorage.setItem(key, String(j.stargazers_count)) } catch (e) {}
    }).catch(() => {})
  }

  // ---- galleries: a thumbnail becomes the big picture (or the clip, which plays by itself like an animated picture)
  for (const g of document.querySelectorAll('[data-gallery]')) {
    const thumbs = [...g.querySelectorAll('.thumbs button')], cap = g.querySelector('[data-cap]:not(button)')
    for (const t of thumbs) t.addEventListener('click', () => {
      const old = g.querySelector('[data-main]')
      let main
      if (t.dataset.video) {
        main = Object.assign(document.createElement('video'), { src: t.dataset.video, poster: t.dataset.poster || '', autoplay: true, muted: true, loop: true, playsInline: true })
        main.setAttribute('playsinline', ''); main.setAttribute('muted', '')
      } else main = Object.assign(document.createElement('img'), { src: t.dataset.src, alt: '' })
      main.dataset.main = ''
      old.replaceWith(main)
      if (cap) cap.textContent = t.dataset.cap || ''
      thumbs.forEach(x => x.classList.toggle('on', x === t))
    })
  }

  // ---- a click on the big picture opens it over the page; a click, Esc or Back closes it
  const openBox = src => {
    const box = Object.assign(document.createElement('div'), { className: 'lightbox' })
    box.append(Object.assign(document.createElement('img'), { src, alt: '' }))
    const close = () => { box.remove(); removeEventListener('keydown', onKey); removeEventListener('popstate', close) }
    const onKey = e => { if (e.key === 'Escape') { close(); if (history.state && history.state.box) history.back() } }
    box.addEventListener('click', () => { close(); if (history.state && history.state.box) history.back() })
    addEventListener('keydown', onKey)
    // On a phone, Back closes the picture and stays on the page.
    history.pushState({ box: true }, '')
    addEventListener('popstate', close)
    document.body.append(box)
  }
  for (const s of document.querySelectorAll('.screen.zoomable')) s.addEventListener('click', () => {
    const m = s.querySelector('[data-main]')
    if (m && m.tagName === 'IMG') openBox(m.src)
    else if (m && m.tagName === 'VIDEO') { if (m.paused) m.play(); else m.pause() }
  })

  // ---- sign-in with GitHub (the site works without it; the button shows only when sign-in is set up)
  const auth = document.getElementById('auth')
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n }
  let me = null
  const ready = fetch('/api/me', { credentials: 'same-origin' }).then(async r => {
    if (r.status === 200) { me = await r.json(); return 'in' }
    return r.status === 401 ? 'out' : 'off'
  }).catch(() => 'off')
  ready.then(state => {
    if (!auth || state === 'off') return
    if (state === 'in') {
      const out = el('button', { type: 'button', textContent: document.body.dataset.signout })
      out.addEventListener('click', () => fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).then(() => location.reload()))
      auth.append(el('img', { src: `${me.avatar}&s=60`, alt: '' }), el('span', { className: 'who', textContent: me.login }), out)
    } else {
      auth.append(el('a', { className: 'btn ghost sm', href: `/api/login?next=${encodeURIComponent(location.pathname + location.hash)}`, textContent: document.body.dataset.signin }))
    }
  })

  // ---- message boards: open issues labelled game:<id> in the store repository
  for (const box of document.querySelectorAll('.board')) {
    const { repo, label, empty, fail, replies } = box.dataset
    const say = text => { box.textContent = ''; box.append(el('p', { className: 'muted', textContent: text })) }
    const load = () => fetch(`https://api.github.com/repos/${repo}/issues?labels=${encodeURIComponent(label)}&state=open&sort=created&direction=desc&per_page=20`, { headers: { accept: 'application/vnd.github+json' } })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(list => {
        const items = list.filter(i => !i.pull_request)
        if (!items.length) return say(empty)
        box.textContent = ''
        for (const i of items) {
          const text = String(i.body || '').replace(/^###\s.*$/gm, '').replace(/^\s*[a-z0-9-]{1,40}\s*$/m, '').replace(/\s+/g, ' ').trim().slice(0, 280)
          box.append(el('a', { className: 'msg', href: i.html_url },
            el('img', { src: `${i.user.avatar_url}&s=80`, alt: '', loading: 'lazy' }),
            el('div', {},
              el('div', { className: 'who', textContent: `${i.user.login} · ${new Date(i.created_at).toLocaleDateString()}${i.comments ? ` · ${i.comments} ${replies}` : ''}` }),
              el('div', { className: 'title', textContent: i.title }),
              el('div', { className: 'text', textContent: text }))))
        }
      })
      .catch(() => say(fail))
    load()
    box.reload = load
  }

  // ---- post a message while signed in
  ready.then(state => {
    for (const form of document.querySelectorAll('form.post')) {
      const hint = form.parentElement.querySelector('.signin-hint')
      if (state === 'in') form.hidden = false
      else if (state === 'out' && hint) hint.hidden = false
      form.addEventListener('submit', async e => {
        e.preventDefault()
        const status = form.querySelector('.status'), button = form.querySelector('button')
        button.disabled = true; status.textContent = ''
        try {
          const r = await fetch('/api/post', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game: form.dataset.game, title: form.title.value, body: form.body.value }) })
          const j = await r.json().catch(() => ({}))
          if (!r.ok) throw new Error(j.error || r.status)
          form.reset(); status.textContent = form.dataset.sent
          setTimeout(() => { const b = form.parentElement.querySelector('.board'); if (b && b.reload) b.reload() }, 4000)
        } catch (err) { status.textContent = form.dataset.err + err.message }
        button.disabled = false
      })
    }
  })
})()
