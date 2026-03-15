import { useEffect, useRef, useState } from 'react'

const PALETTE = [
  [180, 120, 80],   [100, 140, 160],  [140, 170, 100],
  [170, 100, 130],  [130, 130, 170],  [170, 150, 90],
  [100, 160, 140],  [160, 110, 110],  [120, 150, 120],  [150, 120, 160],
]

export function usePhysics(records) {
  const canvasRef = useRef(null)
  const nodesRef = useRef([])
  const animRef = useRef(null)
  const mouseRef = useRef({ x: -1, y: -1 })
  const dragRef = useRef(null)
  const dragTemplateRef = useRef(null)
  const templateOffsetsRef = useRef({})
  const hoveredIdxRef = useRef(null)
  const pinnedIdxRef = useRef(null)
  const physicsRef = useRef({ attraction: 0.3, repulsion: 0.5, inherentAttraction: 0.5 })

  const [hoveredRecord, setHoveredRecord] = useState(null)
  const [pinnedRecord, setPinnedRecord] = useState(null)
  const [attraction, setAttraction] = useState(0.3)
  const [repulsion, setRepulsion] = useState(0.5)
  const [inherentAttraction, setInherentAttraction] = useState(0.5)

  useEffect(() => {
    physicsRef.current = { attraction, repulsion, inherentAttraction }
  }, [attraction, repulsion, inherentAttraction])

  useEffect(() => {
    if (records === null) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w, h
    const PAD = 50

    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
      for (const n of nodesRef.current) {
        n.x = Math.max(PAD, Math.min(w - PAD, n.x))
        n.y = Math.max(PAD, Math.min(h - PAD, n.y))
      }
    }
    resize()
    window.addEventListener('resize', resize)

    const useApiRecords = records.length > 0
    const count = useApiRecords ? records.length : 25

    const templateIds = [...new Set(records.map(r => r.template).filter(Boolean))]
    const templateColors = {}
    const templateLabels = {}
    templateIds.forEach((id, i) => {
      templateColors[id] = PALETTE[i % PALETTE.length]
      const rec = records.find(r => r.template === id)
      if (rec) templateLabels[id] = rec.templateLabel || ''
    })

    const nodes = []
    for (let i = 0; i < count; i++) {
      const rec = useApiRecords ? records[i] : {}
      nodes.push({
        sid: String(rec.sid ?? ''),
        template: String(rec.template ?? ''),
        templateLabel: String(rec.templateLabel ?? ''),
        fieldSections: rec.fieldSections ?? [],
        recordLabel: String(rec.recordLabel ?? ''),
        statusLabel: String(rec.statusLabel ?? ''),
        statusColor: rec.statusColor ?? null,
        recordCreated: rec.recordCreated ?? '',
        lastUpdate: rec.lastUpdate ?? '',
        x: PAD + Math.random() * (w - PAD * 2),
        y: PAD + Math.random() * (h - PAD * 2),
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: 4,
      })
    }
    nodesRef.current = nodes

    const templateMap = {}
    for (let i = 0; i < nodes.length; i++) {
      const t = nodes[i].template
      if (!t) continue
      if (!templateMap[t]) templateMap[t] = []
      templateMap[t].push(i)
    }

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      mouseRef.current = { x: mx, y: my }

      const dt = dragTemplateRef.current
      if (dt) {
        const indices = templateMap[dt.tmpl]
        if (indices && indices.length > 0) {
          let cx = 0, cy = 0
          for (const i of indices) { cx += nodes[i].x; cy += nodes[i].y }
          cx /= indices.length; cy /= indices.length
          templateOffsetsRef.current[dt.tmpl] = { dx: mx - cx, dy: my - cy }
        }
        return
      }

      const di = dragRef.current
      if (di !== null && nodes[di]) {
        nodes[di].x = mx
        nodes[di].y = my
        nodes[di].vx = 0
        nodes[di].vy = 0
      }
    }

    const onMouseLeave = () => {
      mouseRef.current = { x: -1, y: -1 }
      dragRef.current = null
      dragTemplateRef.current = null
    }

    const onMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      ctx.font = 'bold 13px system-ui, sans-serif'
      for (const [tmpl, indices] of Object.entries(templateMap)) {
        const label = templateLabels[tmpl]
        if (!label || indices.length === 0) continue
        let cx = 0, cy = 0
        for (const i of indices) { cx += nodes[i].x; cy += nodes[i].y }
        cx /= indices.length; cy /= indices.length
        const off = templateOffsetsRef.current[tmpl] || { dx: 0, dy: 0 }
        const lx = cx + off.dx
        const ly = cy + off.dy
        const textW = ctx.measureText(label).width
        const textH = 16
        if (
          mx >= lx - textW / 2 - 4 && mx <= lx + textW / 2 + 4 &&
          my >= ly - textH / 2 - 2 && my <= ly + textH / 2 + 2
        ) {
          dragTemplateRef.current = { tmpl }
          return
        }
      }

      const HIT = 12
      let closest = null
      let closestDist = HIT
      for (let i = 0; i < nodes.length; i++) {
        const dx = nodes[i].x - mx
        const dy = nodes[i].y - my
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < closestDist) {
          closestDist = d
          closest = i
        }
      }
      if (closest !== null) {
        dragRef.current = closest
        nodes[closest].vx = 0
        nodes[closest].vy = 0
        if (pinnedIdxRef.current === closest) {
          pinnedIdxRef.current = null
          setPinnedRecord(null)
        } else {
          pinnedIdxRef.current = closest
          const n = nodes[closest]
          setPinnedRecord({
            sid: n.sid, templateLabel: n.templateLabel, recordLabel: n.recordLabel,
            statusLabel: n.statusLabel, statusColor: n.statusColor,
            fieldSections: n.fieldSections, recordCreated: n.recordCreated,
            lastUpdate: n.lastUpdate, nodeX: n.x, nodeY: n.y,
          })
        }
      } else {
        pinnedIdxRef.current = null
        setPinnedRecord(null)
      }
    }

    const onMouseUp = () => {
      dragRef.current = null
      dragTemplateRef.current = null
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mouseup', onMouseUp)

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const { attraction: attr, repulsion: rep, inherentAttraction: inh } = physicsRef.current

      for (const [, indices] of Object.entries(templateMap)) {
        if (indices.length < 2) continue
        let cx = 0, cy = 0
        for (const i of indices) { cx += nodes[i].x; cy += nodes[i].y }
        cx /= indices.length; cy /= indices.length

        for (const i of indices) {
          const dx = cx - nodes[i].x
          const dy = cy - nodes[i].y
          const base = inh * 0.0000001
          const boost = attr * 0.000001
          nodes[i].vx += dx * (base + boost)
          nodes[i].vy += dy * (base + boost)
        }

        for (let a = 0; a < indices.length; a++) {
          for (let b = a + 1; b < indices.length; b++) {
            const ni = nodes[indices[a]], nj = nodes[indices[b]]
            const dx = nj.x - ni.x
            const dy = nj.y - ni.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 1) continue
            const f = 0.000001 * (1 + inh + attr)
            ni.vx += dx * f; ni.vy += dy * f
            nj.vx -= dx * f; nj.vy -= dy * f
          }
        }
      }

      if (rep > 0) {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x - nodes[i].x
            const dy = nodes[j].y - nodes[i].y
            const distSq = dx * dx + dy * dy
            const minDist = 400
            if (distSq < minDist * rep * 10 && distSq > 0.1) {
              const force = rep * 0.3 / distSq
              const fx = dx * force, fy = dy * force
              nodes[i].vx -= fx; nodes[i].vy -= fy
              nodes[j].vx += fx; nodes[j].vy += fy
            }
          }
        }
      }

      for (const n of nodes) { n.vx *= 0.98; n.vy *= 0.98 }

      const dragIdx = dragRef.current
      for (let i = 0; i < nodes.length; i++) {
        if (i === dragIdx) continue
        const n = nodes[i]
        n.x += n.vx; n.y += n.vy
        if (n.x < PAD) { n.x = PAD; n.vx *= -1 }
        if (n.x > w - PAD) { n.x = w - PAD; n.vx *= -1 }
        if (n.y < PAD) { n.y = PAD; n.vy *= -1 }
        if (n.y > h - PAD) { n.y = h - PAD; n.vy *= -1 }
      }

      ctx.font = 'bold 13px system-ui, sans-serif'
      const mx = mouseRef.current.x, my = mouseRef.current.y
      let hoveredTemplate = null
      const centroids = {}

      for (const [tmpl, indices] of Object.entries(templateMap)) {
        const label = templateLabels[tmpl]
        if (!label || indices.length === 0) continue
        let cx = 0, cy = 0
        for (const i of indices) { cx += nodes[i].x; cy += nodes[i].y }
        cx /= indices.length; cy /= indices.length
        const off = templateOffsetsRef.current[tmpl] || { dx: 0, dy: 0 }
        centroids[tmpl] = { cx: cx + off.dx, cy: cy + off.dy }
        const textW = ctx.measureText(label).width, textH = 16
        const lx = cx + off.dx, ly = cy + off.dy
        if (mx >= lx - textW / 2 - 4 && mx <= lx + textW / 2 + 4 &&
            my >= ly - textH / 2 - 2 && my <= ly + textH / 2 + 2) {
          hoveredTemplate = tmpl
        }
      }

      if (hoveredTemplate && centroids[hoveredTemplate]) {
        const { cx, cy } = centroids[hoveredTemplate]
        const [cr, cg, cb] = templateColors[hoveredTemplate] || [160, 133, 110]
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, 0.35)`
        ctx.lineWidth = 1
        for (const i of templateMap[hoveredTemplate]) {
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nodes[i].x, nodes[i].y); ctx.stroke()
        }
      }

      ctx.font = '11px system-ui, sans-serif'
      ctx.textBaseline = 'middle'
      let newHoveredIdx = null
      const HIT_R = 10
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const [cr, cg, cb] = templateColors[n.template] || [160, 133, 110]
        const dx = n.x - mx, dy = n.y - my
        const isHovered = mx >= 0 && my >= 0 && Math.sqrt(dx * dx + dy * dy) < HIT_R
        if (isHovered) newHoveredIdx = i
        ctx.beginPath()
        ctx.arc(n.x, n.y, isHovered ? n.r + 2 : n.r, 0, Math.PI * 2)
        ctx.fillStyle = isHovered ? `rgba(${cr}, ${cg}, ${cb}, 1)` : `rgba(${cr}, ${cg}, ${cb}, 0.8)`
        ctx.fill()
        if (n.sid) {
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 0.6)`
          ctx.fillText(n.sid, n.x + n.r + 4, n.y)
        }
      }

      if (newHoveredIdx !== hoveredIdxRef.current) {
        hoveredIdxRef.current = newHoveredIdx
        if (newHoveredIdx !== null) {
          const n = nodes[newHoveredIdx]
          setHoveredRecord({
            sid: n.sid, templateLabel: n.templateLabel, recordLabel: n.recordLabel,
            statusLabel: n.statusLabel, statusColor: n.statusColor,
            fieldSections: n.fieldSections, recordCreated: n.recordCreated,
            lastUpdate: n.lastUpdate, nodeX: n.x, nodeY: n.y,
          })
        } else {
          setHoveredRecord(null)
        }
      }

      ctx.font = 'bold 13px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const [tmpl] of Object.entries(templateMap)) {
        const label = templateLabels[tmpl]
        if (!label || !centroids[tmpl]) continue
        const { cx, cy } = centroids[tmpl]
        const [cr, cg, cb] = templateColors[tmpl] || [160, 133, 110]
        const isHov = tmpl === hoveredTemplate
        ctx.fillStyle = isHov ? `rgba(${cr}, ${cg}, ${cb}, 0.9)` : `rgba(${cr}, ${cg}, ${cb}, 0.5)`
        ctx.fillText(label, cx, cy)
      }
      ctx.textAlign = 'start'

      animRef.current = requestAnimationFrame(draw)
    }

    canvas.style.cursor = 'default'
    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mouseup', onMouseUp)
    }
  }, [records])

  return {
    canvasRef,
    hoveredRecord,
    pinnedRecord, setPinnedRecord,
    pinnedIdxRef,
    attraction, setAttraction,
    repulsion, setRepulsion,
    inherentAttraction, setInherentAttraction,
  }
}
