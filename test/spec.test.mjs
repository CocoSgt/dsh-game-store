import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { renderMarkdown } from '../lib/markdown.mjs'
import { checkCatalogEntry, checkPackage, imageSize, pickText, sha512Integrity, STANDARD_PATCH } from '../lib/spec.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const template = join(root, 'template')

/** A copy of the template with one thing changed. */
function variant(change) {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-game-test-'))
  cpSync(template, dir, { recursive: true })
  const edit = (file, fn) => { const f = join(dir, file); const v = JSON.parse(readFileSync(f, 'utf8')); fn(v); writeFileSync(f, JSON.stringify(v)) }
  change({ dir, edit })
  const r = checkPackage(dir)
  rmSync(dir, { recursive: true, force: true })
  return r
}
const fails = (r, part) => assert.ok(r.errors.some(e => e.includes(part)), `expected an error with "${part}", got: ${r.errors.join(' | ') || 'none'}`)

test('the template passes', () => {
  const r = checkPackage(template)
  assert.deepEqual(r.errors, [])
  assert.equal(r.manifest.id, 'my-game')
})
test('the template ships the standard patch', () => assert.equal(readFileSync(join(template, 'cordis.patch.yml'), 'utf8'), STANDARD_PATCH))

test('a patch that adds a plugin row is refused', () => fails(variant(({ dir }) => writeFileSync(join(dir, 'cordis.patch.yml'), "- insert:\n    - id: x\n      name: 'dsh-game-my-game/evil.js'\n")), 'cordis.patch.yml'))
test('code for DSH is refused', () => {
  fails(variant(({ edit }) => edit('package.json', p => { p.main = 'index.js' })), 'main')
  fails(variant(({ edit }) => edit('package.json', p => { p.dsh.client = { platform: 'web' } })), 'dsh.client')
  fails(variant(({ edit }) => edit('package.json', p => { p.exports = { '.': './x.js' } })), 'exports')
})
test('dependencies and install scripts are refused', () => {
  fails(variant(({ edit }) => edit('package.json', p => { p.dependencies = { 'left-pad': '1.0.0' } })), 'dependencies')
  fails(variant(({ edit }) => edit('package.json', p => { p.scripts = { postinstall: 'node x.js' } })), 'postinstall')
})
test('a license is required', () => {
  fails(variant(({ edit }) => edit('package.json', p => { delete p.license })), 'license')
  fails(variant(({ edit }) => edit('package.json', p => { p.license = 'UNLICENSED' })), 'UNLICENSED')
  fails(variant(({ dir }) => rmSync(join(dir, 'LICENSE'))), 'LICENSE')
})
test('the manifest is checked', () => {
  fails(variant(({ edit }) => edit('game.json', m => { m.id = 'My Game' })), 'id')
  fails(variant(({ edit }) => edit('game.json', m => { m.name = { zh: '只有中文' } })), 'name.en')
  fails(variant(({ edit }) => edit('game.json', m => { m.entry = '../outside.html' })), 'entry')
  fails(variant(({ edit }) => edit('game.json', m => { m.entry = 'game/missing.html' })), 'missing')
  fails(variant(({ edit }) => edit('game.json', m => { m.controls = ['mind'] })), 'controls')
  fails(variant(({ edit }) => edit('game.json', m => { m.content = { rating: 'mature' } })), 'content.notes')
  fails(variant(({ edit }) => edit('game.json', m => { m.screenshots = [] })), 'screenshots')
  fails(variant(({ edit }) => edit('game.json', m => { m.cover = 'store/icon.png' })), 'cover')
  fails(variant(({ edit }) => edit('game.json', m => { delete m.about.en })), 'about')
})
test('files that are not allowed', () => {
  fails(variant(({ dir }) => writeFileSync(join(dir, 'game/run.sh'), 'echo hi')), 'run.sh')
  fails(variant(({ dir }) => symlinkSync('/etc/hosts', join(dir, 'game/hosts'))), 'symbolic')
})
test('loading from the internet is pointed out', () => {
  const r = variant(({ dir }) => writeFileSync(join(dir, 'game/index.html'), '<script src="https://cdn.example.com/lib.js"></script>'))
  assert.ok(r.warnings.some(w => w.startsWith('network')))
})

test('catalog entries', () => {
  const good = { id: 'my-game', package: 'dsh-game-my-game', version: '1.0.0', integrity: sha512Integrity(Buffer.from('x')), repository: 'https://github.com/a/b' }
  assert.deepEqual(checkCatalogEntry(good, 'my-game').errors, [])
  assert.ok(checkCatalogEntry({ ...good, version: '^1.0.0' }, 'my-game').errors.length)
  assert.ok(checkCatalogEntry({ ...good, integrity: 'sha1-abc' }, 'my-game').errors.length)
  assert.ok(checkCatalogEntry(good, 'other').errors.length)
  assert.ok(checkCatalogEntry({ ...good, status: 'delisted' }, 'my-game').errors.length, 'a takedown needs a reason')
  assert.deepEqual(checkCatalogEntry({ ...good, status: 'delisted', reason: 'asked by the author' }, 'my-game').errors, [])
})

test('helpers', () => {
  assert.equal(pickText({ en: 'a', zh: '甲' }, 'zh-CN'), '甲')
  assert.equal(pickText({ en: 'a', zh: '甲' }, 'fr'), 'a')
  assert.deepEqual(imageSize(readFileSync(join(template, 'store/cover.png'))), { type: 'png', width: 1280, height: 720 })
})
test('descriptions cannot inject HTML', () => {
  const html = renderMarkdown('# Hi\n\n<script>alert(1)</script> **bold** [x](javascript:alert(1)) [ok](https://example.com) ![i](http://evil/x.png)')
  assert.ok(!html.includes('<script>'))
  assert.ok(!html.includes('javascript:'))
  assert.ok(!html.includes('<img'))
  assert.ok(html.includes('<strong>bold</strong>'))
  assert.ok(html.includes('href="https://example.com"'))
})
