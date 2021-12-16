import * as THREE from 'three'

export const genStreets = true

export const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' })

export const rainDensity = 300

// Camera
export const CAMERA_POSITION = new THREE.Vector3(1, 1, 1)
CAMERA_POSITION.normalize()
CAMERA_POSITION.multiplyScalar(120)
export const NEAR_PLANE = 60
export const FAR_PLANE = 180
export const MIN_ZOOM = 0.025
export const MAX_ZOOM = 2

// Directional light (with shadows)
export const LIGHT_NEAR_PLANE = -60
export const LIGHT_FAR_PLANE = 60
