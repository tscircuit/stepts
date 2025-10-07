export type OcctLinearUnit =
  | "millimeter"
  | "centimeter"
  | "meter"
  | "inch"
  | "foot"

export type OcctLinearDeflectionType = "bounding_box_ratio" | "absolute_value"

export interface OcctImportParams {
  linearUnit?: OcctLinearUnit
  linearDeflectionType?: OcctLinearDeflectionType
  linearDeflection?: number
  angularDeflection?: number
}

export interface OcctImportNode {
  name: string
  meshes: number[]
  children: OcctImportNode[]
}

export interface OcctMeshAttributeData {
  array: number[]
}

export interface OcctMeshAttributes {
  position: OcctMeshAttributeData
  normal?: OcctMeshAttributeData
}

export interface OcctMeshFaceRange {
  first: number
  last: number
  color: [number, number, number] | null
}

export interface OcctMesh {
  name: string
  color?: [number, number, number]
  brep_faces: OcctMeshFaceRange[]
  attributes: OcctMeshAttributes
  index: { array: number[] }
}

export interface OcctImportResult {
  success: boolean
  root: OcctImportNode
  meshes: OcctMesh[]
}

type OcctImport = {
  ReadStepFile(
    content: ArrayBufferView | ArrayBuffer,
    params: OcctImportParams | null,
  ): OcctImportResult
  ReadBrepFile(
    content: ArrayBufferView | ArrayBuffer,
    params: OcctImportParams | null,
  ): OcctImportResult
  ReadIgesFile(
    content: ArrayBufferView | ArrayBuffer,
    params: OcctImportParams | null,
  ): OcctImportResult
}

type OcctImportFactory = () => Promise<OcctImport>

let occtInstancePromise: Promise<OcctImport> | undefined

async function loadOcct(): Promise<OcctImport> {
  if (!occtInstancePromise) {
    const imported = (await import("occt-import-js")) as unknown
    const factory = resolveFactory(imported)
    occtInstancePromise = factory()
  }
  return occtInstancePromise
}

function resolveFactory(candidate: unknown): OcctImportFactory {
  if (typeof candidate === "function") {
    return candidate as OcctImportFactory
  }
  if (
    candidate &&
    typeof candidate === "object" &&
    "default" in candidate &&
    typeof (candidate as { default: unknown }).default === "function"
  ) {
    return (candidate as { default: unknown }).default as OcctImportFactory
  }
  throw new Error("Unable to resolve occt-import-js factory export")
}

export type StepInput = string | ArrayBuffer | ArrayBufferView

function toUint8Array(input: StepInput): Uint8Array {
  if (typeof input === "string") {
    return new TextEncoder().encode(input)
  }
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input)
  }
  const view = input as ArrayBufferView
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
}

export async function importStepWithOcct(
  input: StepInput,
  params: OcctImportParams | null = null,
): Promise<OcctImportResult> {
  const occt = await loadOcct()
  const data = toUint8Array(input)
  const result = occt.ReadStepFile(data, params)
  if (!result.success) {
    throw new Error("occt-import-js failed to load STEP file")
  }
  return result
}
