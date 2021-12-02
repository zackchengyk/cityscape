import '../public/style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  getNoise,
  getPrimaryColor,
  getSecondaryColor,
  HEIGHT_SEED,
} from './color';

///////////////////////////////
///////// Globals /////////////
///////////////////////////////
let xbounds = 10;
let ybounds = 10;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#cityscape'),
});
const gridHelper = new THREE.GridHelper();
scene.add(gridHelper);
const orbitControls = new OrbitControls(camera, renderer.domElement);
const buildingUUIDs = new Map();

function makeBox(h, x, y, pc, sc) {
  let coord = {x: x, y: y};
  if (buildingUUIDs.has(coord))
    return;
  const boxGeo = new THREE.BoxGeometry(0.8, h, 0.8);
  const boxTex = new THREE.MeshPhongMaterial({
    color: pc,
    specular: sc,
  });
  const boxMesh = new THREE.Mesh(boxGeo, boxTex);
  boxMesh.position.set(0 + x, h / 2, 0 + y);
  scene.add(boxMesh);

  buildingUUIDs.set(coord, boxMesh.uuid);
}

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(-1, 1, -1);
scene.add(directionalLight);

let oldX = 0;
let oldY = 0;

function withinBounds(cameraX, cameraY, x, y) {
  return (x >= cameraX - ybounds && x < cameraX + xbounds &&
	  y >= cameraY - ybounds && y < cameraY + ybounds);
}

function makeBoxes(centerX, centerY) {
  for (let i = centerX - xbounds; i < centerX + xbounds; i++) {
    for (let j = centerY - ybounds; j < centerY + ybounds; j++) {
      const h = getNoise(i, j, HEIGHT_SEED);
      const pc = getPrimaryColor(i, j, 1, 0.5);
      const sc = getSecondaryColor(i, j, 1, 0.5);
      makeBox(h, i, j, pc, sc);
    }
  }
}

function updateBoxes(scene, camera) {
  // TODO: checking whether boxes are within the boundaries is broken
  let x = Math.round(camera.position.x);
  let y = Math.round(camera.position.y);
  if (x == oldX && y == oldY)
    return;
  oldX = x;
  oldY = y;
  // Clean up irrelevant boxes
  buildingUUIDs.forEach((uuid, coord, map) => {
    if (!withinBounds(x, y, coord.x, coord.y)) {
      const object = scene.getObjectByProperty('uuid', uuid);
      object.geometry.dispose();
      object.material.dispose();
      scene.remove(object);
      map.delete(coord);
    }
  });
  renderer.renderLists.dispose();
  // Generate new boxes
  makeBoxes(x, y);
}

function updateSize(renderer, camera) {
  const factor = 0.01;
  const canvas = renderer.domElement;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const needResize = canvas.width !== w || canvas.height !== h;
  if (needResize) {
    renderer.setSize(w, h);
    camera.left = (-w / 2) * factor;
    camera.right = (w / 2) * factor;
    camera.top = (h / 2) * factor;
    camera.bottom = (-h / 2) * factor;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    console.log(camera);
  }
  return needResize;
}

let prevTime = 0;
function animate(currTime) {
  requestAnimationFrame(animate);
  const deltaTime = currTime - prevTime;
  prevTime = currTime;

  updateSize(renderer, camera);
  updateCameraMovement(deltaTime);
  updateBoxes(scene, camera);

  renderer.render(scene, camera);
}

// Listeners
window.addEventListener('resize', updateSizeOnWindowResize);
function updateSizeOnWindowResize() {
  updateSize(renderer, camera);
}

// Movement
const zeroVec3 = () => new THREE.Vector3(0, 0, 0);
const cameraMovementProperties = {
  _velocity: zeroVec3(),
  _maxSpeed: 0.15,
  _accLam: 0.005,
  _toZeroAccLamModifier: 0.2,
};
function updateCameraMovement(deltaTime) {
  // Current velocity
  const currVel = cameraMovementProperties._velocity;
  const currVelNormalized = currVel.clone().normalize();

  // Target velocity
  const targetVelNormalized = zeroVec3();
  for (const key in gamepad) {
    if (gamepad[key]) {
      targetVelNormalized.add(keybindings[key]);
    }
  }
  targetVelNormalized.normalize();
  const targetVel = targetVelNormalized
    .clone()
    .multiplyScalar(cameraMovementProperties._maxSpeed);

  // Different acceleration bonuses for different inputs
  const dotP = targetVelNormalized.dot(currVelNormalized);
  let directionModifier = 0;
  if (targetVel.equals(zeroVec3())) {
    // When decelerating to zero (no player input)
    directionModifier = cameraMovementProperties._toZeroAccLamModifier;
  } else {
    if (dotP > 0) {
      // When actively accelerating in same direction
      directionModifier = 1;
    } else {
      // When actively accelerating in opposite direction
      directionModifier = -dotP / 2 + 1;
    }
  }

  cameraMovementProperties._velocity = currVel.lerp(
    targetVel,
    1 -
      Math.exp(
        -cameraMovementProperties._accLam * directionModifier * deltaTime
      )
  );

  // Position
  const displacement = deltaTime * cameraMovementProperties._maxSpeed;
  camera.position.add(cameraMovementProperties._velocity);
  camera.updateProjectionMatrix();
}

// Input mapping
const keybindings = {
  ArrowUp: new THREE.Vector3(-1, 0, -1),
  ArrowDown: new THREE.Vector3(1, 0, 1),
  ArrowLeft: new THREE.Vector3(-1, 0, 1),
  ArrowRight: new THREE.Vector3(1, 0, -1),
  w: new THREE.Vector3(-1, 0, -1),
  s: new THREE.Vector3(1, 0, 1),
  a: new THREE.Vector3(-1, 0, 1),
  d: new THREE.Vector3(1, 0, -1),
};

// Gamepad
const gamepad = {};

// Set up gamepad and listeners for gamepad
for (const key in keybindings) {
  gamepad[key] = false;
  window.addEventListener('keydown', (event) => setGamepad(event, key, true));
  window.addEventListener('keyup', (event) => setGamepad(event, key, false));
}

// Listeners for gamepad
function setGamepad(event, key, value) {
  console.log('hello');
  if (event.key === key) {
    gamepad[key] = value;
  }
}

// IMPORTANT
animate(0);
