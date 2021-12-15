import * as THREE from 'three'
import { OrthographicCamera } from 'three'

let ambientLight, dirLight, currTime
let planeMesh, planeMaterial

// Init function
export function setupLighting(cityscape) {
  // Ambient light
  ambientLight = new THREE.AmbientLight(0xffffff, 0.25) // todo: factor out
  ambientLight.layers.enable(0)
  ambientLight.layers.enable(1)
  cityscape.scene.add(ambientLight)

  // Directional light
  dirLight = new THREE.DirectionalLight(0xffffff, 0.15) // todo: factor out
  dirLight.position.set(-1, 1, -1) // related todo: movement
  dirLight.layers.enable(0)
  dirLight.layers.enable(1)
  cityscape.scene.add(dirLight)

  // Directional light's shadows
  dirLight.castShadow = true
  prevBlobRadius = cityscape.params.blobRadius
  const r = cityscape.params.blobRadius * 1.5
  dirLight.shadow.camera = new OrthographicCamera(-r, r, r, -r, -10, 10)
  dirLight.shadow.mapSize.height = r * 200
  dirLight.shadow.mapSize.width = r * 200
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
    console.log('prevBlobRadius', prevBlobRadius)
    console.log('cityscape.params.blobRadius', cityscape.params.blobRadius)
    prevBlobRadius = cityscape.params.blobRadius
    const r = cityscape.params.blobRadius * 1.5
    dirLight.shadow.camera.left = -r
    dirLight.shadow.camera.right = r
    dirLight.shadow.camera.top = r
    dirLight.shadow.camera.bottom = -r
    dirLight.shadow.mapSize.height = r * 200
    dirLight.shadow.mapSize.width = r * 200
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
export function darkenPlane(darkMaterial) {
  planeMesh.material = darkMaterial
}
export function unDarkenPlane() {
  planeMesh.material = planeMaterial
}
