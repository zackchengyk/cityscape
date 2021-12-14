import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

// Todo, @Jessie?
// easy:   add more "simple" params, whose values are simply read by other things
// medium: add more "medium" params, which require simple functions to be called when
//           their values change (e.g. camera.zoom => must call camera.updateProjectionMatrix)
// hard:   add "hard" params, which require very complex, possibly custom functions to be
//           called (e.g. blob radius decreases => clean up unnecessary grid cells)

export function setupGUI(cityscape) {
  // Start up
  const parameters = {
    timeOfDay: 12,
    shadows: true,
    rain: false,
    exposure: 1,
    bloomStrength: 1,
    bloomRadius: 0,
    bloomThreshold: 0,
  }
  const gui = new GUI()
  gui.domElement.style = 'font-size: 1em'

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
