export function extractRichText(input) {
  try {
    const parsed = typeof input === 'string' ? JSON.parse(input) : input
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.uuid && Array.isArray(parsed.versions) && parsed.versions.length > 0) {
      const last = parsed.versions[parsed.versions.length - 1]
      if (last?.content) return extractRichText(last.content)
      return null
    }
    if (parsed.type !== 'doc' || !Array.isArray(parsed.content)) return null
    const texts = []
    function walk(node) {
      if (node.type === 'text' && node.text) texts.push(node.text)
      if (node.type === 'hardBreak') texts.push('\n')
      if (node.type === 'paragraph' && texts.length > 0) texts.push('\n')
      if (node.type === 'heading' && texts.length > 0) texts.push('\n')
      if (node.type === 'imageResize' || node.type === 'image') texts.push('[image]')
      if (node.type === 'recordLink' && node.attrs?.label) texts.push(node.attrs.label)
      if (node.type === 'mention' && node.attrs?.label) texts.push(node.attrs.label)
      if (node.type === 'date' && node.attrs?.date) texts.push(node.attrs.date)
      if (Array.isArray(node.content)) node.content.forEach(walk)
    }
    walk(parsed)
    return texts.join('').trim() || null
  } catch {
    return null
  }
}
