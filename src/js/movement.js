import * as THREE from 'three'

const zeroVec3 = () => new THREE.Vector3(0, 0, 0)

// Movement Properties (Physics)
const cameraMovementProperties = {
  _velocity: zeroVec3(),
  _maxSpeed: 0.15,
  _accLam: 0.005,
  _toZeroAccLamModifier: 0.2,
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

// Animate function: Update camera velocity and position
export function updateCameraMovement(deltaTime, camera) {
  // Get current velocity
  const currVel = cameraMovementProperties._velocity
  const currVelNormalized = currVel.clone().normalize()

  // Get target velocity
  const targetVelNormalized = zeroVec3()
  for (const key in gamepad) {
    if (gamepad[key]) {
      targetVelNormalized.add(keybindings[key])
    }
  }
  targetVelNormalized.normalize()
  const targetVel = targetVelNormalized.clone().multiplyScalar(cameraMovementProperties._maxSpeed)

  // Get modifier: i.e. different acceleration bonuses for different inputs
  let directionModifier = 0
  if (targetVel.equals(zeroVec3())) {
    // When decelerating to zero
    directionModifier = cameraMovementProperties._toZeroAccLamModifier
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
  cameraMovementProperties._velocity = currVel.lerp(
    targetVel,
    1 - Math.exp(-cameraMovementProperties._accLam * directionModifier * deltaTime)
  )

  // Update position
  camera.position.add(cameraMovementProperties._velocity)
  camera.updateProjectionMatrix()
}

// Init function: Set up gamepad and listeners for gamepad
export function setupGamepadAndListeners() {
  function toggleGamepadValue(event, key, value) {
    if (event.key === key) {
      gamepad[key] = value
    }
  }
  for (const key in keybindings) {
    gamepad[key] = false
    window.addEventListener('keydown', (event) => toggleGamepadValue(event, key, true))
    window.addEventListener('keyup', (event) => toggleGamepadValue(event, key, false))
  }
}
