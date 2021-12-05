import '../public/style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  getNoise,
  getPrimaryColor,
  getSecondaryColor,
  HEIGHT_SEED,
} from './color';

// BEGIN TEMPORARY
import Stats from '../../node_modules/stats.js/src/Stats.js';
let stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);
// END TEMPORARY

///////////////////////////////
///////// Globals /////////////
///////////////////////////////
let xbounds = 6;
let zbounds = 6;
let camOffsetX = 1;
let camOffsetZ = 1;
let camOffsetY = 1;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 1000);
camera.position.set(camOffsetX, camOffsetY, camOffsetZ);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#cityscape'),
});
const gridHelper = new THREE.GridHelper();
scene.add(gridHelper);
const orbitControls = new OrbitControls(camera, renderer.domElement);
const buildings = new Map();

// Fog
{
  const color = 0x21263a;
  const density = 0.11;
  scene.fog = new THREE.FogExp2(color, density);
}

function makeBox(h, x, z, pc, sc) {
  let coord = { x: x, z: z };
  if (buildings.has(coord)) return;
  const boxGeo = new THREE.BoxGeometry(0.8, h, 0.8);
  const boxTex = new THREE.MeshPhongMaterial({
    color: pc,
    specular: sc,
  });
  const boxMesh = new THREE.Mesh(boxGeo, boxTex);
  boxMesh.position.set(0 + x, h / 2, 0 + z);
  boxMesh.castShadow = true;
  scene.add(boxMesh);

  buildings.set(coord, boxMesh);
}

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(-1, 1, -1);
scene.add(directionalLight);

// directional light supposed to represent sunlight
// TODO: shadows?
var dl = new THREE.DirectionalLight(0xffffff, 1);
dl.position.set(0, 4, 10);
dl.castShadow = true;
scene.add(dl);

// plane that receives shadows (but does not cast them)
const planeGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
const planeMaterial = new THREE.MeshStandardMaterial({ color: "0x0000ff" });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.receiveShadow = true;
plane.rotation.x = -Math.PI / 2.0;
scene.add(plane);

let oldX = 0;
let oldZ = 0;

function withinBounds(cameraX, cameraZ, x, z) {
  return (x >= cameraX - xbounds - camOffsetX &&
	  x < cameraX + xbounds - camOffsetX &&
	  z >= cameraZ - zbounds - camOffsetZ &&
	  z < cameraZ + zbounds - camOffsetZ);
}

function makeBoxes(centerX, centerZ) {
  for (let i = centerX - xbounds - camOffsetX; i < centerX + xbounds - camOffsetX; i++) {
    for (let j = centerZ - zbounds - camOffsetZ; j < centerZ + zbounds - camOffsetZ; j++) {
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
  let z = Math.round(camera.position.z);
  if (x == oldX && z == oldZ)
    return;
  oldX = x;
  oldZ = z;
  // Clean up irrelevant boxes
  let toDelete = [];
  buildings.forEach((object, coord, map) => {
    if (!withinBounds(x, z, coord.x, coord.z)) {
      scene.remove(object);
      object.geometry.dispose();
      object.material.dispose();
      toDelete.push(coord);
    }
  });
  toDelete.forEach(coord => { buildings.delete(coord);});
  //renderer.renderLists.dispose();
  // Generate new boxes
  makeBoxes(x, z);
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

  // BEGIN TEMPORARY
  stats.begin();
  // END TEMPORARY

  const deltaTime = currTime - prevTime;
  prevTime = currTime;

  updateSize(renderer, camera);
  updateCameraMovement(deltaTime);
  updateBoxes(scene, camera);

  renderer.render(scene, camera);

  // BEGIN TEMPORARY
  stats.end();
  // END TEMPORARY
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
