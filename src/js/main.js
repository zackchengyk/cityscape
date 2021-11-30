import '../public/style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { getNoise, getPrimaryColor, getSecondaryColor, HEIGHT_SEED } from "./color"

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

function makeBox(h, x, y, pc, sc) {
  const boxGeo = new THREE.BoxGeometry(0.8, h, 0.8);
  const boxTex = new THREE.MeshPhongMaterial({
    color: pc,
    specular: sc,
  });
  const boxMesh = new THREE.Mesh(boxGeo, boxTex);
  boxMesh.position.set(0 + x, h / 2, 0 + y);
  scene.add(boxMesh);
}

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(-1, 1, -1);
scene.add(directionalLight);

for (let i = -10; i <= 10; ++i) {
    for (let j = -10; j <= 10; ++j) {
        const h = getNoise(i, j, HEIGHT_SEED)
        const pc = getPrimaryColor(i, j, 1, 0.5)
        const sc = getSecondaryColor(i, j, 1, 0.5)
        makeBox(h, i, j, pc, sc)
    }
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

function animate() {
  requestAnimationFrame(animate);
  if (updateSize(renderer, camera)) {
  }
  renderer.render(scene, camera);
}

animate();
