#!/usr/bin/env node
/**
 * Build the site (dsh-game-store.com) and the catalog the store plugin reads, from catalog/games/*.json.
 *
 *   node site/build.mjs [--local <package>=<tarball>]... [--snapshot] [--out site/dist]
 *
 * For every listed game the package is downloaded from npm (never installed, never run),
 * checked against the spec, and its manifest, description and pictures are copied into the site.
 *   site/dist/catalog.json    what the store plugin reads
 *   site/dist/dsh-index.json  the same games as a DSH plugin index (DSH's "Discover" tab can read it)
 * --snapshot also copies the catalog and pictures into catalog-snapshot/, the copy shipped inside the plugin.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { escapeHtml as esc, renderMarkdown } from '../lib/markdown.mjs'
import { fetchPackage, localSources } from '../lib/packages.mjs'
import { checkCatalogEntry, checkPackage, pickText } from '../lib/spec.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const opt = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : fallback }
const out = resolve(root, opt('--out', 'site/dist'))
const local = localSources(argv, join(root, 'catalog/local.json'))
const SITE = 'https://dsh-game-store.com'
const DOMAIN = 'dsh-game-store.com'
/** A game on the web runs at https://<id>.play.dsh-game-store.com: its own site, apart from the store's pages and from other games. */
const PLAY_SUFFIX = `.play.${DOMAIN}`
const REPO = 'https://github.com/CocoSgt/dsh-game-store'
const storePkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

// ------------------------------------------------------------------ catalog
const games = []
let failed = 0
const dir = join(root, 'catalog/games')
for (const file of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  const id = file.replace(/\.json$/, '')
  let entry
  try { entry = JSON.parse(readFileSync(join(dir, file), 'utf8')) } catch { console.error(`✗ ${file}: not valid JSON`); failed++; continue }
  const r = checkCatalogEntry(entry, id)
  if (r.errors.length) { console.error(`✗ ${file}: ${r.errors.join('; ')}`); failed++; continue }
  try {
    const got = await fetchPackage(entry, { local: local[entry.package], cacheDir: join(root, '.cache') })
    const check = checkPackage(got.dir)
    if (!check.ok) throw new Error(check.errors.join('; '))
    if (check.manifest.id !== entry.id) throw new Error(`the package's game id is "${check.manifest.id}"`)
    if (check.pkg.name !== entry.package || check.pkg.version !== entry.version) throw new Error(`the tarball is ${check.pkg.name}@${check.pkg.version}`)
    const m = check.manifest
    const about = {}
    for (const [lang, rel] of Object.entries(m.about)) about[lang] = readFileSync(join(got.dir, rel), 'utf8')
    for (const rel of [m.icon, m.cover, ...m.screenshots.map(s => s.src), ...(m.videos ?? []).flatMap(v => [v.src, v.poster].filter(Boolean))]) {
      mkdirSync(dirname(join(out, 'games', id, rel)), { recursive: true })
      cpSync(join(got.dir, rel), join(out, 'games', id, rel))
    }
    // Play on the web: the game's own files, served from the game's own subdomain (see vercel.json below).
    const playDir = join(out, '_play', id)
    rmSync(playDir, { recursive: true, force: true })
    cpSync(join(got.dir, 'game'), join(playDir, 'game'), { recursive: true })
    if (m.manual) cpSync(join(got.dir, 'manual'), join(playDir, 'manual'), { recursive: true })
    games.push({
      id, package: entry.package, version: entry.version, integrity: entry.integrity, repository: entry.repository,
      status: entry.status ?? 'listed', ...(entry.reason ? { reason: entry.reason } : {}),
      addedAt: entry.addedAt, updatedAt: (got.publishedAt ?? '').slice(0, 10) || entry.addedAt,
      license: check.pkg.license, packageBytes: check.bytes, tarballBytes: got.tarballBytes,
      manifest: m, about, assets: `games/${id}/`,
      ...(got.source === 'local' ? { preview: true } : {}),
    })
    console.log(`✓ ${id}  ${entry.package}@${entry.version}${got.source === 'local' ? '  (local tarball)' : ''}`)
  } catch (err) { console.error(`✗ ${file}: ${err.message}`); failed++ }
}
if (failed && !argv.includes('--keep-going')) { console.error(`\n${failed} game(s) failed. Nothing was written.`); process.exit(1) }

