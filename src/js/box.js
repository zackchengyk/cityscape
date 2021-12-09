import * as THREE from 'three'
import { getNoise, getPrimaryColor, getSecondaryColor, HEIGHT_SEED } from '/js/color'
import { camOffsetX, camOffsetZ } from '/js/config'

let boundX = 6
let boundZ = 6
const buildings = new Map()
const DEBOUNCE_POSITION_THRESHOLD = 0.01
const BLOB_RADIUS = 4
const BLOB_RADIUS_SQUARED = BLOB_RADIUS * BLOB_RADIUS

function withinBounds(cameraX, cameraZ, boxX, boxZ) {
  const relativeX = boxX - cameraX + camOffsetX
  const relativeZ = boxZ - cameraZ + camOffsetZ
  const distanceSquared = relativeX * relativeX + relativeZ * relativeZ
  const result =
    THREE.MathUtils.smoothstep(BLOB_RADIUS_SQUARED - distanceSquared, 0, BLOB_RADIUS_SQUARED) - 0.05
  return result
}

function generateBox(scene, h, x, z, pc, sc) {
  // Check if a box is already at that location
  let coordKey = x.toString() + '#' + z.toString()
  if (buildings.has(coordKey)) {
    buildings.get(coordKey).scale.y = h
    buildings.get(coordKey).position.y = h / 2
    return
  }
  // Generate a box
  const boxGeometry = new THREE.BoxGeometry(0.8, 1, 0.8)
  const boxMaterial = new THREE.MeshPhongMaterial({
    color: pc,
    specular: sc,
  })
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial)
  boxMesh.scale.y = h
  boxMesh.position.set(0 + x, h / 2, 0 + z)
  // Shadow stuff
  boxMesh.castShadow = true
  boxMesh.receiveShadow = true
  // Add to map and scene
  buildings.set(coordKey, boxMesh)
  scene.add(boxMesh)
}

function generateBoxes(scene, centerX, centerZ, cameraX, cameraZ) {
  for (let boxX = centerX - boundX; boxX <= centerX + boundX; boxX++) {
    for (let boxZ = centerZ - boundZ; boxZ <= centerZ + boundZ; boxZ++) {
      const scale = withinBounds(cameraX, cameraZ, boxX, boxZ)
      if (scale > 0) {
        const h = getNoise(boxX, boxZ, HEIGHT_SEED)
        const pc = getPrimaryColor(boxX, boxZ, 1, 0.5)
        const sc = getSecondaryColor(boxX, boxZ, 1, 0.5)
        generateBox(scene, scale * h, boxX, boxZ, pc, sc)
      }
    }
  }
}

export function setupBoxes(scene, camera) {
  updateBoxes(scene, camera)
}

let prevCameraX = 0
let prevCameraZ = 0
export function updateBoxes(scene, camera) {
  // Get camera position
  const cameraX = camera.position.x
  const cameraZ = camera.position.z
  // Check if we need to recalculate
  const roundedCameraX = Math.round(cameraX)
  const roundedCameraZ = Math.round(cameraZ)
  if (
    Math.abs(cameraX - prevCameraX) < DEBOUNCE_POSITION_THRESHOLD &&
    Math.abs(cameraZ - prevCameraZ) < DEBOUNCE_POSITION_THRESHOLD
  ) {
    return
  }
  prevCameraX = cameraX
  prevCameraZ = cameraZ
  // Clean up irrelevant boxes
  const toDelete = []
  buildings.forEach((boxMesh, key) => {
    if (withinBounds(cameraX, cameraZ, boxMesh.position.x, boxMesh.position.z) < 0) {
      scene.remove(boxMesh)
      boxMesh.geometry.dispose()
      boxMesh.material.dispose()
      toDelete.push(key)
    }
  })
  toDelete.forEach((key) => {
    buildings.delete(key)
  })
  // Generate boxes
  generateBoxes(scene, roundedCameraX - camOffsetX, roundedCameraZ - camOffsetZ, cameraX, cameraZ)
}
