import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { scrollState } from '../scrollState.js'

// Dolly path: start close on the star, pull up and out over the full scroll.
// The end point frames the region where the orbital acts will live.
const START = new THREE.Vector3(0, 1.2, 9)
const END = new THREE.Vector3(0, 14, 42)

// Where the sun should sit on screen for each section, as fractions of the
// half-viewport ([0, 0] = center, x = 1 → right edge, y = 1 → top edge).
// Text alternates left/right per act (see TextLayer), so the sun is framed
// into the opposite negative space and the two can never overlap.
// Hero: text holds the top of the frame, sun sits in the lower third.
const ANCHORS_WIDE = [
  { x: 0, y: -0.36 }, //     hero — sun low, title top
  { x: 0.5, y: -0.08 }, //   act 1 — text left, sun right
  { x: -0.5, y: -0.08 }, //  act 2 — text right, sun left
  { x: 0.5, y: -0.08 }, //   act 3 — text left, sun right
  { x: -0.5, y: -0.08 }, //  act 4 — text right, sun left
  { x: 0, y: -0.42 }, //      closing — sun low, copy top
]

// Portrait/narrow: there is no horizontal negative space, so the acts pin
// text to the bottom (see the media query in index.css) and the sun rides
// the upper half instead.
const ANCHORS_NARROW = [
  { x: 0, y: -0.36 },
  { x: 0.12, y: 0.45 },
  { x: -0.12, y: 0.45 },
  { x: 0.12, y: 0.45 },
  { x: -0.12, y: 0.45 },
  { x: 0, y: -0.42 },
]

// Parallax intensity (how far cursor/gyro shifts the viewpoint)
const CURSOR_PARALLAX = 0.3  // world units max shift
const GYRO_PARALLAX = 0.25

const target = new THREE.Vector3()
const look = new THREE.Vector3(0, 0, 0)
// Smoothed cursor/gyro offset
const inputOffset = { x: 0, y: 0 }

export default function CameraRig() {
  const scroll = useScroll()

  useFrame(({ camera, size }, delta) => {
    const offset = scroll.offset // already damped by ScrollControls
    scrollState.offset = offset
    scrollState.el = scroll.el // Keep reference to scroll element for replay button

    // Second stage of damping on top of ScrollControls' own: the camera
    // chases its targets with exponential falloff, so it keeps a little
    // inertia after the scroll settles — weighty, never snappy.
    target.lerpVectors(START, END, offset)
    camera.position.x = THREE.MathUtils.damp(camera.position.x, target.x, 2.2, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, target.y, 2.2, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, target.z, 2.2, delta)

    // Interpolate the screen anchor between the two neighboring sections,
    // eased so the sun glides to its new side as one act hands off to the
    // next.
    const anchors = size.width / size.height < 0.75 ? ANCHORS_NARROW : ANCHORS_WIDE
    const page = offset * (anchors.length - 1)
    const i = Math.min(Math.floor(page), anchors.length - 2)
    const f = THREE.MathUtils.smoothstep(page - i, 0, 1)
    const ax = THREE.MathUtils.lerp(anchors[i].x, anchors[i + 1].x, f)
    const ay = THREE.MathUtils.lerp(anchors[i].y, anchors[i + 1].y, f)

    // Convert the screen-space anchor into a lookAt offset: aiming the camera
    // at a point beside the star (at the star's depth) shifts where the star
    // lands in frame. half-extents of the view at that depth = d·tan(fov/2).
    const dist = camera.position.length()
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const halfW = halfH * camera.aspect
    const lx = -ax * dist * halfW
    const ly = -ay * dist * halfH

    // ---- Cursor / Gyro parallax ----
    // On desktop, the cursor shifts the lookAt target slightly.
    // On mobile, the gyroscope does the same.
    let inputX = 0, inputY = 0
    if (scrollState.gyro.active) {
      // Gyro: gamma = left-right tilt, beta = front-back tilt
      inputX = Math.max(-1, Math.min(1, scrollState.gyro.gamma / 0.5)) * GYRO_PARALLAX
      inputY = Math.max(-1, Math.min(1, (scrollState.gyro.beta - 0.5) / 0.5)) * GYRO_PARALLAX
    } else {
      inputX = scrollState.cursor.x * CURSOR_PARALLAX
      inputY = scrollState.cursor.y * CURSOR_PARALLAX * 0.6
    }

    // Smooth the input offset
    inputOffset.x = THREE.MathUtils.damp(inputOffset.x, inputX, 3, delta)
    inputOffset.y = THREE.MathUtils.damp(inputOffset.y, inputY, 3, delta)

    look.x = THREE.MathUtils.damp(look.x, lx + inputOffset.x, 2.2, delta)
    look.y = THREE.MathUtils.damp(look.y, ly + inputOffset.y, 2.2, delta)
    camera.lookAt(look)
  })

  return null
}

