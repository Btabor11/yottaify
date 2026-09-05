import * as THREE from "three";

/**
 * A procedural data-centre GPU module, SXM/OAM proportions. Built from
 * primitives so it costs nothing to ship and can be tinted per seller:
 *
 *   PCB plate with real circuit-board PBR textures (CC0, Poly Haven)
 *   raised interposer, die, six HBM stacks
 *   heatsink: copper base + 36 instanced aluminium fins (anisotropic metal)
 *   two connector strips, four screw heads
 *   an LED strip along the front edge — the stock signal
 *
 * Under 3k triangles per module. One shared set of materials for the metal
 * and PCB; the LED material is per module because its colour is data.
 */

export interface BladeMaterials {
  pcb: THREE.MeshStandardMaterial;
  die: THREE.MeshPhysicalMaterial;
  hbm: THREE.MeshPhysicalMaterial;
  copper: THREE.MeshPhysicalMaterial;
  fin: THREE.MeshPhysicalMaterial;
  connector: THREE.MeshStandardMaterial;
  screw: THREE.MeshStandardMaterial;
}

export function makeBladeMaterials(tex: { diff: THREE.Texture; nor: THREE.Texture; arm: THREE.Texture }): BladeMaterials {
  for (const t of [tex.diff, tex.nor, tex.arm]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1.6, 1);
    t.anisotropy = 4;
  }
  tex.diff.colorSpace = THREE.SRGBColorSpace;
  return {
    pcb: new THREE.MeshStandardMaterial({
      map: tex.diff,
      normalMap: tex.nor,
      roughnessMap: tex.arm,
      metalnessMap: tex.arm,
      // Modern accelerators are near-black; pull the retro green down.
      color: new THREE.Color("#3a4448"),
      roughness: 0.55,
      metalness: 0.15,
    }),
    die: new THREE.MeshPhysicalMaterial({ color: "#1a1d24", roughness: 0.18, metalness: 0.7, clearcoat: 0.6, clearcoatRoughness: 0.1 }),
    hbm: new THREE.MeshPhysicalMaterial({ color: "#23272f", roughness: 0.3, metalness: 0.6 }),
    copper: new THREE.MeshPhysicalMaterial({ color: "#b87333", roughness: 0.32, metalness: 1 }),
    fin: new THREE.MeshPhysicalMaterial({ color: "#c9ccd2", roughness: 0.38, metalness: 1, anisotropy: 0.6, anisotropyRotation: Math.PI / 2 }),
    connector: new THREE.MeshStandardMaterial({ color: "#0c0d10", roughness: 0.7, metalness: 0.2 }),
    screw: new THREE.MeshStandardMaterial({ color: "#8e939c", roughness: 0.4, metalness: 0.9 }),
  };
}

const geo = {
  plate: new THREE.BoxGeometry(1.4, 0.06, 0.9),
  interposer: new THREE.BoxGeometry(0.62, 0.03, 0.42),
  die: new THREE.BoxGeometry(0.3, 0.035, 0.3),
  hbm: new THREE.BoxGeometry(0.09, 0.03, 0.12),
  copper: new THREE.BoxGeometry(1.1, 0.05, 0.7),
  fin: new THREE.BoxGeometry(0.018, 0.34, 0.66),
  connector: new THREE.BoxGeometry(0.5, 0.04, 0.05),
  screw: new THREE.CylinderGeometry(0.03, 0.03, 0.02, 10),
  led: new THREE.BoxGeometry(1.2, 0.025, 0.03),
};

const FINS = 36;

export function makeBlade(m: BladeMaterials, ledColor: THREE.ColorRepresentation, ledIntensity: number): { group: THREE.Group; led: THREE.MeshStandardMaterial } {
  const g = new THREE.Group();
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, castShadow = true) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };

  add(geo.plate, m.pcb, 0, 0, 0);
  add(geo.interposer, m.hbm, -0.12, 0.045, 0);
  add(geo.die, m.die, -0.12, 0.078, 0);
  const hbmOffsets: [number, number][] = [[-0.35, -0.14], [-0.35, 0], [-0.35, 0.14], [0.11, -0.14], [0.11, 0], [0.11, 0.14]];
  for (const [dx, dz] of hbmOffsets) add(geo.hbm, m.hbm, -0.12 + dx, 0.075, dz);

  // Heatsink sits over the compute half; fins run front-to-back.
  add(geo.copper, m.copper, -0.05, 0.125, 0);
  const fins = new THREE.InstancedMesh(geo.fin, m.fin, FINS);
  const mat = new THREE.Matrix4();
  for (let i = 0; i < FINS; i++) {
    mat.makeTranslation(-0.05 - 0.53 + (i / (FINS - 1)) * 1.06, 0.32, 0);
    fins.setMatrixAt(i, mat);
  }
  fins.instanceMatrix.needsUpdate = true;
  fins.castShadow = true;
  fins.receiveShadow = true;
  g.add(fins);

  add(geo.connector, m.connector, 0.35, -0.045, -0.4, false);
  add(geo.connector, m.connector, 0.35, -0.045, 0.4, false);
  for (const [x, z] of [[-0.62, -0.38], [0.62, -0.38], [-0.62, 0.38], [0.62, 0.38]] as const) add(geo.screw, m.screw, x, 0.035, z, false);

  const led = new THREE.MeshStandardMaterial({ color: ledColor, emissive: ledColor, emissiveIntensity: ledIntensity, roughness: 0.3 });
  add(geo.led, led, 0, 0.035, 0.47, false);

  return { group: g, led };
}
