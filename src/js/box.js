import * as THREE from 'three'
import { getNoise, getPrimaryAndSecondaryColorModified, HEIGHT_SEED } from '/js/color'
import { focus } from '/js/movement'
import { generateOutlineMesh } from '/js/outline'

export function clearBox(removeFromScene, { boxMesh, outlineMesh1, outlineMesh2, windows }) {
  removeFromScene(boxMesh)
  boxMesh.geometry.dispose()
  boxMesh.material.dispose()
  removeFromScene(outlineMesh1)
  removeFromScene(outlineMesh2)
  outlineMesh1.geometry.dispose()
  outlineMesh1.material.dispose()
  outlineMesh2.material.dispose()
  for (let { windowMesh } of windows) {
      removeFromScene(windowMesh)
      windowMesh.geometry.dispose()
      windowMesh.material.dispose()
  }
}

export function updateBox({ worldX, worldZ, actualHeight, boxMesh, windows }, scale) {
  boxMesh.position.set(worldX - focus.x, (scale - 0.5) * actualHeight, worldZ - focus.z)
  const numFloors = Math.round(actualHeight * 3)
  for (let { windowMesh, thisX, thisZ, i } of windows) {
    windowMesh.position.set(worldX - focus.x + thisX, (i/numFloors) * actualHeight * scale, worldZ - focus.z + thisZ)
  }
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
  // Window stuff
  const numFloors = Math.round(actualHeight * 3)
  const numWindows = 4
  const windows = []
  for (let i = 0; i <= numFloors; i++) {
      for (let x = 0; x <= numWindows; x++) {
          for (let z = 0; z <= numWindows; z++) {
              if (x != 0 && z != 0 && x != numWindows && z != numWindows) continue
              // todo: fix orientation
              const windowGeometry= new THREE.PlaneGeometry(1, 1, 1, 1, 1, 1)
              const windowMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                specular: 0xffffff,
              })
              const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial)
              const thisX = (x / numWindows - 0.5) * 0.8
              const thisZ = (z / numWindows - 0.5) * 0.8
              windowMesh.scale.set(0.1, 0.1, 0.1)
              windowMesh.position.set(worldX - focus.x + thisX, (i/numFloors) * actualHeight * scale, worldZ - focus.z + thisZ)
              windowMesh.castShadow = true
              windowMesh.receiveShadow = true
              windowMesh.layers.set(1)
              windows.push({windowMesh, thisX, thisZ, i})
              addToScene(windowMesh)
          }
      }
  }
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
    windows
  })
  addToScene(boxMesh)
  boxMesh.layers.enable(0)
  boxMesh.layers.enable(1)
}
