export default function Sliders({
  attraction, setAttraction,
  repulsion, setRepulsion,
  inherentAttraction, setInherentAttraction,
}) {
  const sliderStyle = { width: 100, accentColor: '#a0856e' }
  const labelStyle = { display: 'flex', alignItems: 'center', gap: 8 }
  const numStyle = { width: 28, textAlign: 'right' }

  return (
    <>
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
    </>
  )
}
