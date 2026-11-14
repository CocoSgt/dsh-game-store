#!/usr/bin/env node
/**
 * Build the site (dsh-game-store.com) and the catalog the store plugin reads, from catalog/games/*.json.
 *
 *   node site/build.mjs                      the site for deployment
 *   node site/build.mjs --static [--local <package>=<tarball>]...   every page as a file, for a local preview
 *   node site/build.mjs --snapshot           also refresh catalog-snapshot/, the copy shipped inside the plugin
 *
 * The deployed site reads the catalog live: the pages that show games, catalog.json (what the store plugin reads)
 * and dsh-index.json (DSH's "Discover" tab) come from a server function (site/api/page.mjs, site/live.mjs), so a
 * merged pull request shows within minutes without a new deployment. A deployment carries only the site's own
 * files, the function and the routing.
 * With --static or --snapshot every package is downloaded from npm (never installed, never run), checked against
 * the spec, and the pages are written as files from it.
 */
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { escapeHtml as esc, renderMarkdown } from '../lib/markdown.mjs'
import { fetchPackage, localSources } from '../lib/packages.mjs'
import { buildPages, copySiteAssets } from './pages.mjs'
import { statSync } from 'node:fs'

const CDN = 'https://cdn.jsdelivr.net/npm'
/** jsDelivr refuses very large files (it turned down a 57.9 MB page); those stay on this site. */
const CDN_FILE_LIMIT = 20 * 1024 * 1024
const walkFiles = (dir, base = '') => readdirSync(join(dir, base), { withFileTypes: true }).flatMap(d => d.isDirectory() ? walkFiles(dir, base ? `${base}/${d.name}` : d.name) : [base ? `${base}/${d.name}` : d.name])
import { checkCatalogEntry, checkExtension, checkPackage, checkWorkshopEntry, pickText } from '../lib/spec.mjs'

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
const STATIC = argv.includes('--static')
const SNAPSHOT = argv.includes('--snapshot')
const NEED_GAMES = STATIC || SNAPSHOT
/** Submission order, kept by the reviewer when it merges: { games: [ids], workshop: { game: [ids] } }. */
const INDEX = JSON.parse(readFileSync(join(root, 'catalog/index.json'), 'utf8'))

