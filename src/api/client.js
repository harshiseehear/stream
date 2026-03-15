const getAuthHeaders = () => {
  const token = sessionStorage.getItem('ishToken')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function authFetchSafe(url, options = {}) {
  try {
    return await authFetch(url, options)
  } catch {
    return null
  }
}
