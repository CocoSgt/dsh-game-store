// Every page that shows the catalog, and catalog.json itself, rendered from the live catalog (site/live.mjs).
// The build copies live.mjs, pages.mjs and what they need into api/_lib/. One render serves all pages for five
// minutes, and the CDN keeps each answer for five minutes more, so the catalog sources are asked rarely.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { catalogDoc, dshIndex, DOMAIN, liveGames, PLAY_SUFFIX, REPO, SITE } from './_lib/live.mjs'
import { buildPages } from './_lib/pages.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const lib = join(here, '_lib')
const storePkg = JSON.parse(readFileSync(join(lib, 'store.json'), 'utf8'))
const FRESH_MS = 5 * 60_000
let cache = null

function render() {
  if (cache && Date.now() - cache.at < FRESH_MS) return cache.work
  const work = (async () => {
    const games = await liveGames()
    const pages = new Map()
    buildPages({ root: lib, out: lib, games, SITE, REPO, DOMAIN, PLAY_SUFFIX, docRoot: join(lib, 'docs'), write: (lang, path, html) => pages.set((lang === 'zh' ? '' : 'en/') + path, html) })
    return { pages, catalog: JSON.stringify(catalogDoc(games), null, 1), index: JSON.stringify(dshIndex(games, storePkg), null, 1) }
  })()
  const prev = cache
  cache = { at: Date.now(), work }
  // A failed read keeps serving the last good render.
  work.catch(() => { cache = prev && { ...prev, at: Date.now() - FRESH_MS + 30_000 } })
  return work
}

export default async function handler(req, res) {
  const url = new URL(req.url, SITE)
  let site
  try { site = await render() } catch (err) {
    console.error(err)
    res.statusCode = 503
    res.setHeader('Cache-Control', 'no-store')
    return res.end('The catalog could not be read just now. Please try again in a minute.')
  }
  const file = url.searchParams.get('f')
  if (file === 'catalog' || file === 'index') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400')
    return res.end(file === 'catalog' ? site.catalog : site.index)
  }
  let path = (url.searchParams.get('p') ?? '').replace(/^\/+/, '')
  if (path && !path.endsWith('/')) path += '/'
  const html = site.pages.get(path)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  if (!html) {
    res.statusCode = 404
    res.setHeader('Cache-Control', 'public, s-maxage=60')
    return res.end(site.pages.get(path.startsWith('en/') ? 'en/' : '') ?? 'Not found')
  }
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400')
  res.end(html)
}
