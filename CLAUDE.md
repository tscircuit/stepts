This is a library for parsing, creating and serializing STEP files. It is used by higher-level libraries want to generate STEP files for various purposes.

## Structure

```
stepts/
├─ lib/
│  ├─ core/                 # No STEP specifics—framework for IDs, refs, repo, utils
│  │  ├─ Entity.ts
│  │  ├─ Repository.ts
│  │  ├─ Ref.ts
│  │  ├─ stepFormat.ts      # low-level text helpers (escape, numbers)
│  │  └─ index.ts
│  ├─ io/                   # File-level concerns (headers, schema, units, read/write)
│  │  ├─ header.ts
│  │  ├─ schema.ts          # AP214/AP242 constants & helpers
│  │  ├─ units.ts
│  │  ├─ writer.ts          # repo → ISO-10303-21 string
│  │  └─ reader.ts          # string → repo (tokenize, splitArgs)
│  ├─ parse/                # Entity registry and parsing entrypoints
│  │  ├─ registry.ts
│  │  ├─ tokenize.ts
│  │  └─ parseRepository.ts
│  ├─ types/                # Shared types & discriminated unions
│  │  ├─ geometry.d.ts
│  │  ├─ topology.d.ts
│  │  ├─ product.d.ts
│  │  └─ presentation.d.ts
│  ├─ entities/             # STEP entity classes (strongly-typed)
│  │  ├─ geometry/
│  │  │  ├─ CartesianPoint.ts
│  │  │  ├─ Direction.ts
│  │  │  ├─ Axis2Placement3D.ts
│  │  │  ├─ Line.ts
│  │  │  ├─ Circle.ts
│  │  │  ├─ Plane.ts
│  │  │  ├─ CylindricalSurface.ts
│  │  │  └─ ToroidalSurface.ts
│  │  ├─ topology/
│  │  │  ├─ VertexPoint.ts
│  │  │  ├─ EdgeCurve.ts
│  │  │  ├─ OrientedEdge.ts
│  │  │  ├─ EdgeLoop.ts
│  │  │  ├─ FaceOuterBound.ts
│  │  │  ├─ FaceBound.ts
│  │  │  ├─ AdvancedFace.ts
│  │  │  ├─ ClosedShell.ts
│  │  │  └─ ManifoldSolidBrep.ts
│  │  ├─ product/
│  │  │  ├─ Product.ts
│  │  │  ├─ ProductContexts.ts
│  │  │  ├─ RepresentationContext.ts
│  │  │  ├─ ProductDefinition.ts
│  │  │  └─ AdvancedBrepShapeRepresentation.ts
│  │  ├─ presentation/
│  │  │  ├─ ColourRgb.ts
│  │  │  ├─ FillAreaStyleColour.ts
│  │  │  ├─ FillAreaStyle.ts
│  │  │  ├─ SurfaceStyleFillArea.ts
│  │  │  ├─ SurfaceSideStyle.ts
│  │  │  ├─ SurfaceStyleUsage.ts
│  │  │  ├─ PresentationStyleAssignment.ts
│  │  │  └─ StyledItem.ts
│  │  └─ Unknown.ts         # passthrough for entities not yet modeled
│  ├─ builders/             # Friendly factories for higher-level libs
│  │  ├─ placements.ts      # axis builders
│  │  ├─ topology.ts        # edge/loop/face/shell helpers
│  │  └─ styling.ts         # per-face color helpers
│  ├─ guards/               # runtime validation & narrowings
│  │  ├─ isCurve.ts
│  │  ├─ isSurface.ts
│  │  └─ assert.ts          # invariant/assert helpers
│  ├─ index.ts              # stable public API (barrels)
│
├─ tests/
│  ├─ roundtrip/
│  ├─ unit/
│  │  ├─ entities/
│  │  ├─ parse/
│  │  └─ io/
```

# ORIGINAL PROPOSAL

Here’s a **class-based, strongly-typed STEP core** you can hand to a higher-level geometry library. It focuses on:

- **Type-safe references** (`Ref<T>`) with lazy resolution
- **Round-trippable entities** (`static parse(...)` and `toStep()`)
- **A repository** to manage IDs, inter-entity links, and emission order
- **Discriminated unions** for families (e.g., `Curve`, `Surface`, `Topo`)

