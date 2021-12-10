import * as THREE from 'three'
import { getNoise, getPrimaryColor, getSecondaryColor, HEIGHT_SEED } from '/js/color'
import { camOffsetX, camOffsetZ, genStreets } from '/js/config'
import { generateOutlineMesh } from '/js/outline'
import { focus } from '/js/movement'

const boundX = 10 // FIXME: should be correct and dependent on camera's zoom
const boundZ = 10 // FIXME: should be correct and dependent on camera's zoom
const gridCellMap = new Map()
const BLOB_RADIUS = 4
const BLOB_RADIUS_SQUARED = BLOB_RADIUS * BLOB_RADIUS

function xzToKey(x, z) {
  return x.toString() + '#' + z.toString()
}

// FIXME: rename this function
function withinBounds(worldX, worldZ) {
  const relativeX = worldX - focus.x
  const relativeZ = worldZ - focus.z
  const distanceSquared = relativeX * relativeX + relativeZ * relativeZ
  const result =
    THREE.MathUtils.smoothstep(BLOB_RADIUS_SQUARED - distanceSquared, 0, BLOB_RADIUS_SQUARED) - 0.05
  return result
}

function generateBox(scene, worldX, worldZ, scale) {
  // Get random values
  const actualHeight = Math.ceil(getNoise(worldX, worldZ, HEIGHT_SEED)*2)/2
  const height = actualHeight * scale
  const pc = getPrimaryColor(worldX, worldZ, 1, 0.5)
  const sc = getSecondaryColor(worldX, worldZ, 1, 0.5)
  // Box
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1)
  const boxMaterial = new THREE.MeshPhongMaterial({
    color: pc,
    specular: sc,
  })
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial)
  boxMesh.scale.set(0.8, height, 0.8)
  boxMesh.position.set(worldX - focus.x, height / 2, worldZ - focus.z)
  // Shadow stuff
  boxMesh.castShadow = true
  boxMesh.receiveShadow = true
  // Outline stuff
  const outlineMesh = generateOutlineMesh(boxMesh)
  // Add to map and scene
  gridCellMap.set(xzToKey(worldX, worldZ), { worldX, worldZ, actualHeight, boxMesh, outlineMesh })
  scene.add(boxMesh, outlineMesh)
}

let prevFocusX = Infinity
let prevFocusZ = Infinity
const DEBOUNCE_POSITION_THRESHOLD = 0.01

export function updateGrid(scene) {
  // Note: this ASSUMES that all visible grid cells are within [-boundX, boundX], etc

  // Get position
  const { x: focusX, z: focusZ } = focus

  // Debounce recalculation things
  if (
    Math.abs(focusX - prevFocusX) < DEBOUNCE_POSITION_THRESHOLD &&
    Math.abs(focusZ - prevFocusZ) < DEBOUNCE_POSITION_THRESHOLD
  ) {
    return
  }
  prevFocusX = focusX
  prevFocusZ = focusZ

  // Get ready to iterate over grid cells
  const roundedFocusX = Math.round(focusX)
  const roundedFocusZ = Math.round(focusZ)
  const kvPairsToDelete = []

  // Todo: comment / neaten up, and note that this must be done BEFORE the below
  if (genStreets) {
    generateStreets(roundedFocusX, roundedFocusZ)
  }

  // Iterate over grid cells
  for (let worldX = roundedFocusX - boundX; worldX <= roundedFocusX + boundX; worldX++) {
    for (let worldZ = roundedFocusZ - boundZ; worldZ <= roundedFocusZ + boundZ; worldZ++) {
      const scale = withinBounds(worldX, worldZ)
      const gridCellKey = xzToKey(worldX, worldZ)
      if (scale > 0) {
        if (gridCellMap.has(gridCellKey)) {
          // Update currently occupied grid cell
          updateGridCell(scene, gridCellMap.get(gridCellKey), scale)
        } else {
          // Fill currently empty grid cell
          fillGridCell(scene, worldX, worldZ, scale, gridCellKey)
        }
      } else if (gridCellMap.has(gridCellKey)) {
        // Clear currently occupied grid cell
        clearGridCell(scene, gridCellMap.get(gridCellKey))
        kvPairsToDelete.push(gridCellKey)
      }
    }
  }
  kvPairsToDelete.forEach((key) => gridCellMap.delete(key))
}

export function setupGrid(scene) {
  updateGrid(scene)
}

function clearGridCell(scene, gridCellValue) {
  const { boxMesh, outlineMesh } = gridCellValue
  // Extensible, though right now the hashmap object can only have boxes and their outlines
  scene.remove(boxMesh)
  boxMesh.geometry.dispose()
  boxMesh.material.dispose()
  scene.remove(outlineMesh)
  outlineMesh.geometry.dispose()
  outlineMesh.material.dispose()
}