rmSync(join(out, 'catalog.json'), { force: true })
mkdirSync(out, { recursive: true })
// Message boards live on GitHub: one issue per message in this repository, labelled game:<id>.
const BOARD_REPO = REPO.replace('https://github.com/', '')
const catalog = { format: 1, title: 'DSH Game Store', site: SITE, community: { repo: BOARD_REPO }, generatedAt: new Date().toISOString(), games }
writeFileSync(join(out, 'catalog.json'), JSON.stringify(catalog, null, 1))

// The same list in DSH's own plugin index format, for DSH's "Discover" tab.
const stamp = d => Math.floor(Date.parse(d || catalog.generatedAt) / 1000)
writeFileSync(join(out, 'dsh-index.json'), JSON.stringify({
  format: 1,
  title: { en: 'DSH Game Store', zh: 'DSH 游戏商店' },
  description: { en: 'The game store plugin and the games in its catalog.', zh: '游戏商店插件，以及目录里的游戏。' },
  metadata: { categories: { store: { title: { en: 'Store', zh: '商店' } }, game: { title: { en: 'Games', zh: '游戏' } } } },
  plugins: [
    { name: 'dsh-game-store', title: { en: 'Game Store', zh: '游戏商店' }, description: { en: storePkg.description, zh: 'DSH 上的游戏商店：浏览目录、看说明、安装、启动、更新、卸载。' }, author: 'CocoSgt', homepage: SITE, repository: { url: REPO }, metadata: { category: 'store' },
      versions: [{ version: storePkg.version, publishTimestamp: stamp(), source: { type: 'npm' }, engines: { dsh: storePkg.engines.dsh } }] },
    ...games.filter(g => g.status === 'listed').map(g => ({
      name: g.package, title: g.manifest.name, description: g.manifest.summary, icon: `games/${g.id}/${g.manifest.icon}`, author: g.manifest.author.name,
      homepage: `${SITE}/games/${g.id}/`, repository: { url: g.repository }, metadata: { category: 'game' },
      versions: [{ version: g.version, publishTimestamp: stamp(g.updatedAt), source: { type: 'npm' } }],
    })),
  ],
}, null, 1))

if (argv.includes('--snapshot')) {
  const snap = join(root, 'catalog-snapshot')
  rmSync(snap, { recursive: true, force: true })
  mkdirSync(snap, { recursive: true })
  writeFileSync(join(snap, 'catalog.json'), JSON.stringify(catalog, null, 1))
  if (existsSync(join(out, 'games'))) cpSync(join(out, 'games'), join(snap, 'games'), { recursive: true, filter: src => !src.endsWith('.html') })
  console.log('catalog-snapshot/ updated')
}

