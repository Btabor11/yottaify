"use client";

/**
 * D2's 3D moment: the node as a rotating copperplate engraving.
 *
 * Edges only — no lit surfaces, no shading, no environment. Ink hairlines on
 * paper, which is the same drawing language as the SVG plate underneath, just
 * turning. It earns its place because the argument is spatial (eight devices,
 * one domain, one box) and because a line drawing that rotates is the one
 * thing a printed plate cannot do.
 *
 * Discipline: mounted only when in view, frameloop stops off-screen, geometry
 * built once, ~1,100 line vertices total.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { FLEET } from "@/content";

const COLS = 4;
const ROWS = 2;
const PITCH_X = 1.2;
const PITCH_Z = 1.4;

const PKG = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.92, 0.2, 1.06));
const DIE = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.42, 0.06, 0.56));
const HBM = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.1, 0.08, 0.42));
const BOARD = new THREE.EdgesGeometry(
  new THREE.BoxGeometry(COLS * PITCH_X + 0.55, 0.09, ROWS * PITCH_Z + 0.5),
);

function slots(): THREE.Vector3[] {
  return Array.from({ length: FLEET.gpusPerNode }, (_, i) => {
    const col = i % COLS;
    const r = Math.floor(i / COLS);
    return new THREE.Vector3(
      (col - (COLS - 1) / 2) * PITCH_X,
      0.15,
      (r - (ROWS - 1) / 2) * PITCH_Z,
    );
  });
}

function Fabric({ pts }: { pts: THREE.Vector3[] }) {
  const geometry = useMemo(() => {
    const v: number[] = [];
    for (let a = 0; a < pts.length; a++) {
      for (let b = a + 1; b < pts.length; b++) {
        // Bowed slightly so the fabric reads as cabling above the board rather
        // than as a flat wireframe grid.
        const mid = new THREE.Vector3().lerpVectors(pts[a], pts[b], 0.5);
        mid.y += 0.34;
        const curve = new THREE.QuadraticBezierCurve3(pts[a], mid, pts[b]);
        const seg = curve.getPoints(8);
        for (let i = 0; i < seg.length - 1; i++) {
          v.push(seg[i].x, seg[i].y, seg[i].z, seg[i + 1].x, seg[i + 1].y, seg[i + 1].z);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    return g;
  }, [pts]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#16150f" transparent opacity={0.24} />
    </lineSegments>
  );
}

function Plate({ progressRef }: { progressRef: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const pts = useMemo(slots, []);
  const { camera } = useThree();

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    const p = progressRef.current ?? 0;

    // A slow, even turn — an object on a turntable, not a hero animation.
    const targetYaw = -0.62 + p * 1.1 + Math.sin(clock.elapsedTime * 0.12) * 0.05;
    const targetTilt = THREE.MathUtils.lerp(0.1, 0.4, p);
    g.rotation.y += (targetYaw - g.rotation.y) * Math.min(1, delta * 2);
    g.rotation.x += (targetTilt - g.rotation.x) * Math.min(1, delta * 2.6);

    camera.position.y += (1.7 - camera.position.y) * Math.min(1, delta * 2);
    camera.lookAt(0, 0.05, 0);
  });

  const ink = <lineBasicMaterial color="#16150f" transparent opacity={0.78} />;

  return (
    <group ref={group}>
      <lineSegments geometry={BOARD}>{ink}</lineSegments>
      {pts.map((p, i) => (
        <group key={i} position={p}>
          <lineSegments geometry={PKG}>
            <lineBasicMaterial color="#16150f" transparent opacity={0.82} />
          </lineSegments>
          <lineSegments geometry={DIE} position={[0, 0.12, 0]}>
            <lineBasicMaterial color="#16150f" transparent opacity={0.6} />
          </lineSegments>
          {[-0.33, 0.33].map((x) =>
            [-0.24, 0.24].map((z) => (
              <lineSegments key={`${x}-${z}`} geometry={HBM} position={[x, 0.13, z]}>
                <lineBasicMaterial color="#b2331e" transparent opacity={0.66} />
              </lineSegments>
            )),
          )}
        </group>
      ))}
      <Fabric pts={pts} />
    </group>
  );
}

export default function EngravingScene({
  progressRef,
  active,
}: {
  progressRef: React.RefObject<number>;
  active: boolean;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 1.7, 5.6], fov: 34 }}
      style={{ pointerEvents: "none" }}
    >
      <Plate progressRef={progressRef} />
    </Canvas>
  );
}
