import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScroll, Line } from '@react-three/drei'
import Planet from '../scene/Planet.jsx'
import Orbit from '../scene/Orbit.jsx'
import { Label, ACCENT, GREY } from '../scene/annotations.jsx'

// Act 3 — Kepler's third law: T² ∝ a³, i.e. T = k·a^(3/2). Three planets on
// nested ellipses around the shared focus; each period is COMPUTED from its
// semi-major axis by the law, so the inner planet sprinting while the outer
// crawls is the math on display, not choreography. With a = 2.4 / 3.8 / 5.8,
// the periods come out ≈ 5.9 / 11.9 / 22.3 s — the innermost laps ~3.8 times
// per outermost year.
const ECC = 0.2
const PERIOD_SCALE = 1.6 // k, in s per (world unit)^{3/2}

// Each orbit gets its own argument of perihelion (omega — an in-plane
// rotation about the focus, so the physics is untouched): real systems'
// apsides aren't aligned, and it fans the three "a" dimension lines apart so
// they don't pile up on a shared axis. No crossings: each orbit's minimum
// radius a(1−e) exceeds the previous one's maximum a(1+e), so the annuli are
// disjoint whatever the rotation.
const ORBITS = [
  { a: 2.4, radius: 0.22, color: '#7d8fb3', omega: 0.45, phase: 0.8, label: 'a1' }, // slate blue
  { a: 3.8, radius: 0.26, color: '#6fa3a0', omega: 0.0, phase: 3.4, label: 'a2' }, //  dusty teal
  { a: 5.8, radius: 0.3, color: '#b58274', omega: -0.5, phase: 5.2, label: 'a3' }, //  pale rust
]

// Scroll window: page 3 of 4 (act text centered at offset 0.75).
const FROM = 0.50
const DISTANCE = 0.22

const LAP_PULSE_SECONDS = 0.9

export default function Act3_Harmony() {
  const group = useRef()
  const scroll = useScroll()
  const pulseRings = useRef([])
  const pulseAges = useRef(ORBITS.map(() => Infinity))

  const periods = useMemo(
    () => ORBITS.map(({ a }) => PERIOD_SCALE * Math.pow(a, 1.5)), // T ∝ a^{3/2}
    [],
  )

  useFrame((_, delta) => {
    const o = scroll.curve(FROM, DISTANCE)
    group.current.visible = o > 0.001
    group.current.scale.setScalar(THREE.MathUtils.lerp(0.75, 1, o))
    // Same fade pattern as Acts 1–2.
    group.current.traverse((obj) => {
      const base = obj.userData.baseOpacity
      if (base === undefined) return
      if (typeof obj.fillOpacity === 'number') obj.fillOpacity = base * o
      else if (obj.material) obj.material.opacity = base * o
    })

    // Lap ticks: an expanding, fading ring at each orbit's perihelion, fired
    // by Planet's onLap. Managed outside the baseOpacity pattern (age-driven).
    ORBITS.forEach((_, i) => {
      const ring = pulseRings.current[i]
      if (!ring) return
      pulseAges.current[i] += delta
      const age = pulseAges.current[i]
      const alive = age < LAP_PULSE_SECONDS
      ring.visible = alive && o > 0.001
      if (alive) {
        const k = age / LAP_PULSE_SECONDS
        ring.material.opacity = 0.85 * (1 - k) * o
        ring.scale.setScalar(1 + k * 2.2)
      }
    })
  })

  // Same +0.44 rad tilt as Acts 1–2 (≈ 38–40° viewing angle). Act 3's text
  // is on the LEFT and the sun anchors RIGHT (like Act 1), so no Y-flip:
  // the orbits' long ends reach leftward toward screen center.
  return (
    <group ref={group} rotation={[0.44, 0, 0]} visible={false}>
      {ORBITS.map(({ a, radius, color, omega, phase, label }, i) => {
        const c = a * ECC
        return (
          <group key={label} rotation={[0, omega, 0]}>
            <Orbit a={a} e={ECC} lineWidth={1.5} userData={{ baseOpacity: 0.7 }} />
            <Planet
              kepler
              a={a}
              e={ECC}
              period={periods[i]}
              radius={radius}
              color={color}
              phase={phase}
              onLap={() => (pulseAges.current[i] = 0)}
            />

            {/* semi-major axis: centre → aphelion vertex, length a */}
            <Line
              points={[
                [-c, 0, 0],
                [-c - a, 0, 0],
              ]}
              color={GREY}
              lineWidth={1}
              transparent
              opacity={0}
              depthWrite={false}
              userData={{ baseOpacity: 0.5 }}
            />
            <Label position={[-c - a / 2, 0, 0.42]} size={0.24}>
              {label}
            </Label>

            {/* lap pulse ring at this orbit's perihelion */}
            <mesh
              ref={(el) => (pulseRings.current[i] = el)}
              position={[a * (1 - ECC), 0, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              visible={false}
            >
              <ringGeometry args={[0.3, 0.35, 32]} />
              <meshBasicMaterial
                color={ACCENT}
                transparent
                opacity={0}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        )
      })}

      {/* ---- the law ---- */}
      <Label position={[-1.5, 0, 6.9]} size={0.5}>
        T² = k·a³
      </Label>
      <Label position={[-1.5, 0, 7.65]} color={GREY} size={0.24} baseOpacity={0.85}>
        FARTHER = SLOWER YEAR
      </Label>
    </group>
  )
}
