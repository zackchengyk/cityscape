import * as THREE from 'three'
import { getNoise, getPrimaryAndSecondaryColorModified, HEIGHT_SEED } from '/js/color'
import { darkMaterial } from '/js/config'
import { focus } from '/js/movement'
import { generateOutlineMesh } from '/js/outline'

export function enableBloomModeBox(cityscape, v) {
  if (!v.isGlowing) {
    v.storedMaterial = v.boxMesh.material
    v.boxMesh.material = darkMaterial
  }
  if (cityscape.params.bloomWindowEmissivity != null) {
    windowMaterial.emissiveIntensity = cityscape.params.bloomWindowEmissivity
  }
}

export function disableBloomModeBox(cityscape, v) {
  if (!v.isGlowing) {
    v.boxMesh.material = v.storedMaterial
    v.storedMaterial = undefined
  }
  if (cityscape.params.windowEmissivity != null) {
    windowMaterial.emissiveIntensity = cityscape.params.windowEmissivity
  }
}

export function clearBox(removeFromScene, { boxMesh, outlineMesh1, outlineMesh2, windowGroup }) {
  removeFromScene(boxMesh)
  boxMesh.geometry.dispose()
  boxMesh.material.dispose()
  removeFromScene(outlineMesh1)
  removeFromScene(outlineMesh2)
  outlineMesh1.geometry.dispose()
  outlineMesh1.material.dispose()
  outlineMesh2.material.dispose()

  windowGroup.children.forEach((child) => {
    removeFromScene(child)
    child.geometry.dispose()
    child.material.dispose()
  })
  removeFromScene(windowGroup)
}

export function updateBox({ worldX, worldZ, actualHeight, boxMesh, windowGroup }, scale) {
  boxMesh.position.set(worldX - focus.x, (scale - 0.5) * actualHeight, worldZ - focus.z)
  windowGroup.position.copy(boxMesh.position)
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
  const actualWidth = 0.8 // is a magic number still magic if it has a variable name 🤔
  const [pc, sc] = getPrimaryAndSecondaryColorModified(worldX, worldZ, 1, 0.5)
  // Box
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1)
  const boxMaterial = new THREE.MeshPhongMaterial({
    color: pc,
    specular: sc,
    shininess: 40,
    ...boxMaterialBaseParameters,
  })
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial)
  boxMesh.scale.set(actualWidth, actualHeight, actualWidth)
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
  const windowGroup = generateWindowGroup(actualHeight, actualWidth)
  windowGroup.position.copy(boxMesh.position)
  if (windowGroup) addToScene(windowGroup)
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
    windowGroup,
  })
  addToScene(boxMesh)
  boxMesh.layers.enable(0)
  boxMesh.layers.enable(1)
}

// Todo? perhaps these should be GUI variables
const heightPerFloor = 1 / 4
const offsetFromGround = 1 / 8
const offsetFromSide = 1 / 8
const windowGeometry = new THREE.PlaneGeometry(0.065, 0.07, 1, 1)
const windowMaterial = new THREE.MeshLambertMaterial({
  emissive: 0xffffff,
  emissiveIntensity: 0.2,
})

// Helper
function generateWindowGroup(actualHeight, actualWidth) {
  const numberOfFloors = Math.floor(actualHeight / heightPerFloor)
  const windowsPerFloor = THREE.MathUtils.randInt(3, 10) // Todo? make this deterministic, and a nicer distribution
  const halfHeight = actualHeight / 2
  const halfWidth = actualWidth / 2
  const windowsPerFloorMinusOne = windowsPerFloor - 1

  // Helper function to reduce computations
  const temp1 = -halfWidth + offsetFromSide
  const temp2 = (actualWidth - offsetFromSide - offsetFromSide) / windowsPerFloorMinusOne
  const windowNumberToBuildingX = (n) => temp1 + temp2 * n

  const windowGroup = new THREE.Group()
  // For each face
  for (let face = 0; face < 4; face++) {
    // Rotate the thing, then attach to the next face
    windowGroup.rotateY((face * Math.PI) / 2)
    // For each floor
    for (let floor = 0; floor < numberOfFloors; floor++) {
      // For each window
      for (let windowNumber = 0; windowNumber < windowsPerFloor; windowNumber++) {
        const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial)
        const buildingY = offsetFromGround - halfHeight + floor * heightPerFloor
        const buildingX = windowNumberToBuildingX(windowNumber)
        const buildingZ = halfWidth + 0.01
        windowMesh.position.set(buildingX, buildingY, buildingZ)
        windowMesh.layers.enable(1)
        windowGroup.attach(windowMesh)
      }
    }
  }
  return windowGroup
}
