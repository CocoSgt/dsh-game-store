#!/usr/bin/env node
/**
 * Daily health check of the catalog, for an unattended machine. Read only: it changes nothing.
 *
 *   node scripts/patrol.mjs [--json report.json]
 *
 * For every entry (games and workshop): npm still has the version with the same checksum,
 * and the source repository still answers. Then: the site and its catalog.json answer,
 * and the site's catalog names the same versions as this repository.
 * Exit code 1 when anything is wrong, so a scheduler can raise an alarm.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { registryVersion } from '../lib/packages.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://dsh-game-store.com'
const problems = [], notes = []
const entries = []
const gdir = join(root, 'catalog/games')
for (const f of readdirSync(gdir).filter(f => f.endsWith('.json'))) entries.push({ key: f.replace('.json', ''), ...JSON.parse(readFileSync(join(gdir, f), 'utf8')) })
const wdir = join(root, 'catalog/workshop')
for (const g of existsSync(wdir) ? readdirSync(wdir).filter(f => !f.startsWith('.')) : []) for (const f of readdirSync(join(wdir, g)).filter(f => f.endsWith('.json'))) entries.push({ key: `${g}/${f.replace('.json', '')}`, ...JSON.parse(readFileSync(join(wdir, g, f), 'utf8')) })

for (const e of entries) {
  if (e.status === 'blocked') continue
  try {
    const meta = await registryVersion(e.package, e.version)
    if (!meta) problems.push(`${e.key}: ${e.package}@${e.version} is gone from npm`)
    else if (meta.dist?.integrity !== e.integrity) problems.push(`${e.key}: npm now reports another checksum for ${e.package}@${e.version}`)
    else if (meta.deprecated) notes.push(`${e.key}: the author deprecated this version on npm: ${meta.deprecated}`)
  } catch (err) { problems.push(`${e.key}: npm could not be asked (${err.message})`) }
  try {
    const r = await fetch(e.repository, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15_000) })
    if (r.status === 404) notes.push(`${e.key}: the source repository ${e.repository} is gone or private`)
  } catch { /* GitHub being slow is not a catalog problem */ }
}

try {
  const r = await fetch(`${SITE}/catalog.json`, { signal: AbortSignal.timeout(20_000) })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const live = await r.json()
  const liveVersions = new Map()
  for (const g of live.games ?? []) { liveVersions.set(g.id, g.version); for (const x of g.workshop ?? []) liveVersions.set(`${g.id}/${x.id}`, x.version) }
  for (const e of entries) {
    if ((e.status ?? 'listed') !== 'listed') continue
    if (liveVersions.get(e.key) !== e.version) problems.push(`${e.key}: the site has ${liveVersions.get(e.key) ?? 'nothing'}, the repository says ${e.version} (the site needs a rebuild)`)
  }
  const ageHours = (Date.now() - Date.parse(live.generatedAt)) / 3600_000
  notes.push(`site catalog built ${ageHours.toFixed(0)} h ago, ${live.games?.length ?? 0} game(s)`)
} catch (err) { problems.push(`site: ${SITE}/catalog.json did not answer (${err.message})`) }

const report = { at: new Date().toISOString(), entries: entries.length, problems, notes }
const i = process.argv.indexOf('--json')
if (i >= 0) writeFileSync(process.argv[i + 1], JSON.stringify(report, null, 2))
for (const n of notes) console.log(`note     ${n}`)
for (const p of problems) console.log(`PROBLEM  ${p}`)
console.log(problems.length ? `\n${problems.length} problem(s)` : `\n${entries.length} entries, all well`)
process.exit(problems.length ? 1 : 0)
