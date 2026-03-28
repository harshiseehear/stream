import { authFetch, authFetchSafe } from '../client'

const RECORDS_API = '/proxy/records'
const PERMISSIONS_API = '/proxy/permissions'

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

export async function fetchHierarchyLevels() {
  const data = await authFetchSafe(`${PERMISSIONS_API}/hierarchy/levels`)
  if (!data) return []
  const labels = data.data?.labels ?? data.labels ?? []
  return Array.isArray(labels) ? labels : []
}

export async function fetchUserContainers(recordDefUUID) {
  const data = await authFetchSafe(`${PERMISSIONS_API}/data-access/containers/user?recordDefUUID=${encodeURIComponent(recordDefUUID)}&action=view`)
  if (!data) return []
  const containers = data.data ?? data
  return Array.isArray(containers) ? containers : []
}

export async function fetchWorkflows() {
  const data = await authFetchSafe(`${RECORDS_API}/workflows`)
  if (!data) return []
  const workflows = data.data ?? data
  return Array.isArray(workflows) ? workflows : []
}