// ------------------------------------------------------------------ pages
const T = {
  zh: {
    lang: 'zh-CN', other: 'English', site: 'DSH 游戏商店', sub: '在 DeepSeek Harness 里装游戏、玩游戏',
    lead: '游戏商店是 DeepSeek Harness（DSH）的一个插件。装上它，就能在 DSH 里浏览游戏、看说明、一键安装、直接开玩。游戏都在你自己的电脑上运行。',
    nav: { games: '游戏', install: '安装', publish: '发布游戏', spec: '规范' },
    getStore: '安装商店', publishYours: '发布你的游戏', all: '全部游戏', none: '目录里还没有游戏。',
    about: '游戏说明', info: '信息', board: '留言板', boardPost: '用 GitHub 账号留言', boardEmpty: '还没有留言。', boardLoading: '正在读取留言…', boardFail: '现在读不到留言。', boardAll: '在 GitHub 上看全部留言', replies: '条回复', playWeb: '在网页上玩', playBack: '回到游戏页', playFull: '全屏', playManual: '手册', how: '怎么安装', howText: '先装好游戏商店，然后在商店里找到这个游戏，点“安装”。', howLink: '商店的安装方法',
    version: '版本', author: '作者', license: '许可证', size: '安装后大小', download: '下载大小', languages: '语言', controls: '操作方式', players: '人数', rating: '内容分级', pkg: 'npm 包', source: '源码', checksum: '校验值',
    control: { keyboard: '键盘', mouse: '鼠标', touch: '触屏', gamepad: '手柄' }, ratingName: { everyone: '所有人', teen: '13 岁以上', mature: '18 岁以上' },
    playersOne: '1 人', playersRange: (a, b) => `${a}–${b} 人`, sep: '、',
    preview: '预览：这个游戏的包还没有发布到 npm，页面内容来自本地的包。', delisted: '这个游戏已下架：',
    foot: '游戏商店是开源项目。', repo: '源码和游戏目录',
    manual: '包里带一本手册，安装后在商店的游戏页打开。',
  },
  en: {
    lang: 'en', other: '中文', site: 'DSH Game Store', sub: 'Install and play games inside DeepSeek Harness',
    lead: 'The Game Store is a plugin for DeepSeek Harness (DSH). With it you browse games, read about them, install with one click and play, all inside DSH. Games run on your own computer.',
    nav: { games: 'Games', install: 'Install', publish: 'Publish a game', spec: 'Spec' },
    getStore: 'Install the store', publishYours: 'Publish your game', all: 'All games', none: 'The catalog has no games yet.',
    about: 'About this game', info: 'Information', board: 'Message board', boardPost: 'Post with your GitHub account', boardEmpty: 'No messages yet.', boardLoading: 'Loading messages…', boardFail: 'Messages cannot be loaded right now.', boardAll: 'All messages on GitHub', replies: 'replies', playWeb: 'Play in the browser', playBack: 'Back to the game page', playFull: 'Full screen', playManual: 'Manual', how: 'How to install', howText: 'Install the Game Store first. Then find this game in the store and click Install.', howLink: 'How to install the store',
    version: 'Version', author: 'Author', license: 'License', size: 'Size on disk', download: 'Download size', languages: 'Languages', controls: 'Controls', players: 'Players', rating: 'Content rating', pkg: 'npm package', source: 'Source', checksum: 'Checksum',
    control: { keyboard: 'Keyboard', mouse: 'Mouse', touch: 'Touch', gamepad: 'Gamepad' }, ratingName: { everyone: 'Everyone', teen: '13 and up', mature: '18 and up' },
    playersOne: '1 player', playersRange: (a, b) => `${a}–${b} players`, sep: ', ',
    preview: 'Preview: this game is not on npm yet. The page is built from a local package.', delisted: 'This game was taken down: ',
    foot: 'The Game Store is open source.', repo: 'Source and game catalog',
    manual: 'The package includes a manual. Open it from the game page in the store after installing.',
  },
}
const LANG_NAMES = { 'zh-cn': '简体中文', 'zh-tw': '繁體中文', zh: '中文', en: 'English', ja: '日本語', ko: '한국어', es: 'Español', fr: 'Français', de: 'Deutsch', 'pt-br': 'Português', pt: 'Português', ru: 'Русский', it: 'Italiano' }
const mb = n => (n >= 1048576 ? `${(n / 1048576).toFixed(n >= 104857600 ? 0 : 1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

const CSS = readFileSync(join(root, 'site/style.css'), 'utf8')
writeFileSync(join(out, 'style.css'), CSS)
cpSync(join(root, 'site/board.js'), join(out, 'board.js'))
if (existsSync(join(root, 'icon.svg'))) cpSync(join(root, 'icon.svg'), join(out, 'icon.svg'))

/** One page in one language. `path` is the address without the language prefix, e.g. "games/tidemark/". */
function page(lang, path, title, body, { description } = {}) {
  const t = T[lang]
  const base = lang === 'zh' ? '/' : '/en/'
  const otherHref = (lang === 'zh' ? '/en/' : '/') + path
  const html = `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title ? `${title} · ${t.site}` : `${t.site} · ${t.sub}`)}</title>
<meta name="description" content="${esc(description ?? t.lead)}">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="alternate" hreflang="${T[lang === 'zh' ? 'en' : 'zh'].lang}" href="${otherHref}">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header class="top"><div class="in">
  <a class="brand" href="${base}"><img src="/icon.svg" alt="" width="22" height="22">${esc(t.site)}</a>
  <nav><a href="${base}#games">${esc(t.nav.games)}</a><a href="${base}install/">${esc(t.nav.install)}</a><a href="${base}publish/">${esc(t.nav.publish)}</a><a href="${base}spec/">${esc(t.nav.spec)}</a></nav>
  <a class="lang" href="${otherHref}">${esc(t.other)}</a>
</div></header>
<main>${body}</main>
<footer class="foot"><div class="in">${esc(t.foot)} <a href="${REPO}">${esc(t.repo)}</a></div></footer>
</body>
</html>
`
  const file = join(out, lang === 'zh' ? '' : 'en', path, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

function card(lang, g) {
  const t = T[lang], base = lang === 'zh' ? '/' : '/en/', m = g.manifest
  return `<a class="card" href="${base}games/${g.id}/"><img class="cover" src="/games/${g.id}/${esc(m.cover)}" alt="" loading="lazy">
