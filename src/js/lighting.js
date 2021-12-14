import * as THREE from 'three'
import { OrthographicCamera } from 'three'
import { BLOB_RADIUS } from '/js/grid.js'

let ambientLight, dirLight, currTime
let planeMesh, planeMaterial

// Init function
export function setupLighting(scene, renderer) {
  // Ambient light
  ambientLight = new THREE.AmbientLight(0xffffff, 0.25) // todo: factor out
  scene.add(ambientLight)
  ambientLight.layers.enable(0)
  ambientLight.layers.enable(1)

  // Directional light and shadows
  dirLight = new THREE.DirectionalLight(0xffffff, 0.15) // todo: factor out
  dirLight.position.set(-1, 1, -1) // related todo: movement
  dirLight.castShadow = true
  const x = BLOB_RADIUS * 1.5
  dirLight.shadow.camera = new OrthographicCamera(-x, x, x, -x, -10, 10)
  dirLight.shadow.mapSize.height = x * 200
  dirLight.shadow.mapSize.width = x * 200
  dirLight.shadow.bias = -0.0001
  scene.add(dirLight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  dirLight.layers.enable(0)
  dirLight.layers.enable(1)

  // Plane
  const planeGeometry = new THREE.PlaneGeometry(20, 20, 1, 1)
  planeMaterial = new THREE.MeshBasicMaterial({ color: 0x1e1a2b })
  planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
  planeMesh.rotation.x = -Math.PI / 2
  planeMesh.receiveShadow = true
  planeMesh.layers.enable(0)
  planeMesh.layers.enable(1)
  planeMesh.renderOrder = -999
  scene.add(planeMesh)
}

// Animate function
export function updateLighting(scene, params) {
  // Todo: animate lighting, maybe move plane as well?
  if (dirLight.castShadow !== params.shadows) {
    dirLight.castShadow = params.shadows
  }
  if (currTime !== params.timeOfDay) {
    currTime = params.timeOfDay
    const time = (params.timeOfDay / 24) * (Math.PI / 2)
    var nsin = Math.sin(time)
    var ncos = Math.cos(time)
    console.log(time, nsin, ncos)
    dirLight.position.set(-ncos * Math.sqrt(2), 1, -nsin * Math.sqrt(2))
    if (currTime < 6 || currTime > 20) {
      // after 8pm, before 6am
      dirLight.intensity = 0.05
    } else {
      dirLight.intensity = nsin * 0.15
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
