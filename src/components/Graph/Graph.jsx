import { forwardRef } from 'react'

const Graph = forwardRef(function Graph({ style }, ref) {
  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }}
    />
  )
})

export default Graph
