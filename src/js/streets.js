import * as THREE from 'three'
import { focus } from '/js/movement'
import { genStreets } from '/js/config'

// Car stuff

const carProbability = 0.15
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
  [-0.4, 0],
  [0.4, 0],
  [0, 0.4],
  [0, -0.4],
]
function carWithinBoundsRelative(blobRadiusSq, relativeX, relativeZ) {
  const distanceSquared = relativeX * relativeX + relativeZ * relativeZ
  return blobRadiusSq + 10 > distanceSquared
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
  // car.layers.enable(0)
  car.layers.set(1)
  car.traverse((child) => {
    // child.layers.enable(0)
    child.layers.set(1)
  })
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

function generateCars(cityscape, centerX, centerZ) {
  const blobRadius = cityscape.params.blobRadius
  const blobRadiusSq = blobRadius * blobRadius

  if (Math.random() > carProbability) return
  for (let boxX = centerX - blobRadius; boxX <= centerX + blobRadius; boxX++) {
    if (Xstreets.has(boxX)) {
      if (Math.random() > carProbability) continue
      let dist = boxX - centerX
      let dist_squared = dist * dist - 3
      if (Math.random() > 0.5) {
        generateCar(cityscape.scene, boxX, centerZ - Math.sqrt(blobRadiusSq - dist_squared), 0)
      } else {
        generateCar(cityscape.scene, boxX, centerZ + Math.sqrt(blobRadiusSq - dist_squared), 1)
      }
    }
  }

  for (let boxZ = centerZ - blobRadius; boxZ <= centerZ + blobRadius; boxZ++) {
    if (Zstreets.has(boxZ)) {
      if (Math.random() > carProbability) continue
      let dist = boxZ - centerZ
      let dist_squared = dist * dist - 3
      if (Math.random() > 0.5) {
        generateCar(cityscape.scene, centerX - Math.sqrt(blobRadiusSq - dist_squared), boxZ, 2)
      } else {
        generateCar(cityscape.scene, centerX + Math.sqrt(blobRadiusSq - dist_squared), boxZ, 3)
      }
    }
  }
}

export function updateEntities(cityscape) {
  // Get position
  const { x: focusX, z: focusZ } = focus
  const roundedFocusX = Math.round(focusX)
  const roundedFocusZ = Math.round(focusZ)
  const blobRadius = cityscape.params.blobRadius
  const blobRadiusSq = blobRadius * blobRadius

  // Move cars
  Cars.forEach((obj) => {
    obj._worldPosition.add(obj._velocity)
    obj.car.position.x = obj._worldPosition.x - focus.x
    obj.car.position.z = obj._worldPosition.z - focus.z
  })

  // Delete irrelevant cars
  const elementsToDelete = []
  Cars.forEach((obj) => {
    if (!carWithinBoundsRelative(blobRadiusSq, obj.car.position.x, obj.car.position.z)) {
      cityscape.scene.remove(obj.car)
      obj.car.children.forEach((child) => {
        cityscape.scene.remove(child)
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
  generateCars(cityscape, roundedFocusX, roundedFocusZ)
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

export function generateStreets(cityscape) {
  if (!genStreets) return
  const blobRadius = cityscape.params.blobRadius
  const { x: focusX, z: focusZ } = focus
  const centerX = Math.round(focusX)
  const centerZ = Math.round(focusZ)

  for (let boxX = centerX - blobRadius; boxX < XstreetsLimits.low; boxX++) {
    if (hasNearbyStreet(boxX, 0)) continue
    if (Math.random() < streetProbability) {
      Xstreets.add(boxX)
    }
  }
  XstreetsLimits.low = Math.min(XstreetsLimits.low, centerX - blobRadius)
  for (let boxX = XstreetsLimits.high + 1; boxX <= centerX + blobRadius; boxX++) {
    if (hasNearbyStreet(boxX, 0)) continue
    if (Math.random() < streetProbability) {
      Xstreets.add(boxX)
    }
  }
  XstreetsLimits.high = Math.max(XstreetsLimits.high, centerX + blobRadius)
  for (let boxZ = centerZ - blobRadius; boxZ < ZstreetsLimits.low; boxZ++) {
    if (hasNearbyStreet(boxZ, 1)) continue
    if (Math.random() < streetProbability) {
      Zstreets.add(boxZ)
    }
  }
  ZstreetsLimits.low = Math.min(ZstreetsLimits.low, centerZ - blobRadius)
  for (let boxZ = ZstreetsLimits.high + 1; boxZ <= centerZ + blobRadius; boxZ++) {
    if (hasNearbyStreet(boxZ, 1)) continue
    if (Math.random() < streetProbability) {
      Zstreets.add(boxZ)
    }
  }
  ZstreetsLimits.high = Math.max(ZstreetsLimits.high, centerZ + blobRadius)
}

export function isStreetPosition(x, z) {
  return Xstreets.has(x) || Zstreets.has(z)
}