# 1) Core Types & Repository

```ts
// step/core.ts
export type EntityId = number & { __brand: "EntityId" }
export const eid = (n: number) => n as EntityId

// A typed reference to another entity (by #id) with lazy resolution.
export class Ref<T extends Entity> {
  constructor(public id: EntityId) {}
  resolve(repo: Repository): T {
    const e = repo.get(this.id)
    if (!e) throw new Error(`Unresolved #${this.id}`)
    return e as T
  }
  toString() {
    return `#${this.id}`
  }
}

// STEP text helpers
export const stepStr = (s: string) => `'${s.replace(/'/g, "''")}'`
export const fmtNum = (n: number) => (Number.isInteger(n) ? `${n}.` : `${n}`)

// Every entity supports parse + toStep
export abstract class Entity {
  abstract readonly type: string // e.g. "CARTESIAN_POINT"
  abstract toStep(repo: Repository): string

  // Generic parse contract: implement per subclass
  static parse(_a: string[], _ctx: ParseContext): Entity {
    throw new Error("not implemented")
  }
}

// Parse context: access to repo + token decoders
export interface ParseContext {
  repo: Repository
  parseRef<T extends Entity>(tok: string): Ref<T>
  parseNumber(tok: string): number
  parseString(tok: string): string
}

// Repository manages ids, storage, and emission
export class Repository {
  private map = new Map<EntityId, Entity>()
  private order: EntityId[] = [] // insertion/emit order
  schema: "AP214" | "AP242" = "AP214"
  units = { length: "MM", angle: "RAD" as "RAD", solidAngle: "SR" as "SR" }

  set(id: EntityId, e: Entity) {
    if (!this.map.has(id)) this.order.push(id)
    this.map.set(id, e)
  }
  add(e: Entity): Ref<typeof e> {
    const id = eid(this.order.length ? Math.max(...this.order) + 1 : 1)
    this.set(id, e)
    return new Ref<typeof e>(id)
  }
  get(id: EntityId) {
    return this.map.get(id)
  }
  entries() {
    return this.order.map((id) => [id, this.map.get(id)!] as const)
  }

  // Emit a complete ISO-10303-21 file
  toPartFile(meta: { name: string; author?: string; org?: string }) {
    const now = new Date().toISOString().slice(0, 10).replace(/-/g, "-")
    const hdr = [
      "ISO-10303-21;",
      "HEADER;",
      `FILE_DESCRIPTION((${stepStr(meta.name)}),'2;1');`,
      `FILE_NAME(${stepStr(meta.name)},${stepStr(now)},(${stepStr(
        meta.author ?? "tscircuit"
      )}),(${stepStr(meta.org ?? "tscircuit")}),${stepStr("generator")},${
        (stepStr(""), stepStr(""))
      });`,
      `FILE_SCHEMA(('${
        this.schema === "AP214"
          ? "AUTOMOTIVE_DESIGN"
          : "AP242_MANAGED_MODEL_BASED_3D_ENGINEERING"
      }'));`,
      "ENDSEC;",
      "DATA;",
    ]
    const data = this.entries().map(([id, e]) => `#${id} = ${e.toStep(this)};`)
    const ftr = ["ENDSEC;", "END-ISO-10303-21;"]
    return [...hdr, ...data, ...ftr].join("\n")
  }
}
```

---

# 2) Tokenizer & Lightweight Parser

```ts
// step/parse.ts
import { eid, EntityId, Entity, ParseContext, Ref, Repository } from "./core"

// Split: "#12 = ENTITY_NAME(arg1,arg2,...);"
export interface RawEntityRow {
  id: EntityId
  type: string
  args: string[]
}

export function tokenizeSTEP(data: string): RawEntityRow[] {
  // naive but effective: one entity per line
  const lines = data.split(/\r?\n/).filter((l) => /^\s*#\d+\s*=/.test(l))
  return lines.map((line) => {
    const m = line.match(/^#(\d+)\s*=\s*([A-Z0-9_]+)\s*\((.*)\);/)
    if (!m) throw new Error("Bad entity line: " + line)
    const id = eid(parseInt(m[1], 10))
    const type = m[2]
    const body = m[3].trim()

    const args = splitArgs(body)
    return { id, type, args }
  })
}

// Splits top-level args respecting parentheses and quotes
function splitArgs(s: string): string[] {
  const out: string[] = []
  let buf = "",
    depth = 0,
    inStr = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === "'" && s[i - 1] !== "\\") inStr = !inStr
    if (!inStr) {
      if (c === "(") depth++
      if (c === ")") depth--
      if (c === "," && depth === 0) {
        out.push(buf.trim())
        buf = ""
        continue
      }
    }
    buf += c
  }
  if (buf.trim()) out.push(buf.trim())
  return out
}

