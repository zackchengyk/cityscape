import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { MIN_ZOOM, MAX_ZOOM } from '/js/config'
import { setMaxSpeed } from '/js/movement'
import { makeNewShaderPass } from '/js/setup'

export function setupGUI(cityscape) {
  // Start up
  const parameters = {
    autorun: false,
    scene: 'Bloom + Scene',
    timeOfDay: 12,
    shadows: true,
    // Blob
    blobRadius: 4,
    maxSpeed: 0.075,
    // Camera / Renderer
    exposure: 1.02,
    zoom: 0.25,
    autoRotate: false,
    autoRotateSpeed: 0.2,
    // Lighting
    windowEmissivity: 1,
    ambientLightIntensity: 0.4,
    dirLightIntensity: 0.6,
    bloomWindowEmissivity: 0,
    bloomAmbientLightIntensity: 0,
    bloomDirLightIntensity: 0,
    // Bloom
    bloomStrength: 1.5,
    bloomRadius: 0,
    bloomThreshold: 0.075,
    // Weather
    rain: false,
    windSpeed: 1 / 50,
    cloudSpawnProbability: 0.05,
    cloudOpacity: 0.25,
    giveCloudsBloom: true, // Must start true!
  }
  const gui = new GUI()

  // Unorganized parameters
  gui.add(parameters, 'autorun')
  gui.add(parameters, 'scene', ['Bloom + Scene', 'Bloom only', 'Scene only', 'Cloud only']).onChange((v) => {
    let newRenderType = 0
    switch (v) {
      case 'Bloom only': {
        newRenderType = 1
        break
      }
      case 'Scene only': {
        newRenderType = 2
        break
      }
      case 'Cloud only': {
        newRenderType = 3
        break
      }
    }
    cityscape.shaderComposer.removePass(cityscape.shaderComposer.passes[1])
    cityscape.shaderComposer.addPass(makeNewShaderPass(cityscape, { renderType: { value: newRenderType } }))
  })

  // Unorganized parameters
  gui.add(parameters, 'timeOfDay', 0, 24)
  gui.add(parameters, 'shadows')

  // Blob
  const blobParametersFolder = gui.addFolder('Blob')
  blobParametersFolder.add(parameters, 'blobRadius', 0, 12).step(1)
  blobParametersFolder.add(parameters, 'maxSpeed', 0.025, 1).onChange((v) => setMaxSpeed(v))

  // Camera / renderer parameters
  const cameraParametersFolder = gui.addFolder('Camera / Renderer')
  cameraParametersFolder.add(parameters, 'exposure', 0, 2).onChange((v) => {
    cityscape.renderer.toneMappingExposure = v
  })
  cameraParametersFolder.add(parameters, 'zoom', MIN_ZOOM, MAX_ZOOM)
  cameraParametersFolder.add(parameters, 'autoRotate').onChange((v) => {
    cityscape.orbitControls.autoRotate = v
  })
  cameraParametersFolder.add(parameters, 'autoRotateSpeed', 0, 20).onChange((v) => {
    cityscape.orbitControls.autoRotateSpeed = v
  })

  // Lighting parameters
  const lightParametersFolder = gui.addFolder('Lighting')
  lightParametersFolder.add(parameters, 'windowEmissivity', 0, 2)
  lightParametersFolder.add(parameters, 'ambientLightIntensity', 0, 2)
  lightParametersFolder.add(parameters, 'dirLightIntensity', 0, 2)
  lightParametersFolder.add(parameters, 'bloomWindowEmissivity', 0, 2)
  lightParametersFolder.add(parameters, 'bloomAmbientLightIntensity', 0, 2)
  lightParametersFolder.add(parameters, 'bloomDirLightIntensity', 0, 2)

  // Bloom parameters
  const bloomParametersFolder = gui.addFolder('Bloom')
  bloomParametersFolder.add(parameters, 'bloomStrength', 0, 3).onChange((v) => {
    cityscape.bloomComposer.passes[1].strength = v
  })
  bloomParametersFolder.add(parameters, 'bloomRadius', 0, 1).onChange((v) => {
    cityscape.bloomComposer.passes[1].radius = v
  })
  bloomParametersFolder.add(parameters, 'bloomThreshold', 0, 2).onChange((v) => {
    cityscape.bloomComposer.passes[1].threshold = v
  })

  // Weather
  const weatherParametersFolder = gui.addFolder('Weather')
  weatherParametersFolder.add(parameters, 'rain')
  weatherParametersFolder.add(parameters, 'windSpeed', 0, 0.5)
  weatherParametersFolder.add(parameters, 'cloudSpawnProbability', 0, 0.2)
  weatherParametersFolder.add(parameters, 'cloudOpacity', 0, 1).onChange((v) => {
    cityscape.shaderComposer.removePass(cityscape.shaderComposer.passes[1])
    cityscape.shaderComposer.addPass(makeNewShaderPass(cityscape, { cloudOpacity: { value: v } }))
  })
  let tempPass = undefined
  weatherParametersFolder.add(parameters, 'giveCloudsBloom').onChange((v) => {
    if (v) {
      cityscape.cloudComposer.addPass(tempPass)
    } else {
      tempPass = cityscape.cloudComposer.passes[1]
      cityscape.cloudComposer.removePass(tempPass)
    }
  })

  // Finish
  cityscape.params = parameters
  gui.open()
  cityscape.gui = gui
}
