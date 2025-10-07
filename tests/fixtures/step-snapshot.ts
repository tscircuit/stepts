import { expect } from "bun:test"
import {
  createSceneFromGLTF,
  renderSceneFromGLTF,
  pureImageFactory,
  encodePNGToBuffer,
} from "poppygl"
import { importStepWithOcct } from "../utils/occt/importer"
import type { OcctMesh } from "../utils/occt/importer"

// Ensure PNG matcher is loaded so we can reuse it
import "./png-matcher"

type GLTF = {
  asset: { version: "2.0"; generator?: string }
  scene: number
  scenes: { nodes: number[] }[]
  nodes: { mesh: number }[]
  meshes: { primitives: any[] }[]
  buffers: { byteLength: number }[]
  bufferViews: {
    buffer: number
    byteOffset?: number
    byteLength: number
    target?: number
  }[]
  accessors: {
    bufferView: number
    byteOffset?: number
    componentType: number
    count: number
    type: "SCALAR" | "VEC2" | "VEC3" | "VEC4" | "MAT4"
    min?: number[]
    max?: number[]
  }[]
  materials: any[]
}

function createFloat32Buffer(data: number[]): Uint8Array {
  const arr = new Float32Array(data)
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength)
}

function createUint32Buffer(data: number[]): Uint8Array {
  const arr = new Uint32Array(data)
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength)
}

function computeMinMax(positions: number[]) {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]
    const y = positions[i + 1]
    const z = positions[i + 2]
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (z < minZ) minZ = z
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
    if (z > maxZ) maxZ = z
  }
  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] }
}

function gltfFromOcctMeshes(meshes: OcctMesh[]) {
  const gltf: GLTF = {
    asset: { version: "2.0", generator: "stepts+poppygl" },
    scene: 0,
    scenes: [{ nodes: [] }],
    nodes: [],
    meshes: [],
    buffers: [],
    bufferViews: [],
    accessors: [],
    materials: [],
  }

  const buffers: Uint8Array[] = []

  const addBuffer = (bytes: Uint8Array) => {
    const idx = buffers.push(bytes) - 1
    gltf.buffers.push({ byteLength: bytes.byteLength })
    return idx
  }

  const defaultColor: [number, number, number] = [0.82, 0.82, 0.82]

  for (const m of meshes) {
    const positions = (m.attributes.position?.array ?? []) as number[]
    const normals = (m.attributes.normal?.array ?? []) as number[]
    const indices = (m.index?.array ?? []) as number[]

    if (!positions.length || !indices.length) {
      // skip empty meshes
      continue
    }

    // Material
    const [r, g, b] = (m.color ?? defaultColor) as [number, number, number]
    const matIndex =
      gltf.materials.push({
        pbrMetallicRoughness: {
          baseColorFactor: [r, g, b, 1],
          metallicFactor: 0,
          roughnessFactor: 0.9,
        },
      }) - 1

    // POSITION
    const posBufIdx = addBuffer(createFloat32Buffer(positions))
    const posBVIdx =
      gltf.bufferViews.push({
        buffer: posBufIdx,
        byteLength: positions.length * 4,
        target: 34962, // ARRAY_BUFFER
      }) - 1
    const { min, max } = computeMinMax(positions)
    const posAccIdx =
      gltf.accessors.push({
        bufferView: posBVIdx,
        componentType: 5126, // FLOAT
        count: positions.length / 3,
        type: "VEC3",
        min,
        max,
      }) - 1

    // NORMAL (optional)
    let normAccIdx: number | undefined
    if (normals.length) {
      const normBufIdx = addBuffer(createFloat32Buffer(normals))
      const normBVIdx =
        gltf.bufferViews.push({
          buffer: normBufIdx,
          byteLength: normals.length * 4,
          target: 34962, // ARRAY_BUFFER
        }) - 1
      normAccIdx =
        gltf.accessors.push({
          bufferView: normBVIdx,
          componentType: 5126, // FLOAT
          count: normals.length / 3,
          type: "VEC3",
        }) - 1
    }

    // INDICES (use UINT32)
    const idxBufIdx = addBuffer(createUint32Buffer(indices))
    const idxBVIdx =
      gltf.bufferViews.push({
        buffer: idxBufIdx,
        byteLength: indices.length * 4,
        target: 34963, // ELEMENT_ARRAY_BUFFER
      }) - 1
    const idxAccIdx =
      gltf.accessors.push({
        bufferView: idxBVIdx,
        componentType: 5125, // UNSIGNED_INT
        count: indices.length,
        type: "SCALAR",
      }) - 1

    const attributes: Record<string, number> = { POSITION: posAccIdx }
    if (typeof normAccIdx === "number") attributes.NORMAL = normAccIdx

    const meshIndex =
      gltf.meshes.push({
        primitives: [
          {
            attributes,
            indices: idxAccIdx,
            material: matIndex,
            mode: 4, // TRIANGLES
          },
        ],
      }) - 1

    const nodeIndex = gltf.nodes.push({ mesh: meshIndex }) - 1
    gltf.scenes[0].nodes.push(nodeIndex)
  }

  return { gltf, buffers }
}

async function renderStepToPNG(
  stepInput: string | Uint8Array | ArrayBuffer,
  opts?: { width?: number; height?: number; ambient?: number },
): Promise<Uint8Array> {
  const { width = 800, height = 600, ambient = 0.2 } = opts ?? {}

  const result = await importStepWithOcct(stepInput)
  if (!result.success || !result.meshes.length) {
    throw new Error("Failed to import STEP into meshes")
  }

  const { gltf, buffers } = gltfFromOcctMeshes(result.meshes)
  const scene = createSceneFromGLTF(gltf as any, { buffers, images: [] })

  const { bitmap } = renderSceneFromGLTF(
    scene,
    {
      width,
      height,
      ambient,
    },
    pureImageFactory,
  )

  const png = await encodePNGToBuffer(bitmap)
  return png
}

/**
 * Matcher: generate a PNG snapshot from STEP content (string/bytes),
 * compare against stored PNG snapshot using the same rules as png-matcher.
 *
 * Usage:
 *   import "../fixtures/step-snapshot" // register matcher
 *   await expect(stepContent).toMatchStepSnapshot(import.meta.path, "optionalName")
 */
async function toMatchStepSnapshot(
  // biome-ignore lint/suspicious/noExplicitAny: bun doesn't expose
  this: any,
  stepContent: string | Uint8Array | ArrayBuffer,
  testPathOriginal: string,
  pngName?: string,
) {
  const png = await renderStepToPNG(stepContent)
  // Delegate to existing PNG matcher for snapshot compare/update UX
  // @ts-expect-error - custom matcher registered globally
  return await expect(png).toMatchPngSnapshot(testPathOriginal, pngName)
}

expect.extend({
  toMatchStepSnapshot: toMatchStepSnapshot as any,
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchStepSnapshot(
      testPath: string,
      pngName?: string,
    ): Promise<import("bun:test").MatcherResult>
  }
}
