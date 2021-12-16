import * as THREE from 'three'
import { updateGrid, enableBloomModeGrid, disableBloomModeGrid } from '/js/grid'
import { updateEntities } from '/js/streets'
import { updateLighting, enableBloomModeLighting, disableBloomModeLighting } from '/js/lighting'
import { updateMovement } from '/js/movement'
import { updateRain, updateClouds } from '/js/weather'

let prevTime = 0

// Animate function
export function animate(cityscape, currTime) {
  requestAnimationFrame((t) => animate(cityscape, t))

  cityscape.stats.begin()

  const deltaTime = currTime - prevTime
  prevTime = currTime

  // Increment time
  if (cityscape.params.autorun) {
    cityscape.params.timeOfDay += deltaTime / 500
    cityscape.params.timeOfDay = cityscape.params.timeOfDay % 24
  }

  // Update things
  updateSize(cityscape)
  cityscape.orbitControls.update()
  updateMovement(cityscape, deltaTime)
  updateGrid(cityscape)
  updateEntities(cityscape)
  updateLighting(cityscape)
  updateRain(cityscape)
  updateClouds(cityscape)

  // Render bloom to texture
  renderBloomToTexture(cityscape)

  // Render (+ outlines) to screen
  renderToScreen(cityscape)

  // Update display
  cityscape.gui.children.forEach((x) => {
    if (x.children) {
      x.children.forEach((y) => y.updateDisplay())
    } else {
      x.updateDisplay()
    }
  })

  cityscape.stats.end()
}

// Animate helper
function renderBloomToTexture(cityscape) {
  // Go to 'everything' layer
  cityscape.camera.layers.set(0)

  // Temporarily swap out clear color
  let tempRendererClearColor = new THREE.Color()
  cityscape.renderer.getClearColor(tempRendererClearColor)
  cityscape.renderer.setClearColor('black') // Do not interfere with bloom

  // Temporarily swap out non-glowing objects' materials
  enableBloomModeLighting(cityscape)
  enableBloomModeGrid(cityscape)

  // Render
  cityscape.bloomComposer.render()

  // Revert non-glowing objects' materials
  disableBloomModeLighting(cityscape)
  disableBloomModeGrid(cityscape)

  // Revert clear color
  cityscape.renderer.setClearColor(tempRendererClearColor)
}

// Animate helper
function renderToScreen(cityscape) {
  // Go to layer with outline-boxes
  cityscape.camera.layers.set(1)

  // Render
  cityscape.shaderComposer.render()
}

// Resize helper
function updateSize(cityscape) {
  const canvas = cityscape.renderer.domElement
  const w = cityscape.container.clientWidth
  const h = cityscape.container.clientHeight
  const needResize = canvas.width !== w || canvas.height !== h
  if (needResize) {
    cityscape.screenResolution.set(h, w)
    const aspectRatio = w / h
    cityscape.camera.left = -aspectRatio
    cityscape.camera.right = aspectRatio
    cityscape.renderer.setSize(w, h)
    cityscape.bloomComposer.setSize(w, h)
    cityscape.shaderComposer.setSize(w, h)
    cityscape.camera.updateProjectionMatrix()
  }
  return needResize
}
