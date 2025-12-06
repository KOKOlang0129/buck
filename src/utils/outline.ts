export interface OutlineSection {
  id: string
  level: number
  text: string
  startLine: number
  endLine: number
}

const HEADING_REGEX = /^(#+)\s+(.*)$/

export const parseOutlineSections = (markdown: string): OutlineSection[] => {
  const lines = markdown.split('\n')
  const sections: OutlineSection[] = []

  lines.forEach((line, index) => {
    const match = line.trim().match(HEADING_REGEX)
    if (match) {
      sections.push({
        id: `section-${index}`,
        level: match[1].length,
        text: match[2],
        startLine: index,
        endLine: lines.length // placeholder
      })
    }
  })

  sections.forEach((section, idx) => {
    const nextSameOrHigher = sections
      .slice(idx + 1)
      .find(next => next.level <= section.level)
    section.endLine = nextSameOrHigher ? nextSameOrHigher.startLine : lines.length
  })

  if (sections.length === 0 && markdown.trim().length > 0) {
    sections.push({
      id: 'section-0',
      level: 1,
      text: markdown.trim().split('\n').slice(0, 3).join(' '),
      startLine: 0,
      endLine: lines.length
    })
  }

  return sections
}

export const moveSectionInMarkdown = (
  markdown: string,
  sectionId: string,
  direction: 'up' | 'down'
): string => {
  const lines = markdown.split('\n')
  const sections = parseOutlineSections(markdown)
  const currentIndex = sections.findIndex((section) => section.id === sectionId)

  if (currentIndex === -1) return markdown

  let targetIndex = -1
  if (direction === 'up') {
    for (let i = currentIndex - 1; i >= 0; i -= 1) {
      if (sections[i].level === sections[currentIndex].level) {
        targetIndex = i
        break
      }
    }
  } else {
    for (let i = currentIndex + 1; i < sections.length; i += 1) {
      if (sections[i].level === sections[currentIndex].level) {
        targetIndex = i
        break
      }
    }
  }

  if (targetIndex === -1) return markdown

  const section = sections[currentIndex]
  const target = sections[targetIndex]
  const blockLength = section.endLine - section.startLine
  const block = lines.slice(section.startLine, section.endLine)
  lines.splice(section.startLine, blockLength)

  if (direction === 'up') {
    lines.splice(target.startLine, 0, ...block)
  } else {
    const adjustedIndex = target.endLine - blockLength
    lines.splice(adjustedIndex, 0, ...block)
  }

  return lines.join('\n')
}

/**
 * アウトラインビューでのドラッグ＆ドロップ用に、
 * セクションブロックを任意のターゲットセクションの直前に移動させる。
 */
export const reorderSectionsInMarkdown = (
  markdown: string,
  sourceSectionId: string,
  targetSectionId: string
): string => {
  if (sourceSectionId === targetSectionId) return markdown

  const lines = markdown.split('\n')
  const sections = parseOutlineSections(markdown)

  const sourceIndex = sections.findIndex((section) => section.id === sourceSectionId)
  const targetIndex = sections.findIndex((section) => section.id === targetSectionId)

  if (sourceIndex === -1 || targetIndex === -1) return markdown

  const source = sections[sourceIndex]
  const target = sections[targetIndex]

  const blockLength = source.endLine - source.startLine
  const block = lines.slice(source.startLine, source.endLine)

  // まずソースブロックを削除
  lines.splice(source.startLine, blockLength)

  // 挿入インデックスを計算（ターゲットの直前に移動）
  const insertIndex =
    sourceIndex < targetIndex ? Math.max(0, target.startLine - blockLength) : target.startLine

  lines.splice(insertIndex, 0, ...block)

  return lines.join('\n')
}

