#!/usr/bin/env node
/**
 * The rules a catalog pull request must pass before it may merge by itself.
 *
 *   node scripts/check-pr.mjs --author <github login> --base <git ref> [--head <git ref>]
 *
 *   1. It changes catalog files only: catalog/games/<id>.json or catalog/workshop/<game>/<id>.json.
 *   2. It changes at most 3 files (a game and a couple of its extensions).
 *   3. Every changed entry names a repository owned by the pull request's author,
 *      and when the entry existed before, the same owner had it. Nobody edits another person's entry.
 *   4. An existing entry keeps its id and package, and its version only goes up.
 *   5. Nobody but a maintainer sets status or reason (takedowns), or deletes an entry.
 * Prints "auto-merge: yes" when every rule holds. Exit code 0 either way; 1 only on a broken call.
 * The package checks themselves are scripts/check-catalog.mjs.
 */
import { execFileSync } from 'node:child_process'
import { compareVersions } from '../lib/spec.mjs'

const argv = process.argv.slice(2)
const opt = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : fallback }
const author = String(opt('--author', '')).toLowerCase()
const base = opt('--base')
const head = opt('--head', 'HEAD')
if (!author || !base) { console.error('Usage: check-pr.mjs --author <login> --base <ref> [--head <ref>]'); process.exit(1) }

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' })
const show = (ref, file) => { try { return JSON.parse(git('show', `${ref}:${file}`)) } catch { return undefined } }
const ownerOf = entry => (/^https:\/\/github\.com\/([\w.-]+)\/[\w.-]+$/.exec(entry?.repository ?? '') ?? [])[1]?.toLowerCase()
const newer = (a, b) => compareVersions(a, b) > 0

const changed = git('diff', '--name-status', '--no-renames', `${base}...${head}`).trim().split('\n').filter(Boolean).map(l => { const [status, ...file] = l.split('\t'); return { status, file: file.join('\t') } })
const reasons = []
const ENTRY = /^catalog\/(games\/[a-z0-9-]+|workshop\/[a-z0-9-]+\/[a-z0-9-]+)\.json$/
if (!changed.length) reasons.push('nothing changed')
if (changed.length > 3) reasons.push(`changes ${changed.length} files; at most 3 catalog files per pull request`)
for (const { status, file } of changed) {
  if (!ENTRY.test(file)) { reasons.push(`${file}: not a catalog entry; a maintainer reviews anything outside catalog/`); continue }
  if (status === 'D') { reasons.push(`${file}: deleting an entry is a maintainer's call (ask for a takedown instead)`); continue }
  const now = show(head, file), before = status === 'A' ? undefined : show(base, file)
  if (!now) { reasons.push(`${file}: not valid JSON`); continue }
  if (ownerOf(now) !== author) reasons.push(`${file}: the repository belongs to "${ownerOf(now) ?? '?'}", the pull request comes from "${author}"`)
  if (now.status !== undefined || now.reason !== undefined) reasons.push(`${file}: status and reason are set by maintainers`)
  if (before) {
    if (ownerOf(before) !== author) reasons.push(`${file}: this entry belongs to "${ownerOf(before)}"`)
    if (before.id !== now.id || before.package !== now.package) reasons.push(`${file}: id and package cannot change`)
    if (before.status && before.status !== 'listed') reasons.push(`${file}: the entry was taken down; a maintainer lists it again`)
    if (!newer(now.version, before.version)) reasons.push(`${file}: the version must go up (${before.version} → ${now.version})`)
  }
}
for (const r of reasons) console.log(`review needed: ${r}`)
console.log(`auto-merge: ${reasons.length ? 'no' : 'yes'}`)
