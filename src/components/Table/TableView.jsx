import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import TemplateSidebar from './TemplateSidebar'
import DataTable from './DataTable'
import TableFilterPanel from './TableFilterPanel'
import RecordDetailsPage from '../RecordDetails/RecordDetailsPage'
import { useUniversalSearch } from '../../hooks/useUniversalSearch'
import { useFilteredRecords } from '../../hooks/useFilteredRecords'
import { fetchWorkflows } from '../../api/cell/records'
import { borderPanel, bgPage, textPrimary, textSecondary, dropdownHoverBg, dropdownText, textPlaceholder } from '../../theme/colors'

export default function TableView() {
  const { records: allRecords } = useOutletContext()
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [filterRules, setFilterRules] = useState([])
  const [conjunctions, setConjunctions] = useState([])
  const records = useFilteredRecords(allRecords, filterRules, conjunctions)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [contentMode, setContentMode] = useState('records')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef(null)
  const listRef = useRef(null)

  const searchResults = useUniversalSearch(records, debouncedQuery)
  const showResults = searchFocused && debouncedQuery.trim().length >= 2

  const [workflows, setWorkflows] = useState(null)
  const [workflowsError, setWorkflowsError] = useState(false)

  useEffect(() => {
    if (contentMode !== 'workflows') return
    if (workflows !== null) return
    setWorkflowsError(false)
    fetchWorkflows()
      .then(data => setWorkflows(data))
      .catch(() => { setWorkflows([]); setWorkflowsError(true) })
  }, [contentMode, workflows])

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
    setSelectedRecord(record)
    setSearchQuery('')
    setDebouncedQuery('')
    setSearchFocused(false)
  }, [])

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

  const templates = useMemo(() => {
    if (!records || records.length === 0) return []
    const map = new Map()
    for (const r of records) {
      if (r.templateLabel && !map.has(r.templateLabel)) {
        map.set(r.templateLabel, { label: r.templateLabel, template: r.template, count: 0 })
      }
      if (r.templateLabel && map.has(r.templateLabel)) {
        map.get(r.templateLabel).count++
      }
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [records])

  const templateLabel = useMemo(() => {
    if (contentMode === 'templates') return 'Templates'
    if (contentMode === 'workflows') return 'Workflows'
    if (!selectedTemplate || !records) return 'All Records'
    const rec = records.find(r => r.template === selectedTemplate)
    return rec?.templateLabel || 'All Records'
  }, [selectedTemplate, records, contentMode])

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'row',
      fontFamily: 'system-ui, sans-serif',
      padding: 12,
      gap: 12,
    }}>
      {/* Sidebar – full height */}
      <div style={{
        flexShrink: 0,
        position: 'relative',
        width: sidebarOpen ? 200 : 0,
        transition: 'width 0.15s ease',
      }}>
        {sidebarOpen && (
          <div style={{
            width: 200,
            height: '100%',
            border: `1px solid ${borderPanel}`,
            borderRadius: 12,
            background: bgPage,
            overflowY: 'auto',
            overflow: 'visible',
            padding: '12px 6px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}>
            {/* Collapse toggle – sits on top border like Views title */}
            <span
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'absolute',
                top: 2,
                left: 187,
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: bgPage,
                padding: '0 6px',
                cursor: 'pointer',
                lineHeight: 1,
                userSelect: 'none',
                color: textSecondary,
              }}
              onMouseEnter={e => e.currentTarget.querySelector('svg').style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.querySelector('svg').style.opacity = '0.5'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <polyline points="15 6 9 12 15 18" />
              </svg>
            </span>
            {/* Pinned records */}
            {(() => {
              const pinnedIds = ['PJ-141', 'PJ-1']
              const pinned = pinnedIds.map(id => records?.find(r => r.sid === id)).filter(Boolean)
              if (pinned.length === 0) return null
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 2 }}>
                  {pinned.map(r => (
                    <div
                      key={r.sid}
                      onClick={() => setSelectedRecord(r)}
                      style={{
                        padding: '5px 10px',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontFamily: 'system-ui, sans-serif',
                        color: textSecondary,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = dropdownHoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill={textSecondary} stroke="none" style={{ flexShrink: 0, opacity: 0.45 }}>
                        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                      </svg>
                      <span>{r.sid}</span>
                    </div>
                  ))}
                </div>
              )
            })()}
            <TemplateSidebar
              records={records}
              selected={selectedTemplate}
              onSelect={(t) => { setSelectedTemplate(t); setContentMode('records'); setSelectedRecord(null) }}
              contentMode={contentMode}
              onContentMode={(mode) => { setContentMode(mode); setSelectedRecord(null) }}
            />
          </div>
        )}

        {/* Expand toggle when closed */}
        {!sidebarOpen && (
          <span
            onClick={() => setSidebarOpen(true)}
            style={{
              position: 'absolute',
              top: 3,
              left: 4,
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: 0.4,
              lineHeight: 1,
              userSelect: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </span>
        )}
      </div>

      {/* Right content area: toolbar + table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, gap: 12 }}>
        {/* Toolbar */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          padding: '0 12px',
          zIndex: 10,
        }}>
          {/* Left: template label + add */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: textSecondary }}>
          {templateLabel}
          <svg
            onClick={() => {}}
            width="16" height="16" viewBox="0 0 24 24" fill={textSecondary} stroke="none"
            style={{ cursor: 'pointer', opacity: 0.7, flexShrink: 0, display: 'block', padding: 1 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
          >
            <circle cx="12" cy="12" r="11" />
            <rect x="11" y="6" width="2" height="12" rx="1" fill={bgPage} />
            <rect x="6" y="11" width="12" height="2" rx="1" fill={bgPage} />
          </svg>
          <svg
            onClick={() => {
              if (!visibleRecords || visibleRecords.length === 0) return
              const cols = ['sid', 'templateLabel', 'statusLabel', 'recordLabel', 'createdByName', 'containerLabel', 'recordCreated', 'lastUpdate']
              const escape = v => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s }
              const csv = [cols.join(','), ...visibleRecords.map(r => cols.map(c => escape(r[c])).join(','))].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = (templateLabel || 'records') + '.csv'
              a.click()
              URL.revokeObjectURL(url)
            }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ cursor: 'pointer', opacity: 0.7, flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            title="Download CSV"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>

        {/* Center: buttons + search, centered to the full window */}
        <div style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
        }}>
          <TableFilterPanel
            records={allRecords}
            filterRules={filterRules}
            onFilterChange={setFilterRules}
            conjunctions={conjunctions}
            onConjunctionsChange={setConjunctions}
          />
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

        {/* Table content */}
        <div style={{
          flex: 1,
          borderRadius: 12,
          overflow: selectedRecord ? 'visible' : 'hidden',
          background: bgPage,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          position: 'relative',
        }}>
          {selectedRecord ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', borderRadius: 12 }}>
              <RecordDetailsPage record={selectedRecord} />
              </div>
          ) : (
            <>
          {contentMode === 'records' && (
            <DataTable
              records={visibleRecords}
              selectedTemplate={selectedTemplate}
              onRowClick={(record) => setSelectedRecord(record)}
            />
          )}
          {contentMode === 'templates' && (
            <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {templates.map(t => (
                  <div
                    key={t.template}
                    onClick={() => { setSelectedTemplate(t.template); setContentMode('records') }}
                    style={{
                      padding: '16px 18px',
                      border: `1px solid ${borderPanel}`,
                      borderRadius: 10,
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = dropdownHoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary, marginBottom: 4 }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: textSecondary }}>{t.count} record{t.count !== 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {contentMode === 'workflows' && (
            <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
              {workflows === null ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <svg width="24" height="24" viewBox="0 0 32 32" style={{ animation: 'orbit-spin 1.2s linear infinite' }}>
                    <circle cx="16" cy="16" r="12" fill="none" stroke={textSecondary} strokeWidth="1.5" opacity="0.45" />
                    <circle cx="16" cy="4" r="2.5" fill={textSecondary} />
                  </svg>
                </div>
              ) : workflowsError ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div style={{ textAlign: 'center', color: textSecondary, fontSize: 13 }}>
                    <div>Failed to load workflows</div>
                    <div
                      onClick={() => { setWorkflows(null); setWorkflowsError(false) }}
                      style={{ marginTop: 8, cursor: 'pointer', opacity: 0.7, textDecoration: 'underline' }}
                    >Retry</div>
                  </div>
                </div>
              ) : workflows.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div style={{ textAlign: 'center', color: textSecondary, fontSize: 13 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: 8 }}>
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    <div>No workflows yet</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {workflows.map(w => {
                    const stepCount = w.steps ? Object.keys(w.steps).length : 0
                    const isDraft = w.draft ?? w.status === 'DRAFT'
                    return (
                      <div
                        key={w.uuid}
                        style={{
                          padding: '16px 18px',
                          border: `1px solid ${borderPanel}`,
                          borderRadius: 10,
                          cursor: 'pointer',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = dropdownHoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{w.title}</div>
                          {isDraft && (
                            <span style={{
                              fontSize: 9,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                              color: textSecondary,
                              background: dropdownHoverBg,
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}>Draft</span>
                          )}
                        </div>
                        {w.description && (
                          <div style={{ fontSize: 11, color: textSecondary, marginBottom: 4 }}>{w.description}</div>
                        )}
                        <div style={{ fontSize: 11, color: textSecondary, opacity: 0.7 }}>
                          {stepCount} step{stepCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
