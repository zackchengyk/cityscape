import * as THREE from 'three'
import { clearBox, updateBox, fillWithBox } from '/js/box'
import { focus, getSpeed } from '/js/movement'
import { isStreetPosition } from '/js/streets'
import { BLOB_RADIUS } from '/js/config'

// Important
const gridCellMap = new Map()
const BLOB_RADIUS_SQUARED = BLOB_RADIUS * BLOB_RADIUS
const BOUND_X = BLOB_RADIUS
const BOUND_Z = BLOB_RADIUS

// TODO: REFACTOR
export function darkenNonGlowingGridCells(darkMaterial) {
  gridCellMap.forEach((v) => {
    if (!v.isGlowing) {
      v.storedMaterial = v.boxMesh.material
      v.boxMesh.material = darkMaterial
    }
  })
}
export function unDarkenNonGlowingGridCells() {
  gridCellMap.forEach((v, k) => {
    if (!v.isGlowing) {
      v.boxMesh.material = v.storedMaterial
      v.storedMaterial = undefined
    }
  })
}

// Setup function
export function setupGrid(cityscape) {
  updateGrid(cityscape)
}

// Animate function
let prevFocusX = Infinity
let prevFocusZ = Infinity
export function updateGrid(cityscape) {
  // Note: this ASSUMES that all visible grid cells are within [-boundX, boundX], [-boundZ, boundZ]

  // Get position
  const { x: focusX, z: focusZ } = focus

  // Debounce recalculation things
  const updateThreshold = Math.max(getSpeed() * 0.5, 0.002)
  if (Math.abs(focusX - prevFocusX) < updateThreshold && Math.abs(focusZ - prevFocusZ) < updateThreshold) {
    return
  }
  prevFocusX = focusX
  prevFocusZ = focusZ

  // Get ready to iterate over grid cells
  const roundedFocusX = Math.round(focusX)
  const roundedFocusZ = Math.round(focusZ)
  const kvPairsToDelete = []

  // Iterate over grid cells
  for (let worldX = roundedFocusX - BOUND_X; worldX <= roundedFocusX + BOUND_X; worldX++) {
    for (let worldZ = roundedFocusZ - BOUND_Z; worldZ <= roundedFocusZ + BOUND_Z; worldZ++) {
      const scale = withinBounds(worldX, worldZ)
      const gridCellKey = xzToKey(worldX, worldZ)
      if (scale > 0) {
        if (gridCellMap.has(gridCellKey)) {
          // Update currently occupied grid cell
          updateGridCell(gridCellMap.get(gridCellKey), scale)
        } else {
          // Fill currently empty grid cell
          fillGridCell(cityscape.scene, worldX, worldZ, scale, gridCellKey)
        }
      } else if (gridCellMap.has(gridCellKey)) {
        // Clear currently occupied grid cell
        clearGridCell(cityscape.scene, gridCellMap.get(gridCellKey))
        kvPairsToDelete.push(gridCellKey)
      }
    }
  }
  kvPairsToDelete.forEach((key) => gridCellMap.delete(key))
}

// Helpers for updateGrid
function clearGridCell(scene, gridCellValue) {
  const removeFromScene = (x) => scene.remove(x)

  switch (gridCellValue.type) {
    case 'street': {
      break
    }
    case 'box': {
      clearBox(removeFromScene, gridCellValue)
      break
    }
    default: {
      console.error('what are you trying to clear from this grid cell with lol')
      break
    }
  }
}

// Helpers for updateGrid
function updateGridCell(gridCellValue, scale) {
  switch (gridCellValue.type) {
    case 'street': {
      break
    }
    case 'box': {
      updateBox(gridCellValue, scale)
      break
    }
    default: {
      console.error('what are you trying to update this grid cell with lol')
      break
    }
  }
}

// Helpers for updateGrid
function fillGridCell(scene, worldX, worldZ, scale, gridCellKey) {
  const type = isStreetPosition(worldX, worldZ) ? 'street' : 'box'

  switch (type) {
    case 'street': {
      break
    }
    case 'box': {
      fillWithBox(
        (x) => scene.add(x),
        (x) => gridCellMap.set(gridCellKey, x),
        worldX,
        worldZ,
        scale
      )
      break
    }
    default: {
      console.error('what are you trying to fill this grid cell with lol')
      break
    }
  }
}

// Utility function
function xzToKey(x, z) {
  return x.toString() + '#' + z.toString()
}

// FIXME: rename this function
function withinBounds(worldX, worldZ) {
  const relativeX = worldX - focus.x
  const relativeZ = worldZ - focus.z
  const distanceSquared = relativeX * relativeX + relativeZ * relativeZ
  const result =
    THREE.MathUtils.smoothstep(BLOB_RADIUS_SQUARED - distanceSquared, 0, BLOB_RADIUS_SQUARED) - 0.01
  return result
}
