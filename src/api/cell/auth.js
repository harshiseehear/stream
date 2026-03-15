const API_BASE = 'https://sandbox.onlinecolony.com'

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/scint/api/v1/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || `Login failed (${res.status})`)
  }
  const data = await res.json()
  const token = data.token ?? data.data?.token
  if (token) {
    sessionStorage.setItem('ishToken', token)
  }
  return { data, token }
}
