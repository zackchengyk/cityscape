import * as THREE from 'three'
import { getNoise, getPrimaryColor, getSecondaryColor, HEIGHT_SEED } from '/js/color'
import { focus } from '/js/movement'
import { generateOutlineMesh } from '/js/outline'

export function clearBox(removeFromScene, { boxMesh, outlineMesh }) {
  removeFromScene(boxMesh)
  boxMesh.geometry.dispose()
  boxMesh.material.dispose()
  removeFromScene(outlineMesh)
  outlineMesh.geometry.dispose()
  outlineMesh.material.dispose()
}

export function updateBox({ worldX, worldZ, actualHeight, boxMesh }, scale) {
  const height = actualHeight * scale
  boxMesh.scale.y = height
  boxMesh.position.set(worldX - focus.x, height / 2, worldZ - focus.z)
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
  })
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial)
  boxMesh.scale.set(0.8, height, 0.8)
  boxMesh.position.set(worldX - focus.x, height / 2, worldZ - focus.z)
  // Shadow stuff
  boxMesh.castShadow = true
  boxMesh.receiveShadow = true
  // Outline stuff
  const outlineMesh = generateOutlineMesh(boxMesh)
  // Add to map and scene
  addToGridCellMap({
    type: 'box',
    worldX,
    worldZ,
    actualHeight,
    boxMesh,
    outlineMesh,
  })
  addToScene(boxMesh)
  addToScene(outlineMesh)
}
