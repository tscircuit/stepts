import { expect, type MatcherResult } from "bun:test"

export type BBox = {
  min: [number, number, number]
  max: [number, number, number]
}

export type StepSnapshotOptions = {
  chordTolerance?: number
  angleTolerance?: number
  width?: number
  height?: number
  background?: [number, number, number, number]
}

async function convertMeshesToGlb(meshes: any[]): Promise<Uint8Array> {
  type Accessor = {
    bufferView: number
    byteOffset: number
    componentType: number
    count: number
    type: string
    min?: number[]
    max?: number[]
  }

  const chunks: { data: Uint8Array }[] = []
  const bufferViews: { buffer: number; byteOffset: number; byteLength: number }[] = []
  const accessors: Accessor[] = []
  const primitives: any[] = []

  const append = (arr: Uint8Array) => {
    const byteOffset = chunks.reduce((sum, c) => sum + c.data.byteLength, 0)
    chunks.push({ data: arr })
    const viewIndex = bufferViews.length
    bufferViews.push({ buffer: 0, byteOffset, byteLength: arr.byteLength })
    return viewIndex
  }

  for (const mesh of meshes) {
    const posArr = new Float32Array(mesh.attributes.position.array)
    const idxArr = new Uint32Array(mesh.index.array)

    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    for (let i = 0; i < posArr.length; i += 3) {
      const x = posArr[i], y = posArr[i + 1], z = posArr[i + 2]
      if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z
      if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z
    }

    const posView = append(new Uint8Array(posArr.buffer, posArr.byteOffset, posArr.byteLength))
    const idxView = append(new Uint8Array(idxArr.buffer, idxArr.byteOffset, idxArr.byteLength))

    const posAccessorIndex = accessors.length
    accessors.push({
      bufferView: posView,
      byteOffset: 0,
      componentType: 5126,
      count: posArr.length / 3,
      type: "VEC3",
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
    })

    const idxAccessorIndex = accessors.length
    accessors.push({
      bufferView: idxView,
      byteOffset: 0,
      componentType: 5125,
      count: idxArr.length,
      type: "SCALAR",
    })

    primitives.push({
      attributes: { POSITION: posAccessorIndex },
      indices: idxAccessorIndex,
      mode: 4,
    })
  }

  const totalByteLength = chunks.reduce((sum, c) => sum + c.data.byteLength, 0)
  const bin = new Uint8Array(totalByteLength)
  let offset = 0
  for (const c of chunks) {
    bin.set(c.data, offset)
    offset += c.data.byteLength
  }

  const gltf = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives }],
    accessors,
    bufferViews,
    buffers: [{ byteLength: bin.byteLength }],
  }

  const json = new TextEncoder().encode(JSON.stringify(gltf))

  const pad4 = (n: number) => (4 - (n % 4)) % 4
  const jsonPad = pad4(json.length)
  const binPad = pad4(bin.length)

  const totalLength = 12 + 8 + (json.length + jsonPad) + 8 + (bin.length + binPad)
  const glb = new Uint8Array(totalLength)
  const dv = new DataView(glb.buffer)

  dv.setUint32(0, 0x46546c67, true)
  dv.setUint32(4, 2, true)
  dv.setUint32(8, totalLength, true)

  dv.setUint32(12, json.length + jsonPad, true)
  dv.setUint32(16, 0x4e4f534a, true)
  glb.set(json, 20)
  for (let i = 0; i < jsonPad; i++) glb[20 + json.length + i] = 0x20

  const binChunkOffset = 20 + json.length + jsonPad
  dv.setUint32(binChunkOffset, bin.length + binPad, true)
  dv.setUint32(binChunkOffset + 4, 0x004e4942, true)
  glb.set(bin, binChunkOffset + 8)

  return glb
}

async function convertStepToGlb(
  stepContent: string | Uint8Array,
  options?: { chordTolerance?: number; angleTolerance?: number },
): Promise<{ glb: Uint8Array; bbox: BBox }> {
  const { importStepWithOcct } = await import("../utils/occt/importer")
  const stepBytes = typeof stepContent === "string" ? new TextEncoder().encode(stepContent) : stepContent

  const result = await importStepWithOcct(stepBytes, {
    linearUnit: "millimeter",
    linearDeflectionType: "bounding_box_ratio",
    linearDeflection: options?.chordTolerance ?? 0.001,
    angularDeflection: options?.angleTolerance ?? 0.5,
  })

  if (!result.success || result.meshes.length === 0) {
    throw new Error("Failed to read STEP file or no meshes found")
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (const mesh of result.meshes) {
    const p = mesh.attributes.position.array as number[]
    for (let i = 0; i < p.length; i += 3) {
      const x = p[i], y = p[i + 1], z = p[i + 2]
      if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z
      if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z
    }
  }

  const bbox: BBox = { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] }
  const glb = await convertMeshesToGlb(result.meshes)
  return { glb, bbox }
}

async function renderGlbToPng(
  glb: Uint8Array,
  bbox: BBox,
  options?: { width?: number; height?: number; background?: [number, number, number, number] },
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

  const { renderGLTFToPNGBufferFromGLBBuffer } = await import("poppygl")
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

async function toMatchStepSnapshot(
  this: any,
  receivedMaybePromise: string | Uint8Array | Promise<string | Uint8Array>,
  testPath: string,
  pngName?: string,
  options?: StepSnapshotOptions,
): Promise<MatcherResult> {
  try {
    const stepContent = await receivedMaybePromise
    const { glb, bbox } = await convertStepToGlb(stepContent, {
      chordTolerance: options?.chordTolerance,
      angleTolerance: options?.angleTolerance,
    })
    const png = await renderGlbToPng(glb, bbox, {
      width: options?.width,
      height: options?.height,
      background: options?.background,
    })
    return await expect(png).toMatchPngSnapshot(testPath, pngName)
  } catch (error) {
    return {
      message: () => `Failed to create STEP snapshot: ${error}`,
      pass: false,
    }
  }
}

expect.extend({
  toMatchStepSnapshot: toMatchStepSnapshot as any,
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchStepSnapshot(
      testPath: string,
      pngName?: string,
      options?: StepSnapshotOptions,
    ): Promise<MatcherResult>
  }
}

export async function cleanupStepSnapshot() {
}
