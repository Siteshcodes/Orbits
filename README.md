# 🌌 ORBITS | A Scroll Through Orbital Mechanics

<p align="center">

<img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
<img src="https://img.shields.io/badge/Three.js-3D-000000?logo=threedotjs" alt="Three.js">
<img src="https://img.shields.io/badge/React%20Three%20Fiber-R3F-orange" alt="React Three Fiber">
<img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite">
<img src="https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify&logoColor=white" alt="Netlify">
<img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License">

</p>

> **3D Websites Hackathon Submission**  
> An interactive, 60 FPS 3D web experience demonstrating Johannes Kepler's Laws of Planetary Motion and Isaac Newton's Vis-Viva orbital physics.

---

## 🔗 Live Demo

🌍 **Website:** https://orbits-3d.netlify.app/

---

##  Overview

**ORBITS** is a web-based 3D scrollytelling experience. As you scroll, the camera seamlessly moves through **5 interactive acts** of celestial physics, visualizing the mathematical principles that govern planetary motion and spacecraft trajectories.

- **Act 1 — Kepler's First Law (The Ellipse):** Visualizes elliptical orbits, orbital foci, semi-major axis, perihelion, and aphelion.
- **Act 2 — Kepler's Second Law (Equal Areas):** Demonstrates equal areas swept in equal time using animated orbital sectors.
- **Act 3 — Kepler's Third Law (Harmonic Law):** Simulates the relationship between orbital period and orbital distance.
- **Act 4 — Escape Velocity & Vis-Viva Physics:** Real-time telemetry driven by the Vis-Viva equation with interactive trajectory presets (`SUB`, `ORBIT`, `ESCAPE`, `HYPER`).
- **Act 5 — The Grand Finale:** A cinematic ending featuring procedural GLSL effects and replay support.

---

##  Features & Highlights

-  Interactive scroll-driven 3D storytelling
-  Live orbital telemetry gauge
-  Escape velocity simulation
-  Multi-layer animated starfield
-  Procedural Web Audio API sound engine
-  HDR bloom and post-processing
-  Responsive desktop and mobile experience

---

##  Technology Stack

- **Framework:** React
- **3D Engine:** Three.js
- **Renderer:** React Three Fiber
- **Utilities:** React Three Drei
- **Post Processing:** React Postprocessing
- **Audio:** Web Audio API
- **Styling:** CSS3
- **Build Tool:** Vite

---
#  System Architecture

## Overview

ORBITS is a scroll-driven 3D web experience built with React, Vite, Three.js, and React Three Fiber. The application is organized into independent modules responsible for rendering scenes, handling UI, managing scroll state, and generating procedural audio.

```
                User
                  │
                  ▼
          Browser (React App)
                  │
                  ▼
        React + React Three Fiber
                  │
     ┌────────────┼─────────────┐
     │            │             │
     ▼            ▼             ▼
 Scroll State   3D Scene      UI Layer
 Management     Rendering      Overlay
     │            │             │
     ▼            ▼             ▼
  Camera Rig   Acts (1–4)   Header / Text
     │            │             │
     └────────────┼─────────────┘
                  ▼
          Post Processing
                  │
                  ▼
           Browser Canvas
```

##  Project Structure

```text
Orbits
│
├── public/
│
├── src/
│   ├── acts/
│   │   ├── Act1_Ellipse.jsx
│   │   ├── Act2_EqualAreas.jsx
│   │   ├── Act3_Harmony.jsx
│   │   └── Act4_Escape.jsx
│   │
│   ├── scene/
│   │   ├── CameraRig.jsx
│   │   ├── Planet.jsx
│   │   ├── Star.jsx
│   │   └── Starfield.jsx
│   │
│   ├── ui/
│   │   ├── Header.jsx
│   │   ├── LoadingScreen.jsx
│   │   ├── ScrollIndicator.jsx
│   │   └── TextLayer.jsx
│   │
│   ├── lib/
│   │   └── audio.js
│   │
│   ├── scrollState.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── public/
├── README.md
├── LICENSE
├── package.json
├── package-lock.json
├── vite.config.js
├── tsconfig.json
├── components.json
├── .gitignore
└── index.html
```

---

##  Getting Started

### Prerequisites

- Node.js 16+
- npm

### Installation

```bash
git clone https://github.com/Siteshcodes/Orbits.git

cd Orbits

npm install

npm run dev
```

### Production Build

```bash
npm run build
```

---
## Development

This project is actively maintained.

## 📜 License

This project was created for the **3D Websites Hackathon** and is released under the **MIT License**.
