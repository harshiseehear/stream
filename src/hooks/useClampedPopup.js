import { useLayoutEffect, useRef } from 'react'

export function useClampedPopup(triggerRef, open) {
  const popupRef = useRef(null)

  useLayoutEffect(() => {
    if (!open || !popupRef.current || !triggerRef.current) return

    const popup = popupRef.current
    const trigger = triggerRef.current.getBoundingClientRect()
    const popupRect = popup.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const gap = 4

    let top = trigger.bottom + gap
    let left = trigger.left

    if (top + popupRect.height > vh) {
      top = trigger.top - popupRect.height - gap
    }
    if (left + popupRect.width > vw) {
      left = vw - popupRect.width - 8
    }
    if (left < 8) left = 8
    if (top < 8) top = 8

    popup.style.top = `${top}px`
    popup.style.left = `${left}px`
  }, [open, triggerRef])

  return popupRef
}
