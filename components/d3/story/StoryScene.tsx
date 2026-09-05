"use client";

/**
 * THE STAGE — one particle field that becomes each chapter in turn.
 *
 * A single Points object, one draw call, one shader. Every particle carries
 * its position in all eight shapes as vertex attributes, and the vertex shader
 * mixes between the two the reader is currently between. The mix is not
 * uniform: each particle has its own departure delay and its own flight path,
 * so a shape does not slide into the next one, it comes apart and re-forms.
 * That is the whole effect, and it costs nothing per frame beyond the draw.
 *
 * The first shape is the module in the hero's photograph. The field is absent
 * until the module has closed, ignites on its silhouette — placed by a
 * uniform measured off the photograph's box, so it lies exactly on it — and
 * then leaves it for the horizon as the reader scrolls on. Where each shape
 * is fully formed is read off the layout (progress.ts), not assumed.
 *
 * Colour travels with the story from ember to hbm — a conductor under load
 * cooling into memory — and the brightest particles carry a paper-white core
 * so density reads as light rather than as paint.
 *
 * The pointer parts the field. It is the one thing on the page that answers
 * the hand directly, so it is kept small: a push, not a vortex.
 *
 * Mounted only through SceneMount, which has already decided this device can
 * afford it. Under reduced motion or without WebGL the drawing beneath stays.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FLEET, PRICE_POSITION } from "@/content";
import type { SceneProps } from "@/components/shared/SceneMount";
import { rampBytes } from "@/lib/oklch";
import { subscribeScroll } from "@/lib/scroll-runtime";
import { SCENE } from "../palette";
import { BEATS, FRAMES, smooth, stillPath } from "../hero/sequence";
import { mountStoryFrame, STORY_FRAME } from "./frame";
import { buildSeeds, buildShapes, SHAPE_ORDER, type DeviceMask } from "./shapes";

/**
 * Illustrative, not a payload figure: the package is drawn with eight memory
 * stacks because that is the layout of the part class, and the drawing needs
 * a number. Nothing on the page states it as a specification.
 */
const HBM_STACKS_DRAWN = 8;

const LAST = SHAPE_ORDER.length - 1;

