#!/usr/bin/env node
/**
 * dsh-game-store command line tool, for game developers.
 *
 *   dsh-game-store init <folder>            start a new game package from the template
 *   dsh-game-store init-extension <folder> --game <game id>
 *                                           start a new extension (workshop item) for a game
 *   dsh-game-store check [folder|tarball]   check a game or extension package against the spec
 *   dsh-game-store entry <tarball|name@version> --repo <github url>
 *                                           print the catalog entry for a packed or published version
 */
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchPackage, registryVersion } from '../lib/packages.mjs'
import { checkExtension, checkPackage, ID_RE, LIMITS, STANDARD_PATCH } from '../lib/spec.mjs'
import { mkdirSync } from 'node:fs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const [cmd, ...rest] = process.argv.slice(2)
const opt = name => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined }
const args = rest.filter((a, i) => !a.startsWith('--') && !(rest[i - 1] ?? '').startsWith('--'))
const die = msg => { console.error(msg); process.exit(1) }

/** A package is an extension when its package.json says so; otherwise it is checked as a game. */
function checkAny(dir) {
  let pkg = {}
  try { pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) } catch { /* the check reports it */ }
  return pkg.dshGameExtension !== undefined ? { ...checkExtension(dir), extension: true } : checkPackage(dir)
}

function report(r) {
  for (const w of r.warnings) console.log(`  warning  ${w}`)
  for (const e of r.errors) console.log(`  error    ${e}`)
  if (r.ok && r.extension) console.log(`  ok       ${r.pkg.name}@${r.pkg.version}, extension "${r.manifest.id}" for game "${r.manifest.game}", ${(r.bytes / 1024).toFixed(0)} KB`)
  else if (r.ok) console.log(`  ok       ${r.pkg.name}@${r.pkg.version}, game "${r.manifest.id}", ${(r.bytes / 1048576).toFixed(1)} MB of ${LIMITS.packageBytes / 1048576} MB`)
  return r.ok
}

async function unpacked(target) {
  const p = resolve(target)
  if (existsSync(p) && statSync(p).isDirectory()) return { dir: p }
  if (existsSync(p)) {
    const pkgName = basename(p).replace(/-\d+\.\d+\.\d+.*\.tgz$/, '')
    const tmp = mkdtempSync(join(tmpdir(), 'dsh-game-'))
    const got = await fetchPackage({ package: pkgName, version: '0.0.0' }, { local: p, cacheDir: tmp })
    return { ...got, tmp }
  }
  const m = /^(@?[^@]+)@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(target)
  if (!m) die(`Not a folder, a tarball or name@version: ${target}`)
  const tmp = mkdtempSync(join(tmpdir(), 'dsh-game-'))
  return { ...(await fetchPackage({ package: m[1], version: m[2] }, { cacheDir: tmp })), tmp }
}

