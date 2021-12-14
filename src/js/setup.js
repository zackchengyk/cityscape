import * as THREE from 'three'
import { setupGrid } from '/js/grid'
import { setupGUI } from '/js/gui'
import { setupLighting } from '/js/lighting'
import { setupGamepadAndListeners } from '/js/movement'

import Stats from '/../node_modules/stats.js/src/Stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

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

// Setup function
export function setup(cityscape) {
  // Stats
  cityscape.stats = new Stats()
  cityscape.stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(cityscape.stats.dom)

  // Setup basic stuff
  setupCameraSceneRendererComposer(cityscape)

  // Setup GUI
  setupGUI(cityscape)

  // Setup listeners
  setupGamepadAndListeners()

  // Setup geometry
  setupGrid(cityscape.scene, cityscape.camera)

  // Setup lights
  setupLighting(cityscape.scene, cityscape.renderer)
}

// Setup helper
function setupCameraSceneRendererComposer(cityscape) {
  // Dimensions
  const screenX = cityscape.container.clientWidth
  const screenY = cityscape.container.clientHeight
  cityscape.screenResolution = new THREE.Vector2(screenX, screenY)
  const aspectRatio = screenX / screenY

  // Camera
  cityscape.camera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, -1, -20, 20)
  cityscape.camera.zoom = 0.2 // todo GUI?: make into GUI-changeable value, with some default and some range, in a file with all the others
  cityscape.camera.position.set(1, 1, 1)
  cityscape.camera.lookAt(0, 0, 0)
  cityscape.camera.updateProjectionMatrix()

  // Scene
  cityscape.scene = new THREE.Scene()

  // Renderer
  cityscape.renderer = new THREE.WebGLRenderer({ canvas: cityscape.canvas })
  cityscape.renderer.setPixelRatio(window.devicePixelRatio) // todo GUI?
  cityscape.renderer.setClearColor(0x1e1a2b) // todo GUI?: make into GUI-changeable value, with some default, in a file with all the others
  cityscape.renderer.setSize(screenX, screenY)

  // A. Render pass
  const renderPass = new RenderPass(cityscape.scene, cityscape.camera)

  // B. Bloom pass
  const unrealBloomPass = new UnrealBloomPass(cityscape.screenResolution, 1, 0, 0)

  // Bloom composer (A + B)
  cityscape.bloomComposer = new EffectComposer(cityscape.renderer)
  cityscape.bloomComposer.renderToScreen = false // will render to cityscape.bloomComposer.renderTarget2.texture
  cityscape.bloomComposer.addPass(renderPass)
  cityscape.bloomComposer.addPass(unrealBloomPass)

  // C. Shader pass
  const shaderPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        boxesTexture: { value: null },
        bloomTexture: { value: cityscape.bloomComposer.renderTarget2.texture },
      },
      vertexShader,
      fragmentShader,
    }),
    'boxesTexture' // texture from its own earlier passes
  )

  // Shader composer (A + C, dependent on A + B)
  cityscape.shaderComposer = new EffectComposer(cityscape.renderer)
  cityscape.shaderComposer.addPass(renderPass)
  cityscape.shaderComposer.addPass(shaderPass)

  // Temporary below
  const orbitControls = new OrbitControls(cityscape.camera, cityscape.renderer.domElement)
}
