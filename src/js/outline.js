import * as THREE from 'three'

const OUTLINE_THICKNESS = 0.08

const baseOutlineMaterial = new THREE.MeshLambertMaterial({
  color: 'black',
  side: THREE.BackSide,
})

function newOutlineMaterial(scale, position) {
  const outlineMaterial = baseOutlineMaterial.clone()
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
  const outlineMaterial = newOutlineMaterial(boxMesh.scale, boxMesh.position)

  const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial)

  // EXTREMELY important, since CPU knows nothing about GPU vertex transformations
  // and WILL cull the object at some distance from the origin
  outlineMesh.frustumCulled = false

  return outlineMesh
}
