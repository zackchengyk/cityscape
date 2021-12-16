import * as THREE from '../../node_modules/three/src/Three'

const zeroVec3 = () => new THREE.Vector3(0, 0, 0)

// Movement Properties
const movementProperties = {
  _velocity: zeroVec3(),
  _worldPosition: zeroVec3(),
  _maxSpeed: undefined,
  _accLam: 0.0025,
  _toZeroAccLamModifier: 1.25,
}
export const focus = movementProperties._worldPosition
export const getSpeed = () => movementProperties._velocity.length()
export const setMaxSpeed = (v) => {
  movementProperties._maxSpeed = v
}

// Keybindings
const keybindings = {
  ArrowUp: new THREE.Vector3(-1, 0, -1),
  ArrowDown: new THREE.Vector3(1, 0, 1),
  ArrowLeft: new THREE.Vector3(-1, 0, 1),
  ArrowRight: new THREE.Vector3(1, 0, -1),
  w: new THREE.Vector3(-1, 0, -1),
  s: new THREE.Vector3(1, 0, 1),
  a: new THREE.Vector3(-1, 0, 1),
  d: new THREE.Vector3(1, 0, -1),
}

// Gamepad: map from key to boolean ('is pressed')
const gamepad = {}

// Setup function: Set up gamepad and listeners for gamepad
export function setupMovement(cityscape) {
  movementProperties._maxSpeed = cityscape.params.maxSpeed
  // Event handler function to set the gamepad's key to a certain value
  function toggleGamepadValue(event, key, value) {
    if (event.key === key) {
      gamepad[key] = value
    }
  }

  // Add field to gamepad object, and add listeners
  for (const key in keybindings) {
    gamepad[key] = false
    window.addEventListener('keydown', (event) => toggleGamepadValue(event, key, true))
    window.addEventListener('keyup', (event) => toggleGamepadValue(event, key, false))
  }
}

// Animate function: Update velocity and position
export function updateMovement(cityscape, deltaTime) {
  // Get current velocity
  const currVel = movementProperties._velocity
  const currVelNormalized = currVel.clone().normalize()
  // Get target velocity
  const targetVelNormalized = zeroVec3()
  for (const key in gamepad) {
    if (gamepad[key] || (key == 'ArrowRight' && cityscape.params.autoMove)) {
      targetVelNormalized.add(keybindings[key])
    }
  }
  targetVelNormalized.normalize()
  const targetVel = targetVelNormalized.clone().multiplyScalar(movementProperties._maxSpeed)

  // Get modifier: i.e. different acceleration bonuses for different inputs
  let directionModifier = 0
  if (targetVel.equals(zeroVec3())) {
    // When decelerating to zero
    directionModifier = movementProperties._toZeroAccLamModifier
  } else {
    const dotP = targetVelNormalized.dot(currVelNormalized)
    if (dotP > 0) {
      // When actively accelerating in same direction
      directionModifier = 1
    } else {
      // When actively accelerating in opposite direction
      directionModifier = -dotP / 2 + 1 // Between 1 to 1.5
    }
  }

  // Update velocity
  movementProperties._velocity = currVel.lerp(
    targetVel,
    1 - Math.exp(-movementProperties._accLam * directionModifier * deltaTime)
  )
  // Update position
  movementProperties._worldPosition.add(movementProperties._velocity)
}
