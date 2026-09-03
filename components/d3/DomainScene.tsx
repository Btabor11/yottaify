"use client";

/**
 * D3's 3D: the coherent memory domain, not the box that holds it.
 *
 * Eight devices on a ring, every pair joined, and charge running the chords —
 * which is the physical claim the 2,304 GB figure rests on. D1 draws the
 * baseboard and D2 engraves the package; drawing either again here would be
 * the same idea in a new palette.
 *
 * Scroll drives assembly: at progress 0 the devices sit off the ring with the
 * chords dark, and by the time the section is centred they are seated and the
 * fabric is lit. Nothing is revealed by the animation that the static SVG
 * underneath does not already state.
 *
 * Budget: 8 boxes sharing one geometry, one instanced-points cloud for the
 * charge, 28 line segments in a single BufferGeometry, no lights that cast,
 * no post-processing.
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { FLEET } from "@/content";
import type { SceneProps } from "@/components/shared/SceneMount";
import { SCENE } from "./palette";

const N = FLEET.gpusPerNode;
const RADIUS = 2.5;
const CHARGE_PER_CHORD = 3;

/** Ring positions, shared by the devices, the chords and the charge. */
function ringPoints(): THREE.Vector3[] {
  return Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * RADIUS, 0, Math.sin(a) * RADIUS);
  });
}

function pairs(): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) out.push([i, j]);
  return out;
}

function Domain({ progressRef }: { progressRef: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const devices = useRef<THREE.Group>(null);
  const chordMat = useRef<THREE.LineBasicMaterial>(null);
  const charge = useRef<THREE.Points>(null);

  const points = useMemo(ringPoints, []);
  const chordPairs = useMemo(pairs, []);

  // One geometry per part, shared by all eight devices. The edge geometry is
  // what makes them legible against a dark ground — a shaded box at this size
  // reads as a smudge, and the drawing underneath is all outline.
  const pkgGeo = useMemo(() => new THREE.BoxGeometry(1.05, 0.3, 0.72), []);
  const pkgEdges = useMemo(() => new THREE.EdgesGeometry(pkgGeo), [pkgGeo]);
  const dieGeo = useMemo(() => new THREE.BoxGeometry(0.5, 0.07, 0.4), []);

  const pkgMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: SCENE.device,
        metalness: 0.5,
        roughness: 0.5,
      }),
    [],
  );
  const edgeMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: SCENE.deviceEdge, transparent: true, opacity: 0.9 }),
    [],
  );
  const dieMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: SCENE.die,
        emissive: new THREE.Color(SCENE.volt),
        emissiveIntensity: 0.35,
        metalness: 0.2,
        roughness: 0.35,
      }),
    [],
  );

  const chordGeo = useMemo(() => {
    const positions = new Float32Array(chordPairs.length * 6);
    chordPairs.forEach(([i, j], k) => {
      positions.set([points[i].x, 0, points[i].z, points[j].x, 0, points[j].z], k * 6);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [chordPairs, points]);

  // Charge: one point per slot per chord, walking its chord and wrapping.
  const chargeCount = chordPairs.length * CHARGE_PER_CHORD;
  const chargeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(chargeCount * 3), 3));
    return g;
  }, [chargeCount]);

  const offsets = useMemo(
    () => Float32Array.from({ length: chargeCount }, () => Math.random()),
    [chargeCount],
  );
  const speeds = useMemo(
    () => Float32Array.from({ length: chargeCount }, () => 0.22 + Math.random() * 0.4),
    [chargeCount],
  );

  useFrame((state, delta) => {
    const p = progressRef.current;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Seat the devices. 0 → lifted and spread, 1 → on the ring. Completes
    // early: by the time the figure is properly on screen the assembly should
    // be finished, not still in progress.
    const seat = THREE.MathUtils.smoothstep(p, 0.02, 0.34);
    if (devices.current) {
      devices.current.children.forEach((child, i) => {
        const target = points[i];
        const lift = (1 - seat) * (1.6 + (i % 3) * 0.4);
        const spread = 1 + (1 - seat) * 0.55;
        child.position.set(target.x * spread, lift, target.z * spread);
        child.rotation.y = -((i / N) * Math.PI * 2) + (1 - seat) * 0.9;
      });
    }

    // The fabric only lights once the devices are seated.
    if (chordMat.current) chordMat.current.opacity = 0.05 + seat * 0.32;
    if (edgeMat) edgeMat.opacity = 0.25 + seat * 0.65;

    // Slow orbit, plus a little extra as you scroll through.
    if (group.current) {
      group.current.rotation.y = t * 0.055 + p * 0.7;
      group.current.rotation.x = 0.62 - p * 0.2;
    }

    // Walk the charge along its chord.
    if (charge.current) {
      const attr = charge.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let k = 0; k < chargeCount; k++) {
        offsets[k] = (offsets[k] + speeds[k] * dt) % 1;
        const [i, j] = chordPairs[k % chordPairs.length];
        const a = points[i];
        const b = points[j];
        const u = offsets[k];
        arr[k * 3] = a.x + (b.x - a.x) * u;
        arr[k * 3 + 1] = Math.sin(u * Math.PI) * 0.06;
        arr[k * 3 + 2] = a.z + (b.z - a.z) * u;
      }
      attr.needsUpdate = true;
      const m = charge.current.material as THREE.PointsMaterial;
      m.opacity = seat * 0.9;
    }
  });

  return (
    <group ref={group}>
      {/* fabric */}
      <lineSegments geometry={chordGeo}>
        <lineBasicMaterial ref={chordMat} color={SCENE.chord} transparent opacity={0.06} />
      </lineSegments>

      {/* charge */}
      <points ref={charge} geometry={chargeGeo}>
        <pointsMaterial
          color={SCENE.ink}
          size={0.055}
          sizeAttenuation
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* devices */}
      <group ref={devices}>
        {points.map((_, i) => (
          <group key={i}>
            <mesh geometry={pkgGeo} material={pkgMat} />
            <lineSegments geometry={pkgEdges} material={edgeMat} />
            <mesh geometry={dieGeo} material={dieMat} position={[0, 0.185, 0]} />
          </group>
        ))}
      </group>

      {/* the ring the devices sit on */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RADIUS - 0.012, RADIUS + 0.012, 128]} />
        <meshBasicMaterial color={SCENE.ruleStrong} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function DomainScene({ progressRef, active, onReady }: SceneProps) {
  return (
    <Canvas
      // Reported to SceneMount so the drawing underneath only fades out once
      // there is something real to fade to.
      onCreated={() => onReady?.()}
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 3.4, 6.2], fov: 34 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 7, 3]} intensity={1.1} color={SCENE.keyLight} />
      <directionalLight position={[-5, 2, -4]} intensity={0.5} color={SCENE.plasma} />
      <Domain progressRef={progressRef} />
    </Canvas>
  );
}
