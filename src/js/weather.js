import * as THREE from 'three'
import { mergeBufferGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { focus, getSpeed } from '/js/movement'
import { rainDensity } from '/js/config'
import { Noise } from 'noisejs'

let BLOB_RADIUS
let BLOB_RADIUS_SQUARED
let BOUND_X
let BOUND_Z

let cloudProbability = 0
let maxClouds = 40
let rain = null
let Clouds = new Set()
let cloudPositions = new Set()
let diameter
let radius
const xvel = 0
const yvel = -0.2
const zvel = 1
const bufferTime = 20
const cloudThreshold = 0.5
const cubeSize = 0.25
let cloudShiftX = 0
let cloudShiftZ = 0

const noise = new Noise(Math.random())
noise.seed(Math.random())

const cloudSize = 10

const adj = [
  [cubeSize, 0],
  [0, cubeSize],
  [0, -cubeSize],
  [-cubeSize, 0],
]

function getRandomPos() {
  return Math.random() * diameter - radius
}

function cloudFloodFill(x, z) {
  let minX = 0,
    maxX = 0,
    minZ = 0,
    maxZ = 0
  let geometry = null
  let positions = new Set()
  let visited = new Set()
  let queue = []
  queue.push({ dx: 0, dz: 0 })
  while (queue.length > 0) {
    let { dx, dz } = queue[0]
    minX = Math.min(minX, dx)
    maxX = Math.max(maxX, dx)
    minZ = Math.min(minZ, dz)
    maxZ = Math.max(maxZ, dz)
    queue.shift()
    visited.add(xzToKey(x + dx, z + dz))
    const perlinVal = noise.simplex2((x + dx).toFixed(2) / 2, (z + dz).toFixed(2) / 2)
    if (Math.abs(perlinVal) < cloudThreshold) continue
    positions.add(xzToKey(x + dx, z + dz))
    for (let k = 0; k < 4; k++) {
      const nx = dx + adj[k][0]
      const nz = dz + adj[k][1]
      const key = xzToKey(x + nx, z + nz)
      if (visited.has(key)) continue
      visited.add(key)
      queue.push({ dx: nx, dz: nz })
    }
  }

  return { positions, visited, minX, maxX, minZ, maxZ }
}

export function setupRain(cityscape) {
  BLOB_RADIUS = cityscape.params.blobRadius
  BLOB_RADIUS_SQUARED = BLOB_RADIUS * BLOB_RADIUS
  BOUND_X = BLOB_RADIUS
  BOUND_Z = BLOB_RADIUS
  diameter = BLOB_RADIUS * 2
  radius = BLOB_RADIUS
  if (cityscape.params.rain == false) return
  const droplets = []
  for (let i = 0; i < rainDensity; i++) {
    const droplet = new THREE.Vector3(
      getRandomPos(),
      Math.random() * radius * bufferTime + radius,
      getRandomPos()
    )
    droplets.push(droplet)
  }
  let geometry = new THREE.BufferGeometry().setFromPoints(droplets)

  let material = new THREE.PointsMaterial({
    color: 0xcccccc,
    size: 1.5,
    transparent: true,
    opacity: 0.5,
  })

  rain = new THREE.Points(geometry, material)
  rain.layers.enable(1)
  cityscape.scene.add(rain)
}

export function addCloudBlock(scene, worldX, worldZ) {
  for (let x = worldX; x < worldX + 1; x += cubeSize) {
    for (let z = worldZ; z < worldZ + 1; z += cubeSize) {
      if (Math.random() < cloudProbability) {
	addCloud(scene, x, z, false)
      }
    }
  }
}

function addCloud(scene, worldX, worldZ, jitter) {
  if (cloudPositions.has(xzToKey(worldX, worldZ))) return
  if (!cloudWithinBoundsRelative(worldX - focus.x, worldZ - focus.z)) return
  if (Clouds.size >= maxClouds) return
  let x = worldX,
    z = worldZ
  if (jitter) {
    x += Math.round(Math.random() * 1000) + 1000
    z += Math.round(Math.random() * 1000) + 1000
  }
  let { positions, visited, minX, maxX, minZ, maxZ } = cloudFloodFill(x, z)
  if (positions.size == 0) return false
  let geometry = null

  for (let cubex = minX; cubex <= maxX; cubex += cubeSize) {
    for (let cubez = minZ; cubez <= maxZ; cubez += cubeSize) {
      if (!positions.has(xzToKey(x + cubex, z + cubez))) continue
      let box = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)
      box.translate(cubex, 0, cubez)
      box.rotateY(Math.PI)
      if (geometry == null) {
        geometry = box
      } else {
        geometry = mergeBufferGeometries([geometry, box])
      }
    }
  }
  if (geometry == null) return false
  const cloud = new THREE.Mesh(
    geometry,
    new THREE.MeshPhongMaterial({
      emissive: '#ffffff',
      emissiveIntensity: 0.17,
    })
  )
  cloud.position.set(worldX - focus.x, Math.random() * 2 + 3, worldZ - focus.z)
  cloud.castShadow = false
  cloud.receiveShadow = false
  let worldPos = cloud.position.clone()
  worldPos.x += focus.x
  worldPos.z += focus.z
  Clouds.add({ cloud: cloud, _worldPosition: worldPos, positions: positions })

  cloud.layers.set(3)
  // cloud.layers.enable(1)
  scene.add(cloud)
  positions.forEach((key) => {
    cloudPositions.add(key)
  })
  return true
}

const gridCellMap = new Map()
let prevFocusX = Infinity
let prevFocusZ = Infinity

function xzToKey(x, z) {
  return x.toFixed(2).toString() + '#' + z.toFixed(2).toString()
}

