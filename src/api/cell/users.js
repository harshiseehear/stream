import { authFetchSafe } from '../client'

const SCINT_API = '/proxy/scint'

export async function fetchUserNames() {
  const data = await authFetchSafe(`${SCINT_API}/user/names`)
  const users = data?.data ?? data
  if (!Array.isArray(users)) return {}
  const cache = {}
  for (const u of users) {
    const id = u.user_id ?? u.userId ?? u.id
    if (id != null) cache[id] = u
  }
  return cache
}
