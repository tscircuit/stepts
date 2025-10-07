import type { FaceBound } from "../entities/topology/FaceBound"
import type { FaceOuterBound } from "../entities/topology/FaceOuterBound"
import type { Plane } from "../entities/geometry/Plane"
import type { CylindricalSurface } from "../entities/geometry/CylindricalSurface"
import type { ToroidalSurface } from "../entities/geometry/ToroidalSurface"

export type AnyFaceBound = FaceBound | FaceOuterBound
export type Surface = Plane | CylindricalSurface | ToroidalSurface
