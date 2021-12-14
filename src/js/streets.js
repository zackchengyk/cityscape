import * as THREE from 'three'
import { focus } from '/js/movement'
import { genStreets, BLOB_RADIUS } from '/js/config'

const BOUND_X = BLOB_RADIUS
const BOUND_Z = BLOB_RADIUS

// Car stuff

const carProbability = 0
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

  // const light = new THREE.SpotLight(0xff0000)
  // light.angle = Math.PI / 8
  // light.position.x = 0
  // light.position.y = 0
  // light.position.z = 0
  // // todo: implement shadows
  // // light.shadow.camera.left = 10
  // // light.shadow.camera.right = -10
  // // light.shadow.camera.top = 10
  // // light.shadow.camera.bottom = -10
  // // light.shadow.camera.near = -10
  // // light.shadow.camera.far = 1000
  // // light.shadow.bias = -0.0001
  // car.add(light)
  // // todo: figure out which way lights should go
  // light.target.position.x = -1
  // light.target.position.y = 0
  // light.target.position.z = 0
  // car.add(light.target)

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
        if (child.type === 'SpotLight') {
          child.dispose()
        } else if (child.type === 'Object3D') {
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
  for (let boxX = centerX - BOUND_X; boxX < XstreetsLimits.low; boxX++) {
    if (hasNearbyStreet(boxX, 0)) continue
    if (Math.random() < streetProbability) {
      Xstreets.add(boxX)
    }
  }
  XstreetsLimits.low = Math.min(XstreetsLimits.low, centerX - BOUND_X)
  for (let boxX = XstreetsLimits.high; boxX < centerX + BOUND_X; boxX++) {
    if (hasNearbyStreet(boxX, 0)) continue
    if (Math.random() < streetProbability) {
      Xstreets.add(boxX)
    }
  }
  XstreetsLimits.high = Math.max(XstreetsLimits.high, centerX + BOUND_X)
  for (let boxZ = centerZ - BOUND_Z; boxZ < ZstreetsLimits.low; boxZ++) {
    if (hasNearbyStreet(boxZ, 1)) continue
    if (Math.random() < streetProbability) {
      Zstreets.add(boxZ)
    }
  }
  ZstreetsLimits.low = Math.min(ZstreetsLimits.low, centerZ - BOUND_Z)
  for (let boxZ = ZstreetsLimits.high; boxZ < centerZ + BOUND_Z; boxZ++) {
    if (hasNearbyStreet(boxZ, 1)) continue
    if (Math.random() < streetProbability) {
      Zstreets.add(boxZ)
    }
  }
  ZstreetsLimits.high = Math.max(ZstreetsLimits.high, centerZ + BOUND_Z)
}

export function isStreetPosition(x, z) {
  return Xstreets.has(x) || Zstreets.has(z)
}

export function setupStreets(cityscape) {
  const { x: focusX, z: focusZ } = focus
  const roundedFocusX = Math.round(focusX)
  const roundedFocusZ = Math.round(focusZ)

  if (genStreets) {
    generateStreets(roundedFocusX, roundedFocusZ)
  }
}