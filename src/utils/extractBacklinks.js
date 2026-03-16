import { formatFieldValue } from './formatFieldValue'

const STOP_WORDS = new Set([
  'the','be','to','of','and','a','in','that','have','i','it','for','not','on','with',
  'he','as','you','do','at','this','but','his','by','from','they','we','her','she',
  'or','an','will','my','one','all','would','there','their','what','so','up','out',
  'if','about','who','get','which','go','me','when','make','can','like','time','no',
  'just','him','know','take','people','into','year','your','good','some','could',
  'them','see','other','than','then','now','look','only','come','its','over','think',
  'also','back','after','use','two','how','our','work','first','well','way','even',
  'new','want','because','any','these','give','day','most','us','are','was','were',
  'been','has','had','did','does','being','having','each','more','very','much','own',
  'may','said','such','here','both','still','where','should','while','before','those',
  'same','through','between','too','under','last','own','right','off','every','made',
  'let','thing','many','need','say','set','try','ask','went','put','run','got','old',
  'must','tell','call','again','few','big','end','keep','still','why','help','next',
  'start','show','turn','move','per','part','find','long','give','tell','great',
  'high','small','large','another','around','home','hand','left','open','without',
  'own','line','real','hold','point','down','side','name','best','head','begin',
  'kind','low','lot','far','near','sure','less','full','note','plan','done','none',
  'null','true','false','yes','task','tasks','complete','item','items','image','canvas',
  'user','date','type','status','record','field','value','total','count',
])

const WORD_RE = /[A-Za-z\u00C0-\u024F]{3,}/g

// Field types eligible for backlinking (text, user, date, dropdown — no text boxes)
const BACKLINK_FIELD_TYPES = new Set([
  'TEXT', 'STRING',
  'USER', 'USERS', 'ACTOR',
  'DATE', 'DATETIME', 'TIME',
  'SELECTION', 'DROPDOWN', 'SELECT',
])

function isBacklinkField(fieldType) {
  const ft = (fieldType || '').toUpperCase()
  return BACKLINK_FIELD_TYPES.has(ft)
}

function collectText(record) {
  const parts = []
  if (record.recordLabel) parts.push(record.recordLabel)
  if (record.statusLabel) parts.push(record.statusLabel)
  if (record.containerLabel) parts.push(record.containerLabel)
  if (record.createdByName) parts.push(record.createdByName)

  const sections = record.fieldSections
  if (Array.isArray(sections)) {
    for (const section of sections) {
      if (!Array.isArray(section.fields)) continue
      for (const field of section.fields) {
        if (!isBacklinkField(field.fieldType)) continue
        const formatted = formatFieldValue(field.value, field.fieldType)
        if (typeof formatted === 'string' && formatted.length > 0 && !formatted.startsWith('[')) {
          parts.push(formatted)
        }
      }
    }
  }
  return parts.join(' ')
}

export function extractWords(record) {
  const text = collectText(record)
  const properNouns = new Set()
  const nouns = new Set()

  // Split into sentences to detect sentence-start words
  const sentences = text.split(/[.!?]\s+|[\n\r]+/)
  for (const sentence of sentences) {
    const words = sentence.match(WORD_RE)
    if (!words) continue
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const lower = word.toLowerCase()
      if (STOP_WORDS.has(lower)) continue
      // Proper noun: capitalized and NOT the first word of a sentence
      if (i > 0 && word[0] >= 'A' && word[0] <= 'Z') {
        properNouns.add(lower)
      } else {
        nouns.add(lower)
      }
    }
  }
  return { properNouns, nouns }
}

export function buildBacklinks(records) {
  if (!records || records.length === 0) return new Map()

  // Inverted indexes: word → Set<sid>
  const properIndex = new Map()
  const nounIndex = new Map()

  for (const rec of records) {
    const sid = rec.sid
    if (!sid) continue
    const { properNouns, nouns } = extractWords(rec)

    for (const w of properNouns) {
      if (!properIndex.has(w)) properIndex.set(w, new Set())
      properIndex.get(w).add(sid)
    }
    for (const w of nouns) {
      if (!nounIndex.has(w)) nounIndex.set(w, new Set())
      nounIndex.get(w).add(sid)
    }
  }

  // Build adjacency: sid → Set<sid>
  const adj = new Map()
  const addLink = (a, b) => {
    if (!adj.has(a)) adj.set(a, new Set())
    if (!adj.has(b)) adj.set(b, new Set())
    adj.get(a).add(b)
    adj.get(b).add(a)
  }

  // 1 shared proper noun → link
  for (const [, sids] of properIndex) {
    if (sids.size < 2 || sids.size > 50) continue // skip overly common proper nouns
    const arr = [...sids]
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        addLink(arr[i], arr[j])
      }
    }
  }

  // 2+ shared regular nouns → link
  // Build per-pair count of shared regular nouns
  const pairCount = new Map()
  for (const [, sids] of nounIndex) {
    if (sids.size < 2 || sids.size > 50) continue
    const arr = [...sids]
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const key = arr[i] < arr[j] ? `${arr[i]}\0${arr[j]}` : `${arr[j]}\0${arr[i]}`
        pairCount.set(key, (pairCount.get(key) || 0) + 1)
      }
    }
  }
  for (const [key, count] of pairCount) {
    if (count >= 2) {
      const [a, b] = key.split('\0')
      addLink(a, b)
    }
  }

  return adj
}
