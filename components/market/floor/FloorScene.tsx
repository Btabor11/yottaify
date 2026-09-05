"use client";

/**
 * THE MARKET FLOOR.
 *
 * A dark reflective floor. Each seller is a lane. In each lane a GPU module
 * floats at the altitude of the seller's own published price, on a glass
 * riser. Every tracker report about that seller is a thin ring at its own
 * altitude in the same lane. Where the figures disagree, a translucent band
 * fills the gap — the spread is a volume you can see.
 *
 * Our rate is a lit rail across every lane, anchored at the left by the fleet
 * itself: sixteen modules in two stacks of eight, in a real rack frame.
 *
 * Colour does two jobs. Module LEDs carry stock (status palette). The rail
 * and hover carry emphasis (accent). Identity is position and a label.
 *
 * Scrubbing the timeline changes targets; everything damps toward them in
 * useFrame. Mounted only through FloorMount, which has already decided this
 * device can afford it. Under reduced motion the SVG still beneath stays.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { ProviderDigest, Snapshot, StockSignal } from "@/lib/market/types";
import { makeBlade, makeBladeMaterials } from "./blade";
import { FLOOR } from "./palette";
import { usd } from "../format";

export interface FloorSceneProps {
  snap: Snapshot;
  hover: string | null;
  onHover: (id: string | null) => void;
  onPin: (id: string) => void;
  active: boolean;
  onReady: () => void;
}

/** Price → altitude. $18 ≈ 9 units, so the whole market fits in one frame. */
const K = 0.5;
const LANE = 2.2;
/** The fleet stands at the expensive end, nearest the camera; the rail runs from it out to the cheap end. */
const fleetX = (lanes: number) => (lanes - 1) * LANE + 3.4;

const STOCK_LED: Record<StockSignal, { color: string; intensity: number }> = {
  "in-stock": { color: FLOOR.accent2, intensity: 2.2 },
  limited: { color: FLOOR.caution, intensity: 1.6 },
  waitlist: { color: FLOOR.caution, intensity: 1.0 },
  "out-of-stock": { color: FLOOR.alarm, intensity: 1.2 },
  unknown: { color: FLOOR.ink3, intensity: 0.3 },
  "not-reported": { color: FLOOR.ink3, intensity: 0.15 },
};

export default function FloorScene(props: FloorSceneProps) {
  const lanes = useMemo(() => props.snap.providers.filter((p) => p.low != null), [props.snap]);
  const center = (lanes.length - 1) * LANE * 0.5;
  const fx = fleetX(lanes.length);
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      frameloop={props.active ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
      camera={{ position: [fx + 4.5, 5.2, 15.5], fov: 42, near: 0.1, far: 200 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <Scene {...props} lanes={lanes} center={center} />
      </Suspense>
    </Canvas>
  );
}

function Scene({ snap, hover, onHover, onPin, onReady, lanes, center }: FloorSceneProps & { lanes: ProviderDigest[]; center: number }) {
  const tex = useTexture({ diff: "/market/pcb_diff.jpg", nor: "/market/pcb_nor_gl.jpg", arm: "/market/pcb_arm.jpg" });
  const mats = useMemo(() => makeBladeMaterials(tex), [tex]);
  const ready = useRef(false);
  useFrame(() => {
    if (!ready.current) {
      ready.current = true;
      onReady();
    }
  });

  return (
    <>
      <color attach="background" args={[FLOOR.bg]} />
      <fog attach="fog" args={[FLOOR.bg, 26, 60]} />
      <Environment files="/market/studio_512.hdr" environmentIntensity={0.55} />
      <directionalLight position={[center + 6, 18, 10]} intensity={2.4} color={FLOOR.keyLight} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-34, 34, 20, -20, 1, 60]} />
      </directionalLight>
      <directionalLight position={[center + 14, 6, -10]} intensity={0.7} color={FLOOR.rimLight} />
      <ambientLight intensity={0.12} />

      <Floor center={center} />
      <Grid center={center} width={lanes.length * LANE} />

      {lanes.map((p, i) => (
        <Lane key={p.provider} digest={p} x={i * LANE} near={lanes.length - 1 - i} mats={mats} hovered={hover === p.provider} dimmed={hover != null && hover !== p.provider} onHover={onHover} onPin={onPin} />
      ))}

      <Rail y={snap.ourRate * K} x0={-1.3} x1={fleetX(lanes.length) - 0.9} rate={snap.ourRate} />
      <Fleet x={fleetX(lanes.length)} y={snap.ourRate * K} mats={mats} />

      <OrbitControls
        target={[center + (lanes.length - 1) * LANE * 0.22, 3.2, 0]}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.06}
        minPolarAngle={0.95}
        maxPolarAngle={1.42}
        minAzimuthAngle={-0.35}
        maxAzimuthAngle={0.9}
        rotateSpeed={0.45}
      />
      <Parallax />
    </>
  );
}