const VERT = /* glsl */ `
  attribute vec3 aP0; attribute vec3 aP1; attribute vec3 aP2; attribute vec3 aP3;
  attribute vec3 aP4; attribute vec3 aP5; attribute vec3 aP6; attribute vec3 aP7;
  attribute vec3 aSeed;

  uniform float uProgress;   // 0 .. shapes-1
  uniform float uTime;
  uniform float uSize;
  uniform float uDpr;
  uniform float uAspect;
  uniform vec2  uPointer;    // NDC
  uniform float uPush;
  uniform vec4  uBox;        // the photograph's box in object space: centre xy, size wh
  uniform float uHot;

  varying float vAlpha;
  varying float vCore;
  varying float vFlight;
  varying float vJitter;

  vec3 pick(int i) {
    // Shape zero is the module, authored in the picture's own box and placed
    // here so it lies on the photograph however the page is laid out.
    if (i <= 0) return vec3(aP0.xy * uBox.zw + uBox.xy, aP0.z);
    if (i == 1) return aP1;
    if (i == 2) return aP2;
    if (i == 3) return aP3;
    if (i == 4) return aP4;
    if (i == 5) return aP5;
    if (i == 6) return aP6;
    return aP7;
  }

  void main() {
    float t = clamp(uProgress, 0.0, ${LAST}.0);
    int i = int(floor(t));
    float f = t - float(i);
    vec3 a = pick(i);
    vec3 b = pick(min(i + 1, ${LAST}));

    // Staggered departure, eased arrival.
    float delay = aSeed.x * 0.42;
    float ff = clamp((f - delay) / 0.58, 0.0, 1.0);
    ff = ff * ff * (3.0 - 2.0 * ff);
    float flight = sin(ff * 3.14159265);

    vec3 p = mix(a, b, ff);
    // Each particle leaves along its own direction, and the further it is
    // from either shape the more it drifts.
    vec3 dir = normalize(aSeed - 0.5 + vec3(0.0001));
    p += dir * flight * (0.35 + aSeed.y * 1.1);
    p += vec3(
      sin(uTime * 0.6 + aSeed.x * 6.2832),
      cos(uTime * 0.45 + aSeed.y * 6.2832),
      sin(uTime * 0.5 + aSeed.z * 6.2832)
    ) * (0.014 + flight * 0.08);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;

    // The hand parts the field.
    vec2 ndc = clip.xy / clip.w;
    vec2 d = ndc - uPointer;
    d.x *= uAspect;
    float dist = length(d) + 0.0001;
    float push = smoothstep(0.42, 0.0, dist) * uPush;
    clip.xy += (d / dist) * push * 0.16 * clip.w;
    gl_Position = clip;

    // Ignition: on the module the particles run small and hot, so the
    // silhouette reads as the photograph catching light rather than as dots.
    float size = uSize * (0.55 + aSeed.z * 1.15) * (1.0 + flight * 1.4) * (1.0 - uHot * 0.35);
    gl_PointSize = size * uDpr * (5.6 / max(0.5, -mv.z));

    vAlpha = (0.32 + aSeed.z * 0.68) * (1.0 - flight * 0.45);
    vCore = step(0.9, aSeed.z);
    vFlight = flight;
    vJitter = (aSeed.y - 0.5) * 0.16;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uRamp;   // ember → hbm, the long way round the hue wheel
  uniform vec3 uInk;
  uniform vec3 uBg;
  uniform float uPhase;
  uniform float uFade;       // the field's presence: nothing until the module ignites
  uniform float uHot;

  varying float vAlpha;
  varying float vCore;
  varying float vFlight;
  varying float vJitter;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float disc = smoothstep(0.5, 0.1, r);
    // Each particle sits a little off the page's phase, so the field is a
    // gradient of neighbouring hues rather than one flat colour.
    float ph = clamp(uPhase + vJitter, 0.0, 1.0);
    vec3 tint = texture2D(uRamp, vec2(ph, 0.5)).rgb;
    vec3 dim = mix(uBg, tint, 0.42);
    vec3 col = mix(dim, tint, vAlpha);
    // In flight, particles run hot.
    col = mix(col, tint, vFlight * 0.6);
    // On the module, hotter still: more of the paper-white core shows.
    col = mix(col, mix(tint, uInk, 0.4), uHot * 0.55);
    col = mix(col, uInk, vCore * smoothstep(0.3, 0.0, r));
    gl_FragColor = vec4(col, disc * vAlpha * uFade);
  }
`;

function rgb(hex: string): THREE.Color {
  return new THREE.Color(hex).convertSRGBToLinear();
}

