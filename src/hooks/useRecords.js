import { useEffect, useState } from 'react'
import { fetchUserNames } from '../api/cell/users'
import { fetchModuleTemplates, fetchDefinition, fetchInstances, fetchUserContainers, fetchHierarchyLevels } from '../api/cell/records'
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
      .then(templates => {
        return fetchHierarchyLevels()
          .then(levels => ({ templates, containerLevelLabel: levels.length > 0 ? levels[levels.length - 1].label : 'Container' }))
          .catch(() => ({ templates, containerLevelLabel: 'Container' }))
      })
      .then(({ templates, containerLevelLabel }) => {
        return Promise.all(
          templates.map(t => {
            const tLabel = t.recordLabel ?? t.label ?? t.name ?? ''
            const tCode = t.recordCode ?? ''

            return Promise.all([
              fetchDefinition(t.uuid),
              fetchInstances(t.uuid),
              fetchUserContainers(t.uuid),
            ]).then(([defData, instances, containers]) => {
              const containerMap = {}
              for (const c of containers) {
                containerMap[c.uuid] = c.hierarchyNodeLabel
              }
              const def = defData?.data ?? defData

              const sections = []
              for (const sec of (def?.recordSectionDef ?? [])) {
                const secFields = []
                for (const fd of (sec.sectionFieldsDef ?? [])) {
                  if (fd.type === 'TASK_DEF') {
                    const taskSubFields = (fd.taskFieldDefs ?? []).map(tf => ({
                      uuid: tf.uuid, label: tf.fieldLabel ?? tf.uuid, isTask: false, fieldType: tf.fieldType ?? '',
                    })).filter(tf => tf.uuid)
                    if (fd.uuid) secFields.push({ uuid: fd.uuid, label: fd.taskLabel ?? fd.fieldLabel ?? fd.uuid, isTask: true, fieldType: 'TASK', taskSubFields })
                  } else {
                    if (fd.uuid) secFields.push({ uuid: fd.uuid, label: fd.fieldLabel ?? fd.uuid, isTask: false, fieldType: fd.fieldType ?? '' })
                  }
                }
                sections.push({ sectionLabel: sec.sectionLabel ?? '', sectionUuid: sec.uuid ?? '', fields: secFields })
              }

              let recordKeyUuid = null
              for (const sec of (def?.recordSectionDef ?? [])) {
                for (const fd of (sec.sectionFieldsDef ?? [])) {
                  if (fd.type !== 'TASK_DEF' && fd.attributes?.recordKey && fd.uuid) {
                    recordKeyUuid = fd.uuid
                    break
                  }
                }
                if (recordKeyUuid) break
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
                    if (fd.isTask) {
                      const key = 'task' + fd.uuid
                      const raw = resps[key]
                      const taskRows = Array.isArray(raw) ? raw : []
                      const done = taskRows.filter(t => t.taskRowDone).length
                      sectionFields.push({ name: fd.label, value: taskRows.length > 0 ? `${done}/${taskRows.length} task(s) complete` : null, fieldType: 'TASK' })
                      for (const subField of (fd.taskSubFields ?? [])) {
                        const subValues = taskRows.map(row => {
                          const sv = row?.['field' + subField.uuid]
                          if (sv === undefined || sv === null) return null
                          return formatFieldValue(sv, subField.fieldType)
                        }).filter(Boolean)
                        sectionFields.push({ name: subField.label, value: subValues.length > 0 ? subValues.join(', ') : null, fieldType: subField.fieldType })
                      }
                    } else {
                      const key = 'field' + fd.uuid
                      const raw = resps[key]
                      const display = (raw !== undefined && raw !== null) ? formatFieldValue(raw, fd.fieldType) : null
                      sectionFields.push({ name: fd.label, value: display, fieldType: fd.fieldType })
                    }
                  }
                  fieldSections.push({ sectionLabel: sec.sectionLabel, fields: sectionFields })
                }

                const statusUuid = inst.statusResps?.statusUUID ?? ''
                const statusLabel = inst.statusResps?.statusLabel ?? ''
                const statusColor = statusDefs[statusUuid]?.color ?? null

                const createdActorId = inst.recordCreatedActorId ?? inst.recordCreatedActor?.id ?? null
                const createdByName = createdActorId != null ? getUserName(createdActorId) : null

                let recordKeyValue = ''
                if (recordKeyUuid) {
                  const raw = resps['field' + recordKeyUuid]
                  if (raw !== undefined && raw !== null) {
                    recordKeyValue = formatFieldValue(raw) ?? ''
                  }
                }

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
                  containerUUID: inst.containerUUID ?? '',
                  containerLabel: containerMap[inst.containerUUID] ?? '',
                  containerLevelLabel,
                  recordKeyValue,
                }
              })
            }).catch(() => [])
          })
        )
      })
      .then(nested => setRecords(nested.flat()))
      .catch(() => setRecords([]))
  }, [])

  return records
}
