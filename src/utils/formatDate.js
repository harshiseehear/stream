export function formatDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) return null
  const d = new Date(str)
  if (isNaN(d)) return null
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const month = months[d.getMonth()]
  const day = d.getDate()
  const year = d.getFullYear()
  if (/T00:00:00/.test(str)) {
    return `${month} ${day}, ${year}`
  }
  let hours = d.getHours()
  const mins = d.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${month} ${day}, ${year} ${hours}:${String(mins).padStart(2, '0')} ${ampm}`
}