function Field({
  progressRef,
  onReady,
  mask,
}: {
  progressRef: React.RefObject<number>;
  onReady?: () => void;
  mask: DeviceMask | null;
}) {
  const points = useRef<THREE.Points>(null);
  const { gl, size } = useThree();

  // Particle budget scales with the viewport at mount, so a phone is not asked
  // to move the same field as a desktop. Fixed thereafter: rebuilding seven
  // shapes on every address-bar resize would be a hitch for nothing.
  const [count] = useState(() => {
    const px = size.width * size.height;
    return Math.round(Math.min(34000, Math.max(12000, px / 45)));
  });
  // Landscape sets the closing word beside the chapter heading; portrait has
  // no room beside anything, so the word is centred over it instead. Fixed at
  // mount for the same reason as the count.
  const [wordOffset] = useState(() => (size.width < size.height ? 0 : 1.1));

  const geometry = useMemo(() => {
    const root = document.querySelector<HTMLElement>(".d3");
    const fontFamily = root ? getComputedStyle(root).getPropertyValue("--fd").trim() || "sans-serif" : "sans-serif";
    const shapes = buildShapes(count, {
      device: mask,
      fleet: FLEET.total,
      perNode: FLEET.gpusPerNode,
      stacks: HBM_STACKS_DRAWN,
      word: PRICE_POSITION.leadClaim.ours,
      fontFamily,
      wordOffset,
    });
    const g = new THREE.BufferGeometry();
    shapes.forEach((arr, i) => g.setAttribute(`aP${i}`, new THREE.BufferAttribute(arr, 3)));
    // Position is required by three's frustum culling; alias the horizon
    // and disable culling so the field is never clipped mid-flight.
    g.setAttribute("position", new THREE.BufferAttribute(shapes[1], 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(buildSeeds(count), 3));
    g.computeBoundingSphere();
    return g;
  }, [count, wordOffset, mask]);

  const material = useMemo(() => {
    // The live colour ramp, sampled in OKLCH the long way round — the same
    // curve the CSS `--live` follows — so the canvas and the type agree.
    const ramp = new THREE.DataTexture(rampBytes(SCENE.ember, SCENE.hbm, 256), 256, 1, THREE.RGBAFormat);
    ramp.colorSpace = THREE.SRGBColorSpace;
    ramp.minFilter = THREE.LinearFilter;
    ramp.magFilter = THREE.LinearFilter;
    ramp.needsUpdate = true;
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uSize: { value: 2.9 },
        uDpr: { value: 1 },
        uAspect: { value: 1 },
        uPointer: { value: new THREE.Vector2(9, 9) },
        uPush: { value: 0 },
        uPhase: { value: 0 },
        uFade: { value: 0 },
        uHot: { value: 0 },
        uBox: { value: new THREE.Vector4(0, 0, 6, 3.4) },
        uRamp: { value: ramp },
        uInk: { value: rgb(SCENE.ink) },
        uBg: { value: rgb(SCENE.bg) },
      },
    });
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);
  // The frame loop writes uniforms every frame. It reaches the material
  // through a ref, because a memoised value is a render value and the loop is
  // not a render — mutating it there is what the compiler rules forbid.
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  useEffect(() => {
    materialRef.current = material;
    return () => {
      materialRef.current = null;
      (material.uniforms.uRamp.value as THREE.Texture).dispose();
      material.dispose();
    };
  }, [material]);

  // Pointer, tracked on the window so the canvas does not need to take events
  // and the chapters above it stay clickable.
  const pointer = useRef({ x: 9, y: 9, target: 0, strength: 0 });
  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      const inside = x >= -1 && x <= 1 && y >= -1 && y <= 1;
      pointer.current.x = x;
      pointer.current.y = y;
      pointer.current.target = inside && e.pointerType === "mouse" ? 1 : 0;
    };
    const onLeave = () => {
      pointer.current.target = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [gl]);

  // Where the reader is comes from the shared story measurement. Only the
  // photograph's box and the canvas are read here, because the frame they sit
  // in moves once the hero unpins — and both are read in the frame's read
  // phase, so they cost no layout of their own.
  const layout = useRef<{ box: DOMRect | null; canvas: DOMRect | null }>({ box: null, canvas: null });
  useEffect(() => {
    const boxEl = document.querySelector<HTMLElement>("[data-device-box]");
    const releaseStory = mountStoryFrame();
    const releaseScroll = subscribeScroll({
      read: () => {
        const l = layout.current;
        l.box = boxEl ? boxEl.getBoundingClientRect() : null;
        l.canvas = gl.domElement.getBoundingClientRect();
      },
    });
    return () => {
      releaseScroll();
      releaseStory();
    };
  }, [gl]);

  // Lifted a little, so the shape sits in the upper two thirds and the chapter
  // text, which is end-aligned, reads against the scrim rather than the field.
  // Portrait screens lift it further and pull the camera back, because the
  // text takes most of the height there.
  const portrait = size.width < size.height;
  const lift = portrait ? 1.4 : 0.55;
  const scale = portrait ? 0.62 : 1;

  const smoothed = useRef({ progress: 0, ready: false });
  const tmp = useRef({ a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3() });
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const m = materialRef.current;
    if (!m) return;
    const u = m.uniforms;
    const s = smoothed.current;
    const l = layout.current;

    // The shape and the hero beat the reader is at, both already derived from
    // this frame's single measurement of the story.
    const hasMap = STORY_FRAME.map !== null;
    const target = hasMap ? STORY_FRAME.shapeIndex : progressRef.current * LAST;
    const hp = hasMap ? STORY_FRAME.heroProgress : 1;
    // Follow the scroll with a little inertia, so a flick reads as a gust
    // through the field rather than a cut.
    s.progress += (target - s.progress) * Math.min(1, dt * 7);
    u.uProgress.value = s.progress;
    // Colour: ember through the device and the horizon, cooling from there.
    u.uPhase.value = Math.min(1, Math.max(0, (s.progress - 1) / (LAST - 1)));
    // Presence: nothing until the module ignites, everything from then on.
    u.uFade.value = smooth(hp, BEATS.ignite);
    // Heat: hot on the module, cooling as the particles leave it.
    const onDevice = Math.min(1, Math.max(0, 1 - s.progress));
    u.uHot.value = u.uFade.value * onDevice;
    u.uTime.value = state.clock.elapsedTime;
    u.uDpr.value = state.viewport.dpr;
    u.uAspect.value = state.size.width / state.size.height;

    // The photograph's box: viewport → the z = 0 plane the field lives on →
    // object space. Cast through the camera rather than assumed from its
    // field of view, so the camera's slight downward look is accounted for.
    if (l.box && l.canvas && l.canvas.width > 0) {
      const cam = state.camera;
      const t = tmp.current;
      const hit = (px: number, py: number, out: THREE.Vector3) => {
        const nx = ((px - l.canvas!.left) / l.canvas!.width) * 2 - 1;
        const ny = 1 - ((py - l.canvas!.top) / l.canvas!.height) * 2;
        out.set(nx, ny, 0.5).unproject(cam).sub(cam.position).normalize();
        const k = -cam.position.z / out.z;
        return out.multiplyScalar(k).add(cam.position);
      };
      const cx = l.box.left + l.box.width / 2;
      const cy = l.box.top + l.box.height / 2;
      const c = hit(cx, cy, t.c);
      const w = hit(l.box.right, cy, t.a).x - hit(l.box.left, cy, t.b).x;
      const h = hit(cx, l.box.top, t.a).y - hit(cx, l.box.bottom, t.b).y;
      u.uBox.value.set(c.x / scale, (c.y - lift) / scale, w / scale, h / scale);
    }

    const p = pointer.current;
    p.strength += (p.target - p.strength) * Math.min(1, dt * 5);
    u.uPointer.value.set(p.x, p.y);
    u.uPush.value = p.strength;

    if (points.current) {
      // Slow drift, plus a parallax lean toward the pointer. Held still while
      // the field is on the module, which has to stay on the photograph.
      const lean = p.strength * (1 - onDevice);
      points.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.08) * 0.05 * (1 - onDevice) + p.x * 0.06 * lean;
      points.current.rotation.x = p.y * -0.04 * lean;
    }

    if (!s.ready) {
      s.ready = true;
      onReadyRef.current?.();
    }
  });

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      position={[0, lift, 0]}
      scale={scale}
    />
  );
}