function updateGridCell(_, gridCellValue, scale) {
  const { worldX, worldZ, actualHeight, boxMesh } = gridCellValue
  // Extensible, though right now the hashmap object can only have boxes and their outlines
  const height = actualHeight * scale
  boxMesh.scale.y = height
  boxMesh.position.set(worldX - focus.x, height / 2, worldZ - focus.z)
}

function fillGridCell(scene, worldX, worldZ, scale, gridCellKey) {
  // Extensible, though right now the only thing we make is boxes and streets
  if (isStreetPosition(worldX, worldZ)) return
  generateBox(scene, worldX, worldZ, scale, gridCellKey)
}

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
// Car stuff

const carProbability = 0.1
const Cars = new Set()

const carVel = [
  [0, 0.03],
  [0, -0.03],
  [0.03, 0],
  [-0.03, 0],
]

const carRot = [Math.PI / 2, -Math.PI / 2, Math.PI, 0]

// Drive on the right side of the road
const carDisplacement = [
  [-0.45, 0],
  [0.45, 0],
  [0, 0.45],
  [0, -0.45],
]
function carWithinBoundsRelative(relativeX, relativeZ) {
  const distanceSquared = relativeX * relativeX + relativeZ * relativeZ
  return BLOB_RADIUS_SQUARED + 10 > distanceSquared
}

function generateCar(scene, x, z, dir) {
  const car = new THREE.Group()
  // const light = new THREE.PointLight(0xf72119)
  // light.position.x = 0
  // light.position.y = 0
  // light.position.z = 0
  // car.add(light)

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

  car.position.x += x + carDisplacement[dir][0] * Math.random() - focus.x
  car.position.z += z + carDisplacement[dir][1] * Math.random() - focus.z
  car.rotateY(carRot[dir])
  scene.add(car)
  let worldPos = car.position.clone()
  worldPos.x += focus.x
  worldPos.z += focus.z
  Cars.add({
    car,
    _worldPosition: worldPos,
    _velocity: new THREE.Vector3(carVel[dir][0], 0, carVel[dir][1]),
  })
}

function generateCars(scene, centerX, centerZ, focusX, focusZ) {
  if (Math.random() > carProbability) return
  for (let boxX = centerX - BLOB_RADIUS; boxX <= centerX + BLOB_RADIUS; boxX++) {
    if (Xstreets.has(boxX)) {
      if (Math.random() > carProbability) continue
      let dist = boxX - centerX
      let dist_squared = dist * dist - 3
      if (Math.random() > 0.5) {
        generateCar(scene, boxX, centerZ - Math.sqrt(BLOB_RADIUS_SQUARED - dist_squared), 0)
      } else {
        generateCar(scene, boxX, centerZ + Math.sqrt(BLOB_RADIUS_SQUARED - dist_squared), 1)
      }
    }
  }
  for (let boxZ = centerZ - BLOB_RADIUS; boxZ <= centerZ + BLOB_RADIUS; boxZ++) {
    if (Zstreets.has(boxZ)) {
      if (Math.random() > carProbability) continue
      let dist = boxZ - centerZ
      let dist_squared = dist * dist - 3
      if (Math.random() > 0.5) {
        generateCar(scene, centerX - Math.sqrt(BLOB_RADIUS_SQUARED - dist_squared), boxZ, 2)
      } else {
        generateCar(scene, centerX + Math.sqrt(BLOB_RADIUS_SQUARED - dist_squared), boxZ, 3)
      }
    }
  }
}

export function updateEntities(scene) {
  // Get position
  const { x: focusX, z: focusZ } = focus
  const roundedFocusX = Math.round(focusX)
  const roundedFocusZ = Math.round(focusZ)

  // Move cars
  Cars.forEach((obj) => {
    obj._worldPosition.add(obj._velocity)
    obj.car.position.x = obj._worldPosition.x - focus.x
    obj.car.position.z = obj._worldPosition.z - focus.z
  })

  // Delete irrelevant cars
  const elementsToDelete = []
  Cars.forEach((obj) => {
    if (!carWithinBoundsRelative(obj.car.position.x, obj.car.position.z)) {
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
      elementsToDelete.push(obj)
    }
  })
  elementsToDelete.forEach((key) => {
    Cars.delete(key)
  })

  // Generate more entities
  generateCars(scene, roundedFocusX, roundedFocusZ)
}

// Street stuff

const streetProbability = 0.2
const Xstreets = new Set()
let XstreetsLimits = { low: 0, high: 0 }
const Zstreets = new Set()
let ZstreetsLimits = { low: 0, high: 0 }

function hasNearbyStreet(v, dir) {
  for (let cur = v - 5; cur < v + 5; cur++) {
    if (dir === 0 && Xstreets.has(cur)) return true
    if (dir === 1 && Zstreets.has(cur)) return true
  }
  return false
}

export function generateStreets(centerX, centerZ) {
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

export function isStreetPosition(x, z) {
  return Xstreets.has(x) || Zstreets.has(z)
}
