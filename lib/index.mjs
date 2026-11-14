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
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { createServer as createNetServer } from 'node:net'
import { homedir } from 'node:os'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderMarkdown } from './markdown.mjs'
import { checkExtension, checkPackage, gameVersionOk, networkHostProblem, pickText, sha512Integrity, STANDARD_PATCH } from './spec.mjs'

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
const gameCsp = manifest => [
  "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
  // A game that declares its own servers may talk to exactly those; DSH and everything else stay out of reach.
  `connect-src 'self' data: blob: ${(manifest?.network?.hosts ?? []).filter(x => !networkHostProblem(x)).join(' ')}`.trim(),
  "object-src 'none'",
  "form-action 'none'",
  "base-uri 'self'",
].join('; ')

/** The optional helper a game can load with <script src="/__dsh/ai.js">: window.dshAI.available() and .chat(). */
const AI_HELPER = `/* DSH game store: the model the player chose in DSH. */
window.dshAI = {
  async available() { try { const r = await fetch('/__dsh/ai'); return r.ok && (await r.json()).available === true } catch (e) { return false } },
  async chat(options, onText) {
    const r = await fetch('/__dsh/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({}, options, { stream: true })), signal: options && options.signal })
    if (!r.ok) { let e = 'failed'; try { e = (await r.json()).error || e } catch (x) {} throw new Error(e) }
    const reader = r.body.getReader(), dec = new TextDecoder(); let buf = '', all = ''
    for (;;) {
      const { value, done } = await reader.read(); if (done) break
      buf += dec.decode(value, { stream: true }); let i
      while ((i = buf.indexOf('\\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); if (!line) continue
        const m = JSON.parse(line); if (m.error) throw new Error(m.error); if (m.text) { all += m.text; if (onText) onText(m.text, all) } }
    }
    return all
  },
}
`

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
  /** Where mods made on this computer live: <folder>/<game id>/<mod folder>/extension.json. */
  const LOCAL_WORKSHOP = config.localWorkshopDir || join(homedir(), 'DSH 游戏工坊')
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
  // Catalog and updates: shortly after start, then once a day.
  const autoUpdate = config.autoUpdate !== false
  const daily = async () => { await refresh(); if (autoUpdate) { await updateGames(); await updateSelf() } }
  ctx.effect(() => {
    const first = setTimeout(() => void daily().catch(err => log(`auto update: ${err.message}`)), 60_000)
    const t = setInterval(() => void daily().catch(err => log(`auto update: ${err.message}`)), DAY)
    t.unref?.(); first.unref?.()
    return () => { clearTimeout(first); clearInterval(t) }
  }, 'dsh-game-store: daily catalog check and updates')
  void refresh()

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
    // Mods the player made with their own DSH: a folder per mod under the local workshop, used as they are.
    // One with the id of an installed extension takes its place, so a maker can try changes to their own.
    for (const game of safeList(LOCAL_WORKSHOP)) {
      for (const folder of safeList(join(LOCAL_WORKSHOP, game))) {
        const p = join(LOCAL_WORKSHOP, game, folder)
        const m = readJsonFile(join(p, 'extension.json'))
        if (typeof m?.id !== 'string' || m.game !== game || typeof m?.files !== 'string' || !/^[\w-]+$/.test(m.files)) continue
        if (!/^[a-z0-9][a-z0-9-]*$/.test(m.id) || !existsSync(join(p, m.files))) continue
        const pj = readJsonFile(join(p, 'package.json'), {})
        map.set(`${m.game}/${m.id}`, { id: m.id, game: m.game, package: pj?.name, version: pj?.version, license: pj?.license, dir: p, filesDir: join(p, m.files), manifest: m, local: true, folder: p })
      }
    }
    extCache = { at: Date.now(), map }
    return map
  }
  /**
   * Start a mod on this computer: a complete extension package in the local workshop, which the game can use
   * at once and which can later be published as it is. The player's DSH writes the content.
   */
  function createMod(body) {
    const game = String(body.game ?? '')
    const inst = installedGames().get(game)
    if (!inst) throw new StoreError('not-installed')
    const accepts = acceptsOf(inst.manifest)
    const type = accepts.types.includes(body.type) ? body.type : accepts.types[0]
    const name = String(body.name ?? '').trim().slice(0, 60) || 'My mod'
    let id = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) id = `mod-${Date.now().toString(36)}`
    const base = join(LOCAL_WORKSHOP, game)
    for (let i = 2; existsSync(join(base, id)); i++) id = `${id.replace(/-\d+$/, '')}-${i}`
    const dir = join(base, id)
    mkdirSync(join(dir, 'mod'), { recursive: true })
    const major = String(inst.version).split('.')[0]
    const pkgName = `dsh-game-${game}-${id}`
    writeFileSync(join(dir, 'extension.json'), `${JSON.stringify({ spec: 1, id, game, gameVersion: `${major}.x`, types: [type], name: { en: name, zh: name }, summary: { en: String(body.idea ?? '').slice(0, 120) || 'A mod.', zh: String(body.idea ?? '').slice(0, 120) || '一个 Mod。' }, author: { name: 'Me' }, files: 'mod' }, null, 2)}\n`)
    writeFileSync(join(dir, 'package.json'), `${JSON.stringify({ name: pkgName, version: '0.1.0', description: `A mod for ${game}`, license: 'MIT', keywords: ['dsh', 'dsh-game', 'dsh-game-extension', game], files: ['mod', 'extension.json', 'cordis.patch.yml', 'README.md', 'LICENSE'], dsh: { bundle: { patch: './cordis.patch.yml' } }, dshGameExtension: './extension.json' }, null, 2)}\n`)
    writeFileSync(join(dir, 'cordis.patch.yml'), STANDARD_PATCH)
    writeFileSync(join(dir, 'README.md'), `# ${name}\n\nA mod for ${game}, made with DSH for the [DSH Game Store](https://dsh-game-store.com) workshop.\n`)
    forgetExtensions()
    return { dir, id, game, type, guide: type === SCRIPT ? '' : accepts.guide ?? '', gameDir: inst.dir, entry: inst.manifest.entry }
  }
  function safeList(dir) { try { return readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('.')).map(d => d.name) } catch { return [] } }
  /** Open a folder in Finder / Explorer / the file manager. */
  function reveal(dir) {
    mkdirSync(dir, { recursive: true })
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open'
    try { spawn(cmd, [dir], { detached: true, stdio: 'ignore' }).unref() } catch { /* the path is shown on the page */ }
    return dir
  }
  const forgetExtensions = () => { extCache = undefined }

  /** Per game: the order extensions load in, and the ones the player switched off. */
  const workshopFile = join(dataDir, 'workshop.json')
  const workshopState = readJsonFile(workshopFile, {})
  const wstate = game => (workshopState[game] ??= { order: [], off: [] })
  const saveWorkshop = () => writeFileSync(workshopFile, JSON.stringify(workshopState, null, 2))
  /**
   * What mods a game takes. Every game takes script mods: the store adds their mod.js (and mod.css) to the game's
   * page after the game's own scripts, so a game needs no mod support of its own. A game that declares "workshop"
   * in game.json also takes its own kinds, which it loads itself from its mount folder.
   */
  const SCRIPT = 'script'
  const acceptsOf = manifest => {
    const w = manifest?.workshop
    return w ? { ...w, types: [...new Set([...w.types, SCRIPT])] } : { types: [SCRIPT] }
  }
  const isScriptMod = x => (x.manifest?.types ?? []).includes(SCRIPT) && existsSync(join(x.filesDir, 'mod.js'))
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

  // ---------------------------------------------------------------- the model, for games that ask for it
  // A game that declares "ai" in game.json may call the model the player chose in DSH, the same way other DSH
  // plugins do: POST /__dsh/ai on the game's own address. The store adds no key and no account of its own.
  const AI = { maxChars: 60_000, maxMessages: 100, maxTokens: 4000, defaultTokens: 1024, perGame: 3 }
  const aiBusy = new Map()
  const aiModel = () => {
    const llm = ctx.get('llm'), pick = ctx.get('agentDefaultModel')?.currentSelection?.()
    return llm && pick?.provider && pick?.model ? { llm, pick } : null
  }
  async function aiRoute(game, port, req, res) {
    const head = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
    const fail = (status, error, detail) => { res.writeHead(status, { ...head, 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error, ...(detail ? { detail } : {}) })) }
    if (!game.manifest.ai) return fail(403, 'not-declared', 'game.json does not declare "ai"')
    if (req.method === 'GET') return void (res.writeHead(200, { ...head, 'content-type': 'application/json; charset=utf-8' }), res.end(JSON.stringify({ available: !!aiModel() })))
    if (req.method !== 'POST') return fail(405, 'method')
    // Only the game's own page may ask: a fetch from it carries its origin and a JSON body.
    const origin = String(req.headers.origin ?? '')
    if (origin !== `http://127.0.0.1:${port}` && origin !== `http://localhost:${port}`) return fail(403, 'origin')
    if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) return fail(415, 'json')
    let body
    try { body = await readJson(req) } catch { return fail(400, 'bad-json') }
    const msgs = Array.isArray(body.messages) ? body.messages : typeof body.prompt === 'string' ? [{ role: 'user', content: body.prompt }] : []
    if (!msgs.length || msgs.length > AI.maxMessages || !msgs.every(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')) return fail(400, 'messages', 'messages: 1-100 items of { role: "user" | "assistant", content: string }')
    if (msgs[msgs.length - 1].role !== 'user') return fail(400, 'messages', 'the last message must be from the user')
    const system = typeof body.system === 'string' ? body.system : undefined
    if ((system ?? '').length + msgs.reduce((n, m) => n + m.content.length, 0) > AI.maxChars) return fail(413, 'too-long', `at most ${AI.maxChars} characters in one request`)
    const model = aiModel()
    if (!model) return fail(503, 'no-model', 'DSH has no model set up')
    const busy = aiBusy.get(game.id) ?? 0
    if (busy >= AI.perGame) return fail(429, 'busy', `at most ${AI.perGame} requests at a time`)
    aiBusy.set(game.id, busy + 1)
    const abort = new AbortController()
    res.on('close', () => abort.abort())
    const { llm, pick } = model
    const messages = msgs.map(m => m.role === 'user'
      ? { role: 'user', content: [{ type: 'text', text: m.content }] }
      : { id: randomUUID(), role: 'assistant', content: [{ type: 'text', text: m.content }], source: { kind: 'model', provider: pick.provider, model: pick.model } })
    const stream = body.stream !== false
    let text = '', usage
    try {
      const chunks = llm.stream({
        provider: pick.provider, model: pick.model, messages, ...(system ? { system } : {}),
        maxTokens: Math.max(1, Math.min(AI.maxTokens, Number(body.maxTokens) || AI.defaultTokens)),
        ...(typeof body.temperature === 'number' ? { temperature: Math.max(0, Math.min(2, body.temperature)) } : {}),
        signal: abort.signal,
      })
      if (stream) res.writeHead(200, { ...head, 'content-type': 'application/x-ndjson; charset=utf-8' })
      for await (const c of chunks) {
        if (c.type === 'text-delta' && c.text) { text += c.text; if (stream) res.write(`${JSON.stringify({ text: c.text })}\n`) }
        else if (c.type === 'usage') usage = c.usage ?? c
        else if (c.type === 'finish') {
          const bad = c.reason?.kind === 'error' || c.reason?.kind === 'aborted' ? c.reason : null
          if (bad) {
            const code = bad.failure?.code ?? bad.kind
            if (stream) res.end(`${JSON.stringify({ error: code })}\n`); else fail(502, code)
            return
          }
        }
      }
      if (stream) res.end(`${JSON.stringify({ done: true })}\n`)
      else { res.writeHead(200, { ...head, 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ text })) }
    } catch (err) {
      if (res.headersSent) res.end(`${JSON.stringify({ error: 'failed' })}\n`); else fail(502, 'failed', String(err?.message ?? err).slice(0, 200))
    } finally {
      aiBusy.set(game.id, Math.max(0, (aiBusy.get(game.id) ?? 1) - 1))
    }
  }

  async function startServer(game) {
    const running = servers.get(game.id)
    if (running && running.dir === game.dir) return running.port
    stopServer(game.id)
    // The game's own port keeps its saves. When another program holds it (a second DSH running the same game),
    // this run takes any free port instead; the saves of the usual port are back next time.
    let port = await portOf(game.id)
    if (!(await portFree(port))) {
      for (let p = 21000 + Math.floor(Math.random() * 3000), i = 0; i < 50; i++, p++) if (await portFree(p)) { log(`${game.id}: port ${port} is busy, using ${p} this time`); port = p; break }
    }
    const root = game.dir
    const GAME_CSP = gameCsp(game.manifest)
    const server = createServer((req, res) => {
      const host = String(req.headers.host ?? '')
      if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) { res.writeHead(403); return res.end() }
      const path = String(req.url ?? '/').split('?')[0]
      if (path === '/__dsh/ai') return void aiRoute(game, port, req, res)
      if (path === '/__dsh/mods.js') {
        const list = extensionsOf(game.id, game.version).filter(x => x.active && isScriptMod(x))
          .map(x => ({ id: x.id, js: `/__dsh/mod/${x.id}/mod.js`, css: existsSync(join(x.filesDir, 'mod.css')) ? `/__dsh/mod/${x.id}/mod.css` : '' }))
        res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'content-security-policy': GAME_CSP, 'cache-control': 'no-store' })
        return res.end(`/* DSH game store: script mods, in load order */\n(function () {\n  var mods = ${JSON.stringify(list)}, i = 0\n  window.dshMods = mods.map(function (m) { return m.id })\n  function next() {\n    if (i >= mods.length) return\n    var m = mods[i++]\n    if (m.css) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = m.css; document.head.appendChild(l) }\n    var s = document.createElement('script'); s.src = m.js; s.onload = s.onerror = next; document.body.appendChild(s)\n  }\n  next()\n})()\n`)
      }
      if (path.startsWith('/__dsh/mod/')) {
        const [id, ...rest] = path.slice('/__dsh/mod/'.length).split('/').map(x => { try { return decodeURIComponent(x) } catch { return '' } })
        const ext = extensionsOf(game.id, game.version).find(x => x.active && x.id === id)
        const f = ext && rest.length ? resolve(ext.filesDir, rest.join('/')) : ''
        if (!f || !f.startsWith(ext.filesDir + sep) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); return res.end() }
        res.writeHead(200, { 'content-type': MIME[extname(f).toLowerCase()] ?? 'application/octet-stream', 'content-security-policy': GAME_CSP, 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' })
        return createReadStream(f).pipe(res)
      }
      if (path === '/__dsh/ai.js') { res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'content-security-policy': GAME_CSP, 'cache-control': 'no-cache' }); return res.end(AI_HELPER) }
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
      // Script mods: the entry page gets one extra script that loads them in order, after the game's own.
      const scripts = () => extensionsOf(game.id, game.version).filter(x => x.active && isScriptMod(x))
      if (rel === game.manifest.entry && req.method === 'GET') {
        const list = scripts()
        if (list.length) {
          let html
          try { html = readFileSync(file, 'utf8') } catch { res.writeHead(404); return res.end() }
          const tag = '<script src="/__dsh/mods.js"></script>'
          html = /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${tag}</body>`) : html + tag
          res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': GAME_CSP, 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'no-store' })
          return res.end(html)
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
      network: manifest.network,
      ai: !!manifest.ai,
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
    const man = inst?.manifest ?? entry?.manifest
    if (!man) return undefined
    const accepts = acceptsOf(man)
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
        ...(ext?.local ? { local: true, folder: ext.folder, state: 'installed' } : {}),
      }
    }
    installed.forEach((ext, i) => items.push(view(ext.id, workshopEntry(game, ext.id), ext, i)))
    for (const cat of entry?.workshop ?? []) if (!installed.some(x => x.id === cat.id) && (cat.status ?? 'listed') === 'listed') items.push(view(cat.id, cat, undefined, -1))
    return { types: accepts.types, guide: accepts.guide, gameVersion: inst?.version, installedCount: installed.length, items, localDir: join(LOCAL_WORKSHOP, game) }
  }

  function newer(a, b) {
    const n = v => String(v).split('-')[0].split('.').map(x => Number(x) || 0)
    const x = n(a), y = n(b)
    for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0)
    return false
  }

  // ---------------------------------------------------------------- automatic updates
  /** What was updated by itself lately, for the page to mention. */
  const autoLog = []
  /** Games and extensions: no code runs inside DSH, so new files take effect the next time the game starts. */
  async function updateGames() {
    if (!manager() || !profile()?.dir) return
    for (const [id, inst] of installedGames()) {
      const entry = entryOf(id)
      if (!entry || (entry.status ?? 'listed') !== 'listed' || !newer(entry.version, inst.version)) continue
      if (servers.has(id) || busy.has(id)) continue  // being played: next time
      try { await update(id); autoLog.unshift({ kind: 'game', id, from: inst.version, to: entry.version, at: Date.now() }); log(`auto update: ${id} ${inst.version} → ${entry.version}`) } catch (err) { log(`auto update ${id}: ${err.message}`) }
    }
    for (const ext of installedExtensions().values()) {
      const entry = workshopEntry(ext.game, ext.id)
      if (ext.local || !entry || (entry.status ?? 'listed') !== 'listed' || !newer(entry.version, ext.version) || servers.has(ext.game)) continue
      try { await extUpdate(ext.game, ext.id); autoLog.unshift({ kind: 'extension', id: `${ext.game}/${ext.id}`, from: ext.version, to: entry.version, at: Date.now() }) } catch (err) { log(`auto update ${ext.game}/${ext.id}: ${err.message}`) }
    }
    autoLog.splice(20)
  }

  /**
   * The store itself, through DSH's own plugin manager (the call behind the Plugins page's Update button).
   * Only releases that have been out for a day: DSH's package manager holds back younger ones.
   * Without hot reload the new code runs after DSH restarts; the page says so.
   */
  const SELF_MIN_AGE = process.env.GAME_STORE_UPDATE_MIN_AGE_HOURS !== undefined ? Number(process.env.GAME_STORE_UPDATE_MIN_AGE_HOURS) * 3600_000 : DAY
  let selfUpdate = { status: 'idle' }
  async function updateSelf() {
    const pm = manager()
    if (!pm || selfUpdate.status === 'restart' || selfUpdate.status === 'running') return
    let doc
    try { doc = await (await fetch('https://registry.npmjs.org/dsh-game-store', { signal: AbortSignal.timeout(15_000), headers: { accept: 'application/json' } })).json() } catch { return }
    const ripe = Object.keys(doc?.versions ?? {}).filter(v => /^\d+\.\d+\.\d+$/.test(v) && Date.now() - Date.parse(doc.time?.[v] ?? '') >= SELF_MIN_AGE)
    const target = ripe.reduce((best, v) => (!best || newer(v, best) ? v : best), undefined)
    if (!target) return
    let bundle
    try { bundle = (await pm.listBundles()).find(b => b.name === 'dsh-game-store') } catch { return }
    if (!bundle?.updatable) return  // installed from a folder or a tarball: updates are the owner's call
    // Compared with what the profile has installed (the running code may be older until DSH restarts).
    if (!newer(target, bundle.version ?? VERSION)) return
    selfUpdate = { status: 'running', version: target }
    log(`self update: ${VERSION} → ${target}`)
    try {
      const out = await pm.updateBundle('dsh-game-store', target, { requestId: `game-store-self-${Date.now()}` })
      const app = out?.result?.application
      if (out?.restore || app === 'failed' || app === 'cancelled') selfUpdate = { status: 'failed', version: target, message: out?.result?.error?.code ?? app }
      else selfUpdate = { status: app === 'restart-required' ? 'restart' : 'applied', version: target }
    } catch (err) { selfUpdate = { status: 'failed', version: target, message: err.message } }
    log(`self update: ${selfUpdate.status}`)
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
      autoUpdate,
      selfUpdate,
      autoLog: autoLog.filter(x => Date.now() - x.at < DAY),
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

  /**
   * Swap an installed package for another version. When the new one cannot be installed (no network, a release
   * DSH still holds back), the version that was there goes back, so an update never leaves the player without it.
   */
  async function replaceBundle(pm, pkg, oldVersion, spec) {
    settle(await pm.removeBundle(pkg), 'remove')
    try { settle(await pm.installBundle(spec, { saveExact: true }), 'install') } catch (err) {
      try { settle(await pm.installBundle(`${pkg}@${oldVersion}`, { saveExact: true }), 'install'); log(`update of ${pkg} failed; ${oldVersion} put back`) } catch (back) { log(`update of ${pkg} failed, and ${oldVersion} could not be put back: ${back.message}`) }
      throw err
    }
  }

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
    } else await replaceBundle(pm, entry.package, inst.version, spec)
    await verifyInstalled(entry)
    return { version: entry.version }
  })

  const uninstall = id => run(id, 'removing', async () => {
    const inst = installedGames().get(id)
    if (!inst) throw new StoreError('not-installed')
    const pm = needManager()
    stopServer(id)
    // Extensions of a game go with the game.
    for (const ext of extensionsOf(id).filter(x => !x.local)) { try { settle(await pm.removeBundle(ext.package), 'remove') } catch (err) { log(`removing ${ext.package}: ${err.message}`) } }
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
    if (ext.local) throw new StoreError('bad-package', 'a local mod is updated in its folder')
    await replaceBundle(pm, entry.package, ext.version, spec)
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

  /** GitHub stars of every game's repository, asked from this computer at most every six hours. */
  const starCache = { at: 0, map: {}, work: null }
  async function stars() {
    if (Date.now() - starCache.at < 6 * 3600_000) return starCache.map
    if (starCache.work) return starCache.work
    starCache.work = (async () => {
      const repos = [...new Set(catalog.games.map(g => String(g.repository ?? '').replace('https://github.com/', '')).filter(r => /^[\w.-]+\/[\w.-]+$/.test(r)))]
      const map = { ...starCache.map }
      await Promise.all(repos.map(async repo => {
        try {
          const r = await fetch(`https://api.github.com/repos/${repo}`, { signal: AbortSignal.timeout(8_000), headers: { accept: 'application/vnd.github+json', 'user-agent': 'dsh-game-store' } })
          if (r.ok) { const n = (await r.json()).stargazers_count; if (typeof n === 'number') map[repo] = n }
        } catch { /* keep the last count */ }
      }))
      starCache.map = map; starCache.at = Date.now(); starCache.work = null
      return map
    })()
    return starCache.work
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
        if (route === 'stars') return send(res, 200, { stars: await stars() })
        if (route === 'asset') return await asset(String(url.searchParams.get('id')), String(url.searchParams.get('path')), res)
        return send(res, 404, { error: 'not-found' })
      }
      if (req.method !== 'POST') return send(res, 405, { error: 'method' })
      // A page from another site cannot send JSON without asking first, and DSH's server does not let it ask.
      if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) return send(res, 403, { error: 'forbidden' })
      const body = await readJson(req)
      const id = String(body.id ?? '')
      if (route === 'refresh') { await refresh(); if (autoUpdate) void updateGames().catch(() => {}); return send(res, 200, state()) }
      if (route === 'install') { await install(id); return send(res, 200, state()) }
      if (route === 'update') { await update(id); return send(res, 200, state()) }
      if (route === 'uninstall') { await uninstall(id); return send(res, 200, state()) }
      const game = String(body.game ?? '')
      if (route === 'ext-install') { await extInstall(game, id); return send(res, 200, state()) }
      if (route === 'ext-update') { await extUpdate(game, id); return send(res, 200, state()) }
      if (route === 'ext-uninstall') { await extUninstall(game, id); return send(res, 200, state()) }
      if (route === 'ext-enable') { extEnable(game, id, body.on !== false); return send(res, 200, state()) }
      if (route === 'ext-folder') {
        const g = String(body.game ?? '')
        if (!/^[a-z0-9-]+$/.test(g)) return send(res, 400, { error: 'bad-id' })
        const base = join(LOCAL_WORKSHOP, g), want = String(body.folder ?? '')
        forgetExtensions()
        return send(res, 200, { dir: body.open === false ? (mkdirSync(base, { recursive: true }), base) : reveal(want.startsWith(base + sep) ? want : base) })
      }
      if (route === 'ext-create') return send(res, 200, createMod(body))
      if (route === 'ext-rescan') { forgetExtensions(); return send(res, 200, state()) }
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
  ctx.effect(() => ctx.provide('gameStore', { version: 1, state, refresh, install, update, uninstall, launch, extInstall, extUninstall, extEnable, updateGames, updateSelf }), 'dsh-game-store: service')
  log(`started ${VERSION}; catalog ${catalogUrl}; data in ${dataDir}`)
}
