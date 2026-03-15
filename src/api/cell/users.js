import { authFetchSafe } from '../client'

const SCINT_API = '/proxy/scint'
const RECORDS_API = '/proxy/records'

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
  console.log('[fetchUserNames] JWT payload:', jwt)
  const custId = jwt?.cid ?? jwt?.customerId ?? jwt?.customer_id ?? ''

  const endpoints = [
    `${SCINT_API}/user/names`,
    `${SCINT_API}/user/all`,
    `${SCINT_API}/users`,
    ...(custId ? [
      `${SCINT_API}/user/names/${custId}`,
      `${SCINT_API}/user/all/${custId}`,
      `${SCINT_API}/users/${custId}`,
    ] : []),
    `${RECORDS_API}/users`,
    `${RECORDS_API}/user/names`,
  ]
  for (const url of endpoints) {
    const data = await authFetchSafe(url)
    if (data != null) {
      console.log('[fetchUserNames] hit on', url, typeof data, Array.isArray(data) ? `(array len ${data.length})` : '')
      const cache = parseUsers(data)
      if (cache) {
        console.log('[fetchUserNames] resolved', Object.keys(cache).length, 'users')
        return cache
      }
    }
  }
  console.warn('[fetchUserNames] all endpoints returned no usable data')
  return {}
}
