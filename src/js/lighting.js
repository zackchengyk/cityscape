import * as THREE from 'three'
import { darkMaterial } from './config'

let ambientLight, dirLight, currTime
let planeMesh, planeMaterial

// Init function
export function setupLighting(cityscape) {
  prevBlobRadius = cityscape.params.blobRadius
  prevTimeOfDay = cityscape.params.timeOfDay

  // Ambient light
  ambientLight = new THREE.AmbientLight(0xffffff, cityscape.params.ambientLightIntensity)
  ambientLight.layers.enable(0)
  ambientLight.layers.enable(1)
  cityscape.scene.add(ambientLight)

  // Directional light
  dirLight = new THREE.DirectionalLight(0xffe8ab, cityscape.params.dirLightIntensity)
  dirLight.layers.enable(0)
  dirLight.layers.enable(1)
  cityscape.scene.add(dirLight)

  // Directional light's shadows
  dirLight.castShadow = true
  const r = cityscape.params.blobRadius * 1.5
  dirLight.shadow.camera = new THREE.OrthographicCamera(-r, r, r, -r, -10, 10)
  const dim = r * 100
  dirLight.shadow.mapSize = new THREE.Vector2(dim, dim)
  dirLight.shadow.bias = -0.0001
  cityscape.renderer.shadowMap.enabled = true
  cityscape.renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Plane
  const planeGeometry = new THREE.PlaneGeometry(20, 20, 1, 1)
  planeMaterial = new THREE.MeshLambertMaterial({
    color: 0x171324,
    emissive: 0x171324,
    emissiveIntensity: 0.5,
  })
  planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
  planeMesh.rotation.x = -Math.PI / 2
  planeMesh.receiveShadow = true
  planeMesh.layers.enable(0)
  planeMesh.layers.enable(1)
  planeMesh.renderOrder = -999
  updateBasedOnTimeOfDay(cityscape)
  cityscape.scene.add(planeMesh)
}

// Animate function
let prevBlobRadius = 0
let prevTimeOfDay = 0
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
  if (prevTimeOfDay !== cityscape.params.timeOfDay) {
    prevTimeOfDay = cityscape.params.timeOfDay
    updateBasedOnTimeOfDay(cityscape)
  }
}

const nightColor = new THREE.Color(0x171324)
const dayColor = new THREE.Color(0x53acff)
const duskColor = new THREE.Color(0xc87f32)
function updateBasedOnTimeOfDay(cityscape) {
  const hour = cityscape.params.timeOfDay
  const angle = (hour / 12) * Math.PI
  const sint = Math.sin(angle)
  const cost = Math.cos(angle)
  const dayness = THREE.MathUtils.smoothstep(hour, 4, 8) * (1 - THREE.MathUtils.smoothstep(hour, 18, 20))
  const duskness =
    THREE.MathUtils.smoothstep(hour, 18, 19) * (1 - THREE.MathUtils.smoothstep(hour, 19, 21)) * 0.75

  // Light position
  dirLight.position.set(sint + 0.5 - 1.5, 0.5 - cost, -sint - 0.5 - 1.5)

  // Light parameters
  cityscape.params.ambientLightIntensity = THREE.MathUtils.mapLinear(dayness, 0, 1, 0.1, 0.5)
  cityscape.params.dirLightIntensity = THREE.MathUtils.mapLinear(dirLight.position.y, -0.5, 0.5, 0, 0.25)
  cityscape.params.bloomAmbientLightIntensity = THREE.MathUtils.mapLinear(-dayness, -1, 0, 0, 0.5)
  cityscape.params.bloomDirLightIntensity = 0

  // Plane color
  planeMaterial.emissive.lerpColors(nightColor, dayColor, dayness)
  planeMaterial.emissive.lerp(duskColor, duskness)
  planeMaterial.color.copy(planeMaterial.emissive)
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
  dirLight.intensity = dirLight.position.y < 0 ? 0 : cityscape.params.dirLightIntensity
}
