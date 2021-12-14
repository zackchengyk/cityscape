import '/public/style.css'
import { animate } from '/js/animate'
import { setup } from '/js/setup'

const cityscape = {
  container: document.getElementById('container'),
  canvas: document.getElementById('cityscape'),
  screenResolution: undefined,
  camera: undefined,
  scene: undefined,
  renderer: undefined,
  bloomComposer: undefined,
  shaderComposer: undefined,
  params: undefined,
  stats: undefined, // Temporary
}

setup(cityscape)
animate(cityscape, 0)
