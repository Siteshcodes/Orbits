import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScroll, Line } from '@react-three/drei'
import Planet from '../scene/Planet.jsx'
import Orbit from '../scene/Orbit.jsx'
import { Label, MarkerDot, MarkerRing, ACCENT, GREY } from '../scene/annotations.jsx'

// Act 1 — Kepler's first law. One planet, one ellipse, the star visibly
// off-center at a focus, with an infographic layer naming every part of the
// geometry. e = 0.45 keeps the focus offset unmistakable.
const A = 4
const E = 0.45
const B = A * Math.sqrt(1 - E * E) // 3.571 — semi-minor axis
const C = A * E // 1.8 — focal distance

// Key points in the orbital plane (y = 0). The star/focus F1 is the origin;
// +x runs toward perihelion (screen right — Act 1's text is on the LEFT, and
// the CameraRig anchors the sun right of center, so the whole diagram lives
// in the center/right of the frame). After the group tilt below, +z in the
// plane reads as "down" on screen, −z as "up".
const PERIHELION = [A - C, 0, 0] // (2.2, 0, 0)
const APHELION = [-A - C, 0, 0] // (−5.8, 0, 0)
const CENTRE = [-C, 0, 0]
const F2 = [-2 * C, 0, 0]

// Scroll window: page 1 of 4. Ends exactly where Act 2 begins (0.38) so the
// shared planet is never on screen twice.
const FROM = 0.07
const DISTANCE = 0.22

// Leader lines connecting markers to their offset labels, as one batched
// segments draw call: [from, to] per pair.
const LEADERS = [
  [0, 0, 0.7], [0, 0, 1.05], //           F1 (from just outside the sun)
  [-2 * C, 0, 0.2], [-2 * C, 0, 0.75], // F2
  [-C + 0.1, 0, -0.12], [-1.35, 0, -0.72], // centre
  [A - C, 0, -0.14], [A - C + 0.4, 0, -0.8], // perihelion
  [-A - C, 0, -0.14], [-A - C, 0, -0.8], // aphelion
]

export default function Act1_Ellipse() {
  const group = useRef()
  const planet = useRef()
  const rLine = useRef()
  const rLabel = useRef()
  const scroll = useScroll()

  useFrame(() => {
    const o = scroll.curve(FROM, DISTANCE)
    group.current.visible = o > 0.001
    group.current.scale.setScalar(THREE.MathUtils.lerp(0.75, 1, o))

    // Fade every annotation: elements declare their full-on opacity in
    // userData.baseOpacity; troika Text fades via fillOpacity.
    group.current.traverse((obj) => {
      const base = obj.userData.baseOpacity
      if (base === undefined) return
      if (typeof obj.fillOpacity === 'number') obj.fillOpacity = base * o
      else if (obj.material) obj.material.opacity = base * o
    })

    // Live radius vector: star → planet, relabeled every frame. Visibly
    // shortest at perihelion, longest at aphelion.
    if (planet.current && group.current.visible) {
      const pos = planet.current.position
      rLine.current.geometry.setPositions([0, 0, 0, pos.x, pos.y, pos.z])
      rLabel.current.position.set(pos.x / 2, 0, pos.z / 2 + 0.45)
    }
  })

  // Tilt: the camera sits at ~14° elevation here, so the plane is pitched
  // +0.44 rad toward it — combined viewing angle ≈ 38–40°, an open, readable
  // ellipse instead of an edge-on hairline. A rotation about the origin
  // keeps the focus exactly on the star.
  return (
    <group ref={group} rotation={[0.44, 0, 0]} visible={false}>
      <Orbit a={A} e={E} lineWidth={2} userData={{ baseOpacity: 0.9 }} />
      <Planet ref={planet} a={A} e={E} period={14} radius={0.28} color="#7d8fb3" />

      {/* ---- axes (secondary, grey, dashed) ---- */}
      <Line
        points={[PERIHELION, APHELION]}
        color={GREY}
        lineWidth={1}
        dashed
        dashSize={0.16}
        gapSize={0.12}
        transparent
        opacity={0}
        depthWrite={false}
        userData={{ baseOpacity: 0.3 }}
      />
      <Line
        points={[
          [-C, 0, -B],
          [-C, 0, B],
        ]}
        color={GREY}
        lineWidth={1}
        dashed
        dashSize={0.16}
        gapSize={0.12}
        transparent
        opacity={0}
        depthWrite={false}
        userData={{ baseOpacity: 0.25 }}
      />
      <Label position={[-4.7, 0, 0.45]} color={GREY} size={0.19} baseOpacity={0.7}>
        MAJOR AXIS
      </Label>
      <Label position={[-C + 0.8, 0, 4.1]} color={GREY} size={0.19} baseOpacity={0.7}>
        MINOR AXIS
      </Label>

      {/* ---- the point of the law: focus vs centre ---- */}
      <MarkerRing position={[0, 0, 0]} radius={0.62} thickness={0.025} baseOpacity={0.8} />
      <Label position={[0, 0, 1.35]}>F1 · SUN</Label>
      <MarkerRing position={F2} radius={0.12} />
      <Label position={[-2 * C, 0, 1.05]}>F2 · EMPTY FOCUS</Label>
      <MarkerDot position={CENTRE} radius={0.06} color="#c8cfdd" baseOpacity={0.85} />
      <Label position={[-1.35, 0, -0.95]} color={GREY} size={0.19} baseOpacity={0.8}>
        CENTRE
      </Label>

      {/* ---- apsides ---- */}
      <MarkerDot position={PERIHELION} />
      <Label position={[A - C + 0.6, 0, -1.45]}>PERIHELION · FASTEST</Label>
      <MarkerDot position={APHELION} />
      <Label position={[-A - C, 0, -1.45]}>APHELION · SLOWEST</Label>

      {/* ---- leader lines, one batched draw call ---- */}
      <Line
        segments
        points={LEADERS}
        color={GREY}
        lineWidth={1}
        transparent
        opacity={0}
        depthWrite={false}
        userData={{ baseOpacity: 0.35 }}
      />

      {/* ---- live r vector ---- */}
      <Line
        ref={rLine}
        points={[
          [0, 0, 0],
          [A - C, 0, 0],
        ]}
        color={ACCENT}
        lineWidth={1.5}
        transparent
        opacity={0}
        depthWrite={false}
        userData={{ baseOpacity: 0.8 }}
      />
      <group ref={rLabel}>
        <Label position={[0, 0, 0]} size={0.3}>
          r
        </Label>
      </group>
    </group>
  )
}
