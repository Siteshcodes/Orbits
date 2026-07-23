import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/**
 * A planet on a Kepler orbit.
 *
 * The geometry (Kepler's 1st law): an ellipse with semi-major axis `a` and
 * eccentricity `e` has semi-minor axis b = a·√(1 − e²) and focal distance
 * c = a·e (equivalently c = √(a² − b²)). We trace it as
 *
 *     x = a·cos θ − c,   z = b·sin θ
 *
 * The −c shift places the ellipse's *center* at (−c, 0), which puts one
 * focus exactly at the origin — where the star is. The star is at a focus,
 * not the middle: the planet's closest approach (perihelion, θ = 0) is at
 * distance a − c, its farthest (aphelion, θ = π) at a + c.
 *
 * The motion (Kepler's 2nd law, `kepler` mode): gravity is a central force —
 * it points from the planet straight at the star, so it exerts zero torque
 * about the star, and the planet's angular momentum per unit mass
 *
 *     L = r² · (dν/dt)      (ν = true anomaly, the angle seen from the star)
 *
 * is conserved. Rearranging, dν/dt = L / r²: angular velocity is large when
 * r is small (perihelion) and small when r is large (aphelion). The speed-up
 * near the star is a consequence of this one line of math — nothing is
 * keyframed. It follows that the swept-area rate dA/dt = ½·r²·(dν/dt) = L/2
 * is CONSTANT: equal areas in equal times. We pick L = 2πab / period so one
 * revolution takes exactly `period` seconds (ellipse area πab ÷ sweep rate
 * L/2). In this mode the ellipse is traced focus-centered:
 *
 *     r = a(1 − e²) / (1 + e·cos ν),   x = r·cos ν,   z = r·sin ν
 *
 * — the same curve as above, just parametrized by the star-centered angle.
 *
 * Non-kepler mode (Act 1) advances θ uniformly: the shape is the idea there,
 * the true speed variation is Act 2's reveal.
 */

const TRAIL_LENGTH = 18 // number of ghost positions to keep

export default function Planet({
  a = 4,
  e = 0.45,
  period = 14, // seconds per revolution
  radius = 0.28,
  color = '#7d8fb3',
  phase = 0,
  kepler = false,
  showTrail = true,
  onLap, // optional: fired once per completed revolution (at perihelion)
  ref, // optional: exposes the planet mesh (e.g. for the live "r" line)
}) {
  const mesh = useRef()
  const trailPoints = useRef()
  const angle = useRef(phase) // eccentric anomaly (uniform) or true anomaly (kepler)
  const laps = useRef(Math.floor(phase / (Math.PI * 2)))
  // Ring buffer of trail positions
  const trailBuffer = useRef([])
  const trailCounter = useRef(0) // frames since last trail sample

  const setRef = (node) => {
    mesh.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  const { b, c, p, L } = useMemo(() => {
    const b = a * Math.sqrt(1 - e * e)
    return {
      b,
      c: a * e,
      p: a * (1 - e * e), // semi-latus rectum
      L: (2 * Math.PI * a * b) / period, // angular momentum per unit mass
    }
  }, [a, e, period])

  // Pre-allocate trail geometry positions (TRAIL_LENGTH * 3 floats)
  const trailPositions = useMemo(
    () => new Float32Array(TRAIL_LENGTH * 3),
    [],
  )
  const trailOpacities = useMemo(
    () => new Float32Array(TRAIL_LENGTH),
    [],
  )

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05) // no giant steps after a tab switch
    let px, pz
    if (kepler) {
      const r = p / (1 + e * Math.cos(angle.current))
      angle.current += (L / (r * r)) * delta // ω = L/r² — the second law
      const rNext = p / (1 + e * Math.cos(angle.current))
      px = rNext * Math.cos(angle.current)
      pz = rNext * Math.sin(angle.current)
    } else {
      angle.current += (delta * Math.PI * 2) / period
      px = a * Math.cos(angle.current) - c
      pz = b * Math.sin(angle.current)
    }
    mesh.current.position.set(px, 0, pz)
    mesh.current.rotation.y += delta * 0.4 // slow day-side spin

    // Trail: sample every 3 frames to avoid over-dense trails
    if (showTrail) {
      trailCounter.current++
      if (trailCounter.current >= 3) {
        trailCounter.current = 0
        trailBuffer.current.push(px, 0, pz)
        if (trailBuffer.current.length > TRAIL_LENGTH * 3) {
          trailBuffer.current.splice(0, 3) // remove oldest
        }
      }

      // Update trail geometry
      if (trailPoints.current) {
        const buf = trailBuffer.current
        const count = buf.length / 3
        const positions = trailPoints.current.geometry.attributes.position
        const opacities = trailPoints.current.geometry.attributes.opacity

        for (let i = 0; i < TRAIL_LENGTH; i++) {
          if (i < count) {
            const bi = i * 3
            positions.array[bi] = buf[bi]
            positions.array[bi + 1] = buf[bi + 1]
            positions.array[bi + 2] = buf[bi + 2]
            opacities.array[i] = (i / count) * 0.6 // fade: older = dimmer
          } else {
            positions.array[i * 3] = px
            positions.array[i * 3 + 1] = 0
            positions.array[i * 3 + 2] = pz
            opacities.array[i] = 0
          }
        }
        positions.needsUpdate = true
        opacities.needsUpdate = true
        trailPoints.current.geometry.setDrawRange(0, count)
      }
    }

    // Lap detection: the angle passes a multiple of 2π exactly at perihelion.
    if (onLap) {
      const lapsNow = Math.floor(angle.current / (Math.PI * 2))
      if (lapsNow > laps.current) {
        laps.current = lapsNow
        onLap()
      }
    }
  })

  return (
    <group>
      <mesh ref={setRef}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.85} metalness={0} />
      </mesh>

      {/* Fading motion trail — small additive-blended points behind the
          planet, giving a comet-tail impression of its velocity. */}
      {showTrail && (
        <points ref={trailPoints}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[trailPositions, 3]}
            />
            <bufferAttribute
              attach="attributes-opacity"
              args={[trailOpacities, 1]}
            />
          </bufferGeometry>
          <pointsMaterial
            color={color}
            size={radius * 0.7}
            sizeAttenuation
            transparent
            opacity={0.5}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </group>
  )
}
