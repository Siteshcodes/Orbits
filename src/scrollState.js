// Bridge between the R3F world and the DOM overlay. CameraRig (inside the
// Canvas, where drei's useScroll lives) writes the damped scroll offset here
// each frame; TextLayer (plain fixed HTML outside the Canvas) reads it in its
// own rAF loop. A mutable module singleton — no React state, so neither side
// re-renders at 60hz.
export const scrollState = {
  offset: 0,
  // Cursor position (normalized -1 to 1 from center)
  cursor: { x: 0, y: 0 },
  // Gyro tilt (radians, mobile only)
  gyro: { beta: 0, gamma: 0, active: false },
  // Act 4 live data — written by Act4_Escape, read by TextLayer gauge
  act4: {
    active: false,
    subPos: 0,
    vLaunch: 0,
    vCirc: 0,
    vEsc: 0,
    type: 'suborbital',
    color: '#ff6b6b',
  },
}

// ---- Cursor tracking (runs once at import) ----
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    scrollState.cursor.x = (e.clientX / window.innerWidth) * 2 - 1
    scrollState.cursor.y = (e.clientY / window.innerHeight) * 2 - 1
    // Drive the CSS cursor glow + custom dot via custom properties
    const root = document.getElementById('root')
    if (root) {
      root.style.setProperty('--cx', `${e.clientX}px`)
      root.style.setProperty('--cy', `${e.clientY}px`)
    }
  })

  // ---- Gyroscope tracking (mobile) ----
  const handleOrientation = (e) => {
    scrollState.gyro.active = true
    // beta: front-back tilt (-180 to 180), gamma: left-right (-90 to 90)
    scrollState.gyro.beta = ((e.beta || 0) / 180) * Math.PI
    scrollState.gyro.gamma = ((e.gamma || 0) / 90) * Math.PI
  }

  // Try to add gyro listener (needs permission on iOS 13+)
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+ — permission will be requested on first user gesture
    document.addEventListener('click', () => {
      DeviceOrientationEvent.requestPermission()
        .then((state) => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation)
          }
        })
        .catch(() => {})
    }, { once: true })
  } else {
    window.addEventListener('deviceorientation', handleOrientation)
  }
}


