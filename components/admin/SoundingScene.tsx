"use client";

/**
 * THE SOUNDING FIELD — live.
 *
 * The same drawing as Chart.tsx, given a hand to answer. It reads the same
 * points through the same projection, so at rest the canvas is registered
 * exactly over the still it replaced and the cross-fade shows nothing moving.
 *
 * "3D" here is the projection, not a camera orbit. The plane is dimetric and
 * the pointer tilts its basis — the same thing as turning a drawing board,
 * and the reason the chart stays readable while it moves. Everything is
 * projected on the CPU into one orthographic screen-space frame: with a few
 * dozen soundings that costs nothing, and it guarantees the scene and the SVG
 * can never drift apart, because there is only one projection in the codebase.
 *
 * Three draw calls: the lattice, the stems, the beads. Mounted only through
 * ChartMount, which has already decided this machine can afford it and that
 * the reader has not asked for less motion.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ADMIN } from "@/content";
import { STATUS_LABEL, type ReservationStatus } from "@/lib/server/schema";
import type { Field, Sounding } from "@/app/admin/derive";
import { days } from "@/app/admin/format";
import { hold, subscribe } from "./hold";
import { SCENE } from "./palette";
import { ChartTicks } from "./ChartTicks";
import { VIEW, type Basis, basis, beadRadius, lattice, paintOrder, percent, planeCorners, project } from "./project";

export interface SoundingSceneProps {
  field: Field;
  /** Age of the oldest sounding, for the left end of the time axis. */
  oldest: number;
  active: boolean;
  onReady?: () => void;
}

/** How close, in view units, the pointer has to be to claim a sounding. */
const PICK_RADIUS = 26;

const VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aTint;
  attribute float aDim;
  uniform float uScale;
  varying vec3 vTint;
  varying float vDim;
  void main() {
    vTint = aTint;
    vDim = aDim;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = max(2.0, aSize * uScale);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uInk;
  varying vec3 vTint;
  varying float vDim;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p);
    if (d > 0.5) discard;
    // A bead, not a blob: hard rim, one specular core up and to the left.
    float rim = smoothstep(0.5, 0.41, d);
    float core = smoothstep(0.3, 0.0, length(p - vec2(-0.13, -0.15)));
    gl_FragColor = vec4(mix(vTint, uInk, core * 0.8), rim * vDim);
  }
