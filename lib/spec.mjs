/**
 * The game package rules of SPEC.md, as code. The store plugin, the `dsh-game-store check`
 * command and the catalog CI all call the same functions, so they always agree.
 * No dependencies: Node built-ins only.
 */
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, normalize, sep } from 'node:path'

export const SPEC_VERSION = 1

/** The only patch file a game package may ship: it adds nothing to DSH. */
export const STANDARD_PATCH = '# dsh-game-store spec 1: a game adds no plugin rows.\n[]\n'

export const LIMITS = {
  /** Unpacked package size. */
  packageBytes: 300 * 1024 * 1024,
  iconBytes: 256 * 1024,
  coverBytes: 2 * 1024 * 1024,
  screenshotBytes: 2 * 1024 * 1024,
  aboutBytes: 64 * 1024,
  videoBytes: 40 * 1024 * 1024,
  maxVideos: 3,
  minScreenshots: 1,
  maxScreenshots: 8,
  summaryChars: 80,
  /** Unpacked size of a workshop extension. */
  extensionBytes: 50 * 1024 * 1024,
}

/** Addresses a game may talk to: https:// or wss:// plus a host name, nothing else. Never this platform's own domains, never the player's machine or network. */
export const NETWORK_HOST_RE = /^(https|wss):\/\/([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(:\d{2,5})?$/
export const PLATFORM_DOMAINS = ['dsh-game-store.com']
export function networkHostProblem(host) {
  if (typeof host !== 'string' || !NETWORK_HOST_RE.test(host)) return 'must look like "https://api.example.com" or "wss://play.example.com" (no path)'
  const name = host.replace(/^(https|wss):\/\//, '').replace(/:\d+$/, '')
  if (PLATFORM_DOMAINS.some(d => name === d || name.endsWith(`.${d}`))) return 'the store\'s own domain cannot be a game server'
  if (/^(localhost|.*\.local|.*\.localhost|.*\.internal|.*\.lan)$/.test(name)) return 'addresses on the player\'s own machine or network are not allowed'
  return ''
}

export const CONTROLS = ['keyboard', 'mouse', 'touch', 'gamepad']
export const RATINGS = ['everyone', 'teen', 'mature']
export const ID_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
export const LANG_RE = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/
/** Licenses a catalog game may use without a manual review. `SEE LICENSE IN <file>` is also accepted. */
export const KNOWN_LICENSES = [
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'MPL-2.0', 'GPL-2.0-only', 'GPL-2.0-or-later',
  'GPL-3.0-only', 'GPL-3.0-or-later', 'LGPL-3.0-only', 'LGPL-3.0-or-later', 'AGPL-3.0-only', 'AGPL-3.0-or-later',
  'CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'CC-BY-NC-4.0', 'CC-BY-NC-SA-4.0', 'CC-BY-NC-ND-4.0', 'Unlicense', 'Zlib',
  'PolyForm-Noncommercial-1.0.0', 'PolyForm-Strict-1.0.0',
]

const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp']

/** Pick the text for a language: exact id, then its main part ("zh-tw" -> "zh"), then English. */
export function pickText(text, lang = 'en') {
  if (typeof text === 'string') return text
  if (!text || typeof text !== 'object') return ''
  const id = String(lang).toLowerCase()
  return text[id] ?? text[id.split('-')[0]] ?? text.en ?? ''
}

/** Width and height of a PNG, JPEG or WebP file; undefined when it is none of them. */
export function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { type: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const kind = buf.toString('ascii', 12, 16)
    if (kind === 'VP8X') return { type: 'webp', width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) }
    if (kind === 'VP8 ') return { type: 'webp', width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
    if (kind === 'VP8L') { const b = buf.readUInt32LE(21); return { type: 'webp', width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff) } }
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue }
      const marker = buf[i + 1]
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return { type: 'jpeg', height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
      i += 2 + buf.readUInt16BE(i + 2)
    }
  }
  return undefined
}

/** A path from the manifest must stay inside the package and use forward slashes. */
function safeRel(p) {
  if (typeof p !== 'string' || !p || p.startsWith('/') || p.includes('\\') || p.includes('\0')) return false
  const n = normalize(p)
  return !n.startsWith('..') && !n.split(sep).includes('..')
}

