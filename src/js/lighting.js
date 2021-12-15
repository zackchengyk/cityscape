import * as THREE from 'three'
import { darkMaterial } from './config'

let ambientLight, dirLight, currTime
let planeMesh, planeMaterial

// Init function
export function setupLighting(cityscape) {
  // Ambient light
  ambientLight = new THREE.AmbientLight(0xffffff, cityscape.params.ambientLightIntensity)
  ambientLight.layers.enable(0)
  ambientLight.layers.enable(1)
  cityscape.scene.add(ambientLight)

  // Directional light
  dirLight = new THREE.DirectionalLight(0xffffff, cityscape.params.dirLightIntensity)
  dirLight.layers.enable(0)
  dirLight.layers.enable(1)
  cityscape.scene.add(dirLight)

  // Directional light's shadows
  dirLight.castShadow = true
  prevBlobRadius = cityscape.params.blobRadius
  const r = cityscape.params.blobRadius * 1.5
  dirLight.shadow.camera = new THREE.OrthographicCamera(-r, r, r, -r, -10, 10)
  const dim = r * 100
  dirLight.shadow.mapSize = new THREE.Vector2(dim, dim)
  dirLight.shadow.bias = -0.0001
  cityscape.renderer.shadowMap.enabled = true
  cityscape.renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Plane
  const planeGeometry = new THREE.PlaneGeometry(20, 20, 1, 1)
  planeMaterial = new THREE.MeshBasicMaterial({ color: 0x1e1a2b })
  planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
  planeMesh.rotation.x = -Math.PI / 2
  planeMesh.receiveShadow = true
  planeMesh.layers.enable(0)
  planeMesh.layers.enable(1)
  planeMesh.renderOrder = -999
  cityscape.scene.add(planeMesh)
}

// Animate function
let prevBlobRadius = 0
export function updateLighting(cityscape) {
  // Update based on blobRadius parameter
  if (prevBlobRadius !== cityscape.params.blobRadius) {
    prevBlobRadius = cityscape.params.blobRadius
    const r = cityscape.params.blobRadius * 1.5
    dirLight.shadow.camera.left = -r
    dirLight.shadow.camera.right = r
    dirLight.shadow.camera.top = r
    dirLight.shadow.camera.bottom = -r
    dirLight.shadow.map.dispose()
    dirLight.shadow.map = null
    const dim = r * 100
    dirLight.shadow.mapSize = new THREE.Vector2(dim, dim)
    dirLight.shadow.camera.updateProjectionMatrix()
  }
  // Update based on shadow parameter
  dirLight.castShadow = cityscape.params.shadows
  // Update based on time parameter
  if (currTime !== cityscape.params.timeOfDay) {
    currTime = cityscape.params.timeOfDay
    const time = (cityscape.params.timeOfDay / 24) * (Math.PI / 2)
    const sint = Math.sin(time)
    const cost = Math.cos(time)
    console.log(time, sint, cost)
    dirLight.position.set(-cost * Math.sqrt(2), 1, -sint * Math.sqrt(2))
    if (currTime < 6 || currTime > 20) {
      // after 8pm, before 6am
      dirLight.intensity = 0.15
    } else {
      dirLight.intensity = sint * 0.25
    }
  }
}

// Helper function
export function enableBloomModeLighting(cityscape) {
  planeMesh.material = darkMaterial
  ambientLight.intensity = cityscape.params.bloomAmbientLightIntensity
  dirLight.intensity = cityscape.params.bloomDirLightIntensity
}
export function disableBloomModeLighting(cityscape) {
  planeMesh.material = planeMaterial
  ambientLight.intensity = cityscape.params.ambientLightIntensity
  dirLight.intensity = cityscape.params.dirLightIntensity
}
