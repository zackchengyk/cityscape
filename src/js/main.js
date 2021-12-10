import '/public/style.css'
import * as THREE from 'three'
import { setupBoxes, updateBoxes, updateEntities } from '/js/box'
import { camOffsetX, camOffsetY, camOffsetZ } from '/js/config'
import { setupLighting, updateLighting } from '/js/lighting'
import { setupGamepadAndListeners, updateCameraMovement } from '/js/movement'
import Stats from '/../node_modules/stats.js/src/Stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// Stats
const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

// Important
let screenResolution, camera, scene, renderer
let prevTime = 0
init()
animate()

// Init function
function init() {
  // Setup basic stuff
  screenResolution = new THREE.Vector2(window.innerWidth, window.innerHeight)
  const aspectRatio = screenResolution.x / screenResolution.y
  setupCameraSceneRenderer(aspectRatio)

  // Setup listeners
  setupGamepadAndListeners()
  window.addEventListener('resize', () => updateSize(renderer, camera))

  // Setup geometry
  setupBoxes(scene, camera)

  // Setup lights
  setupLighting(scene, renderer)
}

// Animate function
function animate(currTime = 0) {
  requestAnimationFrame(animate)

  stats.begin()

  const deltaTime = currTime - prevTime
  prevTime = currTime

  updateSize(renderer, camera)
  updateCameraMovement(deltaTime, camera)
  updateBoxes(scene, camera)
  updateEntities(scene, camera)
  updateLighting('todo')

  renderer.render(scene, camera)

  stats.end()
}

// Setup helper
function setupCameraSceneRenderer(aspectRatio) {
  // Camera
  camera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, -1, -20, 20)
  camera.zoom = 0.25
  camera.position.set(camOffsetX, camOffsetY, camOffsetZ)
  camera.lookAt(0, 0, 0)
  // Scene
  scene = new THREE.Scene()
  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('cityscape') })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0x47365c)
  renderer.setSize(screenResolution.x, screenResolution.y)
  // renderer.shadowMap.enabled = true

  // Temporary below
  // const gridHelper = new THREE.GridHelper()
  // scene.add(gridHelper)
  const orbitControls = new OrbitControls(camera, renderer.domElement)
}

// Resize helper
function updateSize(renderer, camera) {
  const canvas = renderer.domElement
  const w = window.innerWidth
  const h = window.innerHeight
  const needResize = canvas.width !== w || canvas.height !== h
  if (needResize) {
    screenResolution.set(window.innerWidth, window.innerHeight)
    const aspectRatio = screenResolution.x / screenResolution.y
    camera.left = -aspectRatio
    camera.right = aspectRatio
    renderer.setSize(screenResolution.x, screenResolution.y)
    camera.updateProjectionMatrix()
  }
  return needResize
}