<div class="cin"><img src="/games/${g.id}/${esc(m.icon)}" alt="" width="40" height="40"><div><div class="name">${esc(pickText(m.name, t.lang))}</div><div class="sum">${esc(pickText(m.summary, t.lang))}</div></div></div>
<div class="meta">${esc(m.author.name)} · v${esc(g.version)}</div></a>`
}

for (const lang of ['zh', 'en']) {
  const t = T[lang], base = lang === 'zh' ? '/' : '/en/'
  const listed = games.filter(g => g.status === 'listed')
  const lead = listed.slice().sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))[0]

  // home
  page(lang, '', '', `
<section class="hero"${lead ? ` style="background-image:url('/games/${lead.id}/${esc(lead.manifest.cover)}')"` : ''}><div class="in">
  <h1>${esc(t.site)}</h1>
  <p class="lead">${esc(t.lead)}</p>
  <p class="row"><a class="btn" href="${base}install/">${esc(t.getStore)}</a><a class="btn ghost" href="${base}publish/">${esc(t.publishYours)}</a></p>
</div></section>
<section class="in" id="games"><h2>${esc(t.all)}</h2>
${listed.length ? `<div class="grid">${listed.map(g => card(lang, g)).join('\n')}</div>` : `<p class="muted">${esc(t.none)}</p>`}
</section>`)

  // one page per game
  for (const g of games) {
    const m = g.manifest
    const name = pickText(m.name, t.lang)
    const rows = [
      [t.version, esc(g.version)],
      [t.author, m.author.url ? `<a href="${esc(m.author.url)}">${esc(m.author.name)}</a>` : esc(m.author.name)],
      [t.license, esc(g.license)],
      [t.download, mb(g.tarballBytes)],
      [t.size, mb(g.packageBytes)],
      [t.languages, esc(m.languages.map(l => LANG_NAMES[l.toLowerCase()] ?? l).join(t.sep))],
      [t.controls, esc(m.controls.map(c => t.control[c]).join(t.sep))],
      [t.players, m.players.max > 1 ? t.playersRange(m.players.min, m.players.max) : t.playersOne],
      [t.rating, esc([t.ratingName[m.content.rating], pickText(m.content.notes, t.lang)].filter(Boolean).join(' · '))],
      [t.pkg, `<a href="https://www.npmjs.com/package/${esc(g.package)}">${esc(g.package)}</a>`],
      [t.source, `<a href="${esc(g.repository)}">${esc(g.repository.replace('https://github.com/', ''))}</a>`],
      [t.checksum, `<span class="mono">${esc(g.integrity)}</span>`],
    ]
    const shots = [{ src: m.cover }, ...m.screenshots]
    const videos = (m.videos ?? []).map(v => `<figure><video controls preload="metadata" playsinline${v.poster ? ` poster="/games/${g.id}/${esc(v.poster)}"` : ''} src="/games/${g.id}/${esc(v.src)}"></video>${v.caption ? `<figcaption>${esc(pickText(v.caption, t.lang))}</figcaption>` : ''}</figure>`).join('')
    const label = `game:${g.id}`
    const board = `<h2>${esc(t.board)}</h2>
    <div class="board" data-repo="${BOARD_REPO}" data-label="${esc(label)}" data-empty="${esc(t.boardEmpty)}" data-fail="${esc(t.boardFail)}" data-replies="${esc(t.replies)}"><p class="muted">${esc(t.boardLoading)}</p></div>
    <p class="row"><a class="btn small" href="${REPO}/issues/new?template=message.yml&game=${encodeURIComponent(g.id)}">${esc(t.boardPost)}</a><a class="more" href="${REPO}/issues?q=${encodeURIComponent(`is:issue label:${label}`)}">${esc(t.boardAll)}</a></p>
    <script src="/board.js" defer></script>`
    page(lang, `games/${g.id}/`, name, `
