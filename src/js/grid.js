import * as THREE from 'three'
import { clearBox, updateBox, fillWithBox, enableBloomModeBox, disableBloomModeBox } from '/js/box'
import { focus, getSpeed } from '/js/movement'
import { generateStreets, isStreetPosition } from '/js/streets'
import { addCloudBlock } from '/js/weather'

// Important
const gridCellMap = new Map()

// TODO: REFACTOR
export function enableBloomModeGrid(cityscape) {
  gridCellMap.forEach((v) => {
    switch (v.type) {
      case 'street': {
        break
      }
      case 'box': {
        enableBloomModeBox(cityscape, v)
        break
      }
      default: {
        console.error('what is in this grid cell lol')
        break
      }
    }
  })
}
export function disableBloomModeGrid(cityscape) {
  gridCellMap.forEach((v) => {
    switch (v.type) {
      case 'street': {
        break
      }
      case 'box': {
        disableBloomModeBox(cityscape, v)
        break
      }
      default: {
        console.error('what is in this grid cell lol')
        break
      }
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
let prevBlobRadius = 0
export function updateGrid(cityscape) {
  // Note: this ASSUMES that all visible grid cells are within [-boundX, boundX], [-boundZ, boundZ]

  // Prep streets
  generateStreets(cityscape)

  // Get position
  const { x: focusX, z: focusZ } = focus

  // Get blob radius
  const blobRadius = cityscape.params.blobRadius
  const blobRadiusSq = blobRadius * blobRadius

  // Debounce: update only if blobRadius has changed or position has changed
  const updateThreshold = Math.max(getSpeed() * 0.5, 0.002)
  if (
    prevBlobRadius === blobRadius &&
    Math.abs(focusX - prevFocusX) < updateThreshold &&
    Math.abs(focusZ - prevFocusZ) < updateThreshold
  ) {
    return
  }
  let maxOfPrevAndNewBR = Math.max(prevBlobRadius, blobRadius)
  maxOfPrevAndNewBR++ // Just in case
  prevBlobRadius = blobRadius
  prevFocusX = focusX
  prevFocusZ = focusZ

  // Get ready to iterate over grid cells
  const roundedFocusX = Math.round(focusX)
  const roundedFocusZ = Math.round(focusZ)
  const kvPairsToDelete = []
  const worldXStart = roundedFocusX - maxOfPrevAndNewBR
  const worldXEnd = roundedFocusX + maxOfPrevAndNewBR
  const worldZStart = roundedFocusZ - maxOfPrevAndNewBR
  const worldZEnd = roundedFocusZ + maxOfPrevAndNewBR

  // Iterate over grid cells
  for (let worldX = worldXStart; worldX <= worldXEnd; worldX++) {
    for (let worldZ = worldZStart; worldZ <= worldZEnd; worldZ++) {
      const scale = withinBounds(blobRadiusSq, worldX, worldZ)
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
  addCloudBlock(scene, worldX, worldZ)
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
function withinBounds(blobRadiusSq, worldX, worldZ) {
  const relativeX = worldX - focus.x
  const relativeZ = worldZ - focus.z
  const distanceSquared = relativeX * relativeX + relativeZ * relativeZ
  const result = THREE.MathUtils.smoothstep(blobRadiusSq - distanceSquared, 0, blobRadiusSq) - 0.01
  return result
}
