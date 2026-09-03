/**
 * One browser launcher for every measurement script.
 *
 * Headless Chromium defaults to SwiftShader, a software rasteriser. That is
 * fine for correctness checks and actively misleading for performance ones:
 * a full-viewport fragment shader costs orders of magnitude more on a CPU
 * rasteriser than on any real GPU, so a direction that leans on WebGL looks
 * broken when it is not. These flags put the actual GPU in the loop.
 *
 * Dev-only tooling. Not part of the shipped site.
 */
import { chromium } from "playwright";

export const GPU_ARGS = [
  "--use-angle=metal",
  "--enable-gpu",
  "--ignore-gpu-blocklist",
  "--enable-zero-copy",
];

/** A browser with hardware rendering, for anything that measures time. */
export function launchGpu() {
  return chromium.launch({ args: GPU_ARGS });
}

/** Confirms we really got hardware, so a silent fallback cannot skew a run. */
export async function assertHardware(browser) {
  const page = await browser.newPage();
  const renderer = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return "none";
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    return dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
  });
  await page.close();
  const software = /swiftshader|llvmpipe|software/i.test(renderer);
  return { renderer, software };
}
