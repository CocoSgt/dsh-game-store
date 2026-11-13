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
import { buildPages } from './pages.mjs'
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
// ------------------------------------------------------------------ workshop: extensions, grouped under their game
const wdir = join(root, 'catalog/workshop')
for (const gameId of existsSync(wdir) ? readdirSync(wdir).filter(f => !f.startsWith('.')).sort() : []) {
  const game = games.find(g => g.id === gameId)
  for (const file of readdirSync(join(wdir, gameId)).filter(f => f.endsWith('.json')).sort()) {
    const id = file.replace(/\.json$/, ''), where = `workshop/${gameId}/${file}`
    try {
      if (!game) throw new Error(`there is no game "${gameId}" in the catalog`)
      if (!game.manifest.workshop) throw new Error(`${gameId} does not accept extensions (no "workshop" in its game.json)`)
      const entry = JSON.parse(readFileSync(join(wdir, gameId, file), 'utf8'))
      const r = checkWorkshopEntry(entry, gameId, id)
      if (r.errors.length) throw new Error(r.errors.join('; '))
      const got = await fetchPackage(entry, { local: local[entry.package], cacheDir: join(root, '.cache') })
      const check = checkExtension(got.dir)
      if (!check.ok) throw new Error(check.errors.join('; '))
      const m = check.manifest
      if (m.id !== id || m.game !== gameId) throw new Error(`the package is extension "${m.id}" for game "${m.game}"`)
      if (check.pkg.name !== entry.package || check.pkg.version !== entry.version) throw new Error(`the tarball is ${check.pkg.name}@${check.pkg.version}`)
      const extra = m.types.filter(t => !game.manifest.workshop.types.includes(t))
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
    { name: 'dsh-game-store', icon: 'logo.png', title: { en: 'Game Store', zh: '游戏商店' }, description: { en: storePkg.description, zh: 'DSH 上的游戏商店：浏览目录、看说明、安装、启动、更新、卸载。' }, author: 'CocoSgt', homepage: SITE, repository: { url: REPO }, metadata: { category: 'store' },
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
buildPages({ root, out, games, SITE, REPO, DOMAIN, PLAY_SUFFIX })

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
  redirects: [
    // Someone opening a game host directly in the address bar lands on the page of this site instead:
    // visitors only ever see dsh-game-store.com/… addresses. (Frames ask with another Sec-Fetch-Dest and are served.)
    { source: '/manual/:path*', has: [playHost, { type: 'header', key: 'sec-fetch-dest', value: 'document' }], destination: `https://${DOMAIN}/games/:game/manual/`, permanent: false },
    { source: '/:path*', has: [playHost, { type: 'header', key: 'sec-fetch-dest', value: 'document' }], destination: `https://${DOMAIN}/games/:game/play/`, permanent: false },
    { source: '/_play/:game/:path*', has: [{ type: 'host', value: `(www\\.)?${host}` }], destination: `https://:game.play.${DOMAIN}/:path*`, permanent: false },
  ],
  headers: [
    { source: '/(.*)', has: [playHost], headers: [{ key: 'Content-Security-Policy', value: GAME_CSP }, { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'no-referrer' }] },
    // Game files keep their names between releases, so they are cached for a while and refreshed in the background:
    // pictures, fonts and sounds for a day, scripts for an hour. The entry page is always asked for again.
    { source: '/(.*)\\.(webp|png|jpg|jpeg|gif|avif|woff2|woff|ttf|otf|mp3|ogg|wav|m4a|mp4|webm)', has: [playHost], headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
    { source: '/(.*)\\.(js|mjs|css|json|wasm)', has: [playHost], headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }] },
    { source: '/SKILL.md', headers: [{ key: 'Content-Type', value: 'text/markdown; charset=utf-8' }, { key: 'Access-Control-Allow-Origin', value: '*' }] },
    { source: '/(catalog|dsh-index)\\.json', headers: [{ key: 'Cache-Control', value: 'public, max-age=300' }, { key: 'Access-Control-Allow-Origin', value: '*' }] },
    { source: '/games/(.*)\\.(png|jpg|jpeg|webp|mp4|webm)', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }] },
  ],
}
// dist/vercel.json is for deploying the built folder as it is; the one at the repository root is for builds on Vercel from git.
writeFileSync(join(out, 'vercel.json'), JSON.stringify({ $schema: 'https://openapi.vercel.sh/vercel.json', framework: null, ...routing }, null, 2))
writeFileSync(join(root, 'vercel.json'), `${JSON.stringify({ $schema: 'https://openapi.vercel.sh/vercel.json', framework: null, installCommand: 'true', buildCommand: 'node site/build.mjs', outputDirectory: 'site/dist', ...routing }, null, 2)}\n`)

console.log(`site → ${out}  (${games.length} game${games.length === 1 ? '' : 's'})`)
