import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScroll, Line } from '@react-three/drei'
import Planet from '../scene/Planet.jsx'
import Orbit from '../scene/Orbit.jsx'
import { Label, MarkerDot, ACCENT, GREY } from '../scene/annotations.jsx'

// Act 2 — Kepler's second law, as the classic two-area comparison. The orbit
// is divided into SLICES equal-TIME intervals; because the sweep rate
// dA/dt = L/2 is constant (see Planet.jsx), every interval sweeps the same
// area πab/SLICES. Only the two telling wedges are shown: A1, fat and short,
// straddling perihelion; A2, thin and long, straddling aphelion on the
// opposite side of the star. Equal areas, and the planet crosses each in
// exactly T/SLICES seconds.
const A = 4
const E = 0.45
const PERIOD = 14
const SLICES = 6
const P = A * (1 - E * E) // semi-latus rectum

// Scroll window: page 2 of 4 (act text centered at offset 0.5). Starts where
// Act 1 has fully faded so the shared planet is never on screen twice.
const FROM = 0.30
const DISTANCE = 0.22

// Focus-centered ellipse point at true anomaly ν (matches Planet's kepler
// mode). `scale` ≠ 1 pulls a point inward/outward radially, for labels.
function orbitPoint(nu, scale = 1) {
  const r = (P / (1 + E * Math.cos(nu))) * scale
  return [r * Math.cos(nu), 0, r * Math.sin(nu)]
}

// Sector boundaries at clock ticks t = (j ± ½)·T/SLICES — EQUAL TIME by
// construction, solved exactly. At time t the mean anomaly is M = 2π·t/T;
// Kepler's equation M = E − e·sin E (the closed-form integral of dν/dt =
// L/r²) gives the eccentric anomaly E by Newton's method, and the true
// anomaly follows from tan(ν/2) = √((1+e)/(1−e))·tan(E/2). Machine-precision
// exact, so A1 = A2 is exact, not approximate: each wedge's area is
// (L/2)·(T/SLICES) = πab/SLICES identically. The half-shift makes wedge 0
// straddle perihelion and wedge 3 straddle aphelion symmetrically.
function nuAtTime(t) {
  const M = (2 * Math.PI * t) / PERIOD
  let Ecc = M
  for (let i = 0; i < 10; i++) {
    Ecc -= (Ecc - E * Math.sin(Ecc) - M) / (1 - E * Math.cos(Ecc))
  }
  return 2 * Math.atan2(
    Math.sqrt(1 + E) * Math.sin(Ecc / 2),
    Math.sqrt(1 - E) * Math.cos(Ecc / 2),
  )
}

function sliceBounds() {
  const bounds = []
  let prev = -Math.PI
  for (let j = 0; j <= SLICES; j++) {
    let nu = nuAtTime((j - 0.5) * (PERIOD / SLICES))
    while (nu < prev - 1e-9) nu += 2 * Math.PI // keep monotonic past ν = π
    bounds.push(nu)
    prev = nu
  }
  return bounds
}

// Filled fan + outline (spoke → arc → spoke) for one wedge.
const ARC_STEPS = 24
function wedgeShapes(nuStart, nuEnd) {
  const fill = []
  const outline = [[0, 0, 0]]
  for (let k = 0; k <= ARC_STEPS; k++) {
    const nu0 = THREE.MathUtils.lerp(nuStart, nuEnd, k / ARC_STEPS)
    if (k < ARC_STEPS) {
      const nu1 = THREE.MathUtils.lerp(nuStart, nuEnd, (k + 1) / ARC_STEPS)
      fill.push(0, 0, 0, ...orbitPoint(nu0), ...orbitPoint(nu1))
    }
    outline.push(orbitPoint(nu0))
  }
  outline.push([0, 0, 0])
  return { fill, outline }
}

