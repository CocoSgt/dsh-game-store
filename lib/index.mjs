/**
 * dsh-game-store, host half.
 *
 * - reads the game catalog (network, then the last saved copy, then the copy shipped in this package);
 * - installs, updates and removes game packages through DSH's own plugin manager,
 *   only the package and version the catalog names, and only when the checksum matches;
 * - serves each installed game from its own local address, so games share nothing with DSH or each other;
 * - answers the store page under /game-store/api/*.
 *
 * Plain JavaScript on purpose: no build step, no dependencies.
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createServer as createNetServer } from 'node:net'
import { homedir } from 'node:os'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderMarkdown } from './markdown.mjs'
import { checkExtension, checkPackage, gameVersionOk, pickText, sha512Integrity } from './spec.mjs'

export const name = 'dsh-game-store'
export const inject = ['webServer']

const HERE = dirname(fileURLToPath(import.meta.url))
const SNAPSHOT = resolve(HERE, '../catalog-snapshot')
const VERSION = (() => { try { return JSON.parse(readFileSync(resolve(HERE, '../package.json'), 'utf8')).version } catch { return '0.0.0' } })()
const DEFAULT_CATALOG = 'https://dsh-game-store.com/catalog.json'
const DAY = 24 * 3600_000

const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.avif': 'image/avif',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.wasm': 'application/wasm', '.bin': 'application/octet-stream', '.pdf': 'application/pdf',
}

/**
 * What a game page may do. It loads files from its own address only: no other site, no DSH API.
 * Inline scripts and eval stay allowed because many web games need them.
 */
const GAME_CSP = [
  "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
  "connect-src 'self' data: blob:",
  "object-src 'none'",
  "form-action 'none'",
  "base-uri 'self'",
].join('; ')

/** Only answer loopback hosts: these routes have no login of their own. */
function trusted(req) {
  const host = String(req.headers.host ?? '').replace(/:\d+$/, '')
  return host === '127.0.0.1' || host === 'localhost' || host === '[::1]'
}

