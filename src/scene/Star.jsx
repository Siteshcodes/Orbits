import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Billboard, useScroll } from '@react-three/drei'
import { noiseGLSL } from './shaders/noise.js'

/**
 * The sun: an animated procedural surface (fbm granulation, no textures)
 * plus a soft corona billboard. Surface color is emitted HDR — uIntensity
 * stays above the Bloom luminanceThreshold (1) so the star is the only
 * thing in the scene that blooms.
 */

const SURFACE_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vPos;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const SURFACE_FRAGMENT = noiseGLSL + /* glsl */ `
uniform float uTime;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vPos;

void main() {
  // Granulation: slow-drifting fbm sampled on the unit sphere, plus one
  // higher-frequency octave for fine cell detail.
  vec3 p = normalize(vPos);
  float g = fbm(p * 3.0 + vec3(0.0, uTime * 0.05, uTime * 0.03));
  g += 0.35 * snoise(p * 8.0 - uTime * 0.06);

  // Dark convection lanes (#ff7a1a) between bright granules (#ffb347).
  vec3 col = mix(vec3(1.0, 0.478, 0.102), vec3(1.0, 0.702, 0.278), smoothstep(-0.7, 0.9, g));

  // Limb darkening: edges of the disc dimmer than the center, like a
  // real photosphere. vNormal is view-space, so the view dir is ~ +Z.
  float ndv = clamp(vNormal.z, 0.0, 1.0);
  float limb = 0.5 + 0.5 * pow(ndv, 0.55);

  gl_FragColor = vec4(col * limb * uIntensity, 1.0);
}
`

const CORONA_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// Radial falloff in-shader — smoother than a gradient texture, no banding.
// Additive and everywhere < 1 in luminance, so the corona itself does not
// bloom; it just widens the glow the Bloom pass starts.
const CORONA_FRAGMENT = /* glsl */ `
uniform float uIntensity;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float falloff = pow(clamp(1.0 - d, 0.0, 1.0), 2.6);
  falloff += 0.35 * pow(clamp(1.0 - d, 0.0, 1.0), 9.0);
  vec3 col = mix(vec3(1.0, 0.478, 0.102), vec3(1.0, 0.702, 0.278), falloff);
  gl_FragColor = vec4(col * falloff * 0.55 * uIntensity, 1.0);
}
`

export default function Star() {
  const outer = useRef()
  const mesh = useRef()
  const scroll = useScroll()

  const surfaceUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uIntensity: { value: 2.4 } }),
    [],
  )
  const coronaUniforms = useMemo(() => ({ uIntensity: { value: 1 } }), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    surfaceUniforms.uTime.value = t
    // Two incommensurate sine frequencies so the pulse never reads as a loop.
    const pulse = Math.sin(t * 0.9) * 0.6 + Math.sin(t * 1.63) * 0.4
    mesh.current.scale.setScalar(1 + pulse * 0.015)
    surfaceUniforms.uIntensity.value = 2.4 + pulse * 0.25
    coronaUniforms.uIntensity.value = 1 + pulse * 0.12

    // Big cinematic sun for the hero, half-size once the orbital acts begin
    // so its corona never swallows perihelion (a−c = 2.2 at the acts' scale).
    // Still at the focus — only the radius changes, never the position.
    const shrink = THREE.MathUtils.smoothstep(scroll.offset, 0.08, 0.22)
    outer.current.scale.setScalar(THREE.MathUtils.lerp(1, 0.5, shrink))
  })

  return (
    <group ref={outer}>
      <mesh ref={mesh}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          uniforms={surfaceUniforms}
          vertexShader={SURFACE_VERTEX}
          fragmentShader={SURFACE_FRAGMENT}
        />
      </mesh>

      {/* Corona: camera-facing quad through the star's center; the sphere
          depth-occludes the quad's middle, leaving a soft ring of glow. */}
      <Billboard>
        <mesh scale={[7, 7, 1]} renderOrder={1}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            uniforms={coronaUniforms}
            vertexShader={CORONA_VERTEX}
            fragmentShader={CORONA_FRAGMENT}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Billboard>
    </group>
  )
}
