/**
 * Get a game package onto the disk without installing it: download the tarball npm serves
 * (or take a local one), compare its checksum, unpack it. Nothing from the package is run.
 * Used by the catalog check, the site build and the command line tool.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { sha512Integrity } from './spec.mjs'

const REGISTRY = 'https://registry.npmjs.org'

/** What npm says about one published version. */
export async function registryVersion(pkg, version) {
  const r = await fetch(`${REGISTRY}/${pkg.replace('/', '%2f')}/${version}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(20_000) })
  if (r.status === 404) return undefined
  if (!r.ok) throw new Error(`npm registry answered ${r.status} for ${pkg}@${version}`)
  return r.json()
}

/**
 * @param entry { package, version, integrity? }
 * @param opts.local path of a tarball to use instead of npm
 * @param opts.cacheDir where tarballs and unpacked packages are kept
 * @returns { dir, tarball, integrity, tarballBytes, publishedAt?, source: 'npm' | 'local' }
 */
export async function fetchPackage(entry, opts = {}) {
  const cacheDir = resolve(opts.cacheDir ?? '.cache')
  const key = `${entry.package.replace('/', '__')}@${entry.version}`
  mkdirSync(join(cacheDir, 'tarballs'), { recursive: true })
  let tarball, source = 'npm', publishedAt
  if (opts.local) {
    tarball = resolve(opts.local)
    if (!existsSync(tarball)) throw new Error(`local tarball not found: ${tarball}`)
    source = 'local'
  } else {
    const meta = await registryVersion(entry.package, entry.version)
    if (!meta) throw new Error(`${entry.package}@${entry.version} is not on npm`)
    if (entry.integrity && meta.dist?.integrity !== entry.integrity) throw new Error(`integrity: the catalog says ${entry.integrity}, npm says ${meta.dist?.integrity}`)
    tarball = join(cacheDir, 'tarballs', `${key}.tgz`)
    if (!existsSync(tarball) || sha512Integrity(readFileSync(tarball)) !== meta.dist.integrity) {
      const r = await fetch(meta.dist.tarball, { signal: AbortSignal.timeout(600_000) })
      if (!r.ok) throw new Error(`download failed (${r.status}): ${meta.dist.tarball}`)
      writeFileSync(tarball, Buffer.from(await r.arrayBuffer()))
    }
    try {
      const doc = await (await fetch(`${REGISTRY}/${entry.package.replace('/', '%2f')}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(20_000) })).json()
      publishedAt = doc?.time?.[entry.version]
    } catch { /* the date is optional */ }
  }
  const buf = readFileSync(tarball)
  const integrity = sha512Integrity(buf)
  if (entry.integrity && integrity !== entry.integrity) throw new Error(`integrity: the catalog says ${entry.integrity}, the tarball is ${integrity}`)
  const out = join(cacheDir, 'packages', `${key}-${integrity.slice(7, 19).replace(/[^A-Za-z0-9]/g, '_')}`)
  const dir = join(out, 'package')
  if (!existsSync(join(dir, 'package.json'))) {
    rmSync(out, { recursive: true, force: true })
    mkdirSync(out, { recursive: true })
    // npm tarballs hold one top folder, "package/". tar only writes files here; no script runs.
    execFileSync('tar', ['-xzf', tarball, '-C', out], { stdio: ['ignore', 'ignore', 'inherit'] })
  }
  if (!existsSync(join(dir, 'package.json'))) throw new Error('the tarball has no package/package.json')
  return { dir, tarball, integrity, tarballBytes: buf.length, publishedAt, source }
}

/** Read `--local name=path` pairs (repeatable) and a JSON file of the same shape. */
export function localSources(argv, file) {
  const out = {}
  if (file && existsSync(file)) Object.assign(out, JSON.parse(readFileSync(file, 'utf8')))
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== '--local') continue
    const [name, ...rest] = String(argv[i + 1] ?? '').split('=')
    if (name && rest.length) out[name] = rest.join('=')
  }
  return out
}