// Registry of known entity class parsers
type Parser = (args: string[], ctx: ParseContext) => Entity
const registry = new Map<string, Parser>()
export function register(type: string, parser: Parser) {
  registry.set(type, parser)
}

// Build a repo from raw STEP data
export function parseRepository(data: string): Repository {
  const repo = new Repository()
  const ctx: ParseContext = {
    repo,
    parseRef<T>(_tok: string) {
      const n = +_tok.replace("#", "").trim()
      return new Ref<T>(eid(n))
    },
    parseNumber(tok: string) {
      // handle 1., -3.5, 2.0E-1
      return Number(tok)
    },
    parseString(tok: string) {
      const m = tok.match(/^'(.*)'$/)
      if (!m) throw new Error("Expected string: " + tok)
      return m[1].replace(/''/g, "'")
    },
  }

  // first pass: instantiate classes with raw args; put into repo
  for (const row of tokenizeSTEP(data)) {
    const parser = registry.get(row.type)
    if (!parser) {
      // store Unknown as a passthrough for round-trip
      repo.set(row.id, new Unknown(row.type, row.args))
      continue
    }
    const entity = parser(row.args, ctx)
    repo.set(row.id, entity)
  }
  return repo
}

// Unknown entity passthrough
class Unknown extends Entity {
  constructor(public type: string, public args: string[]) {
    super()
  }
  toStep(): string {
    return `${this.type}(${this.args.join(",")})`
  }
}
```

---

# 3) Geometry & Topology (example subset)

You’ll expand these over time (planes, cylinders, circles, edges, faces, shells…). Below are **fully typed examples** that show the pattern.

```ts
// step/entities.ts
import { Entity, ParseContext, Ref, Repository, fmtNum, stepStr } from "./core"
import { register } from "./parse"

/** ======= Geometry primitives ======= */

export class CartesianPoint extends Entity {
  readonly type = "CARTESIAN_POINT"
  constructor(
    public name: string,
    public x: number,
    public y: number,
    public z: number
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const name = ctx.parseString(a[0])
    const coords = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .map(ctx.parseNumber)
    return new CartesianPoint(name, coords[0], coords[1], coords[2] ?? 0)
  }
  toStep(): string {
    return `CARTESIAN_POINT(${stepStr(this.name)},(${fmtNum(this.x)},${fmtNum(
      this.y
    )},${fmtNum(this.z)}))`
  }
}
register("CARTESIAN_POINT", CartesianPoint.parse)

export class Direction extends Entity {
  readonly type = "DIRECTION"
  constructor(
    public name: string,
    public dx: number,
    public dy: number,
    public dz: number
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const name = ctx.parseString(a[0])
    const comps = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .map(ctx.parseNumber)
    return new Direction(name, comps[0], comps[1], comps[2] ?? 0)
  }
  toStep(): string {
    return `DIRECTION(${stepStr(this.name)},(${fmtNum(this.dx)},${fmtNum(
      this.dy
    )},${fmtNum(this.dz)}))`
  }
}
register("DIRECTION", Direction.parse)

export class Axis2Placement3D extends Entity {
  readonly type = "AXIS2_PLACEMENT_3D"
  constructor(
    public name: string,
    public location: Ref<CartesianPoint>,
    public axis?: Ref<Direction>, // Z
    public refDirection?: Ref<Direction> // X
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const name = ctx.parseString(a[0])
    const loc = ctx.parseRef<CartesianPoint>(a[1])
    const axis = a[2] !== "$" ? ctx.parseRef<Direction>(a[2]) : undefined
    const refd = a[3] !== "$" ? ctx.parseRef<Direction>(a[3]) : undefined
    return new Axis2Placement3D(name, loc, axis, refd)
  }
  toStep(): string {
    const A = this.axis ? this.axis.toString() : "$"
    const R = this.refDirection ? this.refDirection.toString() : "$"
    return `AXIS2_PLACEMENT_3D(${stepStr(this.name)},${
      this.location
    },${A},${R})`
  }
}
register("AXIS2_PLACEMENT_3D", Axis2Placement3D.parse)