/** A whisper of camera drift with the pointer when nobody is dragging. */
function Parallax() {
  const { camera, pointer } = useThree();
  const base = useRef<THREE.Vector3 | null>(null);
  useFrame((_, dt) => {
    base.current ??= camera.position.clone();
    const tx = base.current.x + pointer.x * 0.35;
    const ty = base.current.y + pointer.y * 0.2;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, 2.5, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, ty, 2.5, dt);
  });
  return null;
}

/**
 * Dark polished floor. Reflections come from the HDRI through the physical
 * material — no render-to-texture pass, so it costs nothing extra per frame
 * and never produces artefacts on software or low-end GPUs.
 */
function Floor({ center }: { center: number }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[center, -0.001, 0]} receiveShadow>
      <planeGeometry args={[160, 160]} />
      <meshPhysicalMaterial color={FLOOR.surface} roughness={0.32} metalness={0.55} clearcoat={0.35} clearcoatRoughness={0.25} envMapIntensity={0.9} />
    </mesh>
  );
}

/** Hairline grid: one line per lane, one per dollar. Pure geometry, no texture. */
function Grid({ center, width }: { center: number; width: number }) {
  const geom = useMemo(() => {
    const pts: number[] = [];
    const x0 = center - width / 2 - 3, x1 = center + width / 2 + 3;
    for (let x = Math.floor(x0); x <= x1; x += LANE / 2) pts.push(x, 0.002, -8, x, 0.002, 8);
    for (let z = -8; z <= 8; z += 1) pts.push(x0, 0.002, z, x1, 0.002, z);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [center, width]);
  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color={FLOOR.ruleStrong} transparent opacity={0.55} />
    </lineSegments>
  );
}

