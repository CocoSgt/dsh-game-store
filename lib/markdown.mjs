/**
 * A small Markdown renderer for game descriptions and the site's pages.
 * Everything from the source is escaped: raw HTML in a description shows as text.
 * Supported: headings, paragraphs, lists, block quotes, fenced code, tables, rules,
 * **bold**, *italic*, `code`, [links](https://…) and ![images](relative/path).
 */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * @param src Markdown text
 * @param opts.image maps an image path to a URL; return '' to drop the image
 * @param opts.link maps a link target to a URL; return '' to keep only the text
 * @param opts.headingIds add id attributes to headings
 */
export function renderMarkdown(src, opts = {}) {
  const link = opts.link ?? (href => (/^(https?:|mailto:|#|\.{0,2}\/|[\w.-]+\.html)/.test(href) ? href : ''))
  const image = opts.image ?? (() => '')
  const slugs = new Map()
  const slug = text => {
    // The same ids GitHub gives headings, so links between the documents work in both places.
    let s = text.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^\p{L}\p{N}\s_-]+/gu, '').trim().replace(/\s/g, '-') || 'section'
    const n = slugs.get(s) ?? 0
    slugs.set(s, n + 1)
    return n ? `${s}-${n}` : s
  }

  const inline = text => {
    const codes = []
    let s = text.replace(/`([^`]+)`/g, (_, c) => { codes.push(`<code>${esc(c)}</code>`); return `\u0000${codes.length - 1}\u0000` })
    s = esc(s)
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => { const url = image(src.replace(/&amp;/g, '&')); return url ? `<img src="${esc(url)}" alt="${alt}" loading="lazy">` : '' })
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const url = link(href.replace(/&amp;/g, '&'))
      if (!url) return label
      const out = /^https?:/.test(url) ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${esc(url)}"${out}>${label}</a>`
    })
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)])
  }

  const lines = String(src).replace(/\r\n/g, '\n').replace(/^﻿/, '').split('\n')
  const out = []
  let i = 0
  const isBlockStart = l => /^(#{1,6}\s|```|>\s?|\s*[-*]\s+|\s*\d+[.)]\s+|\|)/.test(l) || /^(-{3,}|\*{3,})\s*$/.test(l)
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    let m
    if ((m = /^```(\w*)\s*$/.exec(line))) {
      const body = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++])
      i++
      out.push(`<pre><code>${esc(body.join('\n'))}</code></pre>`)
    } else if ((m = /^(#{1,6})\s+(.*)$/.exec(line))) {
      const html = inline(m[2].replace(/\s+#+\s*$/, ''))
      out.push(`<h${m[1].length}${opts.headingIds ? ` id="${slug(html)}"` : ''}>${html}</h${m[1].length}>`)
      i++
    } else if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push('<hr>'); i++
    } else if (/^>\s?/.test(line)) {
      const body = []
      while (i < lines.length && /^>\s?/.test(lines[i])) body.push(lines[i++].replace(/^>\s?/, ''))
      out.push(`<blockquote>${renderMarkdown(body.join('\n'), opts)}</blockquote>`)
    } else if (/^\|/.test(line) && /^\|?\s*:?-{2,}/.test(lines[i + 1] ?? '')) {
      const row = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim()))
      const head = row(line)
      i += 2
      const body = []
      while (i < lines.length && /^\|/.test(lines[i])) body.push(row(lines[i++]))
      out.push(`<table><thead><tr>${head.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`)
    } else if (/^\s*([-*]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d/.test(line)
      const items = []
      while (i < lines.length && (/^\s*([-*]|\d+[.)])\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        const mm = /^\s*([-*]|\d+[.)])\s+(.*)$/.exec(lines[i])
        if (mm && !/^\s{2,}/.test(lines[i])) items.push(mm[2]); else items[items.length - 1] += `\n${lines[i].trim()}`
        i++
      }
      const tag = ordered ? 'ol' : 'ul'
      out.push(`<${tag}>${items.map(t => `<li>${t.split('\n').map(inline).join('<br>')}</li>`).join('')}</${tag}>`)
    } else {
      const body = [line]
      i++
      while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) body.push(lines[i++])
      out.push(`<p>${body.map(inline).join('\n')}</p>`)
    }
  }
  return out.join('\n')
}

export { esc as escapeHtml }
