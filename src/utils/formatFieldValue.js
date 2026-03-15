import { extractRichText } from './extractRichText'
import { formatDate } from './formatDate'

let _userCache = {}
export function setUserCache(cache) { _userCache = cache }

export function formatFieldValue(raw, fieldType) {
  if (raw === null || raw === undefined) return null
  let val = raw
  if (val && typeof val === 'object' && !Array.isArray(val) && 'value' in val) {
    val = val.value
  }
  if (val === null || val === undefined) return null

  const ft = (fieldType || '').toUpperCase()

  if (typeof val === 'string') {
    if (!val.trim()) return null
    if (ft === 'IMAGE' || ft === 'CANVAS') return '[Canvas]'
    if (val.startsWith('{') && val.includes('"lines"')) return '[Canvas]'
    if (val.startsWith('{') && (val.includes('"versions"') || val.includes('"type"'))) {
      const text = extractRichText(val)
      if (text) return text
    }
    const dateStr = formatDate(val)
    if (dateStr) return dateStr
    return val
  }

  if (typeof val === 'number') return String(val)
  if (typeof val === 'boolean') return String(val)

  if (Array.isArray(val)) {
    if (val.length === 0) return null
    if (typeof val[0] === 'number') {
      return val.map(id => {
        const u = _userCache[id]
        return u ? `${u.first_name} ${u.last_name}` : `User #${id}`
      }).join(', ')
    }
    if (val[0] && typeof val[0] === 'object' && 'taskRowDone' in val[0]) {
      const done = val.filter(t => t.taskRowDone).length
      return `${done}/${val.length} task(s) complete`
    }
    if (val[0] && typeof val[0] === 'object' && ('sid' in val[0] || 'label' in val[0])) {
      return val.map(o => o.sid || o.label || o.id || '').filter(Boolean).join(', ')
    }
    if (val[0] && typeof val[0] === 'object' && 'recordSID' in val[0]) {
      return val.map(o => {
        let display = o.recordSID || ''
        const subs = o.subFieldResps
        if (subs) {
          const entries = Array.isArray(subs)
            ? subs.flatMap(d => typeof d === 'object' ? Object.values(d) : [])
            : Object.values(subs)
          for (const sv of entries) {
            const v = sv?.value ?? sv
            if (typeof v === 'string' && v.trim()) { display += ` / ${v}`; break }
          }
        }
        return display
      }).filter(Boolean).join(', ')
    }
    if (typeof val[0] === 'string' || typeof val[0] === 'number') {
      return val.join(', ')
    }
    return `${val.length} item(s)`
  }

  if (typeof val === 'object') {
    if ('sel' in val && 'selText' in val) {
      if (!val.selText && (!val.sel || val.sel.length === 0)) return null
      return val.selText || null
    }
    if (val.uuid && Array.isArray(val.versions)) {
      return extractRichText(val)
    }
    if ('lines' in val) return '[Canvas]'
    return JSON.stringify(val)
  }

  return String(val)
}