function walk(dir, base = '') {
  const out = []
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name), rel = base ? `${base}/${name}` : name
    const st = lstatSync(abs)
    if (st.isSymbolicLink()) out.push({ rel, link: true, size: 0 })
    else if (st.isDirectory()) out.push(...walk(abs, rel))
    else out.push({ rel, size: st.size })
  }
  return out
}

export function sha512Integrity(buf) {
  return `sha512-${createHash('sha512').update(buf).digest('base64')}`
}

function localized(report, value, where, { required = true, max } = {}) {
  if (value === undefined && !required) return
  if (typeof value === 'string') { if (!value.trim()) report.error(`${where}: empty`); return }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return report.error(`${where}: must be a string or an object like { "en": "…", "zh": "…" }`)
  if (typeof value.en !== 'string' || !value.en.trim()) report.error(`${where}.en: English text is required`)
  for (const [k, v] of Object.entries(value)) {
    if (!LANG_RE.test(k)) report.error(`${where}.${k}: language ids are lowercase, like "en", "zh", "zh-tw"`)
    if (typeof v !== 'string' || !v.trim()) report.error(`${where}.${k}: empty`)
    else if (max && [...v].length > max) report.error(`${where}.${k}: longer than ${max} characters`)
  }
}

function makeReport() {
  const errors = [], warnings = []
  return { errors, warnings, error: m => errors.push(m), warn: m => warnings.push(m) }
}

/** The package.json rules games and extensions share: a valid npm package with a license and no code for DSH. */
function checkPackageJson(r, dir, pkg, { prefix, field, file }) {
  if (typeof pkg.name !== 'string' || !/^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(pkg.name)) r.error('package.json name: not a valid npm name')
  else if (!new RegExp(`^(@[^/]+\\/)?${prefix}`).test(pkg.name)) r.warn(`package.json name: "${pkg.name}" does not start with ${prefix} (recommended)`)
  if (pkg.name === 'dsh-game-store') r.error('package.json name: dsh-game-store is the store itself')
  if (typeof pkg.version !== 'string' || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(pkg.version)) r.error('package.json version: must be x.y.z')
  if (pkg.private) r.error('package.json private: a published game cannot be private')
  if (typeof pkg.license !== 'string' || !pkg.license.trim()) r.error('package.json license: required (an SPDX id such as MIT, or "SEE LICENSE IN LICENSE.md")')
  else if (pkg.license === 'UNLICENSED') r.error('package.json license: UNLICENSED gives players no right to run the game')
  else if (!KNOWN_LICENSES.includes(pkg.license) && !/^SEE LICENSE IN \S+/.test(pkg.license)) r.warn(`package.json license: "${pkg.license}" is not on the known list; a reviewer will read it`)
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies', 'bundledDependencies', 'bundleDependencies']) {
    const v = pkg[field]
    if (v && (Array.isArray(v) ? v.length : Object.keys(v).length)) r.error(`package.json ${field}: a game package has no dependencies (ship every file it needs)`)
  }
  for (const s of ['preinstall', 'install', 'postinstall', 'prepare', 'preuninstall', 'postuninstall']) {
    if (pkg.scripts?.[s]) r.error(`package.json scripts.${s}: install scripts are not allowed`)
  }
  for (const field of ['main', 'module', 'exports', 'bin', 'browser']) {
    if (pkg[field] !== undefined) r.error(`package.json ${field}: not allowed; a game has no code that runs in DSH itself`)
  }
  if (pkg.dsh?.client) r.error('package.json dsh.client: not allowed; a game adds nothing to the DSH page')
  if (pkg.dsh?.profile) r.error('package.json dsh.profile: not allowed')
  const patch = pkg.dsh?.bundle?.patch
  if (patch !== './cordis.patch.yml') r.error('package.json dsh.bundle.patch: must be "./cordis.patch.yml"')
  else if (!existsSync(join(dir, 'cordis.patch.yml'))) r.error('cordis.patch.yml: missing')
  else if (readFileSync(join(dir, 'cordis.patch.yml'), 'utf8').replace(/\r\n/g, '\n') !== STANDARD_PATCH) r.error('cordis.patch.yml: must be the standard file from the template, unchanged')
  if (pkg[field] !== `./${file}`) r.error(`package.json ${field}: must be "./${file}"`)
  if (pkg.repository === undefined) r.warn('package.json repository: add the source repository so players can see where the game comes from')

}

/**
 * Check an unpacked game package against the spec.
 * @param dir the package folder (it holds package.json)
 * @returns { ok, errors, warnings, pkg, manifest, bytes, files }
 */
