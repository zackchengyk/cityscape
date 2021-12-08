import '/public/style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { getNoise, getPrimaryColor, getSecondaryColor, HEIGHT_SEED } from '/js/color'
import { setupLighting, updateLighting } from '/js/lighting'
import { setupGamepadAndListeners, updateCameraMovement } from '/js/movement'
import Stats from '/../node_modules/stats.js/src/Stats.js'

// STATS
const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

// IMPORTANT
let screenResolution, camera, scene, renderer
let prevTime = 0

// Box stuff (move to own file later)
let xbounds = 6
let zbounds = 6
let camOffsetX = 1
let camOffsetZ = 1
let camOffsetY = 1
let oldX = 0
let oldZ = 0
const buildings = new Map()

init()
animate()

///////////////////////////////
///////// Globals /////////////
///////////////////////////////

// Fog
{
  const color = 0x21263a
  const density = 0.11
  scene.fog = new THREE.FogExp2(color, density)
}

function makeBox(h, x, z, pc, sc) {
  let coordKey = x.toString() + '#' + z.toString()
  if (buildings.has(coordKey)) return
  const boxGeo = new THREE.BoxGeometry(0.8, h, 0.8)
  const boxTex = new THREE.MeshPhongMaterial({
    color: pc,
    specular: sc,
  })
  const boxMesh = new THREE.Mesh(boxGeo, boxTex)
  boxMesh.position.set(0 + x, h / 2, 0 + z)
  boxMesh.castShadow = true
  boxMesh.receiveShadow = true
  scene.add(boxMesh)

  buildings.set(coordKey, boxMesh)
}

function withinBounds(cameraX, cameraZ, x, z) {
  return (
    x >= cameraX - xbounds - camOffsetX &&
    x < cameraX + xbounds - camOffsetX &&
    z >= cameraZ - zbounds - camOffsetZ &&
    z < cameraZ + zbounds - camOffsetZ
  )
}

function makeBoxes(centerX, centerZ) {
  for (let i = centerX - xbounds - camOffsetX; i < centerX + xbounds - camOffsetX; i++) {
    for (let j = centerZ - zbounds - camOffsetZ; j < centerZ + zbounds - camOffsetZ; j++) {
      const h = getNoise(i, j, HEIGHT_SEED)
      const pc = getPrimaryColor(i, j, 1, 0.5)
      const sc = getSecondaryColor(i, j, 1, 0.5)
      makeBox(h, i, j, pc, sc)
    }
  }
}

function updateBoxes(scene, camera) {
  // TODO: checking whether boxes are within the boundaries is broken
  let x = Math.round(camera.position.x)
  let z = Math.round(camera.position.z)
  if (x == oldX && z == oldZ) return
  oldX = x
  oldZ = z
  // Clean up irrelevant boxes
  let toDelete = []
  buildings.forEach((object, key, map) => {
    if (!withinBounds(x, z, object.position.x, object.position.z)) {
      scene.remove(object)
      object.geometry.dispose()
      object.material.dispose()
      toDelete.push(key)
    }
  })
  toDelete.forEach((key) => {
    buildings.delete(key)
  })
  //renderer.renderLists.dispose();
  // Generate new boxes
  makeBoxes(x, z)
}

function updateSize(renderer, camera) {
  const factor = 0.01
  const canvas = renderer.domElement
  const w = window.innerWidth
  const h = window.innerHeight
  const needResize = canvas.width !== w || canvas.height !== h
  if (needResize) {
    renderer.setSize(w, h)
    camera.left = (-w / 2) * factor
    camera.right = (w / 2) * factor
    camera.top = (h / 2) * factor
    camera.bottom = (-h / 2) * factor
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    console.log(camera)
  }
  return needResize
}

// INIT
function init() {
  // Setup basic stuff
  screenResolution = new THREE.Vector2(window.innerWidth, window.innerHeight)
  const aspectRatio = screenResolution.x / screenResolution.y
  setupCameraSceneRenderer(aspectRatio)

  // Setup listeners
  setupGamepadAndListeners()
  window.addEventListener('resize', () => updateSize(renderer, camera))

  // Setup geometry

  // Setup lights
  setupLighting(scene, renderer)
}

// ANIMATE
function animate(currTime = 0) {
  requestAnimationFrame(animate)

  stats.begin()

  const deltaTime = currTime - prevTime
  prevTime = currTime

  updateSize(renderer, camera)
  updateCameraMovement(deltaTime, camera)
  updateBoxes(scene, camera)
  updateLighting('todo')

  renderer.render(scene, camera)

  stats.end()
}

// HELPER
function setupCameraSceneRenderer(aspectRatio) {
  // Camera
  camera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, -1, -20, 20)
  camera.zoom = 0.25
  camera.position.set(camOffsetX, camOffsetY, camOffsetZ)
  camera.lookAt(0, 0, 0)
  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x151729)
  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('cityscape'), antialias: false })
  renderer.shadowMap.enabled = true
  renderer.setSize(screenResolution.x, screenResolution.y)
  // Temporary below
  const gridHelper = new THREE.GridHelper()
  scene.add(gridHelper)
  const orbitControls = new OrbitControls(camera, renderer.domElement)
}
