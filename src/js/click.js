import * as THREE from 'three'

var raycaster = new THREE.Raycaster()

var mouse = new THREE.Vector2()
// Setup function: Set up click for bloom effects
export function setupClick(_) {
  window.addEventListener('click', onMouseClick, false)
}

function onMouseClick(event) {
  event.preventDefault()
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  var intersects = raycaster.intersectObjects(scene.children)
  if (intersects.length > 0) {
    var object = intersects[0].object
    if (object.type === 'BoxMesh') object.layers.toggle(1)
    render()
  }
}
