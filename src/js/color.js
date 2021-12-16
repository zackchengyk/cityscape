import * as THREE from '../../node_modules/three/src/Three'
import { Noise } from 'noisejs'

export const PHI = 1.618
export const NOISE_RATIO = 0.15

export const THEMES = {
  GOTHIC: { s: 0.2, l: 0.2 },
  PASTEL: { s: 0.2, l: 0.8 },
  CYBERPUNK: { s: 0.8, l: 0.8 },
  EVENING: { s: 0.8, l: 0.2 },
}
export const COLOR_SEED = 47
export const HEIGHT_SEED = 29
export const COLOR_BASE = 0.05

export function getBase(x, y, seed) {
  const noise = new Noise(Math.random())
  const noiseFrequency = 0.01
  noise.seed(seed)
  return (noise.simplex2(x * noiseFrequency, y * noiseFrequency) + 1) / 2
}

export function getNoise(x, y, p) {
  const str = '' + x + ('' + y) + ('' + p)
  for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
    (h = Math.imul(h ^ str.charCodeAt(i), 3432918353)), (h = (h << 13) | (h >>> 19))
  return (function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 2147483647
  })()
}

export function getPrimaryColor(x, y, s, l) {
  const base = getBase(x, y, COLOR_SEED)
  const noise = getNoise(x, y, COLOR_SEED)
  const h = (base + noise * NOISE_RATIO) % 1
  const hslStr = hsl2string(h, s, l)
  return hslStr
}

export function getSecondaryColor(x, y, s, l) {
  const base = getBase(x, y, COLOR_SEED)
  const noise = getNoise(x, y, COLOR_SEED)
  const h = (base + noise * NOISE_RATIO + PHI) % 1
  const hslStr = hsl2string(h, s, l)
  return hslStr
}

export function getPrimaryAndSecondaryColorModified(x, y, s, l) {
  const base = getBase(x, y, COLOR_SEED)
  const noise = getNoise(x, y, COLOR_SEED)

  let primaryH = (base + noise * NOISE_RATIO) % 1
  primaryH = Math.round(primaryH * 20) / 20
  const primaryColor = new THREE.Color().setHSL(primaryH, s, l)

  let secondaryH = (base + noise * NOISE_RATIO + PHI / 2 / Math.PI) % 1
  secondaryH = Math.round(secondaryH * 20) / 20
  const secondaryColor = new THREE.Color().setHSL(secondaryH, s, l)

  return [primaryColor, secondaryColor]
}

export function hsl2string(h, s, l) {
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}
