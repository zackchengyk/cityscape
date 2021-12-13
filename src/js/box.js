import * as THREE from 'three'
import { outlineScene } from './outline'
import { getNoise, getPrimaryColor, getSecondaryColor, HEIGHT_SEED } from '/js/color'
import { focus } from '/js/movement'
import { generateOutlineMesh } from '/js/outline'

export function clearBox(removeFromScene, { boxMesh, outlineMesh1, outlineMesh2 }) {
  removeFromScene(boxMesh)
  boxMesh.geometry.dispose()
  boxMesh.material.dispose()
  outlineScene.remove(outlineMesh1)
  outlineScene.remove(outlineMesh2)
  outlineMesh1.geometry.dispose()
  outlineMesh1.material.dispose()
  outlineMesh2.material.dispose()
}

export function updateBox({ worldX, worldZ, actualHeight, boxMesh }, scale) {
  boxMesh.position.set(worldX - focus.x, (scale - 0.5) * actualHeight, worldZ - focus.z)
}

export function fillWithBox(addToScene, addToGridCellMap, worldX, worldZ, scale) {
  // Get random values
  const actualHeight = Math.ceil(getNoise(worldX, worldZ, HEIGHT_SEED) * 2) / 2
  const height = actualHeight * scale
  const pc = getPrimaryColor(worldX, worldZ, 1, 0.5)
  const sc = getSecondaryColor(worldX, worldZ, 1, 0.5)
  // Box
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1)
  const boxMaterial = new THREE.MeshPhongMaterial({
    color: pc,
    specular: sc,
    stencilWrite: true,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilRef: 1,
    stencilFuncMask: 0xff,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
  })
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial)
  boxMesh.scale.set(0.8, actualHeight, 0.8)
  boxMesh.position.set(worldX - focus.x, (scale - 0.5) * actualHeight, worldZ - focus.z)
  // Shadow stuff
  boxMesh.castShadow = true
  boxMesh.receiveShadow = true
  // Outline stuff
  const [outlineMesh1, outlineMesh2] = generateOutlineMesh(boxMesh, actualHeight)
  // Add to map and scene
  addToGridCellMap({
    type: 'box',
    worldX,
    worldZ,
    actualHeight,
    boxMesh,
    outlineMesh1,
    outlineMesh2,
  })
  addToScene(boxMesh)
}
