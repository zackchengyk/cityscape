import * as THREE from 'three'
import { getNoise, getPrimaryColor, getSecondaryColor, HEIGHT_SEED } from '/js/color'
import { camOffsetX, camOffsetZ, genStreets } from '/js/config'
import { generateOutlineMesh } from '/js/outline'

const streetProbability = 0.2
const carProbability = 0.1
let boundX = 6
let boundZ = 6
const buildings = new Map()
const Cars = new Set()
const Xstreets = new Set()
let XstreetsLimits = { low: 0, high: 0 }
const Zstreets = new Set()
let ZstreetsLimits = { low: 0, high: 0 }
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

const carVel = [
  [0, 0.03],
  [0, -0.03],
  [0.03, 0],
  [-0.03, 0],
]

const carRot = [Math.PI / 2, -Math.PI / 2, Math.PI, 0]

// Drive on the right side of the road
const carDisp = [
  [-0.45, 0],
  [0.45, 0],
  [0, 0.45],
  [0, -0.45],
]

function generateCar(scene, x, z, dir) {
  const car = new THREE.Group()
  const light = new THREE.PointLight(0xf72119)
  light.position.x = 0
  light.position.y = 0
  light.position.z = 0
  car.add(light)

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1, 1, 1, 1),
    new THREE.MeshPhongMaterial({ color: '#ff0000' })
  )
  body.scale.set(0.25, 0.05, 0.15)
  body.position.set(0, 0.025, 0)
  body.receiveShadow = true
  car.add(body)

  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1, 1, 1, 1),
    new THREE.MeshPhongMaterial({ color: '#ffffff' })
  )
  hood.scale.set(0.15, 0.08, 0.11)
  hood.position.set(0 + 0.03, 0.06, 0)
  hood.receiveShadow = true
  car.add(hood)

  const fwheels = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1, 1, 1, 1),
    new THREE.MeshPhongMaterial({ color: '#333333' })
  )
  fwheels.scale.set(0.05, 0.05, 0.16)
  fwheels.position.set(0 - 0.055, 0.01, 0)
  fwheels.receiveShadow = true
  car.add(fwheels)

  const bwheels = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1, 1, 1, 1),
    new THREE.MeshPhongMaterial({ color: '#333333' })
  )
  bwheels.scale.set(0.05, 0.05, 0.16)
  bwheels.position.set(0 + 0.055, 0.01, 0)
  bwheels.receiveShadow = true
  car.add(bwheels)

  car.position.x += x + carDisp[dir][0] * Math.random()
  car.position.z += z + carDisp[dir][1] * Math.random()
  car.rotateY(carRot[dir])
  scene.add(car)
  Cars.add({
    car: car,
    velX: carVel[dir][0],
    velZ: carVel[dir][1],
  })
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

function generateCars(scene, centerX, centerZ, cameraX, cameraZ) {
  if (Math.random() > carProbability) return
  for (let boxX = centerX - BLOB_RADIUS; boxX <= centerX + BLOB_RADIUS; boxX++) {
    if (Xstreets.has(boxX)) {
      if (Math.random() > carProbability) continue
      if (Math.random() > 0.5) {
        generateCar(scene, boxX, centerZ - BLOB_RADIUS, 0)
      } else {
        generateCar(scene, boxX, centerZ + BLOB_RADIUS, 1)
      }
    }
  }
  for (let boxZ = centerZ - BLOB_RADIUS; boxZ <= centerZ + BLOB_RADIUS; boxZ++) {
    if (Zstreets.has(boxZ)) {
      if (Math.random() > carProbability) continue
      if (Math.random() > 0.5) {
        generateCar(scene, centerX - BLOB_RADIUS, boxZ, 2)
      } else {
        generateCar(scene, centerX + BLOB_RADIUS, boxZ, 3)
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

function carWithinBounds(cameraX, cameraZ, boxX, boxZ) {
  const relativeX = boxX - cameraX + camOffsetX
  const relativeZ = boxZ - cameraZ + camOffsetZ
  const distanceSquared = relativeX * relativeX + relativeZ * relativeZ
  return BLOB_RADIUS_SQUARED + 5 > distanceSquared
}

export function updateEntities(scene, camera) {
  // Get camera position
  const cameraX = camera.position.x
  const cameraZ = camera.position.z
  const roundedCameraX = Math.round(cameraX)
  const roundedCameraZ = Math.round(cameraZ)
  // Move cars
  Cars.forEach((obj) => {
    obj.car.position.x += obj.velX
    obj.car.position.z += obj.velZ
  })
  // Generate more entities
  generateCars(scene, roundedCameraX - camOffsetX, roundedCameraZ - camOffsetZ, cameraX, cameraZ)
  // Delete irrelevant cars
  const toDelete = []
  Cars.forEach((obj) => {
    if (!carWithinBounds(cameraX, cameraZ, obj.car.position.x, obj.car.position.z)) {
      scene.remove(obj.car)
      obj.car.children.forEach((child) => {
        scene.remove(child)
        if (child.type === 'PointLight') {
          child.dispose()
        } else {
          child.geometry.dispose()
          child.material.dispose()
        }
      })
      toDelete.push(obj)
    }
  })
  toDelete.forEach((key) => {
    Cars.delete(key)
  })
}
