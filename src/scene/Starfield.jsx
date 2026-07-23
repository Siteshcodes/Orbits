import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

/**
 * The starfield, split into three depth layers — each a single THREE.Points
 * draw call (never one mesh per star). Additive blending + a soft radial
 * sprite makes overlapping points brighten like real glows.
 *
 * Parallax: on top of the natural parallax from the camera dolly, each layer
 * slides vertically against the scroll at a rate proportional to its
 * nearness, so the field reads as deep, not painted-on.
 */

// Tiny radial-gradient sprite generated once — no texture asset to ship.
function makeStarSprite() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2,
  )
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.4)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function StarLayer({ count, rMin, rMax, size, drift, parallax, sprite }) {
  const points = useRef()
  const scroll = useScroll()

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const color = new THREE.Color()

    for (let i = 0; i < count; i++) {
      // Uniform direction on the sphere (u = cos φ uniform in [-1, 1] avoids
      // pole clustering), radius within this layer's shell.
      const u = Math.random() * 2 - 1
      const theta = Math.random() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      const r = rMin + Math.sqrt(Math.random()) * (rMax - rMin)

      positions[i * 3 + 0] = r * s * Math.cos(theta)
      positions[i * 3 + 1] = r * u
      positions[i * 3 + 2] = r * s * Math.sin(theta)

      // Mostly cool faint whites with an occasional warm one. Lightness stays
      // low enough that no star crosses the Bloom luminance threshold.
      const warm = Math.random() < 0.12
      color.setHSL(
        warm ? 0.07 : 0.6,
        warm ? 0.5 : 0.2,
        0.3 + Math.random() * 0.45,
      )
      colors[i * 3 + 0] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    return { positions, colors }
  }, [count, rMin, rMax])

  useFrame((_, delta) => {
    points.current.rotation.y += delta * drift
    points.current.position.y = -scroll.offset * parallax
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        vertexColors
        size={size}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function Starfield() {
  const sprite = useMemo(makeStarSprite, [])

  // Near/mid/far shells: nearer layers are brighter (bigger sprites), drift
  // faster, and carry more scroll parallax. Same total budget as before
  // (4000 points, now across 3 draw calls).
  return (
    <>
      <StarLayer count={1600} rMin={55} rMax={90} size={1.5} drift={0.005} parallax={7} sprite={sprite} />
      <StarLayer count={1600} rMin={90} rMax={140} size={1.0} drift={0.003} parallax={3.5} sprite={sprite} />
      <StarLayer count={800} rMin={140} rMax={210} size={0.7} drift={0.0015} parallax={1.2} sprite={sprite} />
    </>
  )
}
