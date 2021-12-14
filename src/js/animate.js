import * as THREE from 'three'
import { darkMaterial } from './config'
import { updateGrid, updateEntities, darkenNonGlowingGridCells, unDarkenNonGlowingGridCells } from '/js/grid'
import { updateLighting, darkenPlane, unDarkenPlane } from '/js/lighting'
import { updateMovement } from '/js/movement'

let prevTime = 0

// Animate function
export function animate(cityscape, currTime) {
  requestAnimationFrame((t) => animate(cityscape, t))

  cityscape.stats.begin()

  const deltaTime = currTime - prevTime
  prevTime = currTime

  updateSize(cityscape)
  updateMovement(deltaTime)
  updateGrid(cityscape.scene)
  updateEntities(cityscape.scene)
  updateLighting(cityscape.scene, cityscape.params)

  // Render
  cityscape.renderer.clear()

  // Render bloom to texture
  renderBloomToTexture(cityscape)

  // Render (+ outlines) to screen
  cityscape.camera.layers.set(1)
  cityscape.shaderComposer.render()
  cityscape.camera.layers.set(0)

  cityscape.stats.end()
}

// Animate helper
function renderBloomToTexture(cityscape) {
  // Temporarily swap out clear color
  let tempRendererClearColor = new THREE.Color()
  cityscape.renderer.getClearColor(tempRendererClearColor)
  cityscape.renderer.setClearColor('black') // Do not interfere with bloom

  // Go to 'everything' layer
  cityscape.camera.layers.set(0)

  // Temporarily swap out non-glowing objects' materials
  darkenPlane(darkMaterial)
  darkenNonGlowingGridCells(darkMaterial)

  // Render
  cityscape.bloomComposer.render()

  // Revert non-glowing objects' materials
  unDarkenNonGlowingGridCells()
  unDarkenPlane()

  // Revert clear color
  cityscape.renderer.setClearColor(tempRendererClearColor)
}

// Resize helper
function updateSize(cityscape) {
  const canvas = cityscape.renderer.domElement
  const w = window.innerWidth
  const h = window.innerHeight
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
