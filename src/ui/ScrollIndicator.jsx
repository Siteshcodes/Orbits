import { useEffect, useRef } from 'react'
import { scrollState } from '../scrollState.js'

/**
 * Minimal scroll progress indicator — a thin vertical line on the right edge
 * with dots for each act. Dots are clickable for navigation; the line fills
 * proportionally to the scroll offset. Fades out when idle.
 */

const ACTS = [
  { label: 'Hero', offset: 0 },
  { label: 'Ellipse', offset: 0.2 },
  { label: 'Areas', offset: 0.4 },
  { label: 'Harmony', offset: 0.6 },
  { label: 'Escape', offset: 0.8 },
  { label: 'End', offset: 1.0 },
]

export default function ScrollIndicator() {
  const containerRef = useRef()
  const fillRef = useRef()
  const dotRefs = useRef([])
  const idleTimer = useRef(null)
  const lastOffset = useRef(0)

  useEffect(() => {
    let raf
    const tick = () => {
      const offset = scrollState.offset

      // Update fill height
      if (fillRef.current) {
        fillRef.current.style.height = `${offset * 100}%`
      }

      // Update active dot
      ACTS.forEach((act, i) => {
        const dot = dotRefs.current[i]
        if (!dot) return
        const nextOffset = ACTS[i + 1]?.offset ?? 1.1
        const isActive = offset >= act.offset - 0.05 && offset < nextOffset - 0.05
        dot.classList.toggle('active', isActive)
      })

      // Show/hide based on scroll activity
      if (Math.abs(offset - lastOffset.current) > 0.001) {
        containerRef.current?.classList.add('visible')
        clearTimeout(idleTimer.current)
        idleTimer.current = setTimeout(() => {
          // Keep visible if not at start
          if (scrollState.offset > 0.02) {
            containerRef.current?.classList.add('visible')
          } else {
            containerRef.current?.classList.remove('visible')
          }
        }, 3000)
      }
      lastOffset.current = offset

      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(idleTimer.current)
    }
  }, [])

  // ---- Keyboard navigation ----
  useEffect(() => {
    const getScrollEl = () =>
      document.querySelector('[data-overlayscroll]') ||
      document.querySelector('.scroll-controls') ||
      // drei ScrollControls creates a div with overflow-y: auto as the first
      // child inside the canvas container
      document.querySelector('div[style*="overflow"]')

    const handleKey = (e) => {
      const el = getScrollEl()
      if (!el) return

      const pageH = el.scrollHeight / 6 // one "page" of scroll
      let delta = 0

      switch (e.key) {
        case 'ArrowDown':
          delta = pageH * 0.15
          break
        case 'ArrowUp':
          delta = -pageH * 0.15
          break
        case 'PageDown':
          delta = pageH
          break
        case 'PageUp':
          delta = -pageH
          break
        case ' ':
          delta = e.shiftKey ? -pageH : pageH
          break
        case 'Home':
          el.scrollTo({ top: 0, behavior: 'smooth' })
          e.preventDefault()
          return
        case 'End':
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
          e.preventDefault()
          return
        default:
          return
      }

      e.preventDefault()
      el.scrollBy({ top: delta, behavior: 'smooth' })
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="scroll-indicator" ref={containerRef}>
      <div className="scroll-indicator-track">
        <div className="scroll-indicator-fill" ref={fillRef} />
        <div className="scroll-indicator-dots">
          {ACTS.map((act, i) => (
            <div
              key={act.label}
              className="scroll-indicator-dot"
              ref={(el) => (dotRefs.current[i] = el)}
              title={act.label}
            >
              <span className="dot-label">{act.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
