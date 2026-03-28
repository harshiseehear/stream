import { useEffect, useRef } from 'react'

export default function PhyllotaxisBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let n = 0
    const c = 8
    let animationFrameId
    let maxR = 0

    const draw = () => {
      let limit = 1 + Math.floor(n / 20)
      if (limit > 50) limit = 50

      for (let i = 0; i < limit; i++) {
        const a = n * 137.5 * (Math.PI / 180)
        const r = c * Math.sqrt(n)
        const x = r * Math.cos(a) + window.innerWidth / 2
        const y = r * Math.sin(a) + window.innerHeight / 2

        if (r > maxR) {
          cancelAnimationFrame(animationFrameId)
          return
        }

        ctx.fillStyle = '#22c55e'
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()

        n++
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      maxR = Math.sqrt(Math.pow(window.innerWidth / 2, 2) + Math.pow(window.innerHeight / 2, 2))
      n = 0
      cancelAnimationFrame(animationFrameId)
      draw()
    }

    window.addEventListener('resize', resize)
    resize()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  )
}
