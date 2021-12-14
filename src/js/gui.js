import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

// Todo, @Jessie?
// easy:   add more "simple" params, whose values are simply read by other things
// medium: add more "medium" params, which require simple functions to be called when
//           their values change (e.g. camera.zoom => must call camera.updateProjectionMatrix)
// hard:   add "hard" params, which require very complex, possibly custom functions to be
//           called (e.g. blob radius decreases => clean up unnecessary grid cells)

export function setupGUI(cityscape) {
  cityscape.params = { shadows: true, timeOfDay: 12, rain: false }
  const gui = new GUI()
  gui.domElement.style = "font-size: 1em"
  gui.add(cityscape.params, 'timeOfDay', 0, 24)
  gui.add(cityscape.params, 'shadows')
  gui.add(cityscape.params, 'rain')
  gui.open()
}
