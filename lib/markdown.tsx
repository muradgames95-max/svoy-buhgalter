import React from 'react'

// Parses inline markdown within a text string → React elements
function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Patterns: **bold**, *italic*, `code`
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[0].startsWith('**')) {
      parts.push(<strong key={m.index} className="font-semibold text-gray-900">{m[2]}</strong>)
    } else if (m[0].startsWith('*')) {
      parts.push(<em key={m.index} className="italic">{m[3]}</em>)
    } else {
      parts.push(
        <code key={m.index} className="bg-gray-100 text-indigo-700 rounded px-1 py-0.5 text-[0.8em] font-mono">
          {m[4]}
        </code>
      )
    }
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

interface BlockNode {
  type: 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'hr' | 'p' | 'blockquote'
  items?: string[]   // for lists
  text?: string      // for paragraphs/headings
}

function parse(markdown: string): BlockNode[] {
  const lines = markdown.split('\n')
  const blocks: BlockNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank
    if (line.trim() === '') { i++; continue }

    // HR
    if (/^---+$/.test(line.trim())) { blocks.push({ type: 'hr' }); i++; continue }

    // Headings
    const h1 = line.match(/^# (.+)/)
    const h2 = line.match(/^## (.+)/)
    const h3 = line.match(/^### (.+)/)
    if (h1) { blocks.push({ type: 'h1', text: h1[1] }); i++; continue }
    if (h2) { blocks.push({ type: 'h2', text: h2[1] }); i++; continue }
    if (h3) { blocks.push({ type: 'h3', text: h3[1] }); i++; continue }

    // Blockquote
    if (line.startsWith('> ')) {
      blocks.push({ type: 'blockquote', text: line.slice(2) })
      i++; continue
    }

    // Unordered list
    if (/^[-•*] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-•*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-•*] /, ''))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // Paragraph (collect consecutive non-special lines)
    const pLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,3} /.test(lines[i]) &&
      !/^[-•*] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim()) &&
      !lines[i].startsWith('> ')
    ) {
      pLines.push(lines[i])
      i++
    }
    if (pLines.length > 0) {
      blocks.push({ type: 'p', text: pLines.join(' ') })
    }
  }

  return blocks
}

interface MarkdownProps {
  content: string
  className?: string
}

export default function Markdown({ content, className }: MarkdownProps) {
  const blocks = parse(content)

  return (
    <div className={className}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return <h2 key={idx} className="text-base font-bold text-gray-900 mt-3 mb-1">{parseInline(block.text!)}</h2>
          case 'h2':
            return <h3 key={idx} className="text-sm font-bold text-gray-900 mt-3 mb-1">{parseInline(block.text!)}</h3>
          case 'h3':
            return <h4 key={idx} className="text-sm font-semibold text-gray-800 mt-2 mb-0.5">{parseInline(block.text!)}</h4>
          case 'hr':
            return <hr key={idx} className="border-gray-200 my-3" />
          case 'blockquote':
            return (
              <blockquote key={idx} className="border-l-2 border-indigo-300 pl-3 my-2 text-gray-600 italic text-sm">
                {parseInline(block.text!)}
              </blockquote>
            )
          case 'ul':
            return (
              <ul key={idx} className="my-2 space-y-1 pl-1">
                {block.items!.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span>{parseInline(item)}</span>
                  </li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={idx} className="my-2 space-y-1 pl-1">
                {block.items!.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="shrink-0 text-xs font-bold text-indigo-500 mt-0.5 w-4 text-right">{j + 1}.</span>
                    <span>{parseInline(item)}</span>
                  </li>
                ))}
              </ol>
            )
          case 'p':
          default:
            return (
              <p key={idx} className="text-sm text-gray-800 leading-relaxed my-1">
                {parseInline(block.text!)}
              </p>
            )
        }
      })}
    </div>
  )
}
