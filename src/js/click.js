import * as THREE from 'three'

var raycaster = new THREE.Raycaster()

var mouse = new THREE.Vector2()
// Setup function: Set up click for bloom effects
export function setupClick(cityscape) {
    function onMouseClick(event) {
        event.preventDefault()
        mouse.x = THREE.MathUtils.mapLinear(event.clientX - cityscape.canvas.getBoundingClientRect().left, 0, cityscape.canvas.clientWidth, -1, 1)
        mouse.y = -THREE.MathUtils.mapLinear(event.clientY - cityscape.canvas.getBoundingClientRect().top, 0, cityscape.canvas.clientHeight, -1, 1)

        raycaster.setFromCamera(mouse, cityscape.camera)
        var intersects = raycaster.intersectObjects(cityscape.scene.children)
        if (intersects.length > 0) {
            for (let i of intersects) {
                if (i?.object?.callback) i.object.callback()
            }
        }
    }
    window.addEventListener('click', onMouseClick, false)
}
