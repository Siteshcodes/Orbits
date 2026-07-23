import { useMemo, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScroll, Line } from '@react-three/drei'
import Orbit from '../scene/Orbit.jsx'
import { Label, MarkerDot, ACCENT, GREY } from '../scene/annotations.jsx'
import { scrollState } from '../scrollState.js'

/**
 * Act 4 — Escape velocity.
 *
 * A small probe launches from perihelion. As the user scrolls deeper into
 * this act's range, the probe's launch speed increases from sub-orbital
 * through orbital, to escape, to hyperbolic. The trajectory morphs in
 * real time.
 *
 * Physics: the vis-viva equation
 *
 *     v² = GM · (2/r − 1/a)
 *
 * relates speed v at distance r to the semi-major axis a of the orbit:
 *   - a > 0 → ellipse (bound)
 *   - a → ∞ → parabola (escape, v = v_esc = √(2GM/r))
 *   - a < 0 → hyperbola (unbound, v > v_esc)
 *
 * We pick GM = 1 (natural units) and a launch radius r₀ = 3 (world units
 * from the star). The circular speed at r₀ is √(GM/r₀) ≈ 0.577, and the
 * escape speed is √(2GM/r₀) ≈ 0.816. The scroll position within Act 4
 * maps linearly from 0.45× circular to 1.35× escape, sweeping through
 * all three trajectory types.
 */

const GM = 1
const R0 = 3          // launch distance from star
const V_CIRC = Math.sqrt(GM / R0)         // circular speed at R0
const V_ESC = Math.sqrt(2 * GM / R0)      // escape speed at R0

const V_MIN = V_CIRC * 0.45   // lowest scroll → plummets back quickly
const V_MAX = V_ESC * 1.35    // highest scroll → fast hyperbolic escape

const TRAIL_STEPS = 300        // trajectory preview points
const DT = 0.06                // integration timestep for trajectory
const PROBE_RADIUS = 0.12

// Scroll window: centered at offset 0.8 (Act 4). Starts at 0.72, ends at 0.88.
const FROM = 0.72
const DISTANCE = 0.16

/**
 * Numerically integrate a 2D orbit (in the orbital plane, y = 0) from a
 * given position and velocity under gravity GM at the origin. Returns an
 * array of [x, 0, z] positions. Stops early if the probe escapes far
 * enough or re-approaches perihelion.
 */
function computeTrajectory(vLaunch) {
  const points = []
  let x = R0, z = 0   // start at (R0, 0) — perihelion direction
  let vx = 0, vz = vLaunch // launch tangentially (perpendicular to radius)

  for (let i = 0; i < TRAIL_STEPS; i++) {
    points.push([x, 0, z])
    const r = Math.sqrt(x * x + z * z)
    if (r < 0.3) break   // crashed into star
    if (r > 25) break    // escaped far enough

    // Gravitational acceleration: a = -GM/r³ · r⃗
    const a = -GM / (r * r * r)
    vx += a * x * DT
    vz += a * z * DT
    x += vx * DT
    z += vz * DT
  }
  return points
}

/**
 * Classify the trajectory: 'suborbital' | 'elliptical' | 'escape' | 'hyperbolic'
 */
function classifyTrajectory(vLaunch) {
  const energy = 0.5 * vLaunch * vLaunch - GM / R0  // specific orbital energy
  if (vLaunch < V_CIRC * 0.7) return 'suborbital'
  if (energy < -0.001) return 'elliptical'
  if (energy < 0.001) return 'escape'
  return 'hyperbolic'
}

/** Map a trajectory class to a display color */
function trajectoryColor(type) {
  switch (type) {
    case 'suborbital': return '#ff6b6b'     // warm red — falls back
    case 'elliptical': return '#ffd166'      // amber — bound orbit
    case 'escape':     return '#06d6a0'      // green — just escapes
    case 'hyperbolic': return '#8ab4ff'      // accent blue — free
    default:           return ACCENT
  }
}

/** Human label for each trajectory type */
function trajectoryLabel(type) {
  switch (type) {
    case 'suborbital': return 'FALLS BACK'
    case 'elliptical': return 'BOUND ORBIT'
    case 'escape':     return 'ESCAPE VELOCITY'
    case 'hyperbolic': return 'HYPERBOLIC EXIT'
    default:           return ''
  }
}

