import { useEffect } from 'react'

export function useKeyboardShortcut(key, callback, { meta = true } = {}) {
  useEffect(() => {
    const handler = (e) => {
      if (meta && !(e.metaKey || e.ctrlKey)) return
      if (e.key.toLowerCase() !== key.toLowerCase()) return
      e.preventDefault()
      callback(e)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback, meta])
}