// ------------------------------------------------------------------ catalog
const games = []
const snapPics = []
let failed = 0
const dir = join(root, 'catalog/games')
for (const file of NEED_GAMES ? readdirSync(dir).filter(f => f.endsWith('.json')).sort() : []) {
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
    // Pictures and game files are read from the npm CDN, from the exact version the catalog names; the site keeps
    // only what the CDN cannot serve: HTML pages (it answers them as plain text) and files over its size limit.
    const cdn = got.source === 'local' ? null : `${CDN}/${entry.package}@${entry.version}/`
    const keep = rel => /\.html?$/i.test(rel) || statSync(join(got.dir, rel)).size > CDN_FILE_LIMIT || !cdn
    const pics = [m.icon, m.cover, ...m.screenshots.map(s => s.src), ...(m.videos ?? []).flatMap(v => [v.src, v.poster].filter(Boolean))]
    for (const rel of pics.filter(keep)) { mkdirSync(dirname(join(out, 'games', id, rel)), { recursive: true }); cpSync(join(got.dir, rel), join(out, 'games', id, rel)) }
    // The copy of the catalog shipped inside the plugin carries its own pictures, so the store looks right offline.
    snapPics.push(...pics.map(rel => ({ id, rel, from: join(got.dir, rel) })))
    const playDir = join(out, '_play', id)
    rmSync(playDir, { recursive: true, force: true })
    const localFiles = []
    for (const top of ['game', ...(m.manual ? ['manual'] : [])]) for (const f of walkFiles(join(got.dir, top))) {
      const rel = `${top}/${f}`
      if (!keep(rel)) continue
      mkdirSync(dirname(join(playDir, rel)), { recursive: true }); cpSync(join(got.dir, rel), join(playDir, rel)); localFiles.push(rel)
    }
    games.push({
      id, package: entry.package, version: entry.version, integrity: entry.integrity, repository: entry.repository,
      status: entry.status ?? 'listed', ...(entry.reason ? { reason: entry.reason } : {}),
      addedAt: entry.addedAt, updatedAt: (got.publishedAt ?? '').slice(0, 10) || entry.addedAt,
      license: check.pkg.license, packageBytes: check.bytes, tarballBytes: got.tarballBytes,
      manifest: m, about, assets: cdn ?? `games/${id}/`, cdn, local: localFiles,
      ...(got.source === 'local' ? { preview: true } : {}),
    })
    console.log(`✓ ${id}  ${entry.package}@${entry.version}${got.source === 'local' ? '  (local tarball)' : ''}`)
  } catch (err) { console.error(`✗ ${file}: ${err.message}`); failed++ }
}
// ------------------------------------------------------------------ workshop: extensions, grouped under their game
const wdir = join(root, 'catalog/workshop')
for (const gameId of NEED_GAMES && existsSync(wdir) ? readdirSync(wdir).filter(f => !f.startsWith('.')).sort() : []) {
  const game = games.find(g => g.id === gameId)
  for (const file of readdirSync(join(wdir, gameId)).filter(f => f.endsWith('.json')).sort()) {
    const id = file.replace(/\.json$/, ''), where = `workshop/${gameId}/${file}`
    try {
      if (!game) throw new Error(`there is no game "${gameId}" in the catalog`)
      const entry = JSON.parse(readFileSync(join(wdir, gameId, file), 'utf8'))
      const r = checkWorkshopEntry(entry, gameId, id)
      if (r.errors.length) throw new Error(r.errors.join('; '))
      const got = await fetchPackage(entry, { local: local[entry.package], cacheDir: join(root, '.cache') })
      const check = checkExtension(got.dir)
      if (!check.ok) throw new Error(check.errors.join('; '))
      const m = check.manifest
      if (m.id !== id || m.game !== gameId) throw new Error(`the package is extension "${m.id}" for game "${m.game}"`)
      if (check.pkg.name !== entry.package || check.pkg.version !== entry.version) throw new Error(`the tarball is ${check.pkg.name}@${check.pkg.version}`)
      const extra = m.types.filter(t => ![...(game.manifest.workshop?.types ?? []), 'script'].includes(t))
      if (extra.length) throw new Error(`${gameId} does not accept extensions of type ${extra.join(', ')}`)
      ;(game.workshop ??= []).push({
        id, game: gameId, package: entry.package, version: entry.version, integrity: entry.integrity, repository: entry.repository,
        status: entry.status ?? 'listed', ...(entry.reason ? { reason: entry.reason } : {}), addedAt: entry.addedAt,
        license: check.pkg.license, packageBytes: check.bytes, tarballBytes: got.tarballBytes, manifest: m,
        ...(got.source === 'local' ? { preview: true } : {}),
      })
      console.log(`✓ ${gameId}/${id}  ${entry.package}@${entry.version}${got.source === 'local' ? '  (local tarball)' : ''}`)
    } catch (err) { console.error(`✗ ${where}: ${err.message}`); failed++ }
  }
}

// Games are listed in the order they were submitted (catalog/index.json); anything missing from it goes last.
{
  const at = id => { const i = (INDEX.games ?? []).indexOf(id); return i < 0 ? 1e9 : i }
  games.sort((a, b) => at(a.id) - at(b.id) || a.id.localeCompare(b.id))
}

if (failed && !argv.includes('--keep-going')) { console.error(`\n${failed} game(s) failed. Nothing was written.`); process.exit(1) }

for (const f of ['catalog.json', 'dsh-index.json', 'index.html', 'en', 'games', 'workshop', 'publish', 'install', 'docs', 'spec', '_play', 'api']) rmSync(join(out, f), { recursive: true, force: true })
mkdirSync(out, { recursive: true })
// Message boards live on GitHub: one issue per message in this repository, labelled game:<id>.
const BOARD_REPO = REPO.replace('https://github.com/', '')
const catalog = { format: 1, title: 'DSH Game Store', site: SITE, community: { repo: BOARD_REPO }, generatedAt: new Date().toISOString(), games }
if (STATIC) writeFileSync(join(out, 'catalog.json'), JSON.stringify(catalog, null, 1))

