import * as THREE from '../../node_modules/three/src/Three'

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Setup function: Set up click for changing glow effect
export function setupClick(cityscape) {
  // Possible todo: prevent click after drag and hold
  function onMouseClick(event) {
    event.preventDefault()
    const rect = cityscape.canvas.getBoundingClientRect()
    // Get canvas-space coordinates (-1 to 1), top left is (-1, -1)
    mouse.x = THREE.MathUtils.mapLinear(event.clientX - rect.left, 0, cityscape.canvas.clientWidth, -1, 1)
    mouse.y = -THREE.MathUtils.mapLinear(event.clientY - rect.top, 0, cityscape.canvas.clientHeight, -1, 1)
    // Ray-cast
    raycaster.setFromCamera(mouse, cityscape.camera)
    raycaster.layers.set(2)
    const intersects = raycaster.intersectObjects(cityscape.scene.children)
    for (let i of intersects) {
      if (i?.object?.callback) {
        i.object.callback()
        break
      }
    }
  }
  cityscape.canvas.addEventListener('click', onMouseClick, false)
}
