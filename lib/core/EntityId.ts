export type EntityId = number & { __brand: "EntityId" }

export const eid = (n: number) => n as EntityId
