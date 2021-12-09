import * as THREE from 'three'

let ambientLight, directionalLight, planeMesh

export function setupLighting(scene, renderer) {
  // Ambient
  ambientLight = new THREE.AmbientLight(0xffffff, 0.55) // todo: factor out
  scene.add(ambientLight)

  // Directional and shadows
  directionalLight = new THREE.DirectionalLight(0xffffff, 0.5) // todo: factor out
  directionalLight.position.set(-1, 1, -1) // related todo: movement
  // directionalLight.castShadow = true
  // directionalLight.shadow.camera.left = 10
  // directionalLight.shadow.camera.right = -10
  // directionalLight.shadow.camera.top = 10
  // directionalLight.shadow.camera.bottom = -10
  // directionalLight.shadow.camera.near = -10
  // directionalLight.shadow.camera.far = 1000
  // directionalLight.shadow.bias = -0.0001
  scene.add(directionalLight)
  // renderer.shadowMap.enabled = true
  // renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // TODO: light doesn't seem to make sense? building reflections are too high
  // const pointGeometry = new THREE.SphereGeometry(0.02)
  // let pointLight = new THREE.PointLight(0xffffff, 1, 50, 2) // distance, decay
  // pointLight.add(new THREE.Mesh(pointGeometry, new THREE.MeshBasicMaterial({ color: 0xff0040 })))
  // pointLight.position.set(0.5, 0.1, 0.5)
  // pointLight.castShadow = true
  // scene.add(pointLight);

  // plane that receives shadows (but does not cast them)
  // const planeGeometry = new THREE.PlaneGeometry(20, 20, 1, 1)
  // const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x2773cc })
  // planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
  // planeMesh.rotation.x = -Math.PI / 2
  // planeMesh.receiveShadow = true
  // scene.add(planeMesh)
}

export function updateLighting(whateverYouNeed) {
  // Todo: animate lighting, maybe move plane as well?
}
