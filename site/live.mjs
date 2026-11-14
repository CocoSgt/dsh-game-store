/**
 * The catalog as the site serves it, read live: the entries from this repository on GitHub, each game's manifest and
 * description from the npm CDN, sizes and dates from the npm registry. Used by the site's server function
 * (api/page.mjs) so a merged pull request shows on dsh-game-store.com within minutes, with no new deployment.
 * Nothing from a game package is run; only its JSON and Markdown are read.
 *
 * catalog/index.json lists the entries in the order they were submitted:
 *   { "games": ["<id>", …], "workshop": { "<game id>": ["<extension id>", …] } }
 */

export const SITE = 'https://dsh-game-store.com'
export const DOMAIN = 'dsh-game-store.com'
export const PLAY_SUFFIX = `.play.${DOMAIN}`
export const REPO = 'https://github.com/CocoSgt/dsh-game-store'
const RAW = 'https://raw.githubusercontent.com/CocoSgt/dsh-game-store/main/'
const CDN = 'https://cdn.jsdelivr.net/npm'
const REGISTRY = 'https://registry.npmjs.org'
const UA = { 'user-agent': 'dsh-game-store-site' }

async function get(url, as = 'json') {
  const r = await fetch(url, { headers: UA })
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`)
  return as === 'json' ? r.json() : r.text()
}
const fileUrl = (entry, rel) => `${CDN}/${entry.package}@${entry.version}/${rel}`

/** What npm says about one exact version: license, sizes, publish date. The checksum must match the catalog's. */
async function npmFacts(entry) {
  const doc = await get(`${REGISTRY}/${entry.package.replace('/', '%2F')}`)
  const v = doc.versions?.[entry.version]
  if (!v) throw new Error(`${entry.package}@${entry.version} is not on npm`)
  if (entry.integrity && v.dist?.integrity !== entry.integrity) throw new Error(`${entry.package}@${entry.version}: the checksum differs from the catalog`)
  let tarballBytes
  // The registry gives no length for a HEAD request; the first byte of a ranged GET carries the total size.
  try { const h = await fetch(v.dist.tarball, { headers: { ...UA, range: 'bytes=0-0' } }); tarballBytes = Number(/\/(\d+)$/.exec(h.headers.get('content-range') ?? '')?.[1]) || undefined; await h.body?.cancel() } catch { /* size unknown */ }
  return { license: v.license, packageBytes: v.dist?.unpackedSize, tarballBytes, publishedAt: doc.time?.[entry.version] }
}

async function oneGame(id) {
  const entry = await get(`${RAW}catalog/games/${id}.json`)
  const [facts, manifest] = await Promise.all([npmFacts(entry), get(fileUrl(entry, 'game.json'))])
  const about = {}
  await Promise.all(Object.entries(manifest.about ?? {}).map(async ([lang, rel]) => { about[lang] = await get(fileUrl(entry, rel), 'text') }))
  const cdn = `${CDN}/${entry.package}@${entry.version}/`
  return {
    id, package: entry.package, version: entry.version, integrity: entry.integrity, repository: entry.repository,
    status: entry.status ?? 'listed', ...(entry.reason ? { reason: entry.reason } : {}),
    addedAt: entry.addedAt, updatedAt: (facts.publishedAt ?? '').slice(0, 10) || entry.addedAt,
    license: facts.license, packageBytes: facts.packageBytes, tarballBytes: facts.tarballBytes,
    manifest, about, assets: cdn, cdn, local: [],
  }
}

async function oneExtension(gameId, id) {
  const entry = await get(`${RAW}catalog/workshop/${gameId}/${id}.json`)
  const [facts, manifest] = await Promise.all([npmFacts(entry), get(fileUrl(entry, 'extension.json'))])
  return {
    id, game: gameId, package: entry.package, version: entry.version, integrity: entry.integrity, repository: entry.repository,
    status: entry.status ?? 'listed', ...(entry.reason ? { reason: entry.reason } : {}), addedAt: entry.addedAt,
    license: facts.license, packageBytes: facts.packageBytes, tarballBytes: facts.tarballBytes, manifest,
  }
}

/** All games in submission order, each with its listed extensions. A game that cannot be read is left out and logged. */
export async function liveGames() {
  const index = await get(`${RAW}catalog/index.json`)
  const games = (await Promise.all((index.games ?? []).map(id => oneGame(id).catch(err => { console.error(`game ${id}: ${err.message}`); return null })))).filter(Boolean)
  await Promise.all(Object.entries(index.workshop ?? {}).map(async ([gameId, ids]) => {
    const g = games.find(x => x.id === gameId)
    if (!g || !g.manifest.workshop) return
    const list = await Promise.all(ids.map(id => oneExtension(gameId, id).catch(err => { console.error(`extension ${gameId}/${id}: ${err.message}`); return null })))
    const ok = list.filter(Boolean).filter(x => x.manifest.game === gameId && x.manifest.types.every(t => g.manifest.workshop.types.includes(t)))
    if (ok.length) g.workshop = ok
  }))
  return games
}

/** catalog.json, what the store plugin reads. */
export const catalogDoc = games => ({ format: 1, title: 'DSH Game Store', site: SITE, community: { repo: REPO.replace('https://github.com/', '') }, generatedAt: new Date().toISOString(), games })

/** The same games as a DSH plugin index, for DSH's "Discover" tab. */
export function dshIndex(games, storePkg) {
  const stamp = d => Math.floor(Date.parse(d || new Date().toISOString()) / 1000)
  return {
    format: 1,
    title: { en: 'DSH Game Store', zh: 'DSH 游戏商店' },
    description: { en: 'The game store plugin and the games in its catalog.', zh: '游戏商店插件，以及目录里的游戏。' },
    metadata: { categories: { store: { title: { en: 'Store', zh: '商店' } }, game: { title: { en: 'Games', zh: '游戏' } } } },
    plugins: [
      { name: 'dsh-game-store', icon: 'logo.png', title: { en: 'Game Store', zh: '游戏商店' }, description: { en: storePkg.description, zh: 'DSH 上的游戏商店：浏览目录、看说明、安装、启动、更新、卸载。' }, author: 'CocoSgt', homepage: SITE, repository: { url: REPO }, metadata: { category: 'store' },
        versions: [{ version: storePkg.version, publishTimestamp: stamp(), source: { type: 'npm' }, engines: { dsh: storePkg.engines?.dsh } }] },
      ...games.filter(g => g.status === 'listed').map(g => ({
        name: g.package, title: g.manifest.name, description: g.manifest.summary, icon: g.cdn ? `${g.cdn}${g.manifest.icon}` : `games/${g.id}/${g.manifest.icon}`, author: g.manifest.author.name,
        homepage: `${SITE}/games/${g.id}/`, repository: { url: g.repository }, metadata: { category: 'game' },
        versions: [{ version: g.version, publishTimestamp: stamp(g.updatedAt), source: { type: 'npm' } }],
      })),
    ],
  }
}