export function setupClouds(cityscape) {
  cloudProbability = cityscape.params.cloudSpawnProbability
  BLOB_RADIUS = cityscape.params.blobRadius
  BLOB_RADIUS_SQUARED = BLOB_RADIUS * BLOB_RADIUS
  BOUND_X = BLOB_RADIUS
  BOUND_Z = BLOB_RADIUS
  diameter = BLOB_RADIUS * 2
  radius = BLOB_RADIUS
  const { x: focusX, z: focusZ } = focus

  // Debounce recalculation things
  const updateThreshold = Math.max(getSpeed() * 0.5, 0.002)
  if (Math.abs(focusX - prevFocusX) < updateThreshold && Math.abs(focusZ - prevFocusZ) < updateThreshold) {
    return
  }
  prevFocusX = focusX
  prevFocusZ = focusZ

  // Get ready to iterate over grid cells
  const roundedFocusX = Math.round(focusX)
  const roundedFocusZ = Math.round(focusZ)
  const kvPairsToDelete = []

  // Iterate over grid cells
  for (let worldX = roundedFocusX - BOUND_X; worldX <= roundedFocusX + BOUND_X; worldX += cubeSize) {
    for (let worldZ = roundedFocusZ - BOUND_Z; worldZ <= roundedFocusZ + BOUND_Z; worldZ += cubeSize) {
      addCloud(cityscape.scene, worldX, worldZ, false)
    }
  }
  //kvPairsToDelete.forEach((key) => gridCellMap.delete(key))
}

export function updateRain(cityscape) {
  if (rain == null && cityscape.params.rain == true) {
    setupRain(cityscape)
  }
  if (rain == null) return
  const positions = rain.geometry.attributes.position.array
  let visibleRain = false
  for (let i = 0; i < positions.length; i += 3) {
    if (cityscape.params.rain == false && positions[i + 1] < -0.2) {
      continue
    }
    visibleRain = true
    let nx = positions[i] + xvel*cityscape.params.windSpeed
    let ny = positions[i + 1] + yvel
    let nz = positions[i + 2] + zvel*cityscape.params.windSpeed
    if (ny < -0.2) {
      if (cityscape.params.rain == true || Math.random() > 2 / bufferTime) {
        ny = Math.min(5.0, Math.random() * radius + radius)
      }
      nx = Math.random() * diameter - radius
      nz = Math.random() * diameter - radius
    }
    if (nx > radius) {
      nx -= diameter
    }
    if (nx < -radius) {
      nx += diameter
    }
    if (nz > radius) {
      nz -= diameter
    }
    if (nz < -radius) {
      nz += diameter
    }
    positions[i] = nx
    positions[i + 1] = ny
    positions[i + 2] = nz
  }
  rain.geometry.attributes.position.needsUpdate = true
  if (cityscape.params.rain == false && visibleRain == false) {
    cityscape.scene.remove(rain)
    rain.geometry.dispose()
    rain.material.dispose()
    rain = null
  }
}

function cloudWithinBoundsRelative(relativeX, relativeZ) {
  const distanceSquared = relativeX * relativeX + relativeZ * relativeZ
  return BLOB_RADIUS_SQUARED + 5 > distanceSquared
}

export function updateClouds(cityscape) {
  let cloudVelocity = new THREE.Vector3(xvel*cityscape.params.windSpeed,
					0,
					zvel*cityscape.params.windSpeed)
  cloudProbability = cityscape.params.cloudSpawnProbability
  BLOB_RADIUS = cityscape.params.blobRadius
  BLOB_RADIUS_SQUARED = BLOB_RADIUS * BLOB_RADIUS
  BOUND_X = BLOB_RADIUS
  BOUND_Z = BLOB_RADIUS
  diameter = BLOB_RADIUS * 2
  radius = BLOB_RADIUS
  Clouds.forEach((obj) => {
    obj._worldPosition.add(cloudVelocity)
    obj.cloud.position.x = obj._worldPosition.x - focus.x
    obj.cloud.position.z = obj._worldPosition.z - focus.z

    const x = obj.cloud.position.x
    const z = obj.cloud.position.z
    /*
    const opacity = Math.min(0.3, Math.max(0.1, (x+radius)*(z+radius)/diameter/diameter))
    obj.cloud.material.opacity = opacity
    */
  })

  const elementsToDelete = []
  Clouds.forEach((obj) => {
    if (!cloudWithinBoundsRelative(obj.cloud.position.x, obj.cloud.position.z)) {
      cityscape.scene.remove(obj.cloud)
      obj.cloud.geometry.dispose()
      obj.cloud.material.dispose()
      elementsToDelete.push(obj)
      obj.positions.forEach((key) => {
        cloudPositions.delete(key)
      })
    }
  })
  elementsToDelete.forEach((key) => {
    Clouds.delete(key)
  })
  // Add clouds to the edge
  const roundedFocusX = Math.round(focus.x)
  const roundedFocusZ = Math.round(focus.z)
  if (Math.random() > cityscape.params.cloudSpawnProbability) return
  for (let distx = 0; distx <= BOUND_X; distx += cubeSize) {
    for (let worldz = roundedFocusZ - BOUND_Z; worldz < roundedFocusZ - BOUND_Z+2; worldz += cubeSize) {
      if (Math.random() < cityscape.params.cloudSpawnProbability) {
	addCloud(cityscape.scene, roundedFocusX+BOUND_X-distx, worldz, true)
      }
      if (Math.random() < cityscape.params.cloudSpawnProbability) {
	addCloud(cityscape.scene, roundedFocusX-BOUND_X+distx, worldz, true)
      }
    }
  }
}
