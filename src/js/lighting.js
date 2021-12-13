import * as THREE from 'three'
import { OrthographicCamera } from 'three'
import { BLOB_RADIUS } from '/js/grid.js'

let ambientLight, dirLight, planeMesh, currTime

// Init function
export function setupLighting(scene, renderer) {
  // Ambient
  ambientLight = new THREE.AmbientLight(0xffffff, 0.55) // todo: factor out
  scene.add(ambientLight)

  // Directional and shadows
  dirLight = new THREE.DirectionalLight(0xffffff, 0.5) // todo: factor out
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

  // // TODO: light doesn't seem to make sense? building reflections are too high
  // const pointGeometry = new THREE.SphereGeometry(0.02)
  // let pointLight = new THREE.PointLight(0xffffff, 1, 50, 2) // distance, decay
  // pointLight.add(new THREE.Mesh(pointGeometry, new THREE.MeshBasicMaterial({ color: 0xff0040 })))
  // pointLight.position.set(0.5, 0.1, 0.5)
  // pointLight.castShadow = true
  // scene.add(pointLight)

  //   plane that receives shadows (but does not cast them)
  const planeGeometry = new THREE.PlaneGeometry(10, 10, 1, 1)
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x2773cc,
    stencilWrite: true,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilRef: 0,
    stencilFuncMask: 0xff,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
  })
  planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
  planeMesh.rotation.x = -Math.PI / 2
  planeMesh.receiveShadow = true
  scene.add(planeMesh)
}

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
      dirLight.intensity = 0
    } else {
      dirLight.intensity = nsin
    }
  }
}
