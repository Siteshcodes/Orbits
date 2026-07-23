import { useState, useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ScrollControls, Stats } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  ToneMapping,
  Vignette,
  Noise,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import Star from './scene/Star.jsx'
import Starfield from './scene/Starfield.jsx'
import MilkyWay from './scene/MilkyWay.jsx'
import CameraRig from './scene/CameraRig.jsx'
import Act1_Ellipse from './acts/Act1_Ellipse.jsx'
import Act2_EqualAreas from './acts/Act2_EqualAreas.jsx'
import Act3_Harmony from './acts/Act3_Harmony.jsx'
import Act4_Escape from './acts/Act4_Escape.jsx'
import TextLayer from './ui/TextLayer.jsx'
import LoadingScreen from './ui/LoadingScreen.jsx'
import ScrollIndicator from './ui/ScrollIndicator.jsx'
import Header from './ui/Header.jsx'
import SpaceParticles from '@/components/SpaceParticles'

// Open with ?stats to overlay an fps meter (for perf checks; ships inert).
const params = new URLSearchParams(window.location.search)
const showStats = params.has('stats')
// Open with ?particles to preview the standalone Particles background
// (src/components/SpaceParticles.jsx) instead of the Kepler scene.
const showParticlesDemo = params.has('particles')

// Graceful degradation: detect low-power devices and reduce effects.
// A narrow viewport or low hardware concurrency both suggest a phone/tablet
// where the full postprocessing stack would tank the frame rate.
const isLowPower =
  typeof window !== 'undefined' &&
  (window.innerWidth < 768 || (navigator.hardwareConcurrency || 4) < 4)

/** Signals readiness once the R3F render loop fires. This project is fully
 *  procedural (no loaded textures/models), so drei's useProgress stays at 0%
 *  forever. Instead we use the first useFrame tick as proof that WebGL is up
 *  and the scene is painted. */
function ProgressBridge({ onProgress }) {
  const signaled = useRef(false)
  useFrame(() => {
    if (!signaled.current) {
      signaled.current = true
      onProgress(100)
    }
  })
  return null
}

export default function App() {
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)

  if (showParticlesDemo) return <SpaceParticles />

  return (
    <>
      {/* Loading screen — rendered outside the Canvas, first thing the user
          sees. Dissolves once assets finish loading. */}
      {!loaded && (
        <LoadingScreen
          progress={loadingProgress}
          onFinished={() => setLoaded(true)}
        />
      )}

      <Canvas
        dpr={isLowPower ? [1, 1.25] : [1, 1.5]}
        camera={{ position: [0, 1.2, 9], fov: 45, near: 0.1, far: 500 }}
      >
        <color attach="background" args={['#05060a']} />

        <Suspense fallback={null}>
          {/* Progress bridge: reads drei useProgress and pushes to DOM state */}
          <ProgressBridge onProgress={setLoadingProgress} />

          <MilkyWay />

          <pointLight position={[0, 0, 0]} intensity={40} decay={2} color="#ffd2a1" />
          <ambientLight intensity={0.35} color="#3a4a6b" />

          {/* Damping 0.12 provides snappy, smooth responsive scrolling */}
          <ScrollControls pages={6} damping={0.12}>
            <Star />
            <Starfield />
            <Act1_Ellipse />
            <Act2_EqualAreas />
            <Act3_Harmony />
            <Act4_Escape />
            <CameraRig />
          </ScrollControls>

          {/* One composer, Bloom still the only glow pass; ToneMapping,
              Vignette and Noise are merged with it into the same fullscreen
              shader chain by pmndrs/postprocessing, not extra passes.
              luminanceThreshold ≥ 1 means only HDR emissive surfaces (the
              star's shader emits at uIntensity > 1) bloom — starfield, corona
              and Milky Way all sit below threshold. The DOM text layer lives
              outside the canvas entirely, so it can never bloom. */}
          <EffectComposer>
            <Bloom mipmapBlur luminanceThreshold={1} intensity={isLowPower ? 0.8 : 1.1} radius={0.7} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            {!isLowPower && <Vignette offset={0.28} darkness={0.55} />}
            {/* premultiply scales grain by scene luminance, so the void stays
                clean and the grain lives in the lit areas */}
            {!isLowPower && <Noise premultiply opacity={0.25} />}
          </EffectComposer>

          {showStats && <Stats />}
        </Suspense>
      </Canvas>

      {/* Fixed DOM overlay — outside the Canvas, above ScrollControls'
          scroll container, pointer-events disabled so scrolling passes
          through. */}
      <Header />
      <TextLayer />
      <ScrollIndicator />
    </>
  )
}
