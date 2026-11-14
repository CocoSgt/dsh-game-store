#!/usr/bin/env node
/**
 * Check the game catalog. This is what CI runs on every pull request.
 *
 *   node scripts/check-catalog.mjs [--only <id>[,<id>]] [--local <package>=<tarball>]... [--no-install] [--catalog <folder>]
 *
 * --catalog checks another copy of catalog/ (the reviewer uses it on a pull request's files, with main's own scripts).
 *
 * For each catalog/games/<id>.json:
 *   1. the entry file is well formed, and no two entries share an id or a package;
 *   2. npm has that exact version with that exact checksum (or the --local tarball matches it);
 *   3. the downloaded package passes every rule of the spec (manifest, description, pictures, size, license, no code for DSH);
 *   4. the package installs into an empty folder with install scripts switched off.
 * For each catalog/workshop/<game>/<id>.json the same is done with the extension rules,
 * and the extension must be of a kind its game accepts.
 * Nothing from a game package is ever run.
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchPackage, localSources } from '../lib/packages.mjs'
import { checkCatalogEntry, checkExtension, checkPackage, checkWorkshopEntry, gameVersionOk, modTypesOf } from '../lib/spec.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const opt = name => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined }
const only = opt('--only')?.split(',').filter(Boolean)
const local = localSources(argv, join(root, 'catalog/local.json'))
const catalogDir = opt('--catalog') ? resolve(opt('--catalog')) : join(root, 'catalog')
const dir = join(catalogDir, 'games')

const results = []
const seen = { id: new Map(), package: new Map() }
const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort()
for (const f of readdirSync(dir)) if (!f.endsWith('.json')) results.push({ id: f, errors: ['catalog/games/ holds only <id>.json files'], warnings: [] })

for (const file of files) {
  const id = file.replace(/\.json$/, '')
  const res = { id, errors: [], warnings: [], info: '' }
  results.push(res)
  let entry
  try { entry = JSON.parse(readFileSync(join(dir, file), 'utf8')) } catch { res.errors.push('not valid JSON'); continue }
  const r = checkCatalogEntry(entry, id)
  res.errors.push(...r.errors)
  for (const key of ['id', 'package']) {
    if (seen[key].has(entry[key])) res.errors.push(`${key} "${entry[key]}" is already used by ${seen[key].get(entry[key])}.json`)
    else seen[key].set(entry[key], id)
  }
  if (res.errors.length || (only && !only.includes(id))) { if (only && !only.includes(id)) res.skipped = true; continue }
  // A blocked game stays in the catalog as a record; its package may be gone from npm.
  if (entry.status === 'blocked') { res.info = 'blocked'; continue }
  try {
    const got = await fetchPackage(entry, { local: local[entry.package], cacheDir: join(root, '.cache') })
    const check = checkPackage(got.dir)
    res.errors.push(...check.errors)
    res.warnings.push(...check.warnings)
    if (got.source === 'local') res.warnings.push('checked from a local tarball; the package is not on npm yet')
    if (check.pkg && (check.pkg.name !== entry.package || check.pkg.version !== entry.version)) res.errors.push(`the tarball is ${check.pkg.name}@${check.pkg.version}`)
    if (check.manifest && check.manifest.id !== entry.id) res.errors.push(`the package's game id is "${check.manifest.id}"`)
    const repo = (typeof check.pkg?.repository === 'string' ? check.pkg.repository : check.pkg?.repository?.url ?? '').replace(/^git\+/, '').replace(/\.git$/, '')
    if (repo && repo !== entry.repository) res.warnings.push(`package.json names the repository ${repo}`)
    if (check.ok && !argv.includes('--no-install')) {
      const tmp = mkdtempSync(join(tmpdir(), 'dsh-game-install-'))
      try {
        writeFileSync(join(tmp, 'package.json'), '{"name":"install-test","private":true}')
        execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', got.tarball], { cwd: tmp, stdio: 'pipe' })
        const installed = readdirSync(join(tmp, 'node_modules')).filter(n => !n.startsWith('.'))
        const scoped = installed.flatMap(n => (n.startsWith('@') ? readdirSync(join(tmp, 'node_modules', n)).map(m => `${n}/${m}`) : [n]))
        if (scoped.length !== 1 || scoped[0] !== entry.package) res.errors.push(`installing it also brings in: ${scoped.filter(n => n !== entry.package).join(', ')}`)
        if (!existsSync(join(tmp, 'node_modules', entry.package, check.manifest.entry))) res.errors.push('the entry file is missing after an install')
      } catch (err) { res.errors.push(`npm install failed: ${String(err.stderr ?? err.message).trim().split('\n').slice(-3).join(' ')}`) } finally { rmSync(tmp, { recursive: true, force: true }) }
    }
    res.info = `${entry.package}@${entry.version} · ${(check.bytes / 1048576).toFixed(1)} MB · ${check.pkg?.license ?? ''}`
  } catch (err) { res.errors.push(err.message) }
}

// Workshop entries: catalog/workshop/<game>/<id>.json
const wdir = join(catalogDir, 'workshop')
const manifests = new Map()
for (const gameId of existsSync(wdir) ? readdirSync(wdir).filter(f => !f.startsWith('.')).sort() : []) {
  for (const file of readdirSync(join(wdir, gameId)).filter(f => f.endsWith('.json')).sort()) {
    const id = file.replace(/\.json$/, '')
    const res = { id: `${gameId}/${id}`, errors: [], warnings: [], info: '' }
    results.push(res)
    if (only && !only.includes(res.id) && !only.includes(gameId)) { res.skipped = true; continue }
    try {
      const gameFile = join(dir, `${gameId}.json`)
      if (!existsSync(gameFile)) throw new Error(`there is no game "${gameId}" in the catalog`)
      const entry = JSON.parse(readFileSync(join(wdir, gameId, file), 'utf8'))
      res.errors.push(...checkWorkshopEntry(entry, gameId, id).errors)
      if (seen.package.has(entry.package)) res.errors.push(`package "${entry.package}" is already used by ${seen.package.get(entry.package)}`)
      else seen.package.set(entry.package, res.id)
      if (res.errors.length || entry.status === 'blocked') continue
      if (!manifests.has(gameId)) {
        const g = JSON.parse(readFileSync(gameFile, 'utf8'))
        const got = await fetchPackage(g, { local: local[g.package], cacheDir: join(root, '.cache') })
        manifests.set(gameId, { manifest: JSON.parse(readFileSync(join(got.dir, 'game.json'), 'utf8')), version: g.version })
      }
      const game = manifests.get(gameId)
      const got = await fetchPackage(entry, { local: local[entry.package], cacheDir: join(root, '.cache') })
      const check = checkExtension(got.dir)
      res.errors.push(...check.errors); res.warnings.push(...check.warnings)
      if (got.source === 'local') res.warnings.push('checked from a local tarball; the package is not on npm yet')
      if (check.manifest) {
        if (check.manifest.id !== id || check.manifest.game !== gameId) res.errors.push(`the package is extension "${check.manifest.id}" for game "${check.manifest.game}"`)
        { const extra = check.manifest.types.filter(t => !modTypesOf(game.manifest).includes(t)); if (extra.length) res.errors.push(`${gameId} does not accept extensions of type ${extra.join(', ')}`) }
        if (!gameVersionOk(check.manifest.gameVersion, game.version)) res.warnings.push(`it asks for game version ${[].concat(check.manifest.gameVersion).join(', ')}; the catalog has ${gameId} ${game.version}, so it will stay switched off`)
      }
      if (check.pkg && (check.pkg.name !== entry.package || check.pkg.version !== entry.version)) res.errors.push(`the tarball is ${check.pkg.name}@${check.pkg.version}`)
      res.info = `${entry.package}@${entry.version} · ${(check.bytes / 1024).toFixed(0)} KB · ${check.pkg?.license ?? ''}`
    } catch (err) { res.errors.push(err.message) }
  }
}

let failed = 0
const lines = ['| Game | Result | Details |', '| --- | --- | --- |']
for (const r of results) {
  if (r.skipped) continue
  const ok = r.errors.length === 0
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} ${r.id}${r.info ? `  ${r.info}` : ''}`)
  for (const w of r.warnings) console.log(`    warning  ${w}`)
  for (const e of r.errors) console.log(`    error    ${e}`)
  lines.push(`| ${r.id} | ${ok ? 'pass' : '**fail**'} | ${[r.info, ...r.errors.map(e => `error: ${e}`), ...r.warnings.map(w => `warning: ${w}`)].filter(Boolean).join('<br>').replaceAll('|', '\\|')} |`)
}
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Catalog check\n\n${lines.join('\n')}\n`)
console.log(failed ? `\n${failed} failed` : '\nAll checks passed')
process.exit(failed ? 1 : 0)
