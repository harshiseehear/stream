import { useEffect, useState } from 'react'
import { fetchUserNames } from '../api/cell/users'
import { fetchModuleTemplates, fetchDefinition, fetchInstances } from '../api/cell/records'
import { formatFieldValue, setUserCache, getUserName } from '../utils/formatFieldValue'

const MODULE_SEQ = 23

export function useRecords() {
  const token = sessionStorage.getItem('ishToken')
  const [records, setRecords] = useState(token ? null : []) // null = loading, [] = no token

  useEffect(() => {
    if (!token) return

    fetchUserNames()
      .then(cache => {
        console.log('[useRecords] user cache loaded, size:', Object.keys(cache).length)
        setUserCache(cache)
      })
      .catch(err => console.warn('[useRecords] fetchUserNames failed:', err))
      .then(() => fetchModuleTemplates(MODULE_SEQ))
      .then(templates =>
        Promise.all(
          templates.map(t => {
            const tLabel = t.recordLabel ?? t.label ?? t.name ?? ''
            const tCode = t.recordCode ?? ''

            return Promise.all([
              fetchDefinition(t.uuid),
              fetchInstances(t.uuid),
            ]).then(([defData, instances]) => {
              const def = defData?.data ?? defData

              const sections = []
              for (const sec of (def?.recordSectionDef ?? [])) {
                const secFields = []
                for (const fd of (sec.sectionFieldsDef ?? [])) {
                  if (fd.type === 'TASK_DEF') {
                    if (fd.uuid) secFields.push({ uuid: fd.uuid, label: fd.taskLabel ?? fd.fieldLabel ?? fd.uuid, isTask: true, fieldType: 'TASK' })
                  } else {
                    if (fd.uuid) secFields.push({ uuid: fd.uuid, label: fd.fieldLabel ?? fd.uuid, isTask: false, fieldType: fd.fieldType ?? '' })
                  }
                }
                if (secFields.length > 0) {
                  sections.push({ sectionLabel: sec.sectionLabel ?? '', sectionUuid: sec.uuid ?? '', fields: secFields })
                }
              }

              const statusDefs = {}
              for (const sd of (def?.statusDef ?? [])) {
                if (sd.uuid) statusDefs[sd.uuid] = { label: sd.statusLabel ?? '', color: sd.statusColor ?? null }
              }

              return instances.map(inst => {
                const incSID = inst.recordIncrementalSID ?? ''
                const sid = tCode && incSID ? `${tCode}-${incSID}` : String(incSID || inst.uuid || '')

                const resps = inst.recordResps ?? {}
                const sectionVisibility = inst.sectionVisibility ?? {}
                const fieldSections = []
                for (const sec of sections) {
                  if (sectionVisibility[sec.sectionUuid] === false) continue
                  const sectionFields = []
                  for (const fd of sec.fields) {
                    const key = (fd.isTask ? 'task' : 'field') + fd.uuid
                    const raw = resps[key]
                    if (raw === undefined || raw === null) continue
                    const display = formatFieldValue(raw, fd.fieldType)
                    if (display === null) continue
                    sectionFields.push({ name: fd.label, value: display, fieldType: fd.fieldType })
                  }
                  if (sectionFields.length > 0) {
                    fieldSections.push({ sectionLabel: sec.sectionLabel, fields: sectionFields })
                  }
                }

                const statusUuid = inst.statusResps?.statusUUID ?? ''
                const statusLabel = inst.statusResps?.statusLabel ?? ''
                const statusColor = statusDefs[statusUuid]?.color ?? null

                const createdActorId = inst.recordCreatedActorId ?? inst.recordCreatedActor?.id ?? null
                const createdByName = createdActorId != null ? getUserName(createdActorId) : null

                return {
                  sid,
                  uuid: inst.uuid ?? '',
                  template: inst.recordDefUUID ?? t.uuid ?? '',
                  templateLabel: tLabel,
                  fieldSections,
                  recordLabel: inst.recordLabel ?? '',
                  statusLabel,
                  statusColor,
                  recordCreated: inst.recordCreated ?? '',
                  lastUpdate: inst.lastUpdate ?? '',
                  createdByName: createdByName ?? '',
                }
              })
            }).catch(() => [])
          })
        )
      )
      .then(nested => setRecords(nested.flat()))
      .catch(() => setRecords([]))
  }, [])

  return records
}
