#!/usr/bin/env node
/** Draw the template's placeholder pictures (icon, cover, screenshot) as PNG files. No dependencies. */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../template/store')
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const body = Buffer.concat([Buffer.from(type), data]); const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body)); return Buffer.concat([len, body, sum]) }
function png(w, h, pixel) {
  const raw = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [r, g, b] = pixel(x, y); const i = y * (w * 3 + 1) + 1 + x * 3; raw[i] = r; raw[i + 1] = g; raw[i + 2] = b }
  const head = Buffer.alloc(13); head.writeUInt32BE(w, 0); head.writeUInt32BE(h, 4); head[8] = 8; head[9] = 2
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', head), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}
/** The template game's look: night sky, yellow stars, a blue paddle. */
function scene(w, h, stars) {
  const u = Math.min(w, h) / 20
  return (x, y) => {
    for (const [sx, sy] of stars) if ((x - sx * w) ** 2 + (y - sy * h) ** 2 < (u * 0.5) ** 2) return [255, 211, 77]
    if (Math.abs(x - w / 2) < u * 2.4 && y > h * 0.86 && y < h * 0.86 + u * 0.7) return [110, 168, 255]
    const t = y / h
    return [16 + t * 14, 20 + t * 18, 37 + t * 40]
  }
}
mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'icon.png'), png(256, 256, scene(256, 256, [[0.3, 0.3], [0.68, 0.48], [0.45, 0.62]])))
const sky = [[0.12, 0.2], [0.3, 0.55], [0.48, 0.3], [0.62, 0.68], [0.78, 0.22], [0.9, 0.5], [0.2, 0.75], [0.7, 0.42]]
writeFileSync(join(out, 'cover.png'), png(1280, 720, scene(1280, 720, sky)))
writeFileSync(join(out, 'shot-1.png'), png(1280, 720, scene(1280, 720, sky.map(([a, b]) => [1 - a, (b + 0.3) % 0.8]))))
console.log('template/store: icon.png, cover.png, shot-1.png')
