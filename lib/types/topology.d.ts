import type { Plane } from "../entities/geometry/Plane"
import type { CylindricalSurface } from "../entities/geometry/CylindricalSurface"
import type { ToroidalSurface } from "../entities/geometry/ToroidalSurface"

export type Surface = Plane | CylindricalSurface | ToroidalSurface
