import * as THREE from 'three'
import { getNoise, getPrimaryColor, getSecondaryColor, HEIGHT_SEED } from '/js/color'
import { camOffsetX, camOffsetZ, genStreets } from '/js/config'
import { generateOutlineMesh } from '/js/outline'

const streetProbability = 0.2
let boundX = 6
let boundZ = 6
const buildings = new Map()
const Xstreets = new Set()
let XstreetsLimits = {low: 0, high: 0}
const Zstreets = new Set()
let ZstreetsLimits = {low: 0, high: 0}
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
  if (Xstreets.has(x) || Zstreets.has(z)) return
  let coordKey = x.toString() + '#' + z.toString()
  if (buildings.has(coordKey)) {
    // Update its "height"
    buildings.get(coordKey).boxMesh.scale.y = h
    buildings.get(coordKey).boxMesh.position.y = h / 2
    return
  }
  // Generate a box
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1)
  const boxMaterial = new THREE.MeshPhongMaterial({
    color: pc,
    specular: sc,
  })
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial)
  boxMesh.scale.set(0.8, h, 0.8)
  boxMesh.position.set(0 + x, h / 2, 0 + z)
  // Shadow stuff
  boxMesh.castShadow = true
  boxMesh.receiveShadow = true
  // Outline stuff
  const outlineMesh = generateOutlineMesh(boxMesh)
  // Add to map and scene
  buildings.set(coordKey, { boxMesh, outlineMesh })
  scene.add(boxMesh, outlineMesh)
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

function hasNearbyStreet(v, dir) {
  for (let cur = v - 5; cur < v + 5; cur++) {
    if (dir === 0 && Xstreets.has(cur)) return true
    if (dir === 1 && Zstreets.has(cur)) return true
  }
  return false
}

function generateStreets(centerX, centerZ, cameraX, cameraZ) {
  for (let boxX = centerX - boundX; boxX < XstreetsLimits.low; boxX++) {
    if (hasNearbyStreet(boxX, 0)) continue
    if (Math.random() < streetProbability) {
      Xstreets.add(boxX)
    }
  }
  XstreetsLimits.low = Math.min(XstreetsLimits.low, centerX - boundX)
  for (let boxX = XstreetsLimits.high; boxX < centerX + boundX; boxX++) {
    if (hasNearbyStreet(boxX, 0)) continue
    if (Math.random() < streetProbability) {
      Xstreets.add(boxX)
    }
  }
  XstreetsLimits.high = Math.max(XstreetsLimits.high, centerX + boundX)
  for (let boxZ = centerZ - boundZ; boxZ < ZstreetsLimits.low; boxZ++) {
    if (hasNearbyStreet(boxZ, 1)) continue
    if (Math.random() < streetProbability) {
      Zstreets.add(boxZ)
    }
  }
  ZstreetsLimits.low = Math.min(ZstreetsLimits.low, centerZ - boundZ)
  for (let boxZ = ZstreetsLimits.high; boxZ < centerZ + boundZ; boxZ++) {
    if (hasNearbyStreet(boxZ, 1)) continue
    if (Math.random() < streetProbability) {
      Zstreets.add(boxZ)
    }
  }
  ZstreetsLimits.high = Math.max(ZstreetsLimits.high, centerZ + boundZ)
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
  buildings.forEach(({ boxMesh, outlineMesh }, key) => {
    if (withinBounds(cameraX, cameraZ, boxMesh.position.x, boxMesh.position.z) < 0) {
      scene.remove(boxMesh)
      boxMesh.geometry.dispose()
      boxMesh.material.dispose()
      scene.remove(outlineMesh)
      outlineMesh.geometry.dispose()
      outlineMesh.material.dispose()
      toDelete.push(key)
    }
  })
  toDelete.forEach((key) => {
    buildings.delete(key)
  })
  if (genStreets) {
    generateStreets(roundedCameraX - camOffsetX, roundedCameraZ - camOffsetZ, cameraX, cameraZ)
  }
  // Generate boxes
  generateBoxes(scene, roundedCameraX - camOffsetX, roundedCameraZ - camOffsetZ, cameraX, cameraZ)
}
