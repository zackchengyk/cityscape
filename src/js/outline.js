import * as THREE from 'three'

// Fixme?: Refactor
export const outlineScene = new THREE.Scene()

const OUTLINE_THICKNESS = 0.05

const baseOutlineMaterial1 = new THREE.MeshBasicMaterial({
  color: 'black',
  side: THREE.BackSide,
  depthTest: true,
})
const baseOutlineMaterial2 = new THREE.MeshBasicMaterial({
  color: 'black',
  side: THREE.BackSide,
  depthTest: false,
  stencilWrite: true,
  stencilFunc: THREE.NotEqualStencilFunc,
  stencilRef: 1,
  stencilFuncMask: 0xff,
  stencilFail: THREE.KeepStencilOp,
  stencilZFail: THREE.KeepStencilOp,
  stencilZPass: THREE.KeepStencilOp,
})
function newOutlineMaterial(baseMat, scale, position) {
  const outlineMaterial = baseMat.clone()
  outlineMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.boxSize = { type: 'vec3', value: scale }
    shader.uniforms.boxPosition = { type: 'vec3', value: position }
    shader.uniforms.outlineThickness = { type: 'f', value: OUTLINE_THICKNESS }
    shader.vertexShader =
      `
      uniform vec3 boxSize;
      uniform vec3 boxPosition;
      uniform float outlineThickness;
      ` + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>

      vec3 signs = sign(position);
      vec3 box = boxSize;
      vec3 p = signs * box;

      transformed = signs * box / 2.0 + normalize(position) * outlineThickness;

      // // re-compute normals for correct shadows and reflections
      // objectNormal = all(equal(p, transformed)) ? normal : normalize(position); 
      // transformedNormal = normalize(normalMatrix * objectNormal);
      // vNormal = transformedNormal;
      
      transformed += boxPosition;
      `
    )
  }
  return outlineMaterial
}

export function generateOutlineMesh(boxMesh) {
  const outlineGeometry = new THREE.BoxGeometry(1, 1, 1, 9, 9, 9)

  // Because the outlineMaterial uses boxMesh.whatever as a uniform, it scales with it.
  // Very convenient, but also very unexpected / sneaky... take note!
  const outlineMaterial1 = newOutlineMaterial(baseOutlineMaterial1, boxMesh.scale, boxMesh.position)
  const outlineMaterial2 = newOutlineMaterial(baseOutlineMaterial2, boxMesh.scale, boxMesh.position)

  const outlineMesh1 = new THREE.Mesh(outlineGeometry, outlineMaterial1)
  const outlineMesh2 = new THREE.Mesh(outlineGeometry, outlineMaterial2)

  outlineScene.add(outlineMesh1)
  outlineScene.add(outlineMesh2)
  return [outlineMesh1, outlineMesh2]
}
