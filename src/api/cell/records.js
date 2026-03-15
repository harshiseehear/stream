import { authFetch, authFetchSafe } from '../client'

const RECORDS_API = '/proxy/records'

export async function fetchModuleTemplates(moduleSeq) {
  const data = await authFetch(`${RECORDS_API}/definitions/module/${moduleSeq}`)
  const templates = data.data ?? data
  return Array.isArray(templates) ? templates : []
}

export async function fetchDefinition(uuid) {
  return authFetchSafe(`${RECORDS_API}/definition/${uuid}`)
}

export async function fetchInstances(uuid) {
  const data = await authFetchSafe(`${RECORDS_API}/instances/${uuid}`)
  if (!data) return []
  const instances = data.data ?? data
  return Array.isArray(instances) ? instances : []
}
