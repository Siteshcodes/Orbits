import { useMemo } from 'react'
import * as THREE from 'three'
import { noiseGLSL } from './shaders/noise.js'

/**
 * A faint, diagonal Milky Way band: an inward-facing sphere far behind the
 * starfield, shaded procedurally — a gaussian falloff around a tilted great
 * circle, broken up by static fbm so it reads as patchy cloud, not a stripe.
 * Pure shader, no image texture; additive and very dim so it stays
 * atmosphere, never focus.
 */

const VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAGMENT = noiseGLSL + /* glsl */ `
varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);

  // Band = distance from a tilted great-circle plane; the normal's tilt is
  // what makes the band run diagonally across the frame.
  vec3 bandNormal = normalize(vec3(0.42, 0.78, 0.31));
  float band = exp(-pow(dot(d, bandNormal) / 0.16, 2.0));

  // Static patchiness — dust lanes and brighter pools along the band.
  float clouds = fbm(d * 4.0) * 0.5 + 0.5;
  float body = band * (0.3 + 0.7 * clouds);

  // Dim blue-white with warmer pools where the "cloud" is denser.
  vec3 col = mix(vec3(0.54, 0.71, 1.0), vec3(1.0, 0.9, 0.78), clouds * 0.45);
  gl_FragColor = vec4(col * body * 0.09, 1.0);
}
`

export default function MilkyWay() {
  const uniforms = useMemo(() => ({}), [])

  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[300, 32, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
