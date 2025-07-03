import Konva from 'konva';
import { BoatData, StorageUnit, PlacementData } from '../types/entities';

export interface KonvaBoatShape {
  id: string;
  konvaObject: Konva.Group;
  boatData: BoatData;
  placement: PlacementData;
  isColliding: boolean;
  visualState: 'normal' | 'selected' | 'dragging' | 'collision';
  safetyMargin: number;
}

export interface KonvaStorageShape {
  id: string;
  konvaObject: Konva.Group;
  storageUnit: StorageUnit;
  bounds: Konva.Rect;
  restrictionZones: Konva.Shape[];
  connectionPoints: Konva.Circle[];
}

export interface KonvaCanvasConfig {
  width: number;
  height: number;
  scale: number;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  enableCollisionDetection: boolean;
}

export interface PlacementSuggestion {
  x: number;
  y: number;
  rotation: number;
  score: number;
  reasoning: string;
}

export interface CollisionResult {
  hasCollision: boolean;
  collisionSeverity: 'none' | 'warning' | 'critical';
  collisionColor: string;
  overlappingBoats: string[];
}

export interface StorageLayout {
  id: string;
  name: string;
  type: 'warehouse' | 'dock';
  konvaShapes: KonvaStorageShape[];
  boats: KonvaBoatShape[];
  levels: any[]; // WarehouseLevel[] when available
  capacity: number;
  currentOccupancy: number;
}

export interface DrawingTool {
  name: 'select' | 'rectangle' | 'circle' | 'polygon' | 'line' | 'restriction';
  icon: string;
  cursor: string;
  isActive: boolean;
}

export interface ZoomLevel {
  scale: number;
  description: string;
  minDetails: boolean;
}
