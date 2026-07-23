import { useEffect, useRef } from 'react'
import { scrollState } from '../scrollState.js'
import { playClick } from '../lib/audio.js'

// One section per scroll page.
const SECTIONS = [
  {
    kicker: 'A scroll through orbital mechanics',
    title: 'ORBITS',
    body: 'Nothing up here floats. Everything is falling — and forever missing the ground.',
    align: 'center',
  },
  {
    kicker: "Act I · Kepler's first law",
    title: 'The ellipse',
    body: 'Planets do not circle the sun. They trace ellipses — and the sun is not at the middle. It waits off-center, at a focus.',
    align: 'left',
  },
  {
    kicker: "Act II · Kepler's second law",
    title: 'Equal areas',
    body: 'Near the sun a planet sprints. Far away, it drifts. But in equal time it always sweeps out equal area.',
    align: 'right',
  },
  {
    kicker: "Act III · Kepler's third law",
    title: 'Harmony',
    body: 'The farther the world, the slower its year — not by accident, but by a single quiet rule shared by every orbit.',
    align: 'left',
  },
  {
    kicker: 'Act IV · Escape',
    title: 'Letting go',
    body: 'Fall fast enough sideways and you never come down. A little faster still, and you never come back. Scroll to change the launch speed.',
    align: 'right',
  },
  {
    kicker: 'The end',
    title: '∞',
    body: 'Every orbit is a story of balance — between falling and flying.',
    subtitle: 'You just watched the math that keeps worlds alive.',
    credit: 'Built with React Three Fiber · Three.js · GSAP',
    align: 'center',
    isClosing: true,
  },
]

const FULL = 0.05
const FADE = 0.05

const GAUGE_MARKS = [
  { pos: 0, label: 'SUB' },
  { pos: 0.35, label: 'ORBIT' },
  { pos: 0.65, label: 'ESCAPE' },
  { pos: 1, label: 'HYPER' },
]