/** ======= Curves (discriminated union) ======= */

export type Curve = Line | Circle

export class Line extends Entity {
  readonly type = "LINE"
  constructor(
    public pnt: Ref<CartesianPoint>,
    public dir: Ref<Direction>,
    public paramLen: number
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const p = ctx.parseRef<CartesianPoint>(a[0])
    // vector is VECTOR(DIRECTION,len) but many exporters inline a direction; we’ll accept DIRECTION ref via VECTOR wrapper or direct
    const vecTok = a[1]
    const m = vecTok.match(/^VECTOR\((#[0-9]+),([0-9Ee+.\-]+)\)$/)
    if (!m) throw new Error("Expected VECTOR(...) in LINE")
    const dir = ctx.parseRef<Direction>(m[1])
    const len = ctx.parseNumber(m[2])
    return new Line(p, dir, len)
  }
  toStep(): string {
    return `LINE(${this.pnt},VECTOR(${this.dir},${fmtNum(this.paramLen)}))`
  }
}
register("LINE", Line.parse)

export class Circle extends Entity {
  readonly type = "CIRCLE"
  constructor(public placement: Ref<Axis2Placement3D>, public radius: number) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const pl = ctx.parseRef<Axis2Placement3D>(a[0])
    const r = ctx.parseNumber(a[1])
    return new Circle(pl, r)
  }
  toStep(): string {
    return `CIRCLE(${this.placement},${fmtNum(this.radius)})`
  }
}
register("CIRCLE", Circle.parse)

/** ======= Topology ======= */

export class VertexPoint extends Entity {
  readonly type = "VERTEX_POINT"
  constructor(public pnt: Ref<CartesianPoint>) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    return new VertexPoint(ctx.parseRef<CartesianPoint>(a[0]))
  }
  toStep(): string {
    return `VERTEX_POINT(${this.pnt})`
  }
}
register("VERTEX_POINT", VertexPoint.parse)

export class EdgeCurve extends Entity {
  readonly type = "EDGE_CURVE"
  constructor(
    public start: Ref<VertexPoint>,
    public end: Ref<VertexPoint>,
    public curve: Ref<Curve>, // accepts Line or Circle ref
    public sameSense: boolean
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const s = ctx.parseRef<VertexPoint>(a[0])
    const e = ctx.parseRef<VertexPoint>(a[1])
    const c = ctx.parseRef<Curve>(a[2] as any)
    const same = a[3].trim() === ".T."
    return new EdgeCurve(s, e, c, same)
  }
  toStep(): string {
    return `EDGE_CURVE(${this.start},${this.end},${this.curve},${
      this.sameSense ? ".T." : ".F."
    })`
  }
}
register("EDGE_CURVE", EdgeCurve.parse)

export class OrientedEdge extends Entity {
  readonly type = "ORIENTED_EDGE"
  constructor(
    public name: string,
    public edge: Ref<EdgeCurve>,
    public orientation: boolean
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    // edge geometry and vertices are usually "$" in AP214 oriented edge rows
    const edge = ctx.parseRef<EdgeCurve>(a[3])
    const orient = a[4]?.trim?.() === ".T." || a[2]?.trim?.() === ".T." // exporter variance
    return new OrientedEdge(name, edge, orient)
  }
  toStep(): string {
    // AP214 canonical form: ( 'name', *, *, #edge, .T.|.F. )
    return `ORIENTED_EDGE(${this.name ? stepStr(this.name) : "$"},*,*,${
      this.edge
    },${this.orientation ? ".T." : ".F."})`
  }
}
register("ORIENTED_EDGE", OrientedEdge.parse)

export class EdgeLoop extends Entity {
  readonly type = "EDGE_LOOP"
  constructor(public name: string, public edges: Ref<OrientedEdge>[]) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const list = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<OrientedEdge>(tok))
    return new EdgeLoop(name, list)
  }
  toStep(): string {
    return `EDGE_LOOP(${
      this.name ? stepStr(this.name) : "$"
    },(${this.edges.join(",")}))`
  }
}
register("EDGE_LOOP", EdgeLoop.parse)

