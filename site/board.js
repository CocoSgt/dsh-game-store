// A game's message board: the open issues labelled game:<id> in the store repository, read from GitHub's public API.
// Everything is put on the page as text, never as HTML.
for (const box of document.querySelectorAll('.board')) {
  const { repo, label, empty, fail, replies } = box.dataset
  fetch(`https://api.github.com/repos/${repo}/issues?labels=${encodeURIComponent(label)}&state=open&sort=created&direction=desc&per_page=20`, { headers: { accept: 'application/vnd.github+json' } })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
    .then(list => {
      const items = list.filter(i => !i.pull_request)
      box.textContent = ''
      if (!items.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = empty; box.append(p); return }
      for (const i of items) {
        const a = document.createElement('a'); a.className = 'msg'; a.href = i.html_url
        const img = document.createElement('img'); img.src = `${i.user.avatar_url}&s=72`; img.alt = ''; img.width = 36; img.height = 36; img.loading = 'lazy'
        const body = document.createElement('div')
        const head = document.createElement('div'); head.className = 'who'
        head.textContent = `${i.user.login} · ${new Date(i.created_at).toLocaleDateString()}${i.comments ? ` · ${i.comments} ${replies}` : ''}`
        const title = document.createElement('div'); title.className = 'title'; title.textContent = i.title
        const text = document.createElement('div'); text.className = 'text'
        text.textContent = String(i.body || '').replace(/^###\s.*$/gm, '').replace(/\s+/g, ' ').trim().slice(0, 280)
        body.append(head, title, text); a.append(img, body); box.append(a)
      }
    })
    .catch(() => { box.textContent = ''; const p = document.createElement('p'); p.className = 'muted'; p.textContent = fail; box.append(p) })
}
