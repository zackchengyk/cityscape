import * as THREE from 'three'
import { camOffsetX, camOffsetY, camOffsetZ } from '/js/config'
import { setupGrid } from '/js/grid'
import { setupLighting } from '/js/lighting'
import { setupGamepadAndListeners } from '/js/movement'

import Stats from '/../node_modules/stats.js/src/Stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

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
  cityscape.screenResolution = new THREE.Vector2(window.innerWidth, window.innerHeight)
  setupCameraSceneRenderer(cityscape)

  // Setup GUI
  cityscape.params = { shadows: true, timeOfDay: 12 }
  const gui = new GUI()
  gui.add(cityscape.params, 'timeOfDay', 0, 24)
  gui.add(cityscape.params, 'shadows')
  gui.open()

  // Setup listeners
  setupGamepadAndListeners()

  // Setup geometry
  setupGrid(cityscape.scene, cityscape.camera)

  // Setup lights
  setupLighting(cityscape.scene, cityscape.renderer)
}

// Setup helper
function setupCameraSceneRenderer(cityscape) {
  // Dimensions
  const { x: screenX, y: screenY } = cityscape.screenResolution
  const aspectRatio = screenX / screenY

  // Camera
  cityscape.camera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, -1, -20, 20)
  cityscape.camera.zoom = 0.2
  cityscape.camera.position.set(camOffsetX, camOffsetY, camOffsetZ)
  cityscape.camera.lookAt(0, 0, 0)
  cityscape.camera.updateProjectionMatrix()

  // Scene
  cityscape.scene = new THREE.Scene()

  // Renderer
  cityscape.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('cityscape') })
  cityscape.renderer.setPixelRatio(window.devicePixelRatio)
  cityscape.renderer.autoClear = false
  cityscape.renderer.setClearColor(0x1e1a2b)
  cityscape.renderer.setSize(screenX, screenY)

  // A. Render pass
  const renderPass = new RenderPass(cityscape.scene, cityscape.camera)

  // B. Bloom pass
  const unrealBloomPass = new UnrealBloomPass(cityscape.screenResolution, 2, 0.5, 0.0)

  // Bloom composer (A + B)
  cityscape.bloomComposer = new EffectComposer(cityscape.renderer)
  cityscape.bloomComposer.renderToScreen = false // Will render to cityscape.bloomComposer.renderTarget2.texture
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
    'boxesTexture'
  )
  shaderPass.needsSwap = true
  // Shader composer (A + C, dependent on A + B)
  cityscape.shaderComposer = new EffectComposer(cityscape.renderer)
  cityscape.shaderComposer.addPass(renderPass)
  cityscape.shaderComposer.addPass(shaderPass)

  // Temporary below
  const orbitControls = new OrbitControls(cityscape.camera, cityscape.renderer.domElement)
}
