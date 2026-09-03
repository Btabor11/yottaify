"use client";

/**
 * D1's 3D moment: one 8-GPU node, rendered as hairline geometry.
 *
 * Why 3D earns its place here: the argument on this page is spatial — eight
 * devices, one memory domain, one box. Rotating it from plan to three-quarter
 * as you scroll makes "one box" legible in a way a table cannot.
 *
 * Discipline:
 *  · Loaded only when the container is in view (see NodeSceneMount).
 *  · frameloop flips to "never" the moment it leaves the viewport.
 *  · No post-processing, no environment maps, no textures. Hairlines and flat
 *    faces — which is also the aesthetic, so restraint costs nothing.
 *  · Never required for the content: the SVG diagram underneath says the same
 *    thing and is what everyone without WebGL sees.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { FLEET } from "@/content";
import { SCENE } from "./palette";
import type { SceneProps } from "@/components/shared/SceneMount";

const COLS = 4;
const ROWS = 2;
const PITCH_X = 1.15;
const PITCH_Z = 1.32;

function positions(): THREE.Vector3[] {
  return Array.from({ length: FLEET.gpusPerNode }, (_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return new THREE.Vector3(
      (col - (COLS - 1) / 2) * PITCH_X,
      0.16,
      (row - (ROWS - 1) / 2) * PITCH_Z,
    );
  });
}

/** All-to-all hairlines between the eight devices. */
function LinkMesh({ pts }: { pts: THREE.Vector3[] }) {
  const geometry = useMemo(() => {
    const verts: number[] = [];
    for (let a = 0; a < pts.length; a++) {
      for (let b = a + 1; b < pts.length; b++) {
        verts.push(pts[a].x, pts[a].y, pts[a].z, pts[b].x, pts[b].y, pts[b].z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return g;
  }, [pts]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={SCENE.accent} transparent opacity={0.28} />
    </lineSegments>
  );
}

/**
 * Points of light travelling between devices. Decorative — it does not encode
 * a throughput figure and is not labelled as one.
 */
function Traffic({ pts }: { pts: THREE.Vector3[] }) {
  const count = 10;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const routes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        // Deterministic pseudo-random so every visitor sees the same scene and
        // there is no hydration mismatch.
        const seed = (i * 2654435761) % 4294967296;
        const a = Math.floor((seed / 4294967296) * pts.length);
        const b = (a + 1 + Math.floor(((seed >> 8) / 16777216) * (pts.length - 1))) % pts.length;
        return { a, b, phase: (i / count) * Math.PI * 2, speed: 0.22 + (i % 4) * 0.05 };
      }),
    [pts.length],
  );

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    routes.forEach((r, i) => {
      const u = (Math.sin(t * r.speed + r.phase) + 1) / 2;
      const p = new THREE.Vector3().lerpVectors(pts[r.a], pts[r.b], u);
      dummy.position.copy(p);
      dummy.position.y += 0.02;
      const s = 0.035 + Math.sin(u * Math.PI) * 0.02;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={SCENE.accentHot} />
    </instancedMesh>
  );
}

/* Geometry is created once at module scope and shared by all eight instances —
   nine boxes' worth of buffers instead of twenty-seven. */
const PKG_GEO = new THREE.BoxGeometry(0.86, 0.22, 1.0);
const PKG_EDGES = new THREE.EdgesGeometry(PKG_GEO);
const DIE_GEO = new THREE.BoxGeometry(0.46, 0.05, 0.52);
const DIE_EDGES = new THREE.EdgesGeometry(DIE_GEO);
const HBM_GEO = new THREE.BoxGeometry(0.09, 0.06, 0.4);

function Gpu({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      {/* package substrate */}
      <mesh geometry={PKG_GEO}>
        <meshStandardMaterial color={SCENE.package} roughness={0.78} metalness={0.18} />
      </mesh>
      {/* hairline edges — the detail that makes it read as a drawing, not a render */}
      <lineSegments geometry={PKG_EDGES}>
        <lineBasicMaterial color={SCENE.packageEdge} />
      </lineSegments>

      {/* die: dark with a cool rim rather than a glowing slab */}
      <mesh geometry={DIE_GEO} position={[0, 0.12, 0]}>
        <meshStandardMaterial color={SCENE.hbm} roughness={0.35} metalness={0.4} />
      </mesh>
      <lineSegments geometry={DIE_EDGES} position={[0, 0.12, 0]}>
        <lineBasicMaterial color={SCENE.accent} />
      </lineSegments>

      {/* HBM stacks flanking the die — the memory is the argument, so it is
          the part of the package worth drawing. Count is illustrative. */}
      {[-0.3, 0.3].map((x) =>
        [-0.22, 0.22].map((z) => (
          <mesh key={`${x}-${z}`} geometry={HBM_GEO} position={[x, 0.12, z]}>
            <meshStandardMaterial
              color={SCENE.die}
              emissive={SCENE.accent}
              emissiveIntensity={0.35}
              roughness={0.5}
            />
          </mesh>
        )),
      )}
    </group>
  );
}

function Node({ progressRef }: { progressRef: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const pts = useMemo(positions, []);
  const { camera } = useThree();

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    const p = progressRef.current ?? 0;

    // Scroll drives the tilt: near-plan at the top of the section, three-quarter
    // by the bottom. Idle yaw keeps it alive without being busy.
    const targetTilt = THREE.MathUtils.lerp(0.04, 0.46, p);
    const targetYaw = -0.52 + p * 0.62 + Math.sin(clock.elapsedTime * 0.15) * 0.06;

    g.rotation.x += (targetTilt - g.rotation.x) * Math.min(1, delta * 3.2);
    g.rotation.y += (targetYaw - g.rotation.y) * Math.min(1, delta * 2.4);

    // Pull in as the section is read, so the node fills more of the frame just
    // as the sentence beside it explains what the frame contains.
    const targetZ = THREE.MathUtils.lerp(5.5, 4.7, p);
    camera.position.z += (targetZ - camera.position.z) * Math.min(1, delta * 2);
    camera.position.y += (1.55 - camera.position.y) * Math.min(1, delta * 2);
    camera.lookAt(0, 0.05, 0);
  });

  return (
    <group ref={group}>
      {/* baseboard */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[COLS * PITCH_X + 0.5, 0.08, ROWS * PITCH_Z + 0.45]} />
        <meshStandardMaterial color={SCENE.board} roughness={0.9} metalness={0.05} />
      </mesh>
      <lineSegments>
        <edgesGeometry
          args={[new THREE.BoxGeometry(COLS * PITCH_X + 0.5, 0.08, ROWS * PITCH_Z + 0.45)]}
        />
        <lineBasicMaterial color={SCENE.boardEdge} />
      </lineSegments>

      {pts.map((p, i) => (
        <Gpu key={i} position={p} />
      ))}

      <LinkMesh pts={pts} />
      <Traffic pts={pts} />
    </group>
  );
}

export default function NodeScene({
  progressRef,
  active,
  onReady,
}: SceneProps) {
  return (
    <Canvas
      // Stop rendering entirely when the section is off-screen.
      // Reported to SceneMount so the drawing underneath only fades out
      // once there is something real to fade to.
      onCreated={() => onReady?.()}
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 1.55, 5.5], fov: 36 }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 3]} intensity={1.15} color={SCENE.keyLight} />
      <directionalLight position={[-5, 2, -4]} intensity={0.4} color={SCENE.accent} />
      <Node progressRef={progressRef} />
    </Canvas>
  );
}
