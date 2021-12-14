import * as THREE from 'three'
import { rainDensity } from '/js/config'

let rain = null
const diameter = 8
const radius = diameter / 2
const xvel = -0.1
const yvel = -0.2
const zvel = 0
const bufferTime = 20

export function setupRain(cityscape) {
  if (cityscape.params.rain == false) return
  const droplets = []
  for (let i = 0; i < rainDensity; i++) {
    const droplet = new THREE.Vector3(
      Math.random() * diameter - radius,
      Math.random() * radius * bufferTime + radius,
      Math.random() * diameter - radius
    )
    droplets.push(droplet)
  }
  let geometry = new THREE.BufferGeometry().setFromPoints(droplets)

  let material = new THREE.PointsMaterial({
    color: 0xcccccc,
    size: 1.5,
    transparent: true,
    opacity: 0.5
  })

  rain = new THREE.Points(geometry, material)
  cityscape.scene.add(rain)
}

export function updateRain(cityscape) {
  if (rain == null && cityscape.params.rain == true) {
    setupRain(cityscape)
  }
  if (rain == null) return
  const positions = rain.geometry.attributes.position.array
  let visibleRain = false
  for (let i = 0; i < positions.length; i += 3) {
    if (cityscape.params.rain == false && positions[i+1] < -0.2) {
      continue
    }
    visibleRain = true
    let nx = positions[i] + xvel
    let ny = positions[i+1] + yvel
    let nz = positions[i+2] + zvel
    if (ny < -0.2) {
      if (cityscape.params.rain == true || Math.random() > 2/bufferTime) {
	ny = Math.random() * radius + radius
      }
      nx = Math.random() * diameter - radius
      nz = Math.random() * diameter - radius
    }
    if (nx > radius - xvel * ny) {
      nx -= diameter
    }
    if (nx < -radius - xvel * ny) {
      nx += diameter
    }
    if (nz > radius - zvel * ny) {
      nz -= diameter
    }
    if (nz < -radius - zvel * ny) {
      nz += diameter
    }
    positions[i] = nx
    positions[i+1] = ny
    positions[i+2] = nz
  }
  rain.geometry.attributes.position.needsUpdate = true
  if (cityscape.params.rain == false && visibleRain == false) {
    cityscape.scene.remove(rain)
    rain.geometry.dispose()
    rain.material.dispose()
    rain = null
  }
}