export class Plane extends Entity {
  readonly type = "PLANE"
  constructor(public name: string, public placement: Ref<Axis2Placement3D>) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    return new Plane(
      ctx.parseString(a[0]),
      ctx.parseRef<Axis2Placement3D>(a[1])
    )
  }
  toStep(): string {
    return `PLANE(${stepStr(this.name)},${this.placement})`
  }
}
register("PLANE", Plane.parse)

export class FaceOuterBound extends Entity {
  readonly type = "FACE_OUTER_BOUND"
  constructor(public bound: Ref<EdgeLoop>, public sameSense: boolean) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    return new FaceOuterBound(
      ctx.parseRef<EdgeLoop>(a[0]),
      a[1].trim() === ".T."
    )
  }
  toStep(): string {
    return `FACE_OUTER_BOUND(${this.bound},${this.sameSense ? ".T." : ".F."})`
  }
}
register("FACE_OUTER_BOUND", FaceOuterBound.parse)

export class AdvancedFace extends Entity {
  readonly type = "ADVANCED_FACE"
  constructor(
    public bounds: Ref<FaceOuterBound>[], // allow inner FACE_BOUND later
    public surface: Ref<Plane /*| other surfaces*/>,
    public sameSense: boolean
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const bounds = a[0]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<FaceOuterBound>(tok))
    const surf = ctx.parseRef<Plane>(a[1])
    const ss = a[2].trim() === ".T."
    return new AdvancedFace(bounds, surf, ss)
  }
  toStep(): string {
    return `ADVANCED_FACE((${this.bounds.join(",")}),${this.surface},${
      this.sameSense ? ".T." : ".F."
    })`
  }
}
register("ADVANCED_FACE", AdvancedFace.parse)

export class ClosedShell extends Entity {
  readonly type = "CLOSED_SHELL"
  constructor(public faces: Ref<AdvancedFace>[]) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const faces = a[0]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<AdvancedFace>(tok))
    return new ClosedShell(faces)
  }
  toStep(): string {
    return `CLOSED_SHELL((${this.faces.join(",")}))`
  }
}
register("CLOSED_SHELL", ClosedShell.parse)

export class ManifoldSolidBrep extends Entity {
  readonly type = "MANIFOLD_SOLID_BREP"
  constructor(public name: string, public outer: Ref<ClosedShell>) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    return new ManifoldSolidBrep(name, ctx.parseRef<ClosedShell>(a[1]))
  }
  toStep(): string {
    return `MANIFOLD_SOLID_BREP(${this.name ? stepStr(this.name) : "$"},${
      this.outer
    })`
  }
}
register("MANIFOLD_SOLID_BREP", ManifoldSolidBrep.parse)
```

---

# 4) Product Structure & Presentation (typed)

```ts
// step/product.ts
import { Entity, ParseContext, Ref, Repository, stepStr } from "./core"
import { register } from "./parse"

// Minimal AP214 identity graph (expand as needed)
export class Product extends Entity {
  readonly type = "PRODUCT"
  constructor(public name: string) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    return new Product(ctx.parseString(a[0]))
  }
  toStep(): string {
    // Keep other fields simple for MVP: name, id="", desc=""
    return `PRODUCT(${stepStr(this.name)},'','',());`
  }
}
register("PRODUCT", Product.parse)

// Representation container
export class AdvancedBrepShapeRepresentation extends Entity {
  readonly type = "ADVANCED_BREP_SHAPE_REPRESENTATION"
  constructor(
    public name: string,
    public items: Ref<Entity>[], // solids etc.
    public context: Ref<Entity> // GEOMETRIC_REPRESENTATION_CONTEXT...
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const items = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<Entity>(tok))
    const c = ctx.parseRef<Entity>(a[2])
    return new AdvancedBrepShapeRepresentation(name, items, c)
  }
  toStep(): string {
    return `ADVANCED_BREP_SHAPE_REPRESENTATION(${
      this.name ? stepStr(this.name) : "$"
    },(${this.items.join(",")}),${this.context})`
  }
}
register(
  "ADVANCED_BREP_SHAPE_REPRESENTATION",
  AdvancedBrepShapeRepresentation.parse
)

