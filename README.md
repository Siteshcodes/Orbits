# ORBITS | A Scroll Through Orbital Mechanics

> **3D Websites Hackathon Submission**  
> An interactive, 60 FPS 3D web experience demonstrating Johannes Kepler's Laws of Planetary Motion and Isaac Newton's Vis-Viva orbital physics.

---

## 🌌 Overview

**ORBITS** is a web-based 3D scrollytelling experience. As you scroll, the camera seamlessly moves through 5 interactive acts of celestial physics, visualizing the exact mathematical formulas that keep planets and spacecraft in motion:

- **Act 1 — Kepler's First Law (The Ellipse)**: Visualizes non-circular orbits, elliptical foci ($F_1, F_2$), semi-major axis $a$, perihelion, and aphelion.
- **Act 2 — Kepler's Second Law (Equal Areas)**: Demonstrates $\Delta A_1 = \Delta A_2$ in equal time intervals $\Delta t$ with live sweeping orbital sector geometry.
- **Act 3 — Kepler's Third Law (Harmonic Law)**: Simulates the period-distance relationship $T^2 \propto a^3$ through a synchronized dual-planet orbital race.
- **Act 4 — Escape Velocity & Vis-Viva Physics**: Live 60 FPS orbital telemetry gauge calculating instant velocity $v = \sqrt{GM\left(\frac{2}{r} - \frac{1}{a}\right)}$. Features live interactive trajectory presets (`SUB`, `ORBIT`, `ESCAPE`, `HYPER`).
- **Act 5 — The Grand Finale**: Infinite loop ending with procedural GLSL Sun shaders and smooth scroll replay navigation.

---

## ✨ Features & Highlights

- 🪐 **High-Definition Neon Header**: Features a glowing complete-ring Saturn logo, live physics status indicator, and an animated sci-fi shuttle with a plasma thruster stream.
- 📊 **Live 60 FPS Telemetry Gauge**: Interactive speed controller dynamically morphs spacecraft trajectories between sub-orbital loops, bound ellipses, parabolic escape, and hyperbolic trajectories in real-time.
- 🎵 **0MB Web Audio Engine**: Built entirely with native Web Audio API oscillators and low-pass filters — zero asset overhead!
- 🎨 **Ultra-Polished Aesthetics**: Dark blue space aesthetics, HDR bloom, multi-layer parallax starfields, glassmorphism UI overlay, and responsive typography.

---

## 🛠️ Technology Stack

- **Framework**: React 18
- **3D Graphics & Canvas**: Three.js & React Three Fiber (`@react-three/fiber`)
- **Camera & Scroll Mechanics**: `@react-three/drei` (`ScrollControls`, `useScroll`)
- **Audio Engine**: Procedural Web Audio API Synthesizer
- **Bundler & Build Tool**: Vite 8

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- `npm` or `yarn`

### Installation & Local Run

```bash
# Clone the repository
git clone https://github.com/Siteshcodes/Orbits.git

# Navigate into the directory
cd Orbits

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
```

---

## 📜 License

Created for the **3D Websites Hackathon**. Open source under the MIT License.
