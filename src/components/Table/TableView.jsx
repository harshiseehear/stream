import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import TemplateSidebar from './TemplateSidebar'
import DataTable from './DataTable'
import { useUniversalSearch } from '../../hooks/useUniversalSearch'
import { borderPanel, bgPage, textPrimary, textSecondary, dropdownHoverBg, dropdownText, textPlaceholder } from '../../theme/colors'

export default function TableView({ records, onRowClick, viewsVisible, onToggleViews, filterPanel }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef(null)
  const listRef = useRef(null)

  const searchResults = useUniversalSearch(records, debouncedQuery)
  const showResults = searchFocused && debouncedQuery.trim().length >= 2

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 150)
    return () => clearTimeout(id)
  }, [searchQuery])

  useEffect(() => { setActiveIndex(0) }, [debouncedQuery])

  useEffect(() => {
    if (!listRef.current) return
    const item = listRef.current.children[activeIndex]
    if (item) item.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  useEffect(() => {
    if (!searchFocused) return
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [searchFocused])

  const handleSearchSelect = useCallback((record) => {
    onRowClick(record)
    setSearchQuery('')
    setDebouncedQuery('')
    setSearchFocused(false)
  }, [onRowClick])

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, searchResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (searchResults[activeIndex]) handleSearchSelect(searchResults[activeIndex].record)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setSearchFocused(false)
    }
  }, [searchResults, activeIndex, handleSearchSelect])

  const visibleRecords = useMemo(() => {
    if (!records) return []
    if (!selectedTemplate) return records
    return records.filter(r => r.template === selectedTemplate)
  }, [records, selectedTemplate])

  const templateLabel = useMemo(() => {
    if (!selectedTemplate || !records) return 'All Records'
    const rec = records.find(r => r.template === selectedTemplate)
    return rec?.templateLabel || 'All Records'
  }, [selectedTemplate, records])

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      padding: 12,
      gap: 12,
    }}>
      {/* Toolbar – full window width */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        padding: '0 12px',
      }}>
        {/* Left: template label + add */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: textSecondary }}>
          {templateLabel}
          <svg
            onClick={() => {}}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ cursor: 'pointer', opacity: 0.7, flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>

        {/* Center: buttons + search, absolutely centered to the full toolbar */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
        }}>
          {onToggleViews && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button
                onClick={onToggleViews}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '3px 5px',
                  borderRadius: 6,
                  color: textSecondary,
                  opacity: viewsVisible ? 1 : 0.7,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => { if (!viewsVisible) e.currentTarget.style.opacity = '0.7' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill={textSecondary} stroke="none">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </button>
              {viewsVisible && filterPanel && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 8,
                  width: 260,
                  background: bgPage,
                  border: `1px solid ${borderPanel}`,
                  borderRadius: 12,
                  padding: '10px 10px 8px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: textSecondary }}>Filter</span>
                    {filterPanel.addButton}
                  </div>
                  {filterPanel.body}
                  {filterPanel.chatInput}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => {}}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '3px 5px',
              borderRadius: 6,
              color: textSecondary,
              opacity: 0.7,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="3" x2="12" y2="21" />
              <line x1="4" y1="3" x2="4" y2="21" />
              <line x1="20" y1="3" x2="20" y2="21" />
            </svg>
          </button>
          <button
            onClick={() => {}}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '3px 5px',
              borderRadius: 6,
              color: textSecondary,
              opacity: 0.7,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <div ref={searchRef} style={{ position: 'relative', marginLeft: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '2px 8px',
              border: `1px solid ${borderPanel}`,
              borderRadius: 20,
              background: bgPage,
              position: 'relative',
            }}>
              {!searchQuery && !searchFocused && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={handleSearchKeyDown}
                style={{
                  width: 100,
                  fontSize: 11,
                  fontFamily: 'inherit',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: textPrimary,
                  padding: 0,
                }}
              />
            </div>
            {showResults && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 360,
                marginTop: 4,
                background: bgPage,
                border: `1px solid ${borderPanel}`,
                borderRadius: 14,
                overflow: 'hidden',
                zIndex: 100,
              }}>
                {searchResults.length > 0 ? (
                  <div ref={listRef} style={{ maxHeight: 260, overflowY: 'auto', padding: '4px 0' }}>
                    {searchResults.map((r, i) => (
                      <div
                        key={r.record.uuid}
                        style={{
                          padding: '6px 10px',
                          cursor: 'pointer',
                          background: i === activeIndex ? dropdownHoverBg : 'transparent',
                        }}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => handleSearchSelect(r.record)}
                      >
                        <div style={{ fontSize: 12, color: dropdownText }}>
                          <span style={{ fontWeight: 600 }}>{r.record.sid}</span>
                          {r.record.recordKeyValue && (
                            <span style={{ marginLeft: 6 }}>{r.record.recordKeyValue}</span>
                          )}
                          <span style={{ color: textSecondary, marginLeft: 6 }}>{r.record.templateLabel}</span>
                        </div>
                        <div style={{ fontSize: 10, color: textSecondary, marginTop: 1 }}>
                          {r.matches.slice(0, 2).map((m, j) => (
                            <span key={j}>
                              {j > 0 && <span style={{ margin: '0 4px' }}>·</span>}
                              <span style={{ opacity: 0.7 }}>{m.field}: </span>
                              {m.snippet}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '10px 8px', textAlign: 'center', color: textPlaceholder, fontSize: 12 }}>
                    No matching records
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content row: sidebar + table */}
      <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}>
        {sidebarOpen ? (
          <div style={{
            width: 200,
            flexShrink: 0,
            border: `1px solid ${borderPanel}`,
            borderRadius: 12,
            background: bgPage,
            overflowY: 'auto',
            padding: '8px 6px',
            position: 'relative',
          }}>
            <span
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'absolute',
                top: -8,
                right: 10,
                fontSize: 11,
                fontWeight: 600,
                color: textSecondary,
                background: bgPage,
                padding: '0 4px',
                cursor: 'pointer',
                opacity: 0.5,
                lineHeight: 1,
                userSelect: 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
            >
              ‹
            </span>
            <TemplateSidebar
              records={records}
              selected={selectedTemplate}
              onSelect={setSelectedTemplate}
            />
          </div>
        ) : (
          <div
            onClick={() => setSidebarOpen(true)}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              border: `1px solid ${borderPanel}`,
              borderRadius: 12,
              background: bgPage,
              cursor: 'pointer',
              opacity: 0.4,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="9" y1="4" x2="15" y2="12" />
              <line x1="15" y1="12" x2="9" y2="20" />
            </svg>
          </div>
        )}
        <div style={{
          flex: 1,
          border: `1px solid ${borderPanel}`,
          borderRadius: 12,
          overflow: 'hidden',
          background: bgPage,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}>
          <DataTable
            records={visibleRecords}
            selectedTemplate={selectedTemplate}
            onRowClick={onRowClick}
          />
        </div>
      </div>
    </div>
  )
}
