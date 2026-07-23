import { useState, useEffect, useRef } from 'react'

/**
 * Cinematic loading screen — the very first thing the user sees.
 *
 * Three phases:
 *   1. Title sequence: the word "ORBITS" letter-staggers in while a minimal
 *      constellation pattern pulses in the background (pure CSS).
 *   2. Asset loading: a hairline progress bar fills as Three.js assets load.
 *      drei's `useProgress` drives the percentage, but we smooth it and hold
 *      the screen for a minimum 2s so the intro has weight even on fast
 *      connections.
 *   3. Reveal: the overlay fades to transparent, cross-dissolving into the
 *      star's initial glow.
 *
 * All visuals are CSS — no canvas, no WebGL, so it paints on the very first
 * frame even before React Three Fiber initialises.
 */

const MIN_DISPLAY_MS = 2200 // minimum time the loading screen is visible
const FADE_MS = 900         // dissolve duration

export default function LoadingScreen({ progress = 0, onFinished }) {
  const [phase, setPhase] = useState('loading') // 'loading' | 'fading' | 'done'
  const startTime = useRef(Date.now())

  useEffect(() => {
    if (progress >= 100 && phase === 'loading') {
      const elapsed = Date.now() - startTime.current
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed)
      const timer = setTimeout(() => setPhase('fading'), remaining)
      return () => clearTimeout(timer)
    }
  }, [progress, phase])

  useEffect(() => {
    if (phase === 'fading') {
      const timer = setTimeout(() => {
        setPhase('done')
        onFinished?.()
      }, FADE_MS)
      return () => clearTimeout(timer)
    }
  }, [phase, onFinished])

  if (phase === 'done') return null

  // Smooth progress: never jump backwards, ease the visual bar.
  const displayProgress = Math.min(100, Math.round(progress))

  return (
    <div
      className="loading-screen"
      style={{
        opacity: phase === 'fading' ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
      }}
    >
      {/* Constellation background — CSS-only dots with subtle drift */}
      <div className="loading-stars" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="loading-star-dot"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2.5 + Math.random() * 3}s`,
              width: `${1.5 + Math.random() * 2}px`,
              height: `${1.5 + Math.random() * 2}px`,
            }}
          />
        ))}
      </div>

      {/* Center content */}
      <div className="loading-content">
        <p className="loading-kicker">A scroll through orbital mechanics</p>
        <h1 className="loading-title">
          {'ORBITS'.split('').map((letter, i) => (
            <span
              key={i}
              className="loading-letter"
              style={{ animationDelay: `${0.15 + i * 0.08}s` }}
            >
              {letter}
            </span>
          ))}
        </h1>

        {/* Progress bar */}
        <div className="loading-bar-track">
          <div
            className="loading-bar-fill"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        <p className="loading-percent">{displayProgress}%</p>
      </div>
    </div>
  )
}