function Lane({ digest: p, x, near, mats, hovered, dimmed, onHover, onPin }: { digest: ProviderDigest; x: number; near: number; mats: ReturnType<typeof makeBladeMaterials>; hovered: boolean; dimmed: boolean; onHover: (id: string | null) => void; onPin: (id: string) => void }) {
  const published = p.published?.usdPerGpuHour ?? null;
  const anchor = published ?? p.low!;                      // where the module sits
  const ghost = published == null;                         // not first-hand → ghost module
  const lo = p.low!, hi = p.high!;
  const led = STOCK_LED[p.stock];

  const blade = useMemo(() => makeBlade(mats, led.color, led.intensity), [mats, led.color, led.intensity]);
  const group = useRef<THREE.Group>(null);
  const riser = useRef<THREE.Mesh>(null);
  const band = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.Group>(null);
  const [labelY, setLabelY] = useState(anchor * K);

  useEffect(() => {
    // Ghost = wireframe, so a gated seller is visibly not a measured one.
    blade.group.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.InstancedMesh) {
        const m = o.material as THREE.Material & { wireframe?: boolean; transparent?: boolean; opacity?: number };
        if (ghost) {
          o.material = (m as THREE.Material).clone();
          const c = o.material as typeof m;
          c.wireframe = true;
          c.transparent = true;
          c.opacity = 0.35;
        }
      }
    });
  }, [blade, ghost]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const targetY = anchor * K;
    g.position.y = THREE.MathUtils.damp(g.position.y, targetY, 4, dt);
    if (Math.abs(g.position.y - labelY) > 0.01) setLabelY(g.position.y);
    const s = hovered ? 1.06 : dimmed ? 0.96 : 1;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, s, 6, dt));
    blade.led.emissiveIntensity = THREE.MathUtils.damp(blade.led.emissiveIntensity, hovered ? led.intensity * 1.8 : dimmed ? led.intensity * 0.45 : led.intensity, 6, dt);
    if (riser.current) {
      riser.current.scale.y = THREE.MathUtils.damp(riser.current.scale.y, Math.max(0.02, g.position.y), 4, dt);
      riser.current.position.y = riser.current.scale.y / 2;
    }
    if (band.current) {
      const h = Math.max(0.02, (hi - lo) * K);
      band.current.scale.y = THREE.MathUtils.damp(band.current.scale.y, h, 4, dt);
      band.current.position.y = THREE.MathUtils.damp(band.current.position.y, lo * K + h / 2, 4, dt);
      (band.current.material as THREE.MeshPhysicalMaterial).opacity = THREE.MathUtils.damp((band.current.material as THREE.MeshPhysicalMaterial).opacity, hovered ? 0.28 : dimmed ? 0.05 : 0.13, 6, dt);
    }
    if (rings.current) {
      rings.current.children.forEach((r, i) => {
        const ty = (p.reported[i]?.usdPerGpuHour ?? lo) * K;
        r.position.y = THREE.MathUtils.damp(r.position.y, ty, 4, dt);
      });
    }
  });

  const showBand = hi - lo > 0.005;
  // Price labels crowd at the far end of the row; only the nearest lanes and the hovered one carry them.
  const showPrice = hovered || near < 9;

  return (
    <group position={[x, 0, 0]}>
      {/* hit target: whole lane column */}
      <mesh
        position={[0, 5, 0]}
        onPointerOver={(e) => { e.stopPropagation(); onHover(p.provider); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = ""; }}
        onClick={(e) => { e.stopPropagation(); onPin(p.provider); }}
      >
        <boxGeometry args={[LANE * 0.92, 10, 2.4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* riser */}
      <mesh ref={riser} position={[0, 0.5, 0]} scale={[1, 1, 1]}>
        <cylinderGeometry args={[0.05, 0.07, 1, 16]} />
        <meshPhysicalMaterial color={FLOOR.riser} transmission={0.85} thickness={0.6} roughness={0.15} ior={1.4} transparent opacity={0.9} />
      </mesh>

      {/* spread band */}
      {showBand && (
        <mesh ref={band} position={[0, lo * K, 0]}>
          <boxGeometry args={[1.7, 1, 1.15]} />
          <meshPhysicalMaterial color={FLOOR.ink2} transparent opacity={0.13} roughness={0.2} transmission={0.4} thickness={0.5} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* tracker reports: rings */}
      <group ref={rings}>
        {p.reported.map((r, i) => (
          <mesh key={i} position={[0, r.usdPerGpuHour * K, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.98, 0.022, 10, 64]} />
            <meshStandardMaterial color={FLOOR.ink2} emissive={FLOOR.ink2} emissiveIntensity={hovered ? 0.6 : 0.25} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* the module */}
      <group ref={group} position={[0, anchor * K, 0]}>
        <primitive object={blade.group} />
      </group>

      {/* labels */}
      <Html position={[0, -0.02, 1.5]} center distanceFactor={14} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div className="d3-tag whitespace-nowrap text-center" style={{ color: hovered ? FLOOR.ink : dimmed ? FLOOR.ink3 : FLOOR.ink2, transition: "color 160ms" }}>
          {p.label}
        </div>
      </Html>
      {showPrice && (
        <Html position={[0.95, labelY + 0.45, 0.4]} distanceFactor={14} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <div className="d3-figure whitespace-nowrap text-[0.75rem]" style={{ color: ghost ? FLOOR.ink3 : hovered ? FLOOR.accent : FLOOR.ink, opacity: dimmed ? 0.35 : 1, transition: "opacity 160ms, color 160ms" }}>
            {published != null ? usd(published) : `≈${usd(lo)}`}
            {showBand && <span style={{ color: FLOOR.ink3 }}> · {((hi - lo) / lo * 100).toFixed(0)}%</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

function Rail({ y, x0, x1, rate }: { y: number; x0: number; x1: number; rate: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, y, 4, dt);
  });
  const len = x1 - x0;
  return (
    <group ref={ref} position={[x0 + len / 2, y, 0]}>
      <mesh castShadow>
        <boxGeometry args={[len, 0.05, 0.05]} />
        <meshStandardMaterial color={FLOOR.accent} emissive={FLOOR.accent} emissiveIntensity={2.6} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[len, 0.01, 1.9]} />
        <meshBasicMaterial color={FLOOR.accent} transparent opacity={0.05} depthWrite={false} />
      </mesh>
      <Html position={[len / 2 - 6.4, 0.55, 0.3]} distanceFactor={14} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div className="d3-tag whitespace-nowrap" style={{ color: FLOOR.accent }}>ours · {usd(rate)}</div>
      </Html>
    </group>
  );
}

/** Sixteen modules in two stacks of eight, in a CC0 rack frame. The anchor of the rail. */
function Fleet({ x, y, mats }: { x: number; y: number; mats: ReturnType<typeof makeBladeMaterials> }) {
  const { scene } = useGLTF("/market/rack.glb");
  const rack = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        // The source model is painted green steel; pull it to a dark neutral so it reads as a rack, not furniture.
        const m = (o.material as THREE.MeshStandardMaterial).clone();
        m.color.set(FLOOR.rackTint);
        m.roughness = Math.min(0.7, m.roughness + 0.1);
        m.metalness = Math.max(0.5, m.metalness);
        o.material = m;
      }
    });
    return s;
  }, [scene]);
  const modules = useMemo(() => {
    const out: THREE.Group[] = [];
    for (let i = 0; i < 16; i++) {
      const { group } = makeBlade(mats, FLOOR.accent, 1.6);
      group.scale.setScalar(0.42);
      const col = i < 8 ? -0.33 : 0.33;
      group.position.set(col, 0.42 + (i % 8) * 0.44, 0);
      out.push(group);
    }
    return out;
  }, [mats]);
  // Rack is ~2.14 m tall in the file; scale so the top shelf meets the rail.
  const scale = Math.max(1.4, (y + 0.4) / 2.14);
  return (
    <group position={[x, 0, 0]}>
      <primitive object={rack} scale={scale} />
      <group scale={[1, scale / 1.9, 1]}>
        {modules.map((m, i) => <primitive key={i} object={m} />)}
      </group>
      <Html position={[0, y + 1.1, 0.4]} center distanceFactor={12} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div className="d3-tag whitespace-nowrap text-center" style={{ color: FLOOR.accent }}>this fleet · 16 × B300</div>
      </Html>
    </group>
  );
}

useGLTF.preload("/market/rack.glb");