// Simple AP214 color chain (per-face)
export class ColourRgb extends Entity {
  readonly type = "COLOUR_RGB"
  constructor(
    public name: string,
    public r: number,
    public g: number,
    public b: number
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    return new ColourRgb(
      ctx.parseString(a[0]),
      ctx.parseNumber(a[1]),
      ctx.parseNumber(a[2]),
      ctx.parseNumber(a[3])
    )
  }
  toStep(): string {
    return `COLOUR_RGB(${stepStr(this.name)},${this.r},${this.g},${this.b})`
  }
}
register("COLOUR_RGB", ColourRgb.parse)

export class FillAreaStyleColour extends Entity {
  readonly type = "FILL_AREA_STYLE_COLOUR"
  constructor(public name: string, public colour: Ref<ColourRgb>) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    return new FillAreaStyleColour(
      ctx.parseString(a[0]),
      ctx.parseRef<ColourRgb>(a[1])
    )
  }
  toStep(): string {
    return `FILL_AREA_STYLE_COLOUR(${stepStr(this.name)},${this.colour})`
  }
}
register("FILL_AREA_STYLE_COLOUR", FillAreaStyleColour.parse)

export class FillAreaStyle extends Entity {
  readonly type = "FILL_AREA_STYLE"
  constructor(public name: string, public items: Ref<FillAreaStyleColour>[]) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const items = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<FillAreaStyleColour>(tok))
    return new FillAreaStyle(a[0] === "$" ? "" : ctx.parseString(a[0]), items)
  }
  toStep(): string {
    return `FILL_AREA_STYLE(${
      this.name ? stepStr(this.name) : "$"
    },(${this.items.join(",")}))`
  }
}
register("FILL_AREA_STYLE", FillAreaStyle.parse)

export class SurfaceStyleFillArea extends Entity {
  readonly type = "SURFACE_STYLE_FILL_AREA"
  constructor(public style: Ref<FillAreaStyle>) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    return new SurfaceStyleFillArea(ctx.parseRef<FillAreaStyle>(a[0]))
  }
  toStep(): string {
    return `SURFACE_STYLE_FILL_AREA(${this.style})`
  }
}
register("SURFACE_STYLE_FILL_AREA", SurfaceStyleFillArea.parse)

export class SurfaceSideStyle extends Entity {
  readonly type = "SURFACE_SIDE_STYLE"
  constructor(public name: string, public styles: Ref<SurfaceStyleFillArea>[]) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const list = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<SurfaceStyleFillArea>(tok))
    return new SurfaceSideStyle(a[0] === "$" ? "" : ctx.parseString(a[0]), list)
  }
  toStep(): string {
    return `SURFACE_SIDE_STYLE(${
      this.name ? stepStr(this.name) : "$"
    },(${this.styles.join(",")}))`
  }
}
register("SURFACE_SIDE_STYLE", SurfaceSideStyle.parse)

export class SurfaceStyleUsage extends Entity {
  readonly type = "SURFACE_STYLE_USAGE"
  constructor(
    public side: ".BOTH." | ".POS." | ".NEG.",
    public style: Ref<SurfaceSideStyle>
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    return new SurfaceStyleUsage(
      a[0].trim() as any,
      ctx.parseRef<SurfaceSideStyle>(a[1])
    )
  }
  toStep(): string {
    return `SURFACE_STYLE_USAGE(${this.side},${this.style})`
  }
}
register("SURFACE_STYLE_USAGE", SurfaceStyleUsage.parse)

export class PresentationStyleAssignment extends Entity {
  readonly type = "PRESENTATION_STYLE_ASSIGNMENT"
  constructor(public items: Ref<SurfaceStyleUsage>[]) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const list = a[0]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<SurfaceStyleUsage>(tok))
    return new PresentationStyleAssignment(list)
  }
  toStep(): string {
    return `PRESENTATION_STYLE_ASSIGNMENT((${this.items.join(",")}))`
  }
}
register("PRESENTATION_STYLE_ASSIGNMENT", PresentationStyleAssignment.parse)