if (cmd === 'init') {
  const target = resolve(args[0] ?? die('Usage: dsh-game-store init <folder>'))
  const id = basename(target).replace(/^dsh-game-/, '')
  if (!ID_RE.test(id)) die(`"${id}" cannot be a game id. Use lowercase letters, digits and hyphens, for example dsh-game-my-game.`)
  if (existsSync(target) && readdirSync(target).length) die(`${target} is not empty.`)
  cpSync(join(root, 'template'), target, { recursive: true })
  for (const file of ['package.json', 'game.json', 'README.md']) {
    const f = join(target, file)
    writeFileSync(f, readFileSync(f, 'utf8').replaceAll('my-game', id))
  }
  console.log(`Created ${target}\n\nNext:\n  1. Put your game's files in game/ (the entry is game/index.html).\n  2. Edit game.json and the files in store/.\n  3. Run: npx dsh-game-store check ${target}`)
} else if (cmd === 'init-extension') {
  const target = resolve(args[0] ?? die('Usage: dsh-game-store init-extension <folder> --game <game id>'))
  const game = opt('--game') ?? die('Say which game it extends: --game <game id>')
  const id = basename(target).replace(new RegExp(`^dsh-game-${game}-`), '').replace(/^dsh-game-/, '')
  if (!ID_RE.test(id) || !ID_RE.test(game)) die('Game and extension ids use lowercase letters, digits and hyphens.')
  if (existsSync(target) && readdirSync(target).length) die(`${target} is not empty.`)
  mkdirSync(join(target, 'mod'), { recursive: true })
  const name = `dsh-game-${game}-${id}`
  writeFileSync(join(target, 'package.json'), `${JSON.stringify({ name, version: '1.0.0', description: `An extension for ${game}`, license: 'MIT', author: 'Your Name', repository: { type: 'git', url: `git+https://github.com/your-name/${name}.git` }, keywords: ['dsh', 'dsh-game', 'dsh-game-extension', game], files: ['mod', 'extension.json', 'cordis.patch.yml', 'README.md', 'LICENSE'], dsh: { bundle: { patch: './cordis.patch.yml' } }, dshGameExtension: './extension.json' }, null, 2)}\n`)
  writeFileSync(join(target, 'extension.json'), `${JSON.stringify({ spec: 1, id, game, gameVersion: '1.x', types: ['map'], name: { en: 'My Extension', zh: '我的扩展' }, summary: { en: 'One sentence about what it adds.', zh: '一句话说它加了什么。' }, author: { name: 'Your Name' }, files: 'mod' }, null, 2)}\n`)
  writeFileSync(join(target, 'cordis.patch.yml'), STANDARD_PATCH)
  cpSync(join(root, 'template/LICENSE'), join(target, 'LICENSE'))
  writeFileSync(join(target, 'mod/README.txt'), `Put the files the game "${game}" reads here. What goes in them is up to the game: read its extension guide.\n`)
  writeFileSync(join(target, 'README.md'), `# ${name}\n\nAn extension for ${game}, for the [DSH Game Store](https://dsh-game-store.com) workshop.\n\nHow to make and publish an extension: https://dsh-game-store.com/en/workshop/\n`)
  console.log(`Created ${target}\n\nNext:\n  1. Put your files in mod/ (see the game's extension guide).\n  2. Edit extension.json: gameVersion, types, name, summary.\n  3. Run: npx dsh-game-store check ${target}`)
} else if (cmd === 'check') {
  const got = await unpacked(args[0] ?? '.')
  const ok = report(checkAny(got.dir))
  if (got.tmp) rmSync(got.tmp, { recursive: true, force: true })
  process.exit(ok ? 0 : 1)
} else if (cmd === 'entry') {
  const target = args[0] ?? die('Usage: dsh-game-store entry <tarball|name@version> --repo https://github.com/<owner>/<repo>')
  const got = await unpacked(target)
  const r = checkAny(got.dir)
  if (!report(r)) { if (got.tmp) rmSync(got.tmp, { recursive: true, force: true }); process.exit(1) }
  let integrity = got.integrity
  if (!integrity) die('Pack the folder first (npm pack), then pass the .tgz file.')
  if (got.source === 'local') {
    const meta = await registryVersion(r.pkg.name, r.pkg.version).catch(() => undefined)
    if (!meta) console.error(`note: ${r.pkg.name}@${r.pkg.version} is not on npm yet. Publish this exact tarball, or the checksum will differ.`)
    else if (meta.dist?.integrity !== integrity) die(`npm already has ${r.pkg.name}@${r.pkg.version} with another checksum (${meta.dist?.integrity}). Raise the version and publish again.`)
  }
  const repo = opt('--repo') ?? (typeof r.pkg.repository === 'string' ? r.pkg.repository : r.pkg.repository?.url ?? '').replace(/^git\+/, '').replace(/\.git$/, '')
  console.log(r.extension ? `\ncatalog/workshop/${r.manifest.game}/${r.manifest.id}.json:\n` : `\ncatalog/games/${r.manifest.id}.json:\n`)
  console.log(JSON.stringify({ id: r.manifest.id, ...(r.extension ? { game: r.manifest.game } : {}), package: r.pkg.name, version: r.pkg.version, integrity, repository: repo, addedAt: new Date().toISOString().slice(0, 10) }, null, 2))
  if (got.tmp) rmSync(got.tmp, { recursive: true, force: true })
} else {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(2, 11).map(l => l.replace(/^ \* ?/, '')).join('\n'))
  process.exit(cmd ? 1 : 0)
}