// The same list in DSH's own plugin index format, for DSH's "Discover" tab.
const stamp = d => Math.floor(Date.parse(d || catalog.generatedAt) / 1000)
if (STATIC) writeFileSync(join(out, 'dsh-index.json'), JSON.stringify({
  format: 1,
  title: { en: 'DSH Game Store', zh: 'DSH 游戏商店' },
  description: { en: 'The game store plugin and the games in its catalog.', zh: '游戏商店插件，以及目录里的游戏。' },
  metadata: { categories: { store: { title: { en: 'Store', zh: '商店' } }, game: { title: { en: 'Games', zh: '游戏' } } } },
  plugins: [
    { name: 'dsh-game-store', icon: 'logo.png', title: { en: 'Game Store', zh: '游戏商店' }, description: { en: storePkg.description, zh: 'DSH 上的游戏商店：浏览目录、看说明、安装、启动、更新、卸载。' }, author: 'CocoSgt', homepage: SITE, repository: { url: REPO }, metadata: { category: 'store' },
      versions: [{ version: storePkg.version, publishTimestamp: stamp(), source: { type: 'npm' }, engines: { dsh: storePkg.engines.dsh } }] },
    ...games.filter(g => g.status === 'listed').map(g => ({
      name: g.package, title: g.manifest.name, description: g.manifest.summary, icon: g.cdn ? `${g.cdn}${g.manifest.icon}` : `games/${g.id}/${g.manifest.icon}`, author: g.manifest.author.name,
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
  for (const p of snapPics) { mkdirSync(dirname(join(snap, 'games', p.id, p.rel)), { recursive: true }); cpSync(p.from, join(snap, 'games', p.id, p.rel)) }
  console.log('catalog-snapshot/ updated')
}

// ------------------------------------------------------------------ pages
if (STATIC) buildPages({ root, out, games, SITE, REPO, DOMAIN, PLAY_SUFFIX })
else {
  copySiteAssets({ root, out })
  // What the page function needs beside it: the renderer, the live catalog reader, the documents.
  const lib = join(out, 'api', '_lib')
  mkdirSync(join(lib, 'docs', 'docs'), { recursive: true })
  const fix = src => src.replaceAll("'../lib/markdown.mjs'", "'./markdown.mjs'").replaceAll("'../lib/spec.mjs'", "'./spec.mjs'")
  writeFileSync(join(lib, 'pages.mjs'), fix(readFileSync(join(root, 'site/pages.mjs'), 'utf8')))
  for (const f of ['site/live.mjs', 'lib/markdown.mjs', 'lib/spec.mjs']) cpSync(join(root, f), join(lib, f.split('/').pop()))
  writeFileSync(join(lib, 'store.json'), JSON.stringify({ version: storePkg.version, description: storePkg.description, engines: storePkg.engines }))
  writeFileSync(join(lib, 'package.json'), '{"type":"module"}\n')
  for (const f of ['SPEC.md', 'SPEC.en.md']) cpSync(join(root, f), join(lib, 'docs', f))
  for (const f of readdirSync(join(root, 'docs')).filter(f => f.endsWith('.md'))) cpSync(join(root, 'docs', f), join(lib, 'docs', 'docs', f))
}

// ------------------------------------------------------------------ hosting (Vercel)
const host = DOMAIN.replaceAll('.', '\\.')
const playHost = { type: 'host', value: `(?<game>[a-z0-9-]+)\\.play\\.${host}` }
// Each game host answers with that game's own policy: its files, plus the servers its manifest declares.
const cspBase = extra => `default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' data: blob:${extra}; object-src 'none'; form-action 'none'; base-uri 'self'; frame-ancestors https://${DOMAIN} https://www.${DOMAIN}`
const cspOf = g => cspBase(g.status === 'listed' ? (g.manifest.network?.hosts ?? []).map(h => ` ${h}`).join('') : '')
const gameHost = id => ({ type: 'host', value: `${id.replaceAll('-', '\\-')}\\.play\\.${host}` })
// A game's files: /v/<package>@<version>/… on its host, from the npm CDN at exactly that version. HTML pages come from
// unpkg (jsDelivr answers them as plain text), which also serves files over jsDelivr's size limit.
const PKG = ':pkg([a-z0-9][a-z0-9._-]*@[0-9][0-9A-Za-z.+-]*)'
const PAGE = ':page((?:en/)?(?:games|workshop|publish|install|docs|spec)(?:/.*)?)'
const routing = {
  cleanUrls: false,
  trailingSlash: true,
  rewrites: [
    ...(STATIC ? games.map(g => ({ source: `/v/:pkg/:path*`, has: [gameHost(g.id)], destination: `/_play/${g.id}/:path*` })) : [
      // On the website a game has no DSH model: the helper says so, and the game carries on without it.
      { source: '/__dsh/ai.js', has: [playHost], destination: '/dsh-ai-web.js' },
      { source: `/v/${PKG}/:path(.*\\.html?)`, has: [playHost], destination: 'https://unpkg.com/:pkg/:path' },
      { source: `/v/${PKG}/:path*`, has: [playHost], destination: 'https://cdn.jsdelivr.net/npm/:pkg/:path*' },
      // The store's own pages and catalog, rendered from the live catalog.
      { source: '/catalog.json', destination: '/api/page?f=catalog' },
      { source: '/dsh-index.json', destination: '/api/page?f=index' },
      { source: '/', destination: '/api/page?p=' },
      { source: '/en/', destination: '/api/page?p=en/' },
      { source: `/${PAGE}`, destination: '/api/page?p=:page' },
    ]),
  ],
  redirects: [
    // Someone opening a game host directly in the address bar lands on the page of this site instead:
    // visitors only ever see dsh-game-store.com/… addresses. (Frames ask with another Sec-Fetch-Dest and are served.)
    { source: '/v/:pkg/manual/:path*', has: [playHost, { type: 'header', key: 'sec-fetch-dest', value: 'document' }], destination: `https://${DOMAIN}/games/:game/manual/`, permanent: false },
    { source: '/:path*', has: [playHost, { type: 'header', key: 'sec-fetch-dest', value: 'document' }], destination: `https://${DOMAIN}/games/:game/play/`, permanent: false },
  ],
  headers: [
    // Games may go online freely; the host keeps them in frames of this site and away from its sign-in cookie.
    { source: '/(.*)', has: [playHost], headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'Content-Security-Policy', value: cspBase(' *') }] },
    // Game files keep their names between releases, so they are cached for a while and refreshed in the background:
    // pictures, fonts and sounds for a day, scripts for an hour. A versioned path never changes, so the CDN keeps it.
    { source: '/(.*)\\.(webp|png|jpg|jpeg|gif|avif|woff2|woff|ttf|otf|mp3|ogg|wav|m4a|mp4|webm)', has: [playHost], headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
    { source: '/(.*)\\.(js|mjs|css|json|wasm)', has: [playHost], headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }] },
    { source: '/SKILL.md', headers: [{ key: 'Content-Type', value: 'text/markdown; charset=utf-8' }, { key: 'Access-Control-Allow-Origin', value: '*' }] },
  ],
  ...(STATIC ? {} : { functions: { 'api/page.mjs': { includeFiles: 'api/_lib/**', maxDuration: 30 } } }),
}
// dist/vercel.json is for deploying the built folder as it is; the one at the repository root is for builds on Vercel from git.
writeFileSync(join(out, 'vercel.json'), JSON.stringify({ $schema: 'https://openapi.vercel.sh/vercel.json', framework: null, ...routing }, null, 2))
writeFileSync(join(root, 'vercel.json'), `${JSON.stringify({ $schema: 'https://openapi.vercel.sh/vercel.json', framework: null, installCommand: 'true', buildCommand: 'node site/build.mjs', outputDirectory: 'site/dist', ...routing }, null, 2)}\n`)

console.log(`site → ${out}  (${games.length} game${games.length === 1 ? '' : 's'})`)