<section class="in game">
  ${g.preview ? `<p class="note">${esc(t.preview)}</p>` : ''}${g.status !== 'listed' ? `<p class="note warn">${esc(t.delisted + (g.reason ?? ''))}</p>` : ''}
  <div class="ghead"><img src="/games/${g.id}/${esc(m.icon)}" alt="" width="84" height="84"><div><h1>${esc(name)}</h1>${m.tagline ? `<p class="tagline">${esc(pickText(m.tagline, t.lang))}</p>` : ''}<p>${esc(pickText(m.summary, t.lang))}</p></div>${g.status === 'listed' ? `<a class="btn play" href="${base}games/${g.id}/play/">${esc(t.playWeb)}</a>` : ''}</div>
  <div class="shots">${videos}${shots.map(s => `<figure><a href="/games/${g.id}/${esc(s.src)}"><img src="/games/${g.id}/${esc(s.src)}" alt="${esc(pickText(s.caption, t.lang))}" loading="lazy"></a>${s.caption ? `<figcaption>${esc(pickText(s.caption, t.lang))}</figcaption>` : ''}</figure>`).join('')}</div>
  <div class="cols"><div>
    <h2>${esc(t.about)}</h2><div class="md">${renderMarkdown(pickText(g.about, t.lang), { link: href => (/^https:\/\//.test(href) ? href : ''), image: () => '' })}</div>
    <h2>${esc(t.how)}</h2><p>${esc(t.howText)} <a href="${base}install/">${esc(t.howLink)}</a></p>
    ${board}
  </div><div>
    <h2>${esc(t.info)}</h2><dl class="info">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>
  </div></div>
</section>`, { description: pickText(m.summary, t.lang) })
  }

  // play pages: the game in a frame that fills the window
  for (const g of games.filter(x => x.status === 'listed')) {
    const m = g.manifest, name = pickText(m.name, t.lang)
    const manualRel = m.manual ? (m.manual[t.lang.toLowerCase()] ?? m.manual[t.lang.toLowerCase().split('-')[0]] ?? m.manual.en ?? Object.values(m.manual)[0]) : ''
    const file = join(out, lang === 'zh' ? '' : 'en', 'games', g.id, 'play', 'index.html')
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(name)} · ${esc(t.site)}</title>
<link rel="icon" href="/games/${g.id}/${esc(m.icon)}">
<style>
html,body{margin:0;height:100%;background:#000;overflow:hidden}
iframe{position:fixed;inset:0;width:100%;height:100%;border:0;background:#000}
.hot{position:fixed;top:0;left:50%;width:260px;height:12px;transform:translateX(-50%);z-index:2;display:flex;justify-content:center}
.hot i{width:44px;height:4px;margin-top:4px;border-radius:4px;background:rgba(255,255,255,.35);box-shadow:0 0 0 1px rgba(0,0,0,.25)}
.bar{position:fixed;top:10px;left:50%;z-index:3;display:flex;align-items:center;gap:2px;padding:5px 6px 5px 12px;border-radius:999px;background:rgba(18,20,28,.86);color:#fff;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;white-space:nowrap;box-shadow:0 6px 24px rgba(0,0,0,.4);transform:translate(-50%,-64px);opacity:0;transition:transform .22s,opacity .22s}
.bar.on{transform:translate(-50%,0);opacity:1}
.bar b{display:flex;align-items:center;gap:8px;margin-right:8px}.bar img{width:20px;height:20px;border-radius:5px}
.bar a,.bar button{padding:5px 12px;border-radius:999px;color:#fff;text-decoration:none;font:inherit;background:none;border:0;cursor:pointer}
.bar a:hover,.bar button:hover{background:rgba(255,255,255,.16)}
</style>
</head>
<body>
<iframe id="f" title="${esc(name)}" sandbox="allow-scripts allow-same-origin allow-pointer-lock" allow="fullscreen; gamepad; autoplay" allowfullscreen referrerpolicy="no-referrer"></iframe>
<div class="hot" id="hot"><i></i></div>
<div class="bar" id="bar"><b><img src="/games/${g.id}/${esc(m.icon)}" alt="">${esc(name)}</b><button id="full">${esc(t.playFull)}</button>${manualRel ? `<a id="manual" target="_blank" rel="noopener">${esc(t.playManual)}</a>` : ''}<a href="${base}games/${g.id}/">${esc(t.playBack)}</a></div>
<script>
// On the real site the game is served from its own subdomain; in a local preview, from a folder of this server.
var live = location.hostname === ${JSON.stringify(DOMAIN)} || location.hostname === ${JSON.stringify('www.' + DOMAIN)};
var root = live ? 'https://' + ${JSON.stringify(g.id + PLAY_SUFFIX)} + '/' : '/_play/' + ${JSON.stringify(g.id)} + '/';
var f = document.getElementById('f'), bar = document.getElementById('bar'), timer;
f.src = root + ${JSON.stringify(m.entry.split('/').map(encodeURIComponent).join('/'))};
f.addEventListener('load', function () { try { f.focus(); } catch (e) {} });
var man = document.getElementById('manual'); if (man) man.href = root + ${JSON.stringify(String(manualRel).split('/').map(encodeURIComponent).join('/'))};
function show(ms) { bar.classList.add('on'); clearTimeout(timer); timer = setTimeout(function () { bar.classList.remove('on'); }, ms || 2500); }
document.getElementById('hot').addEventListener('mouseenter', function () { show(); });
document.getElementById('hot').addEventListener('click', function () { show(4000); });
bar.addEventListener('mouseenter', function () { clearTimeout(timer); });
bar.addEventListener('mouseleave', function () { show(1200); });
document.getElementById('full').addEventListener('click', function () { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(function () {}); try { f.focus(); } catch (e) {} });
show(3000);
</script>
</body>
</html>
`)
  }

  // documents
  const docs = [
    ['install/', lang === 'zh' ? 'docs/install.zh.md' : 'docs/install.en.md'],
    ['publish/', lang === 'zh' ? 'docs/publish.zh.md' : 'docs/publish.en.md'],
    ['spec/', lang === 'zh' ? 'SPEC.md' : 'SPEC.en.md'],
  ]
  for (const [path, file] of docs) {
    if (!existsSync(join(root, file))) { console.warn(`warning: ${file} is missing; ${path} was not built for ${lang}`); continue }
    const src = readFileSync(join(root, file), 'utf8')
    const title = (/^#\s+(.+)$/m.exec(src) ?? [])[1] ?? path
    // Links between the documents become links between the pages.
    const link = href => {
      if (/^(https?:|mailto:|#)/.test(href)) return href
      const [p, hash] = href.split('#')
      const to = /SPEC(\.en)?\.md$/.test(p) ? 'spec/' : /publish\.(zh|en)\.md$/.test(p) ? 'publish/' : /install\.(zh|en)\.md$/.test(p) ? 'install/' : null
      if (to) return base + to + (hash ? `#${hash}` : '')
      return `${REPO}/blob/main/${p.replace(/^(\.\.\/|\.\/)+/, '')}${hash ? `#${hash}` : ''}`
    }
    page(lang, path, title, `<article class="in doc md">${renderMarkdown(src, { headingIds: true, link })}</article>`)
  }
}
// ------------------------------------------------------------------ hosting (Vercel)
const host = DOMAIN.replaceAll('.', '\\.')
const playHost = { type: 'host', value: `(?<game>[a-z0-9-]+)\\.play\\.${host}` }
const GAME_CSP = `default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' data: blob:; object-src 'none'; form-action 'none'; base-uri 'self'; frame-ancestors https://${DOMAIN} https://www.${DOMAIN}`
const routing = {
  cleanUrls: false,
  trailingSlash: true,
  // <id>.play.dsh-game-store.com/… serves the files of that one game, and nothing else.
  rewrites: [{ source: '/:path*', has: [playHost], destination: '/_play/:game/:path*' }],
  // On the store's own address the game files are not served: a game never runs as the store's site.
  redirects: [{ source: '/_play/:game/:path*', has: [{ type: 'host', value: `(www\\.)?${host}` }], destination: `https://:game.play.${DOMAIN}/:path*`, permanent: false }],
  headers: [
    { source: '/(.*)', has: [playHost], headers: [{ key: 'Content-Security-Policy', value: GAME_CSP }, { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'no-referrer' }] },
    { source: '/(catalog|dsh-index)\\.json', headers: [{ key: 'Cache-Control', value: 'public, max-age=300' }, { key: 'Access-Control-Allow-Origin', value: '*' }] },
    { source: '/games/(.*)\\.(png|jpg|jpeg|webp|mp4|webm)', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }] },
  ],
}
// dist/vercel.json is for deploying the built folder as it is; the one at the repository root is for builds on Vercel from git.
writeFileSync(join(out, 'vercel.json'), JSON.stringify({ $schema: 'https://openapi.vercel.sh/vercel.json', framework: null, ...routing }, null, 2))
writeFileSync(join(root, 'vercel.json'), `${JSON.stringify({ $schema: 'https://openapi.vercel.sh/vercel.json', framework: null, installCommand: 'true', buildCommand: 'node site/build.mjs', outputDirectory: 'site/dist', ...routing }, null, 2)}\n`)

console.log(`site → ${out}  (${games.length} game${games.length === 1 ? '' : 's'})`)
