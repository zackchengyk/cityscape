import * as THREE from 'three'
import { getNoise, getPrimaryAndSecondaryColorModified, HEIGHT_SEED } from '/js/color'
import { focus } from '/js/movement'
import { generateOutlineMesh } from '/js/outline'

export function clearBox(removeFromScene, { boxMesh, outlineMesh1, outlineMesh2 }) {
  removeFromScene(boxMesh)
  boxMesh.geometry.dispose()
  boxMesh.material.dispose()
  removeFromScene(outlineMesh1)
  removeFromScene(outlineMesh2)
  outlineMesh1.geometry.dispose()
  outlineMesh1.material.dispose()
  outlineMesh2.material.dispose()
}

export function updateBox({ worldX, worldZ, actualHeight, boxMesh }, scale) {
  boxMesh.position.set(worldX - focus.x, (scale - 0.5) * actualHeight, worldZ - focus.z)
}

const boxMaterialBaseParameters = {
  stencilWrite: true,
  stencilFunc: THREE.AlwaysStencilFunc,
  stencilRef: 1,
  stencilFuncMask: 0xff,
  stencilFail: THREE.KeepStencilOp,
  stencilZFail: THREE.KeepStencilOp,
  stencilZPass: THREE.ReplaceStencilOp,
}
export function fillWithBox(addToScene, addToGridCellMap, worldX, worldZ, scale) {
  // Get random values
  const actualHeight = Math.ceil(getNoise(worldX, worldZ, HEIGHT_SEED) * 2) / 2
  const [pc, sc] = getPrimaryAndSecondaryColorModified(worldX, worldZ, 1, 0.5)
  // Box
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1)
  const boxMaterial = new THREE.MeshPhongMaterial({
    color: pc,
    specular: sc,
    ...boxMaterialBaseParameters,
  })
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial)
  boxMesh.scale.set(0.8, actualHeight, 0.8)
  boxMesh.position.set(worldX - focus.x, (scale - 0.5) * actualHeight, worldZ - focus.z)
  // Shadow stuff
  boxMesh.castShadow = true
  boxMesh.receiveShadow = true
  // Outline stuff
  const [outlineMesh1, outlineMesh2] = generateOutlineMesh(boxMesh, actualHeight)
  addToScene(outlineMesh1)
  addToScene(outlineMesh2)
  outlineMesh1.layers.set(1)
  outlineMesh2.layers.set(1)
  outlineMesh2.renderOrder = -998
  // Add to map and scene
  addToGridCellMap({
    type: 'box',
    worldX,
    worldZ,
    isGlowing: Math.random() < 0.25,
    actualHeight,
    boxMesh,
    outlineMesh1,
    outlineMesh2,
  })
  addToScene(boxMesh)
  boxMesh.layers.enable(0)
  boxMesh.layers.enable(1)
}
