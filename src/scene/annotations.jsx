import * as THREE from 'three'
import { Billboard, Text } from '@react-three/drei'
import fontUrl from '@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff'

/**
 * Shared infographic vocabulary for the orbital acts: billboarded uppercase
 * labels, dot/ring markers. Understated by design — one accent color, grey
 * for secondary geometry, thin strokes.
 *
 * Fading: every element carries userData.baseOpacity. The owning act
 * traverses its group each frame and multiplies baseOpacity by its scroll
 * fade, so annotations appear only in their act's window. (troika Text fades
 * via .fillOpacity, everything else via material.opacity.)
 */

export const ACCENT = '#8ab4ff'
export const GREY = '#9aa3b5'

export function Label({
  position,
  children,
  color = ACCENT,
  size = 0.24,
  baseOpacity = 0.95,
  anchorX = 'center',
}) {
  return (
    <Billboard position={position}>
      <Text
        font={fontUrl}
        fontSize={size}
        letterSpacing={0.14}
        color={color}
        anchorX={anchorX}
        anchorY="middle"
        fillOpacity={0}
        userData={{ baseOpacity }}
      >
        {children}
      </Text>
    </Billboard>
  )
}

// Filled dot lying in the orbital plane (rotated flat onto y = 0).
export function MarkerDot({ position, radius = 0.06, color = ACCENT, baseOpacity = 0.95 }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} userData={{ baseOpacity }}>
      <circleGeometry args={[radius, 24]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// Hollow ring in the orbital plane — the "empty" counterpart to MarkerDot.
export function MarkerRing({
  position,
  radius = 0.12,
  thickness = 0.03,
  color = ACCENT,
  baseOpacity = 0.95,
}) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} userData={{ baseOpacity }}>
      <ringGeometry args={[radius - thickness, radius, 48]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
