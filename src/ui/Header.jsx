import { useState } from 'react'
import { toggleAudio, playClick } from '../lib/audio.js'

export default function Header() {
  const [audioActive, setAudioActive] = useState(false)

  const handleSoundToggle = () => {
    const active = toggleAudio()
    setAudioActive(active)
  }

  return (
    <header className="site-header">
      {/* Brand logo & live physics indicator */}
      <div className="header-brand">
        {/* High-definition glowing complete-ring Saturn logo */}
        <svg className="saturn-logo-hd" viewBox="0 0 48 48" fill="none">
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Complete Outer & Inner Saturn Rings */}
          <g transform="rotate(-23 24 24)" filter="url(#neon-glow)">
            <ellipse cx="24" cy="24" rx="21" ry="6.5" stroke="#60a5fa" strokeWidth="1.4" opacity="0.9" />
            <ellipse cx="24" cy="24" rx="17" ry="5.2" stroke="#93c5fd" strokeWidth="1.8" opacity="0.95" />
          </g>

          {/* Planet Sphere */}
          <circle cx="24" cy="24" r="9.5" fill="url(#planet-body-grad)" stroke="#8ab4ff" strokeWidth="1.2" filter="url(#neon-glow)" />
          <circle cx="22.5" cy="22.5" r="9" fill="none" stroke="#e0f2fe" strokeWidth="0.6" opacity="0.8" />

          {/* Front Arc Ring Highlights */}
          <g transform="rotate(-23 24 24)" filter="url(#neon-glow)">
            <path d="M 4 24 A 21 6.5 0 0 0 44 24" stroke="#c084fc" strokeWidth="1.6" opacity="0.8" />
          </g>

          <defs>
            <radialGradient id="planet-body-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(21 21) scale(12)">
              <stop stopColor="#1e3a8a" />
              <stop offset="0.65" stopColor="#0f172a" />
              <stop offset="1" stopColor="#030712" />
            </radialGradient>
          </defs>
        </svg>

        <span className="brand-logo">ORBITS</span>
        <span className="brand-divider" aria-hidden="true" />
        <span className="brand-status">
          <span className="status-dot" />
          LIVE PHYSICS
        </span>
      </div>

      {/* Flight path channel — single unified SVG containing spaceship AND thruster gas trail */}
      <div className="header-flight-path" aria-hidden="true">
        <div className="spaceship-wrapper">
          <svg className="ship-and-trail-svg" viewBox="0 0 360 32" fill="none">
            {/* Plasma Gas Trail — locks 100% directly into engine thruster */}
            <line
              x1="0"
              y1="16"
              x2="300"
              y2="16"
              stroke="url(#gas-trail-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px #38bdf8)"
            />

            {/* High-definition Sci-Fi Shuttle (Engine positioned at x=300, y=16) */}
            <g transform="translate(296, 2)">
              {/* Engine Exhaust Flame */}
              <ellipse cx="4" cy="14" rx="5" ry="3.5" fill="#38bdf8" filter="blur(1px)" />
              <ellipse cx="2" cy="14" rx="2.5" ry="1.8" fill="#ffffff" />

              {/* Wings & Fins */}
              <path d="M 12 8 L 2 1 L 20 7 Z" fill="#2563eb" stroke="#60a5fa" strokeWidth="0.5" />
              <path d="M 12 20 L 2 27 L 20 21 Z" fill="#2563eb" stroke="#60a5fa" strokeWidth="0.5" />
              <path d="M 6 14 L 0 6 L 14 12 Z" fill="#1d4ed8" />

              {/* Fuselage Hull */}
              <path d="M 4 9 L 30 6 L 54 14 L 30 22 L 4 19 Z" fill="url(#shuttle-hull-grad)" stroke="#93c5fd" strokeWidth="0.8" />

              {/* Cockpit Glass Canopy */}
              <path d="M 28 10 C 36 10, 44 12, 47 14 C 44 16, 36 18, 28 18 Z" fill="#38bdf8" opacity="0.9" />
              <path d="M 32 11 C 38 11, 42 12.5, 44 14 C 42 14.5, 38 15.5, 32 15.5 Z" fill="#ffffff" opacity="0.7" />
            </g>

            <defs>
              <linearGradient id="gas-trail-grad" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="transparent" />
                <stop offset="0.3" stopColor="rgba(56, 189, 248, 0.25)" />
                <stop offset="0.85" stopColor="#38bdf8" />
                <stop offset="1" stopColor="#ffffff" />
              </linearGradient>

              <linearGradient id="shuttle-hull-grad" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0f172a" />
                <stop offset="0.4" stopColor="#334155" />
                <stop offset="0.85" stopColor="#cbd5e1" />
                <stop offset="1" stopColor="#ffffff" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Audio Toggle Action */}
      <div className="header-actions">
        <button
          className={`sound-btn ${audioActive ? 'active' : ''}`}
          onClick={handleSoundToggle}
          title="Toggle ambient audio drone"
        >
          <span className="sound-icon">{audioActive ? '🔊' : '🔇'}</span>
          <span className="sound-text">SOUND: {audioActive ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </header>
  )
}
