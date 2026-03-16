export default function Sliders({
  attraction, setAttraction,
  repulsion, setRepulsion,
  inherentAttraction, setInherentAttraction,
  templateAttraction, setTemplateAttraction,
  linkAttraction, setLinkAttraction,
}) {
  const sliderStyle = { width: 100, accentColor: 'var(--text-secondary)' }
  const labelStyle = { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }
  const numStyle = { width: 28, textAlign: 'right' }

  return (
    <div style={{ paddingBottom: 8 }}>
      <label style={labelStyle}>
        attraction
        <input type="range" min="0" max="1" step="0.01" value={attraction}
          onChange={e => setAttraction(+e.target.value)} style={sliderStyle} />
        <span style={numStyle}>{attraction.toFixed(2)}</span>
      </label>
      <label style={labelStyle}>
        repulsion
        <input type="range" min="0" max="1" step="0.01" value={repulsion}
          onChange={e => setRepulsion(+e.target.value)} style={sliderStyle} />
        <span style={numStyle}>{repulsion.toFixed(2)}</span>
      </label>
      <label style={labelStyle}>
        inherent
        <input type="range" min="0" max="1" step="0.01" value={inherentAttraction}
          onChange={e => setInherentAttraction(+e.target.value)} style={sliderStyle} />
        <span style={numStyle}>{inherentAttraction.toFixed(2)}</span>
      </label>
      <label style={labelStyle}>
        template
        <input type="range" min="0" max="1" step="0.01" value={templateAttraction}
          onChange={e => setTemplateAttraction(+e.target.value)} style={sliderStyle} />
        <span style={numStyle}>{templateAttraction.toFixed(2)}</span>
      </label>
      <label style={labelStyle}>
        links
        <input type="range" min="0" max="1" step="0.01" value={linkAttraction}
          onChange={e => setLinkAttraction(+e.target.value)} style={sliderStyle} />
        <span style={numStyle}>{linkAttraction.toFixed(2)}</span>
      </label>
    </div>
  )
}
