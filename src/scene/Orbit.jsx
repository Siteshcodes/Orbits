import { useMemo } from 'react'
import { Line } from '@react-three/drei'

/**
 * Traces the full orbital ellipse as an accent line, using the same
 * parametrization as Planet (x = a·cos θ − c, z = b·sin θ, star at the
 * origin focus) so the planet rides exactly on this path. Stroke weight and
 * opacity are per-act (extra props spread onto the Line).
 */
export default function Orbit({ a = 4, e = 0.45, segments = 128, ref, ...lineProps }) {
  const points = useMemo(() => {
    const b = a * Math.sqrt(1 - e * e)
    const c = a * e
    const pts = []
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2
      pts.push([a * Math.cos(theta) - c, 0, b * Math.sin(theta)])
    }
    return pts
  }, [a, e, segments])

  return (
    <Line
      ref={ref}
      points={points}
      color="#8ab4ff"
      lineWidth={1}
      transparent
      opacity={0.35}
      depthWrite={false}
      {...lineProps}
    />
  )
}