export function checkPackage(dir) {
  const r = makeReport()
  const done = extra => ({ ok: r.errors.length === 0, errors: r.errors, warnings: r.warnings, ...extra })
  const readJson = (rel) => { try { return JSON.parse(readFileSync(join(dir, rel), 'utf8')) } catch (e) { r.error(`${rel}: ${existsSync(join(dir, rel)) ? 'not valid JSON' : 'missing'}`); return undefined } }

  const pkg = readJson('package.json')
  if (!pkg) return done({})

  checkPackageJson(r, dir, pkg, { prefix: 'dsh-game-', field: 'dshGame', file: 'game.json' })

  // --- files
  const files = walk(dir).filter(f => !f.rel.startsWith('node_modules/'))
  const bytes = files.reduce((n, f) => n + f.size, 0)
  for (const f of files) if (f.link) r.error(`${f.rel}: symbolic links are not allowed`)
  if (bytes > LIMITS.packageBytes) r.error(`package size: ${(bytes / 1048576).toFixed(1)} MB unpacked, the limit is ${LIMITS.packageBytes / 1048576} MB`)
  for (const f of files) {
    if (/\.(node|dylib|so|dll|exe|sh|bat|cmd|ps1)$/i.test(f.rel)) r.error(`${f.rel}: native or shell programs are not allowed`)
  }
  const licenseFile = files.find(f => /^(LICENSE|LICENCE|COPYING)(\.[a-z]+)?$/i.test(f.rel))
  if (!licenseFile) r.error('LICENSE: add a license file at the package root')
  const has = rel => files.some(f => f.rel === rel)
  const sizeOf = rel => files.find(f => f.rel === rel)?.size ?? 0

  // --- game.json
  const m = readJson('game.json')
  if (!m) return done({ pkg, bytes, files })
  if (m.spec !== SPEC_VERSION) r.error(`game.json spec: must be ${SPEC_VERSION}`)
  if (typeof m.id !== 'string' || !ID_RE.test(m.id) || m.id.length > 40) r.error('game.json id: lowercase letters, digits and hyphens, at most 40 characters')
  else if (typeof pkg.name === 'string' && /^(@[^/]+\/)?dsh-game-/.test(pkg.name) && pkg.name.replace(/^(@[^/]+\/)?dsh-game-/, '') !== m.id) r.warn(`game.json id: "${m.id}" differs from the package name ending`)
  localized(r, m.name, 'game.json name', { max: 40 })
  localized(r, m.summary, 'game.json summary', { max: LIMITS.summaryChars })
  localized(r, m.tagline, 'game.json tagline', { required: false, max: 80 })
  if (!m.author || typeof m.author.name !== 'string' || !m.author.name.trim()) r.error('game.json author.name: required')
  if (m.author?.url !== undefined && !/^https:\/\//.test(m.author.url)) r.error('game.json author.url: must start with https://')

  const file = (rel, where, { exts, maxBytes } = {}) => {
    if (!safeRel(rel)) { r.error(`${where}: "${rel}" must be a path inside the package`); return false }
    if (!has(rel)) { r.error(`${where}: file "${rel}" is missing`); return false }
    if (exts && !exts.some(e => rel.toLowerCase().endsWith(e))) r.error(`${where}: "${rel}" must be one of ${exts.join(' ')}`)
    if (maxBytes && sizeOf(rel) > maxBytes) r.error(`${where}: "${rel}" is ${(sizeOf(rel) / 1024).toFixed(0)} KB, the limit is ${maxBytes / 1024} KB`)
    return true
  }
  const image = (rel, where, { maxBytes, minWidth, minHeight, ratio, square }) => {
    if (!file(rel, where, { exts: IMAGE_EXT, maxBytes })) return
    const size = imageSize(readFileSync(join(dir, rel)))
    if (!size) return r.error(`${where}: "${rel}" is not a PNG, JPEG or WebP image`)
    if (size.width < minWidth || size.height < minHeight) r.error(`${where}: "${rel}" is ${size.width}×${size.height}, at least ${minWidth}×${minHeight} is needed`)
    if (square && size.width !== size.height) r.error(`${where}: "${rel}" must be square`)
    if (ratio && Math.abs(size.width / size.height - ratio) > 0.02) r.error(`${where}: "${rel}" is ${size.width}×${size.height}, it must be 16:9`)
  }

  if (typeof m.entry !== 'string' || !/^game\/.+\.html?$/.test(m.entry)) r.error('game.json entry: must be an HTML file inside game/, such as "game/index.html"')
  else file(m.entry, 'game.json entry')
  if (m.icon === undefined) r.error('game.json icon: required')
  else image(m.icon, 'game.json icon', { maxBytes: LIMITS.iconBytes, minWidth: 128, minHeight: 128, square: true })
  if (m.cover === undefined) r.error('game.json cover: required')
  else image(m.cover, 'game.json cover', { maxBytes: LIMITS.coverBytes, minWidth: 1280, minHeight: 720, ratio: 16 / 9 })
  if (!Array.isArray(m.screenshots) || m.screenshots.length < LIMITS.minScreenshots) r.error(`game.json screenshots: at least ${LIMITS.minScreenshots} is needed`)
  else {
    if (m.screenshots.length > LIMITS.maxScreenshots) r.error(`game.json screenshots: at most ${LIMITS.maxScreenshots}`)
    m.screenshots.forEach((s, i) => {
      if (!s || typeof s.src !== 'string') return r.error(`game.json screenshots[${i}].src: required`)
      image(s.src, `game.json screenshots[${i}]`, { maxBytes: LIMITS.screenshotBytes, minWidth: 960, minHeight: 540 })
      localized(r, s.caption, `game.json screenshots[${i}].caption`, { required: false, max: 80 })
    })
  }

  if (m.videos !== undefined) {
    if (!Array.isArray(m.videos) || m.videos.length > LIMITS.maxVideos) r.error(`game.json videos: a list of at most ${LIMITS.maxVideos}`)
    else m.videos.forEach((v, i) => {
      if (!v || typeof v.src !== 'string' || !/^store\//.test(v.src)) return r.error(`game.json videos[${i}].src: a file inside store/`)
      file(v.src, `game.json videos[${i}]`, { exts: ['.mp4', '.webm'], maxBytes: LIMITS.videoBytes })
      if (v.poster !== undefined) image(v.poster, `game.json videos[${i}].poster`, { maxBytes: LIMITS.screenshotBytes, minWidth: 960, minHeight: 540 })
      localized(r, v.caption, `game.json videos[${i}].caption`, { required: false, max: 80 })
    })
  }

  if (!m.about || typeof m.about !== 'object' || typeof m.about.en !== 'string') r.error('game.json about: an object of Markdown files by language; "en" is required')
  else for (const [k, rel] of Object.entries(m.about)) {
    if (!LANG_RE.test(k)) r.error(`game.json about.${k}: language ids are lowercase`)
    if (file(rel, `game.json about.${k}`, { exts: ['.md'], maxBytes: LIMITS.aboutBytes }) && !readFileSync(join(dir, rel), 'utf8').trim()) r.error(`game.json about.${k}: "${rel}" is empty`)
  }
  if (m.manual !== undefined) {
    if (!m.manual || typeof m.manual !== 'object') r.error('game.json manual: an object of HTML files by language')
    else for (const [k, rel] of Object.entries(m.manual)) {
      if (!LANG_RE.test(k)) r.error(`game.json manual.${k}: language ids are lowercase`)
      if (typeof rel !== 'string' || !/^manual\/.+\.html?$/.test(rel)) r.error(`game.json manual.${k}: must be an HTML file inside manual/`)
      else file(rel, `game.json manual.${k}`)
    }
  }

  if (!Array.isArray(m.languages) || !m.languages.length || m.languages.some(l => typeof l !== 'string' || !/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(l))) r.error('game.json languages: a list of language tags the game itself can show, such as ["en", "zh-CN"]')
  if (!Array.isArray(m.controls) || !m.controls.length || m.controls.some(c => !CONTROLS.includes(c))) r.error(`game.json controls: a list from ${CONTROLS.join(', ')}`)
  if (!m.players || !Number.isInteger(m.players.min) || !Number.isInteger(m.players.max) || m.players.min < 1 || m.players.max < m.players.min) r.error('game.json players: { "min": 1, "max": n }')
  if (!m.content || !RATINGS.includes(m.content.rating)) r.error(`game.json content.rating: one of ${RATINGS.join(', ')}`)
  localized(r, m.content?.notes, 'game.json content.notes', { required: false, max: 200 })
  if (m.content?.rating && m.content.rating !== 'everyone' && m.content.notes === undefined) r.error('game.json content.notes: say what the content is when the rating is teen or mature')

  if (m.workshop !== undefined) {
    const w = m.workshop
    if (!w || typeof w !== 'object') r.error('game.json workshop: an object')
    else {
      if (!Array.isArray(w.types) || !w.types.length || w.types.some(t => typeof t !== 'string' || !ID_RE.test(t))) r.error('game.json workshop.types: the kinds of extensions the game accepts, such as ["map", "language"]')
      if (typeof w.mount !== 'string' || !/^game\/[\w./-]+$/.test(w.mount) || !safeRel(w.mount) || w.mount.endsWith('/')) r.error('game.json workshop.mount: a folder inside game/, such as "game/mods"')
      if (w.list !== undefined) {
        if (typeof w.list?.path !== 'string' || !safeRel(w.list.path) || !String(w.list.path).startsWith(`${w.mount}/`)) r.error('game.json workshop.list.path: a file inside the mount folder')
        if (typeof w.list?.template !== 'string' || !w.list.template.includes('{{ids}}') || w.list.template.length > 400) r.error('game.json workshop.list.template: text with {{ids}} where the list of enabled extension ids goes')
      }
      localized(r, w.guide, 'game.json workshop.guide', { required: false, max: 200 })
    }
  }

  if (m.network !== undefined) {
    const n = m.network
    if (!n || typeof n !== 'object' || !Array.isArray(n.hosts) || !n.hosts.length || n.hosts.length > 8) r.error('game.json network.hosts: a list of 1 to 8 addresses the game connects to')
    else for (const hst of n.hosts) { const bad = networkHostProblem(hst); if (bad) r.error(`game.json network.hosts "${hst}": ${bad}`) }
    localized(r, n?.notes, 'game.json network.notes', { max: 200 })
  }

  // --- a game is offline unless it declares its servers: point out addresses it will not reach
  const remote = []
  for (const f of files) {
    if (!f.rel.startsWith('game/') || !/\.(html?|js|mjs|css)$/i.test(f.rel) || f.size > 4 * 1024 * 1024) continue
    const text = readFileSync(join(dir, f.rel), 'utf8')
    if (/(src|href)\s*=\s*["']https?:\/\//i.test(text) || /\b(fetch|WebSocket|EventSource|importScripts)\s*\(\s*["'`](https?|wss?):\/\//.test(text)) remote.push(f.rel)
  }
  if (remote.length && !m.network) r.warn(`network: ${remote.slice(0, 5).join(', ')}${remote.length > 5 ? ` and ${remote.length - 5} more` : ''} load from the internet; the store blocks that unless game.json declares the servers under network`)

  return done({ pkg, manifest: m, bytes, files })
}

/** Check one catalog entry file (catalog/games/<id>.json). */
export function checkCatalogEntry(entry, fileId) {
  const r = makeReport()
  if (!entry || typeof entry !== 'object') { r.error('not a JSON object'); return r }
  if (typeof entry.id !== 'string' || !ID_RE.test(entry.id)) r.error('id: lowercase letters, digits and hyphens')
  if (fileId !== undefined && entry.id !== fileId) r.error(`id: must equal the file name ("${fileId}")`)
  if (typeof entry.package !== 'string' || !/^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(entry.package)) r.error('package: an npm package name')
  if (typeof entry.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(entry.version)) r.error('version: an exact release version x.y.z')
  if (typeof entry.integrity !== 'string' || !/^sha512-[A-Za-z0-9+/]{86}==$/.test(entry.integrity)) r.error('integrity: the sha512 value npm shows for this version (npm view <package>@<version> dist.integrity)')
  if (typeof entry.repository !== 'string' || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(entry.repository)) r.error('repository: https://github.com/<owner>/<repo>')
  if (!['listed', 'delisted', 'blocked'].includes(entry.status ?? 'listed')) r.error('status: listed, delisted or blocked')
  if ((entry.status === 'delisted' || entry.status === 'blocked') && (typeof entry.reason !== 'string' || !entry.reason.trim())) r.error('reason: say why the game was taken down')
  if (entry.addedAt !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(entry.addedAt)) r.error('addedAt: YYYY-MM-DD')
  return r
}

/**
 * Does a game version satisfy what an extension asks for?
 * `want` is "1.0" (exactly 1.0.x), "1.x" (any 1.*), "*" (any), or a list of those.
 */
export function gameVersionOk(want, gameVersion) {
  if (Array.isArray(want)) return want.some(w => gameVersionOk(w, gameVersion))
  if (typeof want !== 'string' || !want) return false
  if (want === '*') return true
  const a = want.split('.'), b = String(gameVersion).split('.')
  if (a[0] !== b[0]) return false
  return a[1] === undefined || a[1] === 'x' || a[1] === '*' || a[1] === b[1]
}
const VERSION_WANT = /^(\*|\d+(\.(\d+|x|\*))?)$/

/**
 * Check an unpacked extension package (a workshop item) against the spec.
 * @returns { ok, errors, warnings, pkg, manifest, bytes }
 */
export function checkExtension(dir) {
  const r = makeReport()
  const done = extra => ({ ok: r.errors.length === 0, errors: r.errors, warnings: r.warnings, ...extra })
  const readJson = rel => { try { return JSON.parse(readFileSync(join(dir, rel), 'utf8')) } catch { r.error(`${rel}: ${existsSync(join(dir, rel)) ? 'not valid JSON' : 'missing'}`); return undefined } }
  const pkg = readJson('package.json')
  if (!pkg) return done({})
  if (pkg.dshGame !== undefined) r.error('package.json dshGame: a package is a game or an extension, not both')
  const m = readJson('extension.json')
  checkPackageJson(r, dir, pkg, { prefix: `dsh-game-${typeof m?.game === 'string' ? `${m.game}-` : ''}`, field: 'dshGameExtension', file: 'extension.json' })
  const files = walk(dir).filter(f => !f.rel.startsWith('node_modules/'))
  const bytes = files.reduce((n, f) => n + f.size, 0)
  for (const f of files) {
    if (f.link) r.error(`${f.rel}: symbolic links are not allowed`)
    if (/\.(node|dylib|so|dll|exe|sh|bat|cmd|ps1)$/i.test(f.rel)) r.error(`${f.rel}: native or shell programs are not allowed`)
  }
  if (bytes > LIMITS.extensionBytes) r.error(`package size: ${(bytes / 1048576).toFixed(1)} MB unpacked, the limit is ${LIMITS.extensionBytes / 1048576} MB`)
  if (!files.some(f => /^(LICENSE|LICENCE|COPYING)(\.[a-z]+)?$/i.test(f.rel))) r.error('LICENSE: add a license file at the package root')
  if (!m) return done({ pkg, bytes })
  if (m.spec !== SPEC_VERSION) r.error(`extension.json spec: must be ${SPEC_VERSION}`)
  if (typeof m.id !== 'string' || !ID_RE.test(m.id) || m.id.length > 40) r.error('extension.json id: lowercase letters, digits and hyphens, at most 40 characters')
  if (typeof m.game !== 'string' || !ID_RE.test(m.game)) r.error('extension.json game: the id of the game this extends')
  const wants = Array.isArray(m.gameVersion) ? m.gameVersion : [m.gameVersion]
  if (!wants.length || wants.some(w => typeof w !== 'string' || !VERSION_WANT.test(w))) r.error('extension.json gameVersion: "1.0", "1.x", "*", or a list of those')
  if (!Array.isArray(m.types) || !m.types.length || m.types.some(t => typeof t !== 'string' || !ID_RE.test(t))) r.error('extension.json types: what the extension adds, such as ["map"]')
  localized(r, m.name, 'extension.json name', { max: 40 })
  localized(r, m.summary, 'extension.json summary', { max: 120 })
  if (!m.author || typeof m.author.name !== 'string' || !m.author.name.trim()) r.error('extension.json author.name: required')
  if (typeof m.files !== 'string' || !/^[\w-]+$/.test(m.files) || ['node_modules', 'store'].includes(m.files)) r.error('extension.json files: the name of the folder that is handed to the game, such as "mod"')
  else if (!files.some(f => f.rel.startsWith(`${m.files}/`))) r.error(`extension.json files: the folder "${m.files}/" is empty or missing`)
  return done({ pkg, manifest: m, bytes })
}

/** Check one workshop entry file (catalog/workshop/<game>/<id>.json). */
export function checkWorkshopEntry(entry, game, fileId) {
  const r = checkCatalogEntry(entry, fileId)
  if (entry && entry.game !== game) r.error(`game: must equal the folder name ("${game}")`)
  return r
}