export default function Act4_Escape() {
  const group = useRef()
  const probeRef = useRef()
  const trailRef = useRef()
  const labelGroupRef = useRef()
  const scroll = useScroll()

  // Current velocity driven by scroll sub-position within Act 4
  const state = useRef({
    vLaunch: V_MIN,
    trajectory: [],
    type: 'suborbital',
    probeT: 0,
  })

  // Pre-allocated flat position array to avoid GC allocations in useFrame
  const flatPositionsRef = useRef(new Float32Array(TRAIL_STEPS * 3))
  const lastVLaunchRef = useRef(-1)

  // Animated probe position along the computed trajectory
  useFrame((_, delta) => {
    const actScroll = scroll.curve(FROM, DISTANCE)
    group.current.visible = actScroll > 0.001
    group.current.scale.setScalar(THREE.MathUtils.lerp(1.1, 1.45, actScroll))

    if (actScroll < 0.05) {
      scrollState.act4.active = false
      return
    }

    // Map scroll sub-position to launch velocity. We use the range within
    // the act's own curve: 0 = act start, 1 = act end.
    const subPos = scroll.range(FROM, DISTANCE)
    const vLaunch = THREE.MathUtils.lerp(V_MIN, V_MAX, subPos)

    // Recompute trajectory only when velocity actually changes
    if (Math.abs(vLaunch - lastVLaunchRef.current) > 0.0001) {
      lastVLaunchRef.current = vLaunch
      state.current.vLaunch = vLaunch
      state.current.trajectory = computeTrajectory(vLaunch)
      state.current.type = classifyTrajectory(vLaunch)

      // Update trail line geometry using pre-allocated typed array (0 GC allocations)
      const trajectory = state.current.trajectory
      if (trailRef.current && trajectory.length > 1) {
        const flat = flatPositionsRef.current
        const len = Math.min(trajectory.length, TRAIL_STEPS)
        for (let i = 0; i < len; i++) {
          flat[i * 3] = trajectory[i][0]
          flat[i * 3 + 1] = trajectory[i][1]
          flat[i * 3 + 2] = trajectory[i][2]
        }
        trailRef.current.geometry.setPositions(flat.subarray(0, len * 3))
        const color = new THREE.Color(trajectoryColor(state.current.type))
        trailRef.current.material.color = color
        trailRef.current.material.opacity = 0.7 * actScroll
      }
    }

    // Push live data to DOM bridge for the velocity gauge (only active when Act 4 is prominent)
    scrollState.act4.active = actScroll > 0.15
    scrollState.act4.subPos = subPos
    scrollState.act4.vLaunch = vLaunch
    scrollState.act4.vCirc = V_CIRC
    scrollState.act4.vEsc = V_ESC
    scrollState.act4.type = state.current.type
    scrollState.act4.color = trajectoryColor(state.current.type)

    const trajectory = state.current.trajectory

    // Animate probe along trajectory
    state.current.probeT += delta * 1.8
    if (state.current.probeT > trajectory.length - 1) {
      state.current.probeT = 0  // loop
    }
    const idx = Math.floor(state.current.probeT)
    const frac = state.current.probeT - idx
    if (trajectory[idx] && trajectory[idx + 1] && probeRef.current) {
      const px = THREE.MathUtils.lerp(trajectory[idx][0], trajectory[idx + 1][0], frac)
      const pz = THREE.MathUtils.lerp(trajectory[idx][2], trajectory[idx + 1][2], frac)
      probeRef.current.position.set(px, 0, pz)
    }
  })

  // Initial trajectory for the line's starting shape
  const initialTrajectory = useMemo(() => computeTrajectory(V_MIN), [])

  return (
    <group ref={group} rotation={[0.44, Math.PI, 0]} visible={false}>
      {/* Reference circular orbit at R0 (what the probe would follow at
          exactly circular speed) — gives context for the launch point. */}
      <Orbit a={R0} e={0} lineWidth={1} opacity={0.15} userData={{ baseOpacity: 0.2 }} />

      {/* Launch point marker */}
      <MarkerDot position={[R0, 0, 0]} radius={0.07} color="#ffd166" />
      <Label position={[R0 + 0.5, 0, -0.6]} color={GREY} size={0.18} baseOpacity={0.8}>
        LAUNCH POINT
      </Label>

      {/* Trajectory trail — recomputed each frame by scroll position */}
      <Line
        ref={trailRef}
        points={initialTrajectory}
        color={trajectoryColor('suborbital')}
        lineWidth={2.5}
        transparent
        opacity={0}
        depthWrite={false}
        userData={{ baseOpacity: 0.7 }}
      />

      {/* The probe */}
      <mesh ref={probeRef}>
        <sphereGeometry args={[PROBE_RADIUS, 16, 16]} />
        <meshStandardMaterial
          color="#e0e8ff"
          emissive="#8ab4ff"
          emissiveIntensity={0.5}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* ---- velocity gauge ---- */}
      <group ref={labelGroupRef}>
        <Label position={[-3, 0, -4.5]} size={0.36}>
          {/* Updated dynamically would require troika text updates — instead
              we show the concept label which the CSS TextLayer handles */}
          v → ?
        </Label>
      </group>

      {/* ---- speed ladder markers ---- */}
      <Label position={[0, 0, 5.5]} size={0.22} baseOpacity={0.6} color={GREY}>
        v_circ
      </Label>
      <Label position={[0, 0, 6.2]} size={0.22} baseOpacity={0.6} color="#06d6a0">
        v_escape = √2 · v_circ
      </Label>

      {/* ---- the law ---- */}
      <Label position={[-1.5, 0, 7.8]} size={0.42}>
        v² = GM(2/r − 1/a)
      </Label>
      <Label position={[-1.5, 0, 8.5]} color={GREY} size={0.22} baseOpacity={0.85}>
        SCROLL TO CHANGE LAUNCH SPEED
      </Label>
    </group>
  )
}