export default function Act2_EqualAreas() {
  const group = useRef()
  const scroll = useScroll()

  const { sectorGeometry, outlines, boundaryDots, boundaryLabels, a2LabelPos } =
    useMemo(() => {
      const bounds = sliceBounds()

      // Hero wedges only: sector 0 (perihelion) and sector 3 (aphelion).
      const w1 = wedgeShapes(bounds[0], bounds[1])
      const w2 = wedgeShapes(bounds[3], bounds[4])
      const sectorGeometry = new THREE.BufferGeometry()
      sectorGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([...w1.fill, ...w2.fill], 3),
      )

      // P1/P2 bound the perihelion sweep, P3/P4 the aphelion sweep — each
      // pair is the planet's position one equal-time interval apart. Dots on
      // the path, labels pushed radially outward well past the orbit line.
      const boundNus = [bounds[0], bounds[1], bounds[3], bounds[4]]
      const boundaryDots = boundNus.map((nu) => orbitPoint(nu))
      const boundaryLabels = boundNus.map((nu, i) => ({
        text: `P${i + 1}`,
        position: orbitPoint(nu, i < 2 ? 1.45 : 1.3),
      }))

      const a2LabelPos = orbitPoint((bounds[3] + bounds[4]) / 2, 0.55)

      return { sectorGeometry, outlines: [w1.outline, w2.outline], boundaryDots, boundaryLabels, a2LabelPos }
    }, [])

  useFrame(() => {
    const o = scroll.curve(FROM, DISTANCE)
    group.current.visible = o > 0.001
    group.current.scale.setScalar(THREE.MathUtils.lerp(0.75, 1, o))
    // Same fade pattern as Act 1: elements declare userData.baseOpacity,
    // troika Text fades via fillOpacity.
    group.current.traverse((obj) => {
      const base = obj.userData.baseOpacity
      if (base === undefined) return
      if (typeof obj.fillOpacity === 'number') obj.fillOpacity = base * o
      else if (obj.material) obj.material.opacity = base * o
    })
  })

  // Same +0.44 rad tilt as Act 1 (≈ 40° viewing angle — open, readable
  // loop). The extra π about Y mirrors the diagram: Act 2's text column is
  // on the RIGHT, the CameraRig anchors the sun LEFT, so aphelion must reach
  // rightward toward screen center. A pure rotation about the origin — the
  // focus stays exactly on the star and the physics is untouched. Inside
  // orbit coordinates, −z reads as "up" on screen and +x as screen-left.
  return (
    <group ref={group} rotation={[0.44, Math.PI, 0]} visible={false}>
      <Orbit a={A} e={E} lineWidth={2} userData={{ baseOpacity: 0.9 }} />
      <Planet kepler a={A} e={E} period={PERIOD} radius={0.28} color="#7d8fb3" />

      {/* ---- the two hero wedges: fill + outline ---- */}
      <mesh geometry={sectorGeometry} userData={{ baseOpacity: 0.3 }}>
        <meshBasicMaterial
          color={ACCENT}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {outlines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color={ACCENT}
          lineWidth={1.5}
          transparent
          opacity={0}
          depthWrite={false}
          userData={{ baseOpacity: 0.85 }}
        />
      ))}

      {/* ---- equal-time boundary points ---- */}
      {boundaryDots.map((position, i) => (
        <MarkerDot key={i} position={position} radius={0.055} />
      ))}
      {boundaryLabels.map(({ text, position }) => (
        <Label key={text} position={position} color={GREY} size={0.18} baseOpacity={0.8}>
          {text}
        </Label>
      ))}

      {/* ---- wedge labels ---- */}
      <Label position={orbitPoint(0, 0.5)} size={0.3}>
        A1
      </Label>
      <Label position={[orbitPoint(0, 0.5)[0], 0, -0.55]} color={GREY} size={0.18} baseOpacity={0.85}>
        FASTEST
      </Label>
      <Label position={a2LabelPos} size={0.3}>
        A2
      </Label>
      <Label position={[a2LabelPos[0], 0, -0.5]} color={GREY} size={0.18} baseOpacity={0.85}>
        SLOWEST
      </Label>

      {/* ---- equality callout, placed cleanly ABOVE the orbit top ---- */}
      <Label position={[-1.1, 0, -4.3]} size={0.34}>
        A1 = A2
      </Label>
      <Label position={[-1.1, 0, -4.95]} color={GREY} size={0.2} baseOpacity={0.85}>
        THE SAME TIME SWEEPS THE SAME AREA
      </Label>
      <Line
        segments
        points={[
          [-0.3, 0, -4.2], [0.85, 0, -1.55], // → A1 wedge interior
          [-1.9, 0, -4.2], [-3.05, 0, -0.7], // → A2 wedge edge
        ]}
        color={GREY}
        lineWidth={1}
        transparent
        opacity={0}
        depthWrite={false}
        userData={{ baseOpacity: 0.4 }}
      />
    </group>
  )
}
