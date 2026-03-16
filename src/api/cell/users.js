import { authFetchSafe } from '../client'

const SCINT_API = '/proxy/scint'

function decodeJwtPayload() {
  try {
    const token = sessionStorage.getItem('ishToken')
    if (!token) return null
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch { return null }
}

function parseUsers(data) {
  let users = data?.data ?? data
  // Handle object-map format: { "123": { ... }, "456": { ... } }
  if (users && typeof users === 'object' && !Array.isArray(users)) {
    const keys = Object.keys(users)
    if (keys.length > 0 && typeof users[keys[0]] === 'object') {
      users = keys.map(k => ({ _key: k, ...users[k] }))
    }
  }
  if (!Array.isArray(users)) return null
  const cache = {}
  for (const u of users) {
    const id = u.user_id ?? u.userId ?? u.id ?? (u._key != null ? Number(u._key) : null)
    if (id != null) {
      cache[id] = {
        first_name: u.first_name ?? u.firstName ?? u.fname ?? u.name?.split(' ')[0] ?? '',
        last_name: u.last_name ?? u.lastName ?? u.lname ?? u.name?.split(' ').slice(1).join(' ') ?? '',
        ...u,
      }
    }
  }
  return Object.keys(cache).length > 0 ? cache : null
}

export async function fetchUserNames() {
  const jwt = decodeJwtPayload()
  const custId = jwt?.cid ?? jwt?.customerId ?? jwt?.customer_id ?? ''
  if (!custId) {
    console.warn('[fetchUserNames] no customer ID in JWT')
    return {}
  }

  const data = await authFetchSafe(`${SCINT_API}/users/${custId}`)
  if (data != null) {
    const cache = parseUsers(data)
    if (cache) return cache
  }
  console.warn('[fetchUserNames] failed to load users')
  return {}
}