export default function TextLayer() {
  const refs = useRef([])
  const gaugeRef = useRef(null)
  // DOM element caches to eliminate querySelector inside 60fps rAF loop
  const domCache = useRef([])
  const gaugeCache = useRef(null)

  useEffect(() => {
    // Cache DOM sub-elements once after mount
    domCache.current = SECTIONS.map((_, i) => {
      const el = refs.current[i]
      if (!el) return null
      return {
        el,
        kicker: el.querySelector('.kicker'),
        title: el.querySelector('.act-title, .hero-title'),
        body: el.querySelector('.body'),
        subtitle: el.querySelector('.closing-subtitle'),
        credit: el.querySelector('.closing-credit'),
        line: el.querySelector('.closing-line'),
      }
    })

    const g = gaugeRef.current
    if (g) {
      gaugeCache.current = {
        gauge: g,
        fill: g.querySelector('.vgauge-fill'),
        needle: g.querySelector('.vgauge-needle'),
        speed: g.querySelector('.vgauge-speed'),
        typeLabel: g.querySelector('.vgauge-type'),
      }
    }

    let raf
    let prevOffset = -1

    const tick = () => {
      const offset = scrollState.offset

      // Skip tick if offset hasn't changed noticeably and gauge is inactive
      if (Math.abs(offset - prevOffset) < 0.0001 && !scrollState.act4.active) {
        raf = requestAnimationFrame(tick)
        return
      }
      prevOffset = offset

      SECTIONS.forEach((_, i) => {
        const cached = domCache.current[i]
        if (!cached || !cached.el) return

        const center = i / (SECTIONS.length - 1)
        const d = Math.abs(offset - center)
        const opacity = Math.max(0, Math.min(1, (FULL + FADE - d) / FADE))

        cached.el.style.opacity = opacity
        cached.el.style.visibility = opacity === 0 ? 'hidden' : 'visible'
        cached.el.style.transform = `translateY(${(center - offset) * 60}px)`

        if (cached.kicker) {
          const ko = Math.max(0, Math.min(1, opacity / 0.5))
          cached.kicker.style.opacity = ko
          cached.kicker.style.transform = `translateY(${(1 - ko) * 10}px)`
        }
        if (cached.title) {
          const to = Math.max(0, Math.min(1, (opacity - 0.08) / 0.5))
          cached.title.style.opacity = to
          cached.title.style.transform = `translateY(${(1 - to) * 15}px)`
          cached.title.style.letterSpacing = `${0.05 + (1 - to) * 0.08}em`
        }
        if (cached.body) {
          const bo = Math.max(0, Math.min(1, (opacity - 0.15) / 0.5))
          cached.body.style.opacity = bo * 0.72
          cached.body.style.transform = `translateY(${(1 - bo) * 20}px)`
        }
        if (cached.subtitle) {
          const so = Math.max(0, Math.min(1, (opacity - 0.25) / 0.5))
          cached.subtitle.style.opacity = so * 0.55
          cached.subtitle.style.transform = `translateY(${(1 - so) * 12}px)`
        }
        if (cached.credit) {
          const co = Math.max(0, Math.min(1, (opacity - 0.35) / 0.5))
          cached.credit.style.opacity = co * 0.35
          cached.credit.style.transform = `translateY(${(1 - co) * 8}px)`
        }
        if (cached.line) {
          const lo = Math.max(0, Math.min(1, (opacity - 0.2) / 0.4))
          cached.line.style.opacity = lo * 0.2
          cached.line.style.transform = `scaleX(${lo})`
        }
      })

      // Scroll hint
      const hint = refs.current.hint
      if (hint) hint.style.opacity = Math.max(0, 1 - offset * 12)

      // ---- Velocity gauge for Act 4 ----
      const gc = gaugeCache.current
      if (gc && gc.gauge) {
        const a4 = scrollState.act4
        if (a4.active) {
          gc.gauge.style.opacity = '1'
          gc.gauge.style.visibility = 'visible'

          if (gc.fill) {
            gc.fill.style.height = `${a4.subPos * 100}%`
            gc.fill.style.background = `linear-gradient(to top, ${a4.color}44, ${a4.color})`
            gc.fill.style.boxShadow = `0 0 12px ${a4.color}66`
          }
          if (gc.needle) {
            gc.needle.style.bottom = `${a4.subPos * 100}%`
            gc.needle.style.borderColor = a4.color
          }
          if (gc.speed) {
            gc.speed.textContent = `v = ${a4.vLaunch.toFixed(3)}`
            gc.speed.style.color = a4.color
            gc.speed.style.bottom = `${a4.subPos * 100}%`
          }
          if (gc.typeLabel) {
            const labels = {
              suborbital: 'FALLS BACK',
              elliptical: 'BOUND ORBIT',
              escape: 'ESCAPE VELOCITY',
              hyperbolic: 'HYPERBOLIC EXIT',
            }
            gc.typeLabel.textContent = labels[a4.type] || ''
            gc.typeLabel.style.color = a4.color
            gc.typeLabel.style.textShadow = `0 0 20px ${a4.color}88`
          }
        } else {
          gc.gauge.style.opacity = '0'
          gc.gauge.style.visibility = 'hidden'
        }
      }

      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="text-layer">
      {SECTIONS.map((section, i) => (
        <section
          key={section.title}
          ref={(el) => (refs.current[i] = el)}
          className={`text-section align-${section.align}${i === 0 ? ' hero' : ''}${section.isClosing ? ' closing' : ''}`}
        >
          {section.kicker && <p className="kicker">{section.kicker}</p>}
          <h2 className={i === 0 ? 'hero-title' : 'act-title'}>{section.title}</h2>
          <p className="body">{section.body}</p>
          {section.subtitle && (
            <>
              <div className="closing-line" aria-hidden="true" />
              <p className="closing-subtitle">{section.subtitle}</p>
            </>
          )}
          {section.credit && (
            <p className="closing-credit">{section.credit}</p>
          )}
          {section.isClosing && (
            <button
              className="replay-btn"
              onClick={() => {
                if (scrollState.el) {
                  scrollState.el.scrollTo({ top: 0, behavior: 'smooth' })
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }}
            >
              ↑ replay
            </button>
          )}
        </section>
      ))}

      {/* ---- Velocity Gauge (Act 4) ---- */}
      <div className="vgauge" ref={gaugeRef}>
        <div className="vgauge-track">
          <div className="vgauge-fill" />
          {GAUGE_MARKS.map((m) => (
            <div
              key={m.label}
              className="vgauge-mark clickable"
              style={{ bottom: `${m.pos * 100}%` }}
              onClick={() => {
                playClick(720 + m.pos * 400, 0.05)
                // Calculate target scroll offset for Act 4 range (starts at 0.72, spans 0.16)
                const targetSub = 0.72 + m.pos * 0.16
                if (scrollState.el) {
                  const targetTop = targetSub * scrollState.el.scrollHeight
                  scrollState.el.scrollTo({ top: targetTop, behavior: 'smooth' })
                }
              }}
              title={`Jump to ${m.label} speed state`}
            >
              <span className="vgauge-mark-line" />
              <span className="vgauge-mark-label">{m.label}</span>
            </div>
          ))}
          <div className="vgauge-needle" />
        </div>
        <span className="vgauge-speed" />
        <span className="vgauge-type" />
      </div>

      {/* ---- Scroll Hint ---- */}
      <div className="scroll-hint" ref={(el) => (refs.current.hint = el)}>
        <span className="scroll-hint-icon" aria-hidden="true" />
        <span className="scroll-hint-chevron" aria-hidden="true" />
        <span>scroll</span>
      </div>
    </div>
  )
}
