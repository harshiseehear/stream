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
  const panRef = useRef(null)
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 })
  const templateOffsetsRef = useRef({})
  const hoveredIdxRef = useRef(null)
  const pinnedIdxRef = useRef(null)
  const physicsRef = useRef({ attraction: 0.3, repulsion: 0.5, inherentAttraction: 0.5 })
  const alphaRef = useRef(1.0)
  const reheatRef = useRef(false)

  const [hoveredRecord, setHoveredRecord] = useState(null)
  const [pinnedRecord, setPinnedRecord] = useState(null)
  const [attraction, setAttraction] = useState(0.3)
  const [repulsion, setRepulsion] = useState(0.5)
  const [inherentAttraction, setInherentAttraction] = useState(0.5)

  useEffect(() => {
    physicsRef.current = { attraction, repulsion, inherentAttraction }
    reheatRef.current = true
  }, [attraction, repulsion, inherentAttraction])

  useEffect(() => {
    if (records === null) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w, h
    const PAD = 50

    const screenToWorld = (sx, sy) => {
      const cam = cameraRef.current
      return { x: (sx - cam.x) / cam.zoom, y: (sy - cam.y) / cam.zoom }
    }

    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
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

    const existingBySid = {}
    for (const n of nodesRef.current) {
      if (n.sid) existingBySid[n.sid] = n
    }

    let hasNewNodes = false
    const nodes = []
    for (let i = 0; i < count; i++) {
      const rec = useApiRecords ? records[i] : {}
      const sid = String(rec.sid ?? '')
      const existing = existingBySid[sid]
      if (!existing) hasNewNodes = true
      nodes.push({
        sid,
        template: String(rec.template ?? ''),
        templateLabel: String(rec.templateLabel ?? ''),
        fieldSections: rec.fieldSections ?? [],
        recordLabel: String(rec.recordLabel ?? ''),
        statusLabel: String(rec.statusLabel ?? ''),
        statusColor: rec.statusColor ?? null,
        recordCreated: rec.recordCreated ?? '',
        lastUpdate: rec.lastUpdate ?? '',
        createdByName: rec.createdByName ?? '',
        x: existing ? existing.x : PAD + Math.random() * (w - PAD * 2),
        y: existing ? existing.y : PAD + Math.random() * (h - PAD * 2),
        vx: existing ? existing.vx : (Math.random() - 0.5) * 0.6,
        vy: existing ? existing.vy : (Math.random() - 0.5) * 0.6,
        r: 4,
      })
    }
    nodesRef.current = nodes

    // Only reset alpha when there are genuinely new nodes
    if (hasNewNodes) alphaRef.current = 1.0

    const templateMap = {}
    for (let i = 0; i < nodes.length; i++) {
      const t = nodes[i].template
      if (!t) continue
      if (!templateMap[t]) templateMap[t] = []
      templateMap[t].push(i)
    }

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      mouseRef.current = { x: sx, y: sy }

      // Canvas panning
      const pan = panRef.current
      if (pan) {
        cameraRef.current.x += sx - pan.lastX
        cameraRef.current.y += sy - pan.lastY
        pan.lastX = sx
        pan.lastY = sy
        return
      }

      const { x: mx, y: my } = screenToWorld(sx, sy)

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
      panRef.current = null
    }

    const onMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const { x: mx, y: my } = screenToWorld(sx, sy)

      // Reheat simulation on any interaction
      alphaRef.current = Math.max(alphaRef.current, 0.3)

      const TMPL_R = 6
      for (const [tmpl, indices] of Object.entries(templateMap)) {
        if (!templateLabels[tmpl] || indices.length === 0) continue
        let cx = 0, cy = 0
        for (const i of indices) { cx += nodes[i].x; cy += nodes[i].y }
        cx /= indices.length; cy /= indices.length
        const off = templateOffsetsRef.current[tmpl] || { dx: 0, dy: 0 }
        const lx = cx + off.dx
        const ly = cy + off.dy
        const dx = mx - lx, dy = my - ly
        if (Math.sqrt(dx * dx + dy * dy) < TMPL_R + 4) {
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
            lastUpdate: n.lastUpdate, createdByName: n.createdByName,
            nodeX: n.x, nodeY: n.y,
          })
        }
      } else {
        // Empty space — start canvas pan
        panRef.current = { lastX: sx, lastY: sy }
      }
    }

    const onMouseUp = () => {
      if (dragRef.current !== null || dragTemplateRef.current !== null) {
        alphaRef.current = Math.max(alphaRef.current, 0.1)
      }
      dragRef.current = null
      dragTemplateRef.current = null
      panRef.current = null
    }

    const onWheel = (e) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const cam = cameraRef.current
      const factor = e.deltaY > 0 ? 0.95 : 1.05
      const newZoom = Math.min(5, Math.max(0.1, cam.zoom * factor))
      // Zoom toward mouse pointer
      cam.x = sx - (sx - cam.x) * (newZoom / cam.zoom)
      cam.y = sy - (sy - cam.y) * (newZoom / cam.zoom)
      cam.zoom = newZoom
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    const ALPHA_DECAY = 0.005
    const ALPHA_MIN = 0.001

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const { attraction: attr, repulsion: rep, inherentAttraction: inh } = physicsRef.current

      // Reheat on slider change
      if (reheatRef.current) {
        alphaRef.current = Math.max(alphaRef.current, 0.3)
        reheatRef.current = false
      }

      // Alpha decay (simulated annealing)
      let alpha = alphaRef.current
      alpha += (0 - alpha) * ALPHA_DECAY
      alphaRef.current = alpha

      const simulate = alpha >= ALPHA_MIN

      if (simulate) {
        const centerX = w / 2
        const centerY = h / 2

        // CENTER FORCE — pulls all nodes toward canvas center
        const kCenter = inh * 0.1
        for (let i = 0; i < nodes.length; i++) {
          const dx = centerX - nodes[i].x
          const dy = centerY - nodes[i].y
          nodes[i].vx += dx * kCenter * alpha
          nodes[i].vy += dy * kCenter * alpha
        }

        // TEMPLATE CENTROID ATTRACTION + PAIRWISE ATTRACTION
        for (const [, indices] of Object.entries(templateMap)) {
          if (indices.length < 2) continue
          let cx = 0, cy = 0
          for (const i of indices) { cx += nodes[i].x; cy += nodes[i].y }
          cx /= indices.length; cy /= indices.length

          // Centroid pull
          const kCentroid = (inh * 0.015 + attr * 0.03)
          for (const i of indices) {
            const dx = cx - nodes[i].x
            const dy = cy - nodes[i].y
            nodes[i].vx += dx * kCentroid * alpha
            nodes[i].vy += dy * kCentroid * alpha
          }

          // Pairwise attraction within template
          const kPair = 0.003 * (1 + inh + attr)
          for (let a = 0; a < indices.length; a++) {
            for (let b = a + 1; b < indices.length; b++) {
              const ni = nodes[indices[a]], nj = nodes[indices[b]]
              const dx = nj.x - ni.x
              const dy = nj.y - ni.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < 1) continue
              const f = kPair * alpha / dist
              ni.vx += dx * f; ni.vy += dy * f
              nj.vx -= dx * f; nj.vy -= dy * f
            }
          }
        }

        // REPULSION — all pairs, infinite range (1/r² falloff)
        if (rep > 0) {
          const kRepel = rep * 30
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const dx = nodes[j].x - nodes[i].x
              const dy = nodes[j].y - nodes[i].y
              const distSq = Math.max(dx * dx + dy * dy, 1)
              const force = kRepel * alpha / distSq
              const fx = dx * force
              const fy = dy * force
              nodes[i].vx -= fx; nodes[i].vy -= fy
              nodes[j].vx += fx; nodes[j].vy += fy
            }
          }
        }
      }

      // Damping
      for (const n of nodes) { n.vx *= 0.6; n.vy *= 0.6 }

      // Position update (no bounds — free to go off-screen)
      const dragIdx = dragRef.current
      for (let i = 0; i < nodes.length; i++) {
        if (i === dragIdx) continue
        const n = nodes[i]
        n.x += n.vx; n.y += n.vy
      }

      const TMPL_R_DRAW = 6
      const smx = mouseRef.current.x, smy = mouseRef.current.y
      const mouseActive = smx >= 0 && smy >= 0
      const { x: mx, y: my } = screenToWorld(smx, smy)
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
        const lx = cx + off.dx, ly = cy + off.dy
        const dx = mx - lx, dy = my - ly
        if (mouseActive && Math.sqrt(dx * dx + dy * dy) < TMPL_R_DRAW + 4) {
          hoveredTemplate = tmpl
        }
      }

      // Apply camera transform for all drawing
      const cam = cameraRef.current
      ctx.save()
      ctx.translate(cam.x, cam.y)
      ctx.scale(cam.zoom, cam.zoom)

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
        const isHovered = mouseActive && Math.sqrt(dx * dx + dy * dy) < HIT_R
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
            lastUpdate: n.lastUpdate, createdByName: n.createdByName,
            nodeX: n.x, nodeY: n.y,
          })
        } else {
          setHoveredRecord(null)
        }
      }

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const [tmpl] of Object.entries(templateMap)) {
        const label = templateLabels[tmpl]
        if (!label || !centroids[tmpl]) continue
        const { cx, cy } = centroids[tmpl]
        const [cr, cg, cb] = templateColors[tmpl] || [160, 133, 110]
        const isHov = tmpl === hoveredTemplate
        // Draw template circle — same style as records, just bigger
        ctx.beginPath()
        ctx.arc(cx, cy, isHov ? TMPL_R_DRAW + 2 : TMPL_R_DRAW, 0, Math.PI * 2)
        ctx.fillStyle = isHov ? `rgba(${cr}, ${cg}, ${cb}, 1)` : `rgba(${cr}, ${cg}, ${cb}, 0.8)`
        ctx.fill()
        // Draw template label below circle
        ctx.font = 'bold 11px system-ui, sans-serif'
        ctx.fillStyle = isHov ? `rgba(${cr}, ${cg}, ${cb}, 0.9)` : `rgba(${cr}, ${cg}, ${cb}, 0.6)`
        ctx.fillText(label, cx, cy + TMPL_R_DRAW + 10)
      }
      ctx.textAlign = 'start'

      ctx.restore()

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
      canvas.removeEventListener('wheel', onWheel)
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
