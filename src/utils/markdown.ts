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

/**
 * Markdown記法を除去してプレーンテキストのみを抽出する
 * plainモード用の関数
 */
export const stripMarkdownToPlainText = (markdown: string): string => {
  if (!markdown) {
    return ''
  }

  let text = markdown

  // コードブロックを除去（```で囲まれた部分）
  text = text.replace(/```[\s\S]*?```/g, '')

  // インラインコードを除去（`で囲まれた部分）
  text = text.replace(/`([^`]+)`/g, '$1')

  // 見出し記号を除去（#）
  text = text.replace(/^#{1,6}\s+/gm, '')

  // 太字を除去（**text** または __text__）
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/__([^_]+)__/g, '$1')

  // 斜体を除去（*text* または _text_）
  text = text.replace(/\*([^*]+)\*/g, '$1')
  text = text.replace(/_([^_]+)_/g, '$1')

  // ブロック引用を除去（>）
  text = text.replace(/^>\s+/gm, '')

  // 箇条書き記号を除去（- または * または +）
  text = text.replace(/^[\s]*[-*+]\s+/gm, '')

  // 番号付きリスト記号を除去（1. など）
  text = text.replace(/^\s*\d+\.\s+/gm, '')

  // リンクを除去（[text](url) -> text）
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')

  // 画像を除去（![alt](url) -> alt）
  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')

  // テーブル記法を除去（| で始まる行）
  text = text.replace(/^\|.+\|$/gm, (match) => {
    // テーブル行からセル内容を抽出（| を除去してセル内容のみ）
    return match
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell && !cell.match(/^[-:]+$/)) // 区切り行を除去
      .join(' ')
  })

  // 水平線を除去（--- または ***）
  text = text.replace(/^[-*]{3,}$/gm, '')

  // 空行を整理（連続する空行を1つに）
  text = text.replace(/\n{3,}/g, '\n\n')

  // 先頭・末尾の空白を除去
  text = text.trim()

  return text
}

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

