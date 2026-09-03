"use client";

/**
 * D3 HERO FIELD — the energised bus, as a shader.
 *
 * Deliberately not a model of the hardware: D1 and D2 both draw the node, and
 * a third axonometric would be the same idea in a new colour. This is the
 * thing around the hardware — the field a 35 kW load sits in. Domain-warped
 * fbm produces filaments; a second, slower warp drags them; the live phase
 * uniform is the same 0→1 scroll value that drives the CSS accent, so the
 * canvas and the type change temperature together.
 *
 * Written against the WebGL context directly rather than three.js, which the
 * other scenes use. The whole scene is one triangle and one fragment shader,
 * so a scene graph, a camera, a material system and a renderer would be
 * ~600 KB of parse and compile bought for nothing — and this is the one scene
 * that sits above the fold, where that cost lands on the first impression.
 * `DomainScene` is below the fold and still uses three.js, where it earns it.
 *
 * DPR is capped at 1.5 and the loop stops the moment the hero leaves the
 * viewport or the tab is hidden.
 */

import { useEffect, useRef } from "react";
import type { SceneProps } from "@/components/shared/SceneMount";
import { SCENE } from "./palette";

/** One triangle that covers the clip volume. No geometry, no transform. */
const VERT = /* glsl */ `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform float uPhase;
  uniform vec2  uRes;
  uniform vec3  uVolt;
  uniform vec3  uPlasma;
  uniform vec3  uBg;

  // Value noise. Cheap, and the filaments come from the warp, not the octaves.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // Aspect-corrected, origin at centre.
    vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);

    float t = uTime * 0.035;

    // Two-stage domain warp, deliberately gentle. A stronger warp gives the
    // chrome-and-oil look every WebGL hero has; what we want is a field with
    // thin bright cores and a lot of dark between them.
    vec2 q = vec2(fbm(uv * 1.15 + vec2(0.0, t)), fbm(uv * 1.15 + vec2(4.2, -t)));
    vec2 r = vec2(
      fbm(uv * 1.5 + 1.35 * q + vec2(1.7, 9.2) + t * 0.9),
      fbm(uv * 1.5 + 1.35 * q + vec2(8.3, 2.8) - t * 0.7)
    );
    float f = fbm(uv * 1.35 + 1.8 * r);

    // Ridged, then raised to a high power: the cores collapse to filaments and
    // everything else falls to black.
    float ridge = 1.0 - abs(f * 2.0 - 1.0);
    float filament = pow(clamp(ridge, 0.0, 1.0), 11.0);

    // Three horizontal conductors, bent through the field.
    float bus = 0.0;
    for (int i = 0; i < 3; i++) {
      float y = (float(i) - 1.0) * 0.3 + (r.y - 0.5) * 0.16;
      bus += 0.0011 / max(abs(uv.y - y), 0.0011) * 0.02;
    }

    // Charge travelling along the conductors.
    float sweep = fract(uv.x * 0.3 - uTime * 0.075);
    float pulse = pow(1.0 - abs(sweep * 2.0 - 1.0), 14.0);

    float energy = filament * 0.55 + bus + bus * pulse * 2.0;

    // Temperature travels with the page.
    vec3 tint = mix(uVolt, uPlasma, clamp(uPhase, 0.0, 1.0));
    vec3 col = uBg + tint * energy * 0.85 + vec3(energy * energy * 0.18);

    // Weight the whole field to the right and the bottom, which is where the
    // type is not. The headline sits on near-solid substrate at every size.
    float toRight = smoothstep(-0.15, 0.75, uv.x);
    float toBottom = smoothstep(-0.15, 0.55, vUv.y);
    float vig = smoothstep(1.35, 0.25, length(uv * vec2(0.7, 1.0)));
    float mask = vig * (0.12 + 0.88 * max(toRight, toBottom * 0.65));

    col = mix(uBg, col, mask);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/** #rrggbb → linear-ish 0–1 triple, matching what the shader expects. */
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const srgb = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return [srgb(((n >> 16) & 255) / 255), srgb(((n >> 8) & 255) / 255), srgb((n & 255) / 255)];
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function BusScene({ progressRef, active, onReady }: SceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read inside the loop rather than closed over, so toggling visibility does
  // not tear down and rebuild the GL context.
  const activeRef = useRef(active);
  activeRef.current = active;
  // Set by the GL effect so the visibility effect below can restart a loop it
  // did not create.
  const resumeRef = useRef<(() => void) | null>(null);
  // Held in a ref, and kept out of the effect's dependencies, so that a caller
  // passing a fresh callback each render cannot tear down and rebuild the GL
  // context. Losing a context is not recoverable without a restore handler,
  // and the canvas is left showing whatever was in the buffer.
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      time: gl.getUniformLocation(program, "uTime"),
      phase: gl.getUniformLocation(program, "uPhase"),
      res: gl.getUniformLocation(program, "uRes"),
    };
    gl.uniform3fv(gl.getUniformLocation(program, "uVolt"), rgb(SCENE.volt));
    gl.uniform3fv(gl.getUniformLocation(program, "uPlasma"), rgb(SCENE.plasma));
    gl.uniform3fv(gl.getUniformLocation(program, "uBg"), rgb(SCENE.bg));

    /*
      The field is soft, low-frequency and heavily blurred by its own maths —
      there is no detail in it finer than a few pixels. Rendering it at device
      resolution therefore buys nothing visible and costs the fragment shader,
      which evaluates nine octaves of noise per pixel, in direct proportion.
      So: one device pixel per CSS pixel at most, and an absolute ceiling on
      the buffer so a large display does not quietly become a heater. Upscaling
      the last stretch is free and, on a field like this, invisible.
    */
    const MAX_PIXELS = 1_300_000;

    const resize = () => {
      const cssW = Math.max(1, canvas.clientWidth);
      const cssH = Math.max(1, canvas.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 1);
      const fit = Math.min(1, Math.sqrt(MAX_PIXELS / (cssW * dpr * (cssH * dpr))));
      const w = Math.max(1, Math.round(cssW * dpr * fit));
      const h = Math.max(1, Math.round(cssH * dpr * fit));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.res, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let frame = 0;
    let time = 0;
    let last = performance.now();
    let announced = false;

    const draw = (now: number) => {
      // Off-screen or backgrounded: end the loop rather than keep scheduling
      // callbacks that do nothing. A rAF that runs forever holds the browser
      // out of its idle state, which is the opposite of what a parked scene
      // should cost. `resume` starts it again.
      if (!activeRef.current || document.hidden) {
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(draw);
      // The field drifts at 0.035 units a second. Redrawing it sixty times a
      // second renders the same picture repeatedly and takes frame budget away
      // from the scrolling underneath it, which is the thing people can
      // actually see. Thirty is already more than this motion needs.
      if (now - last < 32) return;
      // Clamp the step so a paused scene does not fast-forward the field.
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += delta;
      gl.uniform1f(u.time, time);
      gl.uniform1f(u.phase, progressRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!announced) {
        announced = true;
        onReadyRef.current?.();
      }
    };
    frame = requestAnimationFrame(draw);

    const resume = () => {
      if (!frame && activeRef.current && !document.hidden) {
        // Reset the clock so the field picks up where it stopped instead of
        // jumping by however long it was parked.
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };
    resumeRef.current = resume;
    document.addEventListener("visibilitychange", resume);

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(frame);
      frame = 0;
      resumeRef.current = null;
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      cancelAnimationFrame(frame);
      frame = 0;
      resumeRef.current = null;
      document.removeEventListener("visibilitychange", resume);
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [progressRef]);

  // Scrolling back to the hero restarts the loop the draw callback ended.
  useEffect(() => {
    if (active) resumeRef.current?.();
  }, [active]);

  return <canvas ref={canvasRef} aria-hidden className="block h-full w-full" />;
}
