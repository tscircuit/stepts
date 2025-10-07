import { renderGLTFToPNGBufferFromGLBBuffer } from "poppygl"
import type { BBox } from "./step-to-glb"

export interface GlbToPngOptions {
  width?: number
  height?: number
  background?: [number, number, number, number]
}

export async function renderGlbToPng(
  glb: Uint8Array,
  bbox: BBox,
  options?: GlbToPngOptions,
): Promise<Uint8Array> {
  const width = options?.width ?? 800
  const height = options?.height ?? 600
  const bg = options?.background ?? [1, 1, 1, 1]

  const cx = 0.5 * (bbox.min[0] + bbox.max[0])
  const cy = 0.5 * (bbox.min[1] + bbox.max[1])
  const cz = 0.5 * (bbox.min[2] + bbox.max[2])
  const size = Math.max(bbox.max[0] - bbox.min[0], bbox.max[1] - bbox.min[1], bbox.max[2] - bbox.min[2]) || 1
  const dist = size * 2.5
  const camPos: readonly [number, number, number] = [cx + dist * 0.7, cy + dist * 0.5, cz + dist * 0.7]
  const lookAt: readonly [number, number, number] = [cx, cy, cz]

  const pngBuf: Buffer = await renderGLTFToPNGBufferFromGLBBuffer(glb, {
    width,
    height,
    fov: 35,
    ambient: 0.2,
    gamma: true,
    cull: true,
    camPos,
    lookAt,
    backgroundColor: [bg[0], bg[1], bg[2]],
  })

  return new Uint8Array(pngBuf)
}
