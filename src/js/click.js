import * as THREE from 'three'

var raycaster = new THREE.Raycaster()

var mouse = new THREE.Vector2()
// Setup function: Set up click for bloom effects
export function setupClick(cityscape) {
    function onMouseClick(event) {
        event.preventDefault()
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

        raycaster.setFromCamera(mouse, cityscape.camera)
        var intersects = raycaster.intersectObjects(cityscape.scene.children)
        if (intersects.length > 0) {
            console.log(intersects)
            console.log(intersects[0])
            console.log(intersects[0].callback)
            for (let i of intersects) {
                if (i.callback) callback()
            }
        }
    }
    window.addEventListener('click', onMouseClick, false)
}
