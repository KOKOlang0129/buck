import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({
  gfm: true,
  breaks: true
})

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const MARKDOWN_TEST_SNIPPET = `# 見出しレベル1

## 見出しレベル2

### 見出しレベル3

#### 見出しレベル4

**太字テキスト** と *斜体テキスト*、そして \`インラインコード\`。

> ブロック引用: 雨上がりの匂いが、彼女の記憶を呼び起こした。

- 箇条書き1
- 箇条書き2
  - ネスト1
  - ネスト2

1. 番号付きリスト
2. 二行目

[リンク例](https://example.com) と ![画像例](https://placehold.co/100x60)。

| 列A | 列B | 列C |
| --- | --- | --- |
| 太字 | *斜体* | \`コード\` |

\`\`\`ts
function greet(name: string) {
  console.log(\`こんにちは、\${name}さん\`)
}
\`\`\`

---
`

export const renderMarkdownToHtml = (markdown: string): string => {
  if (!markdown) {
    return ''
  }

  const rawHtml = marked.parse(markdown, { async: false })
  return DOMPurify.sanitize(rawHtml as string)
}

const wrapWithHighlight = (term: string) =>
  `<mark class="bg-yellow-100 text-gray-800 font-semibold px-1 rounded-sm" data-dictionary-term="${term}">$1</mark>`

export const applyDictionaryHighlights = (
  html: string,
  entries: Array<{ term: string | undefined }>
): string => {
  if (!html || !entries.length) {
    return html
  }

  const normalized = entries
    .map(entry => entry.term?.trim())
    .filter((term): term is string => Boolean(term))

  if (normalized.length === 0) {
    return html
  }

  const highlightWithRegex = (input: string) => {
    return normalized.reduce((acc, term) => {
      const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi')
      return acc.replace(regex, wrapWithHighlight(term))
    }, input)
  }

  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return highlightWithRegex(html)
  }

  const parser = new window.DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text)
  }

  textNodes.forEach(node => {
    const original = node.nodeValue ?? ''
    const replaced = highlightWithRegex(original)
    if (original !== replaced) {
      const span = doc.createElement('span')
      span.innerHTML = replaced
      node.replaceWith(...Array.from(span.childNodes))
    }
  })

  return doc.body.innerHTML
}