async function readJson(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

/** An error whose message is meant for the player. `code` picks the translated text on the page. */
class StoreError extends Error {
  constructor(code, detail) { super(detail ? `${code}: ${detail}` : code); this.code = code; this.detail = detail }
}

function readJsonFile(file, fallback) {
  try { return JSON.parse(readFileSync(file, 'utf8')) } catch { return fallback }
}

function portFree(port) {
  return new Promise(done => {
    const s = createNetServer()
    s.once('error', () => done(false))
    s.listen(port, '127.0.0.1', () => s.close(() => done(true)))
  })
}

export function apply(ctx, config = {}) {
  const logger = ctx.logger?.('dsh-game-store')
  const log = msg => { if (logger?.info) logger.info(msg); else console.log(`[dsh-game-store] ${msg}`) }
  const service = key => { try { return ctx.get?.(key) } catch { return undefined } }
  const profile = () => service('profileContext')
  const manager = () => service('pluginManager')

  const home = () => profile()?.home ?? process.env.DSH_HOME ?? join(homedir(), '.dsh')
  const dataDir = config.dataDir || join(home(), 'game-store')
  const catalogUrl = config.catalogUrl || DEFAULT_CATALOG
  const portBase = Number(config.portBase) || 19800
  /** Developer option: install these packages from a local tarball instead of npm (the checksum is still compared). */
  const devSources = config.devSources && typeof config.devSources === 'object' ? config.devSources : {}
  mkdirSync(join(dataDir, 'cache'), { recursive: true })

  // ---------------------------------------------------------------- catalog
  /** @type {{ games: any[], generatedAt?: string, from: 'network'|'saved'|'bundled', base: string, fetchedAt?: number, error?: string }} */
  let catalog = { games: [], from: 'bundled', base: '' }
  let loading

  const usable = doc => doc && doc.format === 1 && Array.isArray(doc.games)
  function loadLocal() {
    const saved = readJsonFile(join(dataDir, 'cache', 'catalog.json'))
    if (usable(saved?.doc) && saved.url === catalogUrl) return { ...saved.doc, from: 'saved', base: catalogUrl, fetchedAt: saved.fetchedAt }
    const bundled = readJsonFile(join(SNAPSHOT, 'catalog.json'))
    if (usable(bundled)) return { ...bundled, from: 'bundled', base: '' }
    return { games: [], from: 'bundled', base: '' }
  }
  catalog = loadLocal()

  const refresh = () => loading ??= (async () => {
    try {
      let doc
      if (catalogUrl.startsWith('file:')) doc = JSON.parse(readFileSync(fileURLToPath(catalogUrl), 'utf8'))
      else {
        const r = await fetch(catalogUrl, { signal: AbortSignal.timeout(10_000), headers: { accept: 'application/json' }, redirect: 'error' })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        doc = await r.json()
      }
      if (!usable(doc)) throw new Error('not a game catalog (format 1)')
      const fetchedAt = Date.now()
      writeFileSync(join(dataDir, 'cache', 'catalog.json'), JSON.stringify({ url: catalogUrl, fetchedAt, doc }))
      catalog = { ...doc, from: 'network', base: catalogUrl, fetchedAt }
    } catch (err) {
      catalog = { ...loadLocal(), error: err.message, fetchedAt: Date.now() }
      log(`catalog: ${catalogUrl} not reachable (${err.message}); using the ${catalog.from} copy`)
    }
    loading = undefined
    return catalog
  })()
  void refresh()
  ctx.effect(() => { const t = setInterval(() => void refresh(), DAY); t.unref?.(); return () => clearInterval(t) }, 'dsh-game-store: daily catalog check')

  const entryOf = id => catalog.games.find(g => g.id === id)

  // ---------------------------------------------------------------- installed games
  /** The folder of an installed package in this profile, or undefined. */
  function packageDir(pkg) {
    const dir = profile()?.dir
    if (!dir) return undefined
    const p = join(dir, 'node_modules', ...pkg.split('/'))
    return existsSync(join(p, 'package.json')) ? p : undefined
  }

  /** Every package in the profile that declares a game, by game id. */
  function installedGames() {
    const out = new Map()
    const dir = profile()?.dir
    if (!dir) return out
    const deps = readJsonFile(join(dir, 'package.json'), {})?.dependencies ?? {}
    for (const pkg of Object.keys(deps)) {
      const p = packageDir(pkg)
      if (!p) continue
      const pj = readJsonFile(join(p, 'package.json'))
      if (pj?.dshGame !== './game.json') continue
      const manifest = readJsonFile(join(p, 'game.json'))
      if (!manifest?.id || typeof manifest.id !== 'string') continue
      out.set(manifest.id, { id: manifest.id, package: pkg, version: pj.version, license: pj.license, dir: p, manifest, saved: deps[pkg] })
    }
    return out
  }

  /** The checksum pnpm recorded for an installed package version, read from the profile's lockfile. */
  function lockedIntegrity(pkg, version) {
    const dir = profile()?.dir
    if (!dir) return undefined
    let text
    try { text = readFileSync(join(dir, 'pnpm-lock.yaml'), 'utf8') } catch { return undefined }
    const lines = text.split('\n')
    const head = new RegExp(`^  '?${pkg.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}@(${version.replace(/\./g, '\\.')}|file:[^']*)'?:\\s*$`)
    for (let i = 0; i < lines.length; i++) {
      if (!head.test(lines[i])) continue
      for (let j = i + 1; j < lines.length && /^\s{4,}/.test(lines[j]); j++) {
        const m = /integrity:\s*(sha512-[A-Za-z0-9+/=]+)/.exec(lines[j])
        if (m) return m[1]
      }
    }
    return undefined
  }

  // ---------------------------------------------------------------- workshop: extensions of installed games
  /** Every package in the profile that declares an extension, as "<game>/<id>" -> record. Read at most every 1.5 s. */
  let extCache
  function installedExtensions() {
    if (extCache && Date.now() - extCache.at < 1500) return extCache.map
    const map = new Map()
    const dir = profile()?.dir
    if (dir) {
      const deps = readJsonFile(join(dir, 'package.json'), {})?.dependencies ?? {}
      for (const pkg of Object.keys(deps)) {
        const p = packageDir(pkg)
        if (!p) continue
        const pj = readJsonFile(join(p, 'package.json'))
        if (pj?.dshGameExtension !== './extension.json') continue
        const m = readJsonFile(join(p, 'extension.json'))
        if (typeof m?.id !== 'string' || typeof m?.game !== 'string' || typeof m?.files !== 'string' || !/^[\w-]+$/.test(m.files)) continue
        map.set(`${m.game}/${m.id}`, { id: m.id, game: m.game, package: pkg, version: pj.version, license: pj.license, dir: p, filesDir: join(p, m.files), manifest: m })
      }
    }
    extCache = { at: Date.now(), map }
    return map
  }
  const forgetExtensions = () => { extCache = undefined }

  /** Per game: the order extensions load in, and the ones the player switched off. */
  const workshopFile = join(dataDir, 'workshop.json')
  const workshopState = readJsonFile(workshopFile, {})
  const wstate = game => (workshopState[game] ??= { order: [], off: [] })
  const saveWorkshop = () => writeFileSync(workshopFile, JSON.stringify(workshopState, null, 2))
  const workshopEntry = (game, id) => (entryOf(game)?.workshop ?? []).find(x => x.id === id)

  /** The installed extensions of a game in load order, each with whether it is handed to the game and why not. */
  function extensionsOf(game, gameVersion) {
    const st = wstate(game)
    const list = [...installedExtensions().values()].filter(x => x.game === game)
    list.sort((a, b) => { const i = st.order.indexOf(a.id), j = st.order.indexOf(b.id); return (i < 0 ? 1e9 : i) - (j < 0 ? 1e9 : j) || a.id.localeCompare(b.id) })
    return list.map(x => {
      const entry = workshopEntry(game, x.id)
      const compatible = gameVersion ? gameVersionOk(x.manifest.gameVersion, gameVersion) : true
      const blocked = entry?.status === 'blocked'
      const on = !st.off.includes(x.id)
      return { ...x, on, compatible, blocked, active: on && compatible && !blocked }
    })
  }

  // Each game keeps one local port for good, so its saves (kept by the browser per address) survive updates and reinstalls.
  const portsFile = join(dataDir, 'ports.json')
  const ports = readJsonFile(portsFile, {})
  async function portOf(id) {
    if (ports[id]) return ports[id]
    let h = 0
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
    const taken = new Set(Object.values(ports))
    for (let i = 0; i < 1000; i++) {
      const port = portBase + ((h + i) % 1000)
      if (taken.has(port) || !(await portFree(port))) continue
      ports[id] = port
      writeFileSync(portsFile, JSON.stringify(ports, null, 2))
      return port
    }
    throw new StoreError('no-port')
  }

  // ---------------------------------------------------------------- game servers
  /** @type {Map<string, { server: import('node:http').Server, port: number, dir: string }>} */
  const servers = new Map()

  function stopServer(id) {
    const s = servers.get(id)
    if (!s) return
    servers.delete(id)
    s.server.closeAllConnections?.()
    s.server.close()
  }

  async function startServer(game) {
    const running = servers.get(game.id)
    if (running && running.dir === game.dir) return running.port
    stopServer(game.id)
    const port = await portOf(game.id)
    const root = game.dir
    const server = createServer((req, res) => {
      const host = String(req.headers.host ?? '')
      if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) { res.writeHead(403); return res.end() }
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end() }
      let rel
      try { rel = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname).replace(/^\/+/, '') } catch { res.writeHead(400); return res.end() }
      // Only the three folders a game package serves; nothing else in the package or on the disk.
      if (!/^(game|manual|store)\//.test(rel)) { res.writeHead(404); return res.end() }
      let file = resolve(root, rel)
      if (!file.startsWith(root + sep)) { res.writeHead(404); return res.end() }
      // Workshop: the game's mount folder also shows the enabled extensions, each under its own id,
      // and the list file names them in load order. The game package itself is never changed.
      const w = game.manifest.workshop
      if (w && typeof w.mount === 'string') {
        const active = extensionsOf(game.id, game.version).filter(x => x.active)
        if (w.list && rel === w.list.path) {
          const body = String(w.list.template).replace('{{ids}}', JSON.stringify(active.map(x => x.id)))
          res.writeHead(200, { 'content-type': MIME[extname(rel).toLowerCase()] ?? 'text/plain; charset=utf-8', 'content-security-policy': GAME_CSP, 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' })
          return res.end(req.method === 'HEAD' ? undefined : body)
        }
        if (rel.startsWith(`${w.mount}/`)) {
          const [id, ...rest] = rel.slice(w.mount.length + 1).split('/')
          const ext = active.find(x => x.id === id)
          if (ext && rest.length) {
            file = resolve(ext.filesDir, rest.join('/'))
            if (!file.startsWith(ext.filesDir + sep)) { res.writeHead(404); return res.end() }
          }
        }
      }
      let st
      try { st = statSync(file) } catch { res.writeHead(404); return res.end() }
      if (!st.isFile()) { res.writeHead(404); return res.end() }
      res.writeHead(200, {
        'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
        'content-length': st.size,
        'content-security-policy': GAME_CSP,
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer',
        'cache-control': 'no-cache',
      })
      if (req.method === 'HEAD') return res.end()
      createReadStream(file).pipe(res)
    })
    await new Promise((ok, fail) => { server.once('error', fail); server.listen(port, '127.0.0.1', ok) }).catch(err => {
      throw new StoreError('port-busy', `${port} (${err.code ?? err.message})`)
    })
    servers.set(game.id, { server, port, dir: root })
    log(`serving ${game.id} at http://127.0.0.1:${port}/`)
    return port
  }
  ctx.effect(() => () => { for (const id of [...servers.keys()]) stopServer(id) }, 'dsh-game-store: game servers')

  // ---------------------------------------------------------------- state for the page
  /** id -> what is being done to it right now */
  const busy = new Map()
  /** id -> the last failure, shown until the next attempt */
  const failures = new Map()

  function gameView(id, entry, inst) {
    const manifest = inst?.manifest ?? entry?.manifest ?? {}
    const status = entry?.status ?? 'listed'
    let state = 'available'
    if (inst) state = entry && status === 'listed' && entry.version !== inst.version && newer(entry.version, inst.version) ? 'update' : 'installed'
    return {
      id,
      package: inst?.package ?? entry?.package,
      // Store text comes from the catalog when the game is listed, so the page reads the same before and after installing.
      name: (entry?.manifest ?? manifest).name,
      tagline: (entry?.manifest ?? manifest).tagline,
      summary: (entry?.manifest ?? manifest).summary,
      author: manifest.author,
      languages: manifest.languages ?? [],
      controls: manifest.controls ?? [],
      players: manifest.players,
      content: manifest.content,
      hasManual: !!inst?.manifest?.manual && Object.keys(inst.manifest.manual).length > 0,
      manualInPackage: !!manifest.manual,
      icon: manifest.icon,
      cover: manifest.cover,
      screenshots: manifest.screenshots ?? [],
      // Videos play from the site; the copy shipped inside the plugin has none.
      videos: entry && /^https?:/.test(catalog.base) && typeof entry.assets === 'string' ? (entry.manifest.videos ?? []).map(v => ({ ...v, url: String(new URL(entry.assets + v.src, catalog.base)), posterUrl: v.poster ? String(new URL(entry.assets + v.poster, catalog.base)) : undefined })) : [],
      workshop: workshopView(id, entry, inst),
      board: entry && catalog.community?.repo ? boardLinks(catalog.community.repo, id) : undefined,
      version: entry?.version ?? inst?.version,
      installedVersion: inst?.version,
      license: entry?.license ?? inst?.license,
      repository: entry?.repository,
      integrity: entry?.integrity,
      bytes: entry?.packageBytes,
      downloadBytes: entry?.tarballBytes,
      addedAt: entry?.addedAt,
      updatedAt: entry?.updatedAt,
      status,
      reason: entry?.reason,
      /** Installed by hand, not through the catalog. */
      unlisted: !entry,
      local: !!(inst && devSources[inst.package]),
      state,
      busy: busy.get(id),
      failure: failures.get(id),
      running: servers.has(id),
    }
  }

  /** What the game page shows under "Workshop": the catalog's extensions for this game plus the installed ones. */
  function workshopView(game, entry, inst) {
    const accepts = (inst?.manifest ?? entry?.manifest)?.workshop
    if (!accepts) return undefined
    const installed = extensionsOf(game, inst?.version)
    const items = []
    const view = (id, cat, ext, index) => {
      const m = ext?.manifest ?? cat?.manifest ?? {}
      const key = `${game}/${id}`
      const status = cat?.status ?? 'listed'
      return {
        id, name: (cat?.manifest ?? m).name, summary: (cat?.manifest ?? m).summary, types: m.types ?? [], author: m.author, gameVersion: [].concat((cat?.manifest ?? m).gameVersion ?? []),
        package: ext?.package ?? cat?.package, repository: cat?.repository, license: cat?.license ?? ext?.license, bytes: cat?.packageBytes,
        version: cat?.version ?? ext?.version, installedVersion: ext?.version,
        state: !ext ? 'available' : cat && status === 'listed' && newer(cat.version, ext.version) ? 'update' : 'installed',
        on: ext ? ext.on : undefined, compatible: ext ? ext.compatible : inst ? gameVersionOk((cat?.manifest ?? m).gameVersion, inst.version) : true, active: ext?.active,
        index, status, reason: cat?.reason, unlisted: !cat, busy: busy.get(key), failure: failures.get(key),
      }
    }
    installed.forEach((ext, i) => items.push(view(ext.id, workshopEntry(game, ext.id), ext, i)))
    for (const cat of entry?.workshop ?? []) if (!installed.some(x => x.id === cat.id) && (cat.status ?? 'listed') === 'listed') items.push(view(cat.id, cat, undefined, -1))
    return { types: accepts.types, guide: accepts.guide, gameVersion: inst?.version, installedCount: installed.length, items }
  }

  function newer(a, b) {
    const n = v => String(v).split('-')[0].split('.').map(x => Number(x) || 0)
    const x = n(a), y = n(b)
    for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0)
    return false
  }

  function state() {
    const inst = installedGames()
    const games = catalog.games.filter(g => (g.status ?? 'listed') === 'listed' || inst.has(g.id)).map(g => gameView(g.id, g, inst.get(g.id)))
    for (const [id, g] of inst) if (!entryOf(id)) games.push(gameView(id, undefined, g))
    return {
      version: VERSION,
      games,
      catalog: { url: catalogUrl, from: catalog.from, generatedAt: catalog.generatedAt, fetchedAt: catalog.fetchedAt, error: catalog.error },
      canInstall: !!manager() && !!profile()?.dir,
      profile: profile()?.name,
    }
  }

  // ---------------------------------------------------------------- install, update, remove
  function settle(out, what) {
    // An update reports { result, restore }; an install or removal reports the result itself.
    const r = out?.result ?? out
    if (!r) throw new StoreError('manager-failed', `${what}: no answer`)
    if (r.application === 'cancelled') throw new StoreError('cancelled')
    if (r.application === 'failed' || r.error) {
      const e = r.error ?? {}
      const tail = String(r.packageResult?.output ?? '').trim().split('\n').slice(-4).join(' ').slice(0, 400)
      if (r.pendingBuilds?.length) throw new StoreError('build-blocked', r.pendingBuilds.join(', '))
      throw new StoreError('manager-failed', [e.code, e.diagnostic, r.packageResult?.kind, tail].filter(Boolean).join(' · ') || what)
    }
    return r
  }

  /** The spec to hand to the plugin manager, after comparing the checksum with the catalog. */
  async function verifiedSpec(entry) {
    const dev = devSources[entry.package]
    if (dev) {
      let buf
      try { buf = readFileSync(dev) } catch { throw new StoreError('source-missing', dev) }
      if (sha512Integrity(buf) !== entry.integrity) throw new StoreError('integrity', `${dev} does not match the catalog`)
      return dev
    }
    let meta
    try {
      const r = await fetch(`https://registry.npmjs.org/${entry.package.replace('/', '%2f')}/${entry.version}`, { signal: AbortSignal.timeout(15_000), headers: { accept: 'application/json' } })
      if (r.status === 404) throw new StoreError('not-on-npm', `${entry.package}@${entry.version}`)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      meta = await r.json()
    } catch (err) {
      if (err instanceof StoreError) throw err
      throw new StoreError('registry-unreachable', err.message)
    }
    if (meta?.dist?.integrity !== entry.integrity) throw new StoreError('integrity', `npm has ${meta?.dist?.integrity ?? 'no checksum'}`)
    return `${entry.package}@${entry.version}`
  }

  /** After pnpm finished: the files on disk must be the catalog's version and pass the spec, or they are removed again. */
  async function verifyInstalled(entry, kind = 'game') {
    const pm = manager()
    const dir = packageDir(entry.package)
    const fail = async (code, detail) => {
      try { await pm.removeBundle(entry.package) } catch {}
      throw new StoreError(code, detail)
    }
    if (!dir) return fail('manager-failed', 'the package folder is missing after the install')
    const pj = readJsonFile(join(dir, 'package.json'), {})
    if (pj.version !== entry.version) return fail('integrity', `installed ${pj.version}, the catalog names ${entry.version}`)
    const locked = lockedIntegrity(entry.package, entry.version)
    if (locked && locked !== entry.integrity) return fail('integrity', 'the installed files do not match the catalog')
    const check = kind === 'extension' ? checkExtension(dir) : checkPackage(dir)
    if (!check.ok) return fail('bad-package', check.errors.slice(0, 3).join('; '))
    if (check.manifest.id !== entry.id) return fail('bad-package', `the package is "${check.manifest.id}", not "${entry.id}"`)
    if (kind === 'extension' && check.manifest.game !== entry.game) return fail('bad-package', `the package extends "${check.manifest.game}", not "${entry.game}"`)
    return { verified: !!locked }
  }

  async function run(id, what, fn) {
    if (busy.has(id)) throw new StoreError('busy')
    busy.set(id, what)
    failures.delete(id)
    try { return await fn() } catch (err) {
      const e = err instanceof StoreError ? err : new StoreError('manager-failed', err?.message ?? String(err))
      failures.set(id, { code: e.code, detail: e.detail })
      log(`${what} ${id}: ${e.message}`)
      throw e
    } finally { busy.delete(id) }
  }

  const needManager = () => {
    const pm = manager()
    if (!pm || !profile()?.dir) throw new StoreError('no-manager')
    return pm
  }

  const install = id => run(id, 'installing', async () => {
    await refresh()
    const entry = entryOf(id)
    if (!entry) throw new StoreError('not-in-catalog')
    if ((entry.status ?? 'listed') !== 'listed') throw new StoreError('taken-down', entry.reason)
    const pm = needManager()
    if (installedGames().has(id)) throw new StoreError('already-installed')
    const spec = await verifiedSpec(entry)
    log(`installing ${spec}`)
    settle(await pm.installBundle(spec, { saveExact: true, requestId: `game-store-${id}-${Date.now()}` }), 'install')
    const { verified } = await verifyInstalled(entry)
    forgetExtensions()
    await portOf(id)
    log(`installed ${entry.package}@${entry.version}${verified ? '' : ' (no checksum in the lockfile to compare)'}`)
    return { version: entry.version }
  })

  const update = id => run(id, 'updating', async () => {
    await refresh()
    const entry = entryOf(id)
    const inst = installedGames().get(id)
    if (!entry || !inst) throw new StoreError('not-installed')
    if ((entry.status ?? 'listed') !== 'listed') throw new StoreError('taken-down', entry.reason)
    if (inst.package !== entry.package) throw new StoreError('bad-package', `installed from ${inst.package}`)
    const pm = needManager()
    const spec = await verifiedSpec(entry)
    stopServer(id)
    const bundle = (await pm.listBundles()).find(b => b.name === entry.package)
    if (bundle?.updatable && !devSources[entry.package]) {
      const out = await pm.updateBundle(entry.package, entry.version, { requestId: `game-store-${id}-${Date.now()}` })
      if (out?.restore) throw new StoreError('manager-failed', 'the update failed; the installed version was put back')
      settle(out, 'update')
    } else {
      settle(await pm.removeBundle(entry.package), 'remove')
      settle(await pm.installBundle(spec, { saveExact: true }), 'install')
    }
    await verifyInstalled(entry)
    return { version: entry.version }
  })

  const uninstall = id => run(id, 'removing', async () => {
    const inst = installedGames().get(id)
    if (!inst) throw new StoreError('not-installed')
    const pm = needManager()
    stopServer(id)
    // Extensions of a game go with the game.
    for (const ext of extensionsOf(id)) { try { settle(await pm.removeBundle(ext.package), 'remove') } catch (err) { log(`removing ${ext.package}: ${err.message}`) } }
    forgetExtensions()
    settle(await pm.removeBundle(inst.package), 'remove')
    return {}
  })

  // ---- workshop operations
  const extInstall = (game, id) => run(`${game}/${id}`, 'installing', async () => {
    await refresh()
    const entry = workshopEntry(game, id)
    if (!entry) throw new StoreError('not-in-catalog')
    if ((entry.status ?? 'listed') !== 'listed') throw new StoreError('taken-down', entry.reason)
    const inst = installedGames().get(game)
    if (!inst) throw new StoreError('game-missing')
    if (!inst.manifest.workshop) throw new StoreError('bad-package', 'this game takes no extensions')
    if (installedExtensions().has(`${game}/${id}`)) throw new StoreError('already-installed')
    const pm = needManager()
    const spec = await verifiedSpec(entry)
    log(`installing extension ${spec}`)
    settle(await pm.installBundle(spec, { saveExact: true, requestId: `game-store-${game}-${id}-${Date.now()}` }), 'install')
    forgetExtensions()
    await verifyInstalled(entry, 'extension')
    const st = wstate(game)
    if (!st.order.includes(id)) st.order.push(id)
    st.off = st.off.filter(x => x !== id)
    saveWorkshop()
    return {}
  })

  const extUpdate = (game, id) => run(`${game}/${id}`, 'updating', async () => {
    await refresh()
    const entry = workshopEntry(game, id)
    const ext = installedExtensions().get(`${game}/${id}`)
    if (!entry || !ext) throw new StoreError('not-installed')
    if ((entry.status ?? 'listed') !== 'listed') throw new StoreError('taken-down', entry.reason)
    if (ext.package !== entry.package) throw new StoreError('bad-package', `installed from ${ext.package}`)
    const pm = needManager()
    const spec = await verifiedSpec(entry)
    settle(await pm.removeBundle(entry.package), 'remove')
    settle(await pm.installBundle(spec, { saveExact: true }), 'install')
    forgetExtensions()
    await verifyInstalled(entry, 'extension')
    return {}
  })

  const extUninstall = (game, id) => run(`${game}/${id}`, 'removing', async () => {
    const ext = installedExtensions().get(`${game}/${id}`)
    if (!ext) throw new StoreError('not-installed')
    const pm = needManager()
    settle(await pm.removeBundle(ext.package), 'remove')
    forgetExtensions()
    const st = wstate(game)
    st.order = st.order.filter(x => x !== id)
    st.off = st.off.filter(x => x !== id)
    saveWorkshop()
    return {}
  })

  /** Switch an extension on or off. The game reads the list when it starts. */
  function extEnable(game, id, on) {
    if (!installedExtensions().has(`${game}/${id}`)) throw new StoreError('not-installed')
    const st = wstate(game)
    st.off = st.off.filter(x => x !== id)
    if (!on) st.off.push(id)
    saveWorkshop()
  }

  /** Move an extension one place earlier (-1) or later (+1) in the load order. */
  function extMove(game, id, dir) {
    const ids = extensionsOf(game).map(x => x.id)
    const i = ids.indexOf(id), j = i + (dir < 0 ? -1 : 1)
    if (i < 0 || j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    wstate(game).order = ids
    saveWorkshop()
  }

  async function launch(id, what, lang) {
    const inst = installedGames().get(id)
    if (!inst) throw new StoreError('not-installed')
    const entry = entryOf(id)
    if (entry?.status === 'blocked') throw new StoreError('taken-down', entry.reason)
    let rel = inst.manifest.entry
    if (what === 'manual') {
      const manual = inst.manifest.manual ?? {}
      const key = String(lang ?? 'en').toLowerCase()
      rel = manual[key] ?? manual[key.split('-')[0]] ?? manual.en ?? Object.values(manual)[0]
      if (!rel) throw new StoreError('no-manual')
    }
    if (typeof rel !== 'string' || !/^(game|manual)\/[^?#]+$/.test(rel) || rel.includes('..')) throw new StoreError('bad-package', 'entry')
    const port = await startServer(inst)
    return { url: `http://127.0.0.1:${port}/${rel.split('/').map(encodeURIComponent).join('/')}`, port }
  }

  // ---------------------------------------------------------------- pictures and descriptions
  /** Pictures a game's manifest names: from the installed package, else from the catalog (saved copy on disk, or the site). */
  async function asset(id, rel, res) {
    const inst = installedGames().get(id)
    const entry = entryOf(id)
    const manifest = entry?.manifest ?? inst?.manifest
    const allowed = manifest ? [manifest.icon, manifest.cover, ...(manifest.screenshots ?? []).map(s => s?.src), ...(manifest.videos ?? []).map(v => v?.poster)].filter(Boolean) : []
    const instAllowed = inst ? [inst.manifest.icon, inst.manifest.cover, ...(inst.manifest.screenshots ?? []).map(s => s?.src)] : []
    if (!allowed.includes(rel) && !instAllowed.includes(rel)) { res.writeHead(404); return res.end() }
    const type = MIME[extname(rel).toLowerCase()]
    if (!type?.startsWith('image/') || type === 'image/svg+xml') { res.writeHead(404); return res.end() }
    const sendFile = file => { res.writeHead(200, { 'content-type': type, 'cache-control': 'max-age=300', 'x-content-type-options': 'nosniff' }); createReadStream(file).pipe(res) }
    // A listed game shows the catalog's pictures, installed or not.
    if (entry && allowed.includes(rel)) {
      const bundled = resolve(SNAPSHOT, 'games', id, rel)
      // Keyed by the checksum too, so a rebuilt package never shows the pictures of the one before it.
      const cached = resolve(dataDir, 'cache', 'assets', id, `${entry.version}-${String(entry.integrity ?? '').slice(7, 19).replace(/[^A-Za-z0-9]/g, '_')}`, rel)
      if (catalog.from === 'bundled' && bundled.startsWith(SNAPSHOT + sep) && existsSync(bundled)) return sendFile(bundled)
      if (cached.startsWith(resolve(dataDir) + sep) && existsSync(cached)) return sendFile(cached)
      if (catalog.base && typeof entry.assets === 'string') {
        try {
          const url = new URL(entry.assets + rel, catalog.base)
          let buf
          if (url.protocol === 'file:') buf = readFileSync(fileURLToPath(url))
          else {
            const r = await fetch(url, { signal: AbortSignal.timeout(15_000), redirect: 'error' })
            if (!r.ok) throw new Error(`HTTP ${r.status}`)
            buf = Buffer.from(await r.arrayBuffer())
          }
          if (buf.length <= 4 * 1024 * 1024) {
            mkdirSync(dirname(cached), { recursive: true })
            writeFileSync(cached, buf)
            return sendFile(cached)
          }
        } catch { /* fall through to the other copies */ }
      }
      if (bundled.startsWith(SNAPSHOT + sep) && existsSync(bundled)) return sendFile(bundled)
    }
    if (inst && instAllowed.includes(rel)) {
      const file = resolve(inst.dir, rel)
      if (file.startsWith(inst.dir + sep) && existsSync(file)) return sendFile(file)
    }
    res.writeHead(404); res.end()
  }

  /** The game's own description, as safe HTML. Listed games use the catalog's text; unlisted ones the package's file. */
  function about(id, lang) {
    const entry = entryOf(id)
    const inst = installedGames().get(id)
    let text = entry?.about ? pickText(entry.about, lang) : ''
    if (!text && inst?.manifest?.about) {
      const rel = pickText(inst.manifest.about, lang)
      const file = resolve(inst.dir, String(rel))
      if (rel && file.startsWith(inst.dir + sep) && existsSync(file) && statSync(file).size <= 64 * 1024) text = readFileSync(file, 'utf8')
    }
    return renderMarkdown(text, { link: href => (/^https:\/\//.test(href) ? href : ''), image: () => '' })
  }

  // ---------------------------------------------------------------- message boards (GitHub issues)
  const boardLinks = (repo, id) => ({
    post: `https://github.com/${repo}/issues/new?template=message.yml&game=${encodeURIComponent(id)}`,
    all: `https://github.com/${repo}/issues?q=${encodeURIComponent(`is:issue label:game:${id}`)}`,
  })
  /** id -> { at, messages }; GitHub allows 60 anonymous requests an hour, so answers are kept for ten minutes. */
  const boards = new Map()
  async function board(id) {
    const entry = entryOf(id)
    const repo = catalog.community?.repo
    if (!entry || typeof repo !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return { messages: [] }
    const hit = boards.get(id)
    if (hit && Date.now() - hit.at < 600_000) return { messages: hit.messages, ...boardLinks(repo, id) }
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}/issues?labels=${encodeURIComponent(`game:${id}`)}&state=open&sort=created&direction=desc&per_page=20`, { signal: AbortSignal.timeout(10_000), headers: { accept: 'application/vnd.github+json', 'user-agent': 'dsh-game-store' } })
      if (!r.ok) throw new Error(`GitHub answered ${r.status}`)
      const messages = (await r.json()).filter(i => !i.pull_request).map(i => ({
        title: String(i.title ?? ''), user: String(i.user?.login ?? ''), avatar: /^https:\/\/avatars\.githubusercontent\.com\//.test(i.user?.avatar_url ?? '') ? i.user.avatar_url : '',
        at: i.created_at, replies: Number(i.comments) || 0, url: /^https:\/\/github\.com\//.test(i.html_url ?? '') ? i.html_url : '',
        text: String(i.body ?? '').replace(/^###\s.*$/gm, '').replace(/\s+/g, ' ').trim().slice(0, 280),
      }))
      boards.set(id, { at: Date.now(), messages })
      return { messages, ...boardLinks(repo, id) }
    } catch (err) {
      return { messages: hit?.messages ?? [], error: err.message, ...boardLinks(repo, id) }
    }
  }

  // ---------------------------------------------------------------- routes
  const api = async (req, res) => {
    if (!trusted(req)) return send(res, 403, { error: 'forbidden' })
    const url = new URL(req.url ?? '/', 'http://localhost')
    const route = url.pathname.replace(/^\/game-store\/api\/?/, '')
    try {
      if (req.method === 'GET') {
        if (route === 'state') return send(res, 200, state())
        if (route === 'about') return send(res, 200, { html: about(String(url.searchParams.get('id')), url.searchParams.get('lang') ?? 'en') })
        if (route === 'logo') { const f = resolve(HERE, '../icon.png'); res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'max-age=86400' }); return createReadStream(f).pipe(res) }
        if (route === 'board') return send(res, 200, await board(String(url.searchParams.get('id'))))
        if (route === 'asset') return await asset(String(url.searchParams.get('id')), String(url.searchParams.get('path')), res)
        return send(res, 404, { error: 'not-found' })
      }
      if (req.method !== 'POST') return send(res, 405, { error: 'method' })
      // A page from another site cannot send JSON without asking first, and DSH's server does not let it ask.
      if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) return send(res, 403, { error: 'forbidden' })
      const body = await readJson(req)
      const id = String(body.id ?? '')
      if (route === 'refresh') { await refresh(); return send(res, 200, state()) }
      if (route === 'install') { await install(id); return send(res, 200, state()) }
      if (route === 'update') { await update(id); return send(res, 200, state()) }
      if (route === 'uninstall') { await uninstall(id); return send(res, 200, state()) }
      const game = String(body.game ?? '')
      if (route === 'ext-install') { await extInstall(game, id); return send(res, 200, state()) }
      if (route === 'ext-update') { await extUpdate(game, id); return send(res, 200, state()) }
      if (route === 'ext-uninstall') { await extUninstall(game, id); return send(res, 200, state()) }
      if (route === 'ext-enable') { extEnable(game, id, body.on !== false); return send(res, 200, state()) }
      if (route === 'ext-move') { extMove(game, id, Number(body.dir) || 1); return send(res, 200, state()) }
      if (route === 'launch') return send(res, 200, await launch(id, body.what === 'manual' ? 'manual' : 'game', body.lang))
      if (route === 'stop') { stopServer(id); return send(res, 200, state()) }
      return send(res, 404, { error: 'not-found' })
    } catch (err) {
      const e = err instanceof StoreError ? err : new StoreError('manager-failed', err?.message ?? String(err))
      return send(res, e.code === 'busy' ? 409 : 400, { error: e.code, detail: e.detail, state: state() })
    }
  }
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: '/game-store/api', handler: api }), 'dsh-game-store: api route')

  // Other plugins (and tests) can ask the store directly.
  ctx.effect(() => ctx.provide('gameStore', { version: 1, state, refresh, install, update, uninstall, launch, extInstall, extUninstall, extEnable }), 'dsh-game-store: service')
  log(`started ${VERSION}; catalog ${catalogUrl}; data in ${dataDir}`)
}