export class StyledItem extends Entity {
  readonly type = "STYLED_ITEM"
  constructor(
    public name: string,
    public styles: Ref<PresentationStyleAssignment>[],
    public item: Ref<Entity>
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const styles = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<PresentationStyleAssignment>(tok))
    const item = ctx.parseRef<Entity>(a[2])
    return new StyledItem(name, styles, item)
  }
  toStep(): string {
    return `STYLED_ITEM(${
      this.name ? stepStr(this.name) : "$"
    },(${this.styles.join(",")}),${this.item})`
  }
}
register("STYLED_ITEM", StyledItem.parse)
```

---

# 5) Example: Create, Link, Round-Trip

```ts
// example.ts
import { Repository, Ref } from "./step/core"
import {
  CartesianPoint,
  Direction,
  Axis2Placement3D,
  Plane,
  VertexPoint,
  Line,
  EdgeCurve,
  OrientedEdge,
  EdgeLoop,
  FaceOuterBound,
  AdvancedFace,
  ClosedShell,
  ManifoldSolidBrep,
} from "./step/entities"

// Build a single planar face square as a toy example
const repo = new Repository()

// Geometry frame
const p0 = repo.add(new CartesianPoint("", 0, 0, 0))
const dz = repo.add(new Direction("", 0, 0, 1))
const dx = repo.add(new Direction("", 1, 0, 0))
const frame = repo.add(new Axis2Placement3D("", p0, dz, dx))
const plane = repo.add(new Plane("", frame))

// Square vertices
const v = [
  [0, 0, 0],
  [10, 0, 0],
  [10, 10, 0],
  [0, 10, 0],
].map(([x, y, z]) =>
  repo.add(new VertexPoint(repo.add(new CartesianPoint("", x, y, z))))
)

// Edges (lines)
function edge(i: number, j: number): Ref<EdgeCurve> {
  const p = v[i].resolve(repo).pnt,
    q = v[j].resolve(repo).pnt
  const dir = repo.add(
    new Direction(
      "",
      q.resolve(repo).x - p.resolve(repo).x,
      q.resolve(repo).y - p.resolve(repo).y,
      q.resolve(repo).z - p.resolve(repo).z
    )
  )
  const line = repo.add(new Line(p, dir, 1)) // param length not used by many kernels
  return repo.add(new EdgeCurve(v[i], v[j], line as any, true))
}

const ec = [edge(0, 1), edge(1, 2), edge(2, 3), edge(3, 0)]
const oe = ec.map((e) => repo.add(new OrientedEdge("", e, true)))
const loop = repo.add(new EdgeLoop("", oe))
const fob = repo.add(new FaceOuterBound(loop, true))
const face = repo.add(new AdvancedFace([fob], plane, true))
const shell = repo.add(new ClosedShell([face]))
repo.add(new ManifoldSolidBrep("", shell))

// Emit STEP text
const stepText = repo.toPartFile({ name: "square" })
console.log(stepText)
```

---

# 6) Design Notes (why this works well)

- **Strongly-typed references:** `Ref<T>` ties compile-time type (e.g., `Ref<Plane>`) to entities. The high-level library can’t accidentally attach a `Ref<Circle>` where a `Ref<Plane>` is required.
- **Open-ended unions:** Families like `Curve = Line | Circle` keep everything type-safe but extensible (add `CIRCLE`, `ELLIPSE`, etc.).
- **Parsing registry:** New entities register a parser once (`register("PLANE", Plane.parse)`), so your repo loader stays simple and fast.
- **Unknown passthrough:** Anything you haven’t implemented is preserved as `Unknown` and round-trips untouched (no data loss).
- **Emission order:** The repo keeps a stable order (insert order). If you need **topological dependence order**, you can add a topological sort or “ensure before use” emission pass later.
- **Schema & units:** `Repository.schema` and `Repository.units` provide a single source of truth for headers; expose setters for AP242 or inches later.

---

# 7) How a higher-level library would use it

- Construct solids using its own geometric model.
- Convert to **typed STEP entities** by creating instances and `repo.add(...)` them.
- Maintain handles via `Ref<T>` without ever touching raw `#ids`.
- Call `repo.toPartFile(...)` to serialize.
- To read an incoming file: `parseRepository(text)` → typed objects → high-level rebuilds its model by **resolving** `Ref<T>`s.