/**
 * The module's silhouette, read off the smallest assembled still. A failed
 * fetch is not an error: the field falls back to a slab and the page never
 * knows.
 */
async function loadMask(): Promise<DeviceMask | null> {
  try {
    const size = Math.min(...FRAMES.sizes);
    const res = await fetch(stillPath("assembled", size));
    if (!res.ok) return null;
    const bitmap = await createImageBitmap(await res.blob());
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { data, w: canvas.width, h: canvas.height };
  } catch {
    return null;
  }
}

export default function StoryScene({ progressRef, active, onReady }: SceneProps) {
  // The canvas creates its context synchronously; the first real frame is what
  // fades the drawing out, and Field reports that. Field waits for the module's
  // silhouette too — a small fetch, and the alternative is rebuilding the
  // geometry when it lands.
  const [mask, setMask] = useState<DeviceMask | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) setMask((m) => (m === undefined ? null : m));
    }, 2500);
    void loadMask().then((m) => {
      if (!cancelled) setMask((prev) => (prev === undefined ? m : prev));
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.6]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance", stencil: false, depth: false }}
      camera={{ position: [0, 0.4, 9.2], fov: 38 }}
      style={{ pointerEvents: "none" }}
    >
      {mask !== undefined && <Field progressRef={progressRef} onReady={onReady} mask={mask} />}
    </Canvas>
  );
}
