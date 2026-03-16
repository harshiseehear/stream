import { useState, useEffect, useRef, useCallback } from 'react'
import { useUniversalSearch } from '../../hooks/useUniversalSearch'
import { bgPage, textSecondary, textPlaceholder, dropdownHoverBg, dropdownText } from '../../theme/colors'

export default function SearchBar({ records, onSelect, visible, onClose }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const containerRef = useRef(null)

  const results = useUniversalSearch(records, debouncedQuery)
  const showResults = debouncedQuery.trim().length >= 2

  // Auto-focus and reset when opened
  useEffect(() => {
    if (visible) {
      setQuery('')
      setDebouncedQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [visible])

  // Debounce query
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 150)
    return () => clearTimeout(id)
  }, [query])

  // Keep activeIndex in bounds
  useEffect(() => {
    setActiveIndex(0)
  }, [debouncedQuery])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const item = listRef.current.children[activeIndex]
    if (item) item.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // Close on outside click
  useEffect(() => {
    if (!visible) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [visible, onClose])

  const handleSelect = useCallback((record) => {
    onSelect(record)
    setQuery('')
    setDebouncedQuery('')
    onClose()
  }, [onSelect, onClose])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[activeIndex]) handleSelect(results[activeIndex].record)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }, [results, activeIndex, handleSelect])

  const highlightMatch = (snippet, query) => {
    if (!query || query.trim().length < 2) return snippet
    const terms = query.trim().toLowerCase().split(/\s+/).filter(t => t.length > 0)
    const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
    const parts = snippet.split(regex)
    return parts.map((part, i) =>
      regex.test(part)
        ? <span key={i} style={{ fontWeight: 700, color: dropdownText }}>{part}</span>
        : part
    )
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '20vh',
    }}>
      <div
        ref={containerRef}
        style={{
          width: 480,
          maxWidth: 'calc(100vw - 32px)',
          background: bgPage,
          borderRadius: 16,
          border: '1px solid #8B6914',
          fontFamily: 'system-ui, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div
          style={{ padding: '12px 16px' }}
          onKeyDown={handleKeyDown}
        >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%',
            fontSize: 14,
            fontFamily: 'inherit',
            background: bgPage,
            border: 'none',
            outline: 'none',
            color: dropdownText,
            padding: 0,
          }}
        />
      </div>

      {/* Results list */}
      {showResults && results.length > 0 && (
        <div
          ref={listRef}
          style={{
            maxHeight: 320,
            overflowY: 'auto',
            padding: '4px 0',
            background: bgPage,
          }}
        >
          {results.map((r, i) => (
            <div
              key={r.record.uuid}
              style={{
                padding: '8px 10px',
                cursor: 'pointer',
                background: i === activeIndex ? dropdownHoverBg : 'transparent',
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => handleSelect(r.record)}
            >
              <div style={{ fontSize: 13, color: dropdownText }}>
                <span style={{ fontWeight: 600 }}>{r.record.sid}</span>
                {r.record.recordKeyValue && (
                  <span style={{ marginLeft: 6 }}>{r.record.recordKeyValue}</span>
                )}
                <span style={{ color: textSecondary, marginLeft: 6 }}>{r.record.templateLabel}</span>
              </div>
              <div style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                {r.matches.slice(0, 2).map((m, j) => (
                  <span key={j}>
                    {j > 0 && <span style={{ margin: '0 6px' }}>·</span>}
                    <span style={{ opacity: 0.7 }}>{m.field}: </span>
                    {highlightMatch(m.snippet, debouncedQuery)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

        {/* Empty state */}
        {showResults && results.length === 0 && (
          <div style={{
            padding: '12px 10px',
            textAlign: 'center',
            color: textPlaceholder,
            fontSize: 13,
          }}>
            No matching records
          </div>
        )}
      </div>
    </div>
  )
}
