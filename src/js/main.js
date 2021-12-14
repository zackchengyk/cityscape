import '/public/style.css'
import * as THREE from 'three'
import {
  setupGrid,
  updateGrid,
  updateEntities,
  darkenNonGlowingGridCells,
  unDarkenNonGlowingGridCells,
} from '/js/grid'
import { camOffsetX, camOffsetY, camOffsetZ } from '/js/config'
import { setupLighting, updateLighting, darkenPlane, unDarkenPlane } from '/js/lighting'
import { setupGamepadAndListeners, updateMovement } from '/js/movement'
import Stats from '/../node_modules/stats.js/src/Stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

// Stats
const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

// Default params
const params = {
  shadows: true,
  timeOfDay: 12,
}

// Shaders
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`
const fragmentShader = `
  uniform sampler2D boxesTexture;
  uniform sampler2D bloomTexture;
  varying vec2 vUv;
  void main() {
    vec4 boxesColor = texture2D( boxesTexture, vUv );
    if (boxesColor.x < 0.005 && boxesColor.y < 0.005 && boxesColor.z < 0.005) {
      gl_FragColor = boxesColor + 0.2 * texture2D( bloomTexture, vUv );
    } else {
      gl_FragColor = boxesColor + texture2D( bloomTexture, vUv );
    }
  }
`
const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' })

// Important
let screenResolution, camera, scene, renderer
let bloomComposer, shaderComposer
let prevTime = 0
init()
animate()

// Init function
function init() {
  // Setup basic stuff
  screenResolution = new THREE.Vector2(window.innerWidth, window.innerHeight)
  setupCameraSceneRenderer()

  // Setup GUI
  const gui = new GUI()
  gui.add(params, 'timeOfDay', 0, 24)
  gui.add(params, 'shadows')
  gui.open()

  // Setup listeners
  setupGamepadAndListeners()
  window.addEventListener('resize', () => updateSize(renderer, camera))

  // Setup geometry
  setupGrid(scene, camera)

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
  updateMovement(deltaTime)
  updateGrid(scene)
  updateEntities(scene)
  updateLighting(scene, params)

  // Render
  renderer.clear()

  // Render bloom to texture
  renderBloomToTexture()

  // Render (+ outlines) to screen
  camera.layers.set(1)
  shaderComposer.render()
  camera.layers.set(0)

  stats.end()
}

// Setup helper
function setupCameraSceneRenderer() {
  // Dimensions
  const { x: screenX, y: screenY } = screenResolution
  const aspectRatio = screenX / screenY

  // Camera
  camera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, -1, -20, 20)
  camera.zoom = 0.2
  camera.position.set(camOffsetX, camOffsetY, camOffsetZ)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  // Scene
  scene = new THREE.Scene()

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('cityscape') })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.autoClear = false
  renderer.setClearColor(0x1e1a2b)
  renderer.setSize(screenX, screenY)

  // A. Render pass
  const renderPass = new RenderPass(scene, camera)

  // B. Bloom pass
  const unrealBloomPass = new UnrealBloomPass(screenResolution, 2, 0.5, 0.0)

  // Bloom composer (A + B)
  bloomComposer = new EffectComposer(renderer)
  bloomComposer.renderToScreen = false // Will render to bloomComposer.renderTarget2.texture
  bloomComposer.addPass(renderPass)
  bloomComposer.addPass(unrealBloomPass)

  // C. Shader pass
  const shaderPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        boxesTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture },
      },
      vertexShader,
      fragmentShader,
    }),
    'boxesTexture'
  )
  shaderPass.needsSwap = true
  // Shader composer (A + C, dependent on A + B)
  shaderComposer = new EffectComposer(renderer)
  shaderComposer.addPass(renderPass)
  shaderComposer.addPass(shaderPass)

  // Temporary below
  const orbitControls = new OrbitControls(camera, renderer.domElement)
}

// Animation helper
function renderBloomToTexture() {
  // Temporarily swap out clear color
  let tempRendererClearColor = new THREE.Color()
  renderer.getClearColor(tempRendererClearColor)
  renderer.setClearColor('black') // Do not interfere with bloom

  // Go to 'everything' layer
  camera.layers.set(0)

  // Temporarily swap out non-glowing objects' materials
  darkenPlane(darkMaterial)
  darkenNonGlowingGridCells(darkMaterial)

  // Render
  bloomComposer.render()

  // Revert non-glowing objects' materials
  unDarkenNonGlowingGridCells()
  unDarkenPlane()

  // Revert clear color
  renderer.setClearColor(tempRendererClearColor)
}

// Resize helper
function updateSize(renderer, camera) {
  const canvas = renderer.domElement
  const w = window.innerWidth
  const h = window.innerHeight
  const needResize = canvas.width !== w || canvas.height !== h
  if (needResize) {
    screenResolution.set(h, w)
    const aspectRatio = w / h
    camera.left = -aspectRatio
    camera.right = aspectRatio
    renderer.setSize(w, h)
    bloomComposer.setSize(w, h)
    shaderComposer.setSize(w, h)
    camera.updateProjectionMatrix()
  }
  return needResize
}
