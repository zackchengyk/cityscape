import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

// Todo, @Jessie?
// easy:   add more "simple" params, whose values are simply read by other things
// medium: add more "medium" params, which require simple functions to be called when
//           their values change (e.g. camera.zoom => must call camera.updateProjectionMatrix)
// hard:   add "hard" params, which require very complex, possibly custom functions to be
//           called (e.g. blob radius decreases => clean up unnecessary grid cells)

export function setupGUI(cityscape) {
  // Start up
  const parameters = {
    scene: 'Bloom + Scene',
    timeOfDay: 12,
    shadows: true,
    rain: false,
    blobRadius: 4,
    exposure: 1,
    bloomStrength: 2,
    bloomRadius: 0,
    bloomThreshold: 0,
  }
  const gui = new GUI()
  gui.domElement.style = 'font-size: 1em'

  // Unorganized parameters
  gui.add(parameters, 'scene', ['Bloom + Scene', 'Bloom only', 'Scene only']).onChange((v) => {
    const existingShaderMaterial = cityscape.shaderComposer.passes[1].material.clone()
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
    }
    existingShaderMaterial.uniforms = {
      renderType: { value: newRenderType },
      boxesTexture: { value: null },
      bloomTexture: { value: cityscape.bloomComposer.renderTarget2.texture },
    }
    cityscape.shaderComposer.removePass(cityscape.shaderComposer.passes[1])
    cityscape.shaderComposer.addPass(new ShaderPass(existingShaderMaterial, 'boxesTexture'))
  })
  gui.add(parameters, 'blobRadius', 0, 8).step(1)

  // Unorganized parameters
  gui.add(parameters, 'timeOfDay', 0, 24)
  gui.add(parameters, 'shadows')
  gui.add(parameters, 'rain')

  // Lighting parameters
  const bloomParametersFolder = gui.addFolder('Bloom Parameters')
  bloomParametersFolder.add(parameters, 'exposure', 0, 3).onChange((v) => {
    cityscape.renderer.toneMappingExposure = Math.pow(v, 4.0)
  })
  bloomParametersFolder.add(parameters, 'bloomStrength', 0, 3).onChange((v) => {
    cityscape.bloomComposer.passes[1].strength = v
  })
  bloomParametersFolder.add(parameters, 'bloomRadius', 0, 1).onChange((v) => {
    cityscape.bloomComposer.passes[1].radius = v
  })
  bloomParametersFolder.add(parameters, 'bloomThreshold', 0, 1).onChange((v) => {
    cityscape.bloomComposer.passes[1].threshold = v
  })

  // Finish
  cityscape.params = parameters
  gui.open()
}