`;

interface Field3DProps extends SoundingSceneProps {
  /** Called when the pointer takes or releases a sounding. */
  onPick: (index: number) => void;
  /** Called every frame with the picked bead's position, as frame percents. */
  onTrack: (left: number, top: number) => void;
  onOpen: (index: number) => void;
  /** Called every frame with the basis the plane is currently drawn on. */
  onTilt: (b: Basis) => void;
}

function Field3D({ field, active, onReady, onPick, onTrack, onOpen, onTilt }: Field3DProps) {
  const gl = useThree((s) => s.gl);
  const points = useMemo(() => paintOrder(field.points), [field.points]);
  const n = points.length;

  const grid = useRef<THREE.LineSegments>(null);
  const stems = useRef<THREE.LineSegments>(null);
  const beads = useRef<THREE.Points>(null);
  const tilt = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const born = useRef(0);
  const announced = useRef(false);
  // Pointer in view units, and which sounding it currently has hold of.
  const cursor = useRef({ x: -1e4, y: -1e4, inside: false });
  const picked = useRef(-1);
  // A row being hovered in the log, as an index into `points`.
  const fromLog = useRef(-1);

  const index = useMemo(() => new Map(points.map((p, i) => [p.reference, i])), [points]);
  useEffect(
    () =>
      subscribe((reference) => {
        // Only follow the log. Echoing our own pick back would make the two
        // ends of the channel chase each other around the frame loop.
        if (picked.current >= 0 && points[picked.current]?.reference === reference) return;
        fromLog.current = reference ? (index.get(reference) ?? -1) : -1;
      }),
    [index, points],
  );

  /* --- buffers, sized once ---------------------------------------------- */

  const geo = useMemo(() => {
    const latticeCount = lattice().length + 4; // grid lines plus the outline
    const g = {
      grid: new THREE.BufferGeometry(),
      stems: new THREE.BufferGeometry(),
      beads: new THREE.BufferGeometry(),
      plane: new THREE.BufferGeometry(),
    };
    g.grid.setAttribute("position", new THREE.BufferAttribute(new Float32Array(latticeCount * 6), 3));

    // The water column, as two triangles. The still fills the plane with a
    // gradient; without this the scene faded in and the water disappeared,
    // which is the sort of difference nobody can name and everybody notices.
    g.plane.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6 * 3), 3));
    // The still's column is light at the surface and gone by the floor. A
    // mesh has one opacity for the whole surface, so the fade is baked into
    // the vertex colours instead — pulled most of the way to the ground the
    // canvas is composited over, which is the same picture by other means.
    const shoalTop = new THREE.Color(SCENE.shoal);
    const deepFloor = new THREE.Color(SCENE.deep).lerp(new THREE.Color(SCENE.bg), 0.86);
    const water = new Float32Array(18);
    // Corner order per triangle: (0,0) (1,0) (1,1) / (0,0) (1,1) (0,1).
    [shoalTop, shoalTop, deepFloor, shoalTop, deepFloor, deepFloor].forEach((c, i) => c.toArray(water, i * 3));
    g.plane.setAttribute("color", new THREE.BufferAttribute(water, 3));
    g.stems.setAttribute("position", new THREE.BufferAttribute(new Float32Array(Math.max(1, n) * 6), 3));

    const pos = new Float32Array(Math.max(1, n) * 3);
    const size = new Float32Array(Math.max(1, n));
    const tint = new Float32Array(Math.max(1, n) * 3);
    const dim = new Float32Array(Math.max(1, n));
    const shoal = new THREE.Color(SCENE.shoal);
    const deep = new THREE.Color(SCENE.deep);
    const spent = new THREE.Color(SCENE.spent);
    const c = new THREE.Color();
    points.forEach((p, i) => {
      c.copy(p.terminal ? spent : shoal).lerp(deep, p.terminal ? 0 : p.depth);
      c.toArray(tint, i * 3);
      size[i] = beadRadius(p.magnitude) * 2;
      dim[i] = p.terminal ? 0.42 : 1;
    });
    g.beads.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.beads.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.beads.setAttribute("aTint", new THREE.BufferAttribute(tint, 3));
    g.beads.setAttribute("aDim", new THREE.BufferAttribute(dim, 1));
    return g;
  }, [points, n]);

  const uniforms = useMemo(() => ({ uScale: { value: 1 }, uInk: { value: new THREE.Color(SCENE.ink) } }), []);
  // The frame loop writes uScale. It reaches the material through the ref the
  // renderer assigned, rather than the object handed back by the hook.
  const material = useRef<THREE.ShaderMaterial>(null);
  const fitted = useRef("");

  useEffect(() => {
    return () => {
      geo.grid.dispose();
      geo.stems.dispose();
      geo.beads.dispose();
      geo.plane.dispose();
    };
  }, [geo]);

  /* --- the pointer tilts the board -------------------------------------- */

  useEffect(() => {
    const el = gl.domElement.parentElement ?? gl.domElement;

    /* The frame is held at the viewBox's aspect ratio, so a fraction across
       the element is a chart-space unit. That is all the picking needs — the
       bead positions are already computed on the CPU every frame, so the
       nearest one is a loop over a few dozen numbers rather than a raycast. */
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const fx = (e.clientX - r.left) / r.width;
      const fy = (e.clientY - r.top) / r.height;
      tilt.current.tx = fx * 2 - 1;
      tilt.current.ty = fy * 2 - 1;
      cursor.current.x = fx * VIEW.w;
      cursor.current.y = fy * VIEW.h;
      cursor.current.inside = true;
    };
    const leave = () => {
      tilt.current.tx = 0;
      tilt.current.ty = 0;
      cursor.current.inside = false;
    };
    const click = () => {
      if (picked.current >= 0) onOpen(picked.current);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("click", click);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("click", click);
    };
  }, [gl, onOpen]);

  useFrame((state, delta) => {
    if (!active) return;

    /* The frustum reproduces SVG's preserveAspectRatio="xMidYMid meet", so
       the canvas frames the chart exactly as the still did. Recomputed only
       when the canvas actually changed size. */
    const key = `${state.size.width}x${state.size.height}`;
    if (key !== fitted.current) {
      fitted.current = key;
      const cam = state.camera as THREE.OrthographicCamera;
      const scale = Math.min(state.size.width / VIEW.w, state.size.height / VIEW.h) || 1;
      const halfW = state.size.width / scale / 2;
      const halfH = state.size.height / scale / 2;
      cam.left = VIEW.w / 2 - halfW;
      cam.right = VIEW.w / 2 + halfW;
      // Top above bottom in value terms flips Y, so chart space and SVG space
      // are the same coordinates and project() needs no second variant.
      cam.top = VIEW.h / 2 - halfH;
      cam.bottom = VIEW.h / 2 + halfH;
      cam.near = -1000;
      cam.far = 1000;
      cam.updateProjectionMatrix();
      if (material.current) material.current.uniforms.uScale.value = scale * state.gl.getPixelRatio();
    }

    born.current = Math.min(1, born.current + delta / 1.1);

    const t = tilt.current;
    t.x += (t.tx - t.x) * Math.min(1, delta * 4);
    t.y += (t.ty - t.y) * Math.min(1, delta * 4);
    const b = basis(t.x, t.y);

    // Entrance: the soundings rise off the plane rather than fading in, so
    // the resting picture is the one that was there all along.
    const rise = easeOut(born.current);

    // The labels ride the plane, and only the owner of those nodes may move
    // them. This hands over the basis and stays out of the DOM.
    onTilt(b);

    const g = geo.grid.getAttribute("position") as THREE.BufferAttribute;
    const segs = lattice(8, 5, b);
    const corners = planeCorners(b);
    let k = 0;
    for (const [x1, y1, x2, y2] of segs) {
      g.setXYZ(k++, x1, y1, 0);
      g.setXYZ(k++, x2, y2, 0);
    }
    for (let i = 0; i < 4; i++) {
      const a = corners[i];
      const c = corners[(i + 1) % 4];
      g.setXYZ(k++, a[0], a[1], 0);
      g.setXYZ(k++, c[0], c[1], 0);
    }
    g.needsUpdate = true;

    const pl = geo.plane.getAttribute("position") as THREE.BufferAttribute;
    const [c0, c1, c2, c3] = corners;
    [c0, c1, c2, c0, c2, c3].forEach(([x, y], i) => pl.setXYZ(i, x, y, -1));
    pl.needsUpdate = true;

    const s = geo.stems.getAttribute("position") as THREE.BufferAttribute;
    const p = geo.beads.getAttribute("position") as THREE.BufferAttribute;
    const size = geo.beads.getAttribute("aSize") as THREE.BufferAttribute;

    /* Nearest bead to the pointer, weighted so a big mark is easier to hit —
       which is also how it looks, so the hit area matches the drawing. When
       the pointer is somewhere else entirely and the log is holding a row,
       that row's mark is taken instead: the chart answers "which one is
       that" for a table it is not being touched through. */
    let best = fromLog.current;
    let bestD = PICK_RADIUS * PICK_RADIUS;

    points.forEach((pt, i) => {
      const [bx, by] = project(pt.x, pt.depth, 0, b);
      const [tx, ty] = project(pt.x, pt.depth, pt.magnitude * rise, b);
      s.setXYZ(i * 2, bx, by, 0);
      s.setXYZ(i * 2 + 1, tx, ty, 0);
      p.setXYZ(i, tx, ty, 1);
      if (cursor.current.inside) {
        const dx = tx - cursor.current.x;
        const dy = ty - cursor.current.y;
        const d = dx * dx + dy * dy - beadRadius(pt.magnitude) * beadRadius(pt.magnitude);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
    });
    s.needsUpdate = true;
    p.needsUpdate = true;

    if (best !== picked.current) {
      // The held bead swells. Everything else keeps its size, so the change
      // reads as "this one" rather than as the chart rescaling.
      if (picked.current >= 0 && points[picked.current])
        size.setX(picked.current, beadRadius(points[picked.current].magnitude) * 2);
      if (best >= 0) size.setX(best, beadRadius(points[best].magnitude) * 2 + 9);
      size.needsUpdate = true;
      picked.current = best;
      state.gl.domElement.style.cursor = best >= 0 ? "pointer" : "";
      onPick(best);
    }
    if (best >= 0) {
      const pt = points[best];
      const [tx, ty] = project(pt.x, pt.depth, pt.magnitude * rise, b);
      onTrack((tx / VIEW.w) * 100, (ty / VIEW.h) * 100);
    }

    if (!announced.current) {
      announced.current = true;
      onReady?.();
    }
  });

  return (
    <>
      <mesh geometry={geo.plane} frustumCulled={false}>
        <meshBasicMaterial vertexColors transparent opacity={0.15} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments ref={grid} geometry={geo.grid} frustumCulled={false}>
        <lineBasicMaterial color={SCENE.rule} transparent opacity={0.9} />
      </lineSegments>
      <lineSegments ref={stems} geometry={geo.stems} frustumCulled={false}>
        <lineBasicMaterial color={SCENE.shoal} transparent opacity={0.4} />
      </lineSegments>
      <points ref={beads} geometry={geo.beads} frustumCulled={false}>
        <shaderMaterial
          ref={material}
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </points>
    </>
  );
}

function easeOut(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

/**
 * The scene, plus the one thing it cannot draw: type.
 *
 * Both labels the chart carries live here as HTML over the canvas. The axis
 * names are handed to Field3D, which re-places them from its own basis so
 * they turn with the plane. The tooltip names whichever sounding the pointer
 * is holding, and clicking it opens that dossier — the chart is a way into
 * the data rather than a picture of it.
 *
 * The tooltip's *contents* are React state, changed only when the held bead
 * changes; its *position*, like the axes', is written straight to the node
 * every frame, because both move whenever the board tilts and re-rendering
 * sixty times a second to follow them would be absurd.
 *
 * The table below is the accessible path to all of this. Nothing here is the
 * only way to reach a row.
 */
export default function SoundingScene(props: SoundingSceneProps) {
  const router = useRouter();
  const ordered = useMemo(() => paintOrder(props.field.points), [props.field.points]);
  const [held, setHeld] = useState<Sounding | null>(null);
  const tip = useRef<HTMLDivElement>(null);
  const axes = useRef<HTMLDivElement>(null);

  const onPick = useCallback(
    (i: number) => {
      const p = i >= 0 ? (ordered[i] ?? null) : null;
      setHeld(p);
      hold(p?.reference ?? null);
    },
    [ordered],
  );

  /* Half the label's width, as a percentage of the frame. Measured when the
     label's contents change rather than in the frame loop, because reading a
     layout property sixty times a second is how you lose a frame budget. */
  const reach = useRef(0);
  useEffect(() => {
    const el = tip.current;
    const host = el?.parentElement;
    if (!el || !host || !held) return;
    reach.current = host.clientWidth ? (el.offsetWidth / 2 / host.clientWidth) * 100 : 0;
  }, [held]);

  const onTrack = useCallback((left: number, top: number) => {
    const el = tip.current;
    if (!el) return;
    // Slid inboard far enough to stay whole, with the pointer left behind on
    // the bead. Below the mark when there is no room above it.
    const edge = reach.current + 1;
    const x = Math.min(100 - edge, Math.max(edge, left));
    el.style.left = `${x}%`;
    el.style.top = `${top}%`;
    el.style.setProperty("--tip-x", `${50 + ((left - x) / (reach.current * 2 || 1)) * 100}%`);
    const under = top < 20 ? "true" : "";
    if (el.dataset.under !== under) el.dataset.under = under;
  }, []);
  const onOpen = useCallback(
    (i: number) => {
      const p = ordered[i];
      if (p) router.push(`/admin/r/${p.reference}`);
    },
    [ordered, router],
  );
  /* Each label carries the chart-space point it names, so re-placing the set
     is a loop over eight nodes and two style properties each — cheaper than
     a render, and it keeps the axes attached to a plane that is turning. */
  const onTilt = useCallback((b: Basis) => {
    const host = axes.current;
    if (!host) return;
    for (const el of host.children) {
      const node = el as HTMLElement;
      const at = percent(Number(node.dataset.u), Number(node.dataset.v), 0, b);
      node.style.left = at.left;
      node.style.top = at.top;
    }
  }, []);

  return (
    <div className="relative h-full">
      <Canvas
        orthographic
        dpr={[1, 2]}
        frameloop={props.active ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        style={{ width: "100%", height: "100%" }}
      >
        <Field3D {...props} onPick={onPick} onTrack={onTrack} onOpen={onOpen} onTilt={onTilt} />
      </Canvas>

      <ChartTicks oldest={props.oldest} hostRef={axes} />

      <div ref={tip} className="adm-tip" data-held={held ? "true" : undefined}>
        {held && (
          <>
            <p className="adm-tip-ref">{held.reference}</p>
            <p className="adm-tip-name">{held.company}</p>
            <p className="adm-tip-meta">
              {held.gpus} {ADMIN.table.capacity} · {STATUS_LABEL[held.status as ReservationStatus] ?? held.status} ·{" "}
              {days(held.ageDays)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
