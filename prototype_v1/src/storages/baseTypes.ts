// Base entity interface that all entities should extend
export interface BaseEntity {
  id: number
  createdAt?: Date
  updatedAt?: Date
}

// Standard response wrapper for store operations
export interface StoreResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Common relationship types
export type RelationshipType = 'one-to-one' | 'one-to-many' | 'many-to-many'

// Base store state interface
export interface BaseStoreState {
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

// Foreign key validation helper
export const validateForeignKey = <T extends BaseEntity>(
  entities: T[],
  foreignKey: number,
  entityName: string
): boolean => {
  const exists = entities.some(entity => entity.id === foreignKey)
  if (!exists) {
    throw new Error(`${entityName} with ID ${foreignKey} does not exist`)
  }
  return true
}

// Cascade delete helper
export const cascadeDelete = <T extends Record<string, unknown>>(
  entities: T[],
  foreignKeyField: string,
  parentId: number
): T[] => {
  return entities.filter(entity => entity[foreignKeyField] !== parentId)
}

// Generic relationship getter factory
export const createRelationshipGetter = <TChild extends BaseEntity>(
  childEntities: TChild[],
  foreignKeyField: keyof TChild
) => {
  return (parentId: number): TChild[] => {
    return childEntities.filter(child => child[foreignKeyField] === parentId)
  }
}

// Type-safe ID generator
export const generateId = (): number => {
  return Date.now() + Math.random() * 1000
}

// Relationship metadata interface
export interface RelationshipMetadata {
  type: RelationshipType
  parentEntity: string
  childEntity: string
  foreignKeyField: string
  cascadeDelete?: boolean
} 