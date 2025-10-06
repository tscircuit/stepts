declare module "occt-import-js" {
  export type OcctLinearUnit =
    | "millimeter"
    | "centimeter"
    | "meter"
    | "inch"
    | "foot"

  export type OcctLinearDeflectionType =
    | "bounding_box_ratio"
    | "absolute_value"

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

  export interface OcctImport {
    ReadStepFile(
      content: ArrayBuffer | ArrayBufferView,
      params: OcctImportParams | null,
    ): OcctImportResult
    ReadBrepFile(
      content: ArrayBuffer | ArrayBufferView,
      params: OcctImportParams | null,
    ): OcctImportResult
    ReadIgesFile(
      content: ArrayBuffer | ArrayBufferView,
      params: OcctImportParams | null,
    ): OcctImportResult
  }

  const factory: () => Promise<OcctImport>
  export = factory
}
