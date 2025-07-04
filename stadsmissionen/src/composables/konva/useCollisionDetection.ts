// /src/composables/konva/useCollisionDetection.ts
// Collision Detection System - Exakt från HTML-prototyp logik

import { ref, computed } from 'vue';
import Konva from 'konva';
import { applyBoatStyle } from '@/services/konva/boat-svg.service';
import type {
  CollisionResult,
  KonvaBoatConfig,
  KonvaStorageConfig,
  BoatData
} from '@/types/konva';

export function useCollisionDetection() {
  // Reactive state
  const boats = ref<Map<number, KonvaBoatConfig>>(new Map());
  const storageUnits = ref<Map<number, KonvaStorageConfig>>(new Map());
  const restrictionZones = ref<Konva.Shape[]>([]);

  // Collision detection methods
  const checkBoatCollision = (
    boat1: KonvaBoatConfig,
    boat2: KonvaBoatConfig
  ): { hull: boolean; margin: boolean } => {
    // Hull collision check
    const hull1Bounds = boat1.hullPath.getClientRect();
    const hull2Bounds = boat2.hullPath.getClientRect();
    const hullCollision = doRectsOverlap(hull1Bounds, hull2Bounds);

    // Margin collision check
    const margin1Bounds = boat1.marginPath.getClientRect();
    const margin2Bounds = boat2.marginPath.getClientRect();
    const marginCollision = doRectsOverlap(margin1Bounds, margin2Bounds);

    return { hull: hullCollision, margin: marginCollision };
  };

  const checkBoatZoneCollision = (
    boat: KonvaBoatConfig,
    zone: Konva.Shape
  ): { hull: boolean; margin: boolean } => {
    const hullBounds = boat.hullPath.getClientRect();
    const marginBounds = boat.marginPath.getClientRect();
    const zoneBounds = zone.getClientRect();

    return {
      hull: doRectsOverlap(hullBounds, zoneBounds),
      margin: doRectsOverlap(marginBounds, zoneBounds)
    };
  };

  const doRectsOverlap = (
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean => {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    );
  };

  // Advanced collision detection med exakta paths
  const checkPreciseCollision = (
    boat1: KonvaBoatConfig,
    boat2: KonvaBoatConfig
  ): { hull: boolean; margin: boolean } => {
    // Get transformed paths
    const boat1HullPoints = getTransformedPathPoints(boat1.hullPath);
    const boat2HullPoints = getTransformedPathPoints(boat2.hullPath);

    const boat1MarginPoints = getTransformedPathPoints(boat1.marginPath);
    const boat2MarginPoints = getTransformedPathPoints(boat2.marginPath);

    return {
      hull: doPolygonsIntersect(boat1HullPoints, boat2HullPoints),
      margin: doPolygonsIntersect(boat1MarginPoints, boat2MarginPoints)
    };
  };

  const getTransformedPathPoints = (path: Konva.Path): number[] => {
    const points: number[] = [];
    const pathData = path.data();

    // Simplified path parsing - in real implementation would use proper SVG path parser
    // For now, use bounding box approximation
    const bounds = path.getClientRect();
    return [
      bounds.x, bounds.y,
      bounds.x + bounds.width, bounds.y,
      bounds.x + bounds.width, bounds.y + bounds.height,
      bounds.x, bounds.y + bounds.height
    ];
  };

  const doPolygonsIntersect = (poly1: number[], poly2: number[]): boolean => {
    // Simplified polygon intersection using SAT (Separating Axis Theorem)
    // For complex shapes, would use proper computational geometry library

    // Convert points to polygon format
    const polygon1 = [];
    const polygon2 = [];

    for (let i = 0; i < poly1.length; i += 2) {
      polygon1.push({ x: poly1[i], y: poly1[i + 1] });
    }

    for (let i = 0; i < poly2.length; i += 2) {
      polygon2.push({ x: poly2[i], y: poly2[i + 1] });
    }

    // Check if any point of polygon1 is inside polygon2
    for (const point of polygon1) {
      if (isPointInPolygon(point, polygon2)) {
        return true;
      }
    }

    // Check if any point of polygon2 is inside polygon1
    for (const point of polygon2) {
      if (isPointInPolygon(point, polygon1)) {
        return true;
      }
    }

    return false;
  };

  const isPointInPolygon = (
    point: { x: number; y: number },
    polygon: { x: number; y: number }[]
  ): boolean => {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      if (((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  };

  // Main collision detection function
  const detectCollisions = (targetBoat: KonvaBoatConfig): CollisionResult => {
    const result: CollisionResult = {
      hullCollision: false,
      marginCollision: false,
      collidingBoats: [],
      collidingZones: []
    };

    // Check against other boats
    boats.value.forEach((boat, id) => {
      if (boat.id !== targetBoat.id) {
        const collision = checkBoatCollision(targetBoat, boat);

        if (collision.hull) {
          result.hullCollision = true;
          result.collidingBoats.push(id);
        } else if (collision.margin) {
          result.marginCollision = true;
          result.collidingBoats.push(id);
        }
      }
    });

    // Check against restriction zones
    restrictionZones.value.forEach((zone, index) => {
      const collision = checkBoatZoneCollision(targetBoat, zone);

      if (collision.hull) {
        result.hullCollision = true;
        result.collidingZones.push(index);
      } else if (collision.margin) {
        result.marginCollision = true;
        result.collidingZones.push(index);
      }
    });

    return result;
  };

  // Update boat styling based on collision
  const updateBoatCollisionState = (
    boat: KonvaBoatConfig,
    collision: CollisionResult
  ): void => {
    if (collision.hullCollision) {
      applyBoatStyle(boat.hullPath, boat.marginPath, 'hullCollision');
      boat.isInvalid = true;
    } else if (collision.marginCollision) {
      applyBoatStyle(boat.hullPath, boat.marginPath, 'marginCollision');
      boat.isInvalid = true;
    } else {
      applyBoatStyle(boat.hullPath, boat.marginPath, boat.isActive ? 'new' : 'placed');
      boat.isInvalid = false;
    }
  };

  // Real-time collision detection during drag
  const onBoatDrag = (boat: KonvaBoatConfig): void => {
    const collision = detectCollisions(boat);
    updateBoatCollisionState(boat, collision);

    // Update other boats that might be affected
    boats.value.forEach(otherBoat => {
      if (otherBoat.id !== boat.id) {
        const otherCollision = detectCollisions(otherBoat);
        updateBoatCollisionState(otherBoat, otherCollision);
      }
    });
  };

  // Register boat for collision detection
  const registerBoat = (boat: KonvaBoatConfig): void => {
    boats.value.set(boat.id, boat);

    // Setup drag event for real-time collision
    boat.konvaGroup.on('dragmove', () => {
      onBoatDrag(boat);
    });
  };

  // Unregister boat
  const unregisterBoat = (boatId: number): void => {
    boats.value.delete(boatId);
  };

  // Register storage unit
  const registerStorageUnit = (storageUnit: KonvaStorageConfig): void => {
    storageUnits.value.set(storageUnit.id, storageUnit);
    restrictionZones.value.push(...storageUnit.restrictedZones);
  };

  // Clear all registrations
  const clearAll = (): void => {
    boats.value.clear();
    storageUnits.value.clear();
    restrictionZones.value = [];
  };

  // Check if position is valid for boat placement
  const isValidPlacement = (
    boat: KonvaBoatConfig,
    x: number,
    y: number
  ): boolean => {
    // Temporarily move boat to check position
    const originalX = boat.konvaGroup.x();
    const originalY = boat.konvaGroup.y();

    boat.konvaGroup.position({ x, y });
    const collision = detectCollisions(boat);

    // Restore original position
    boat.konvaGroup.position({ x: originalX, y: originalY });

    return !collision.hullCollision && !collision.marginCollision;
  };

  // Find valid placement suggestions
  const findValidPlacements = (
    boat: KonvaBoatConfig,
    canvasWidth: number,
    canvasHeight: number,
    gridSize: number = 10
  ): Array<{ x: number; y: number; score: number }> => {
    const suggestions: Array<{ x: number; y: number; score: number }> = [];

    for (let x = 0; x < canvasWidth; x += gridSize) {
      for (let y = 0; y < canvasHeight; y += gridSize) {
        if (isValidPlacement(boat, x, y)) {
          // Calculate score based on proximity to other boats (lower is better)
          let score = 0;
          boats.value.forEach(otherBoat => {
            if (otherBoat.id !== boat.id) {
              const distance = Math.sqrt(
                Math.pow(x - otherBoat.konvaGroup.x(), 2) +
                Math.pow(y - otherBoat.konvaGroup.y(), 2)
              );
              score += 1 / (distance + 1); // Inverse distance
            }
          });

          suggestions.push({ x, y, score });
        }
      }
    }

    return suggestions.sort((a, b) => a.score - b.score);
  };

  // Computed properties
  const totalBoats = computed(() => boats.value.size);
  const collidingBoats = computed(() => {
    let count = 0;
    boats.value.forEach(boat => {
      if (boat.isInvalid) count++;
    });
    return count;
  });

  return {
    // State
    boats,
    storageUnits,
    restrictionZones,

    // Methods
    detectCollisions,
    updateBoatCollisionState,
    registerBoat,
    unregisterBoat,
    registerStorageUnit,
    clearAll,
    isValidPlacement,
    findValidPlacements,
    onBoatDrag,

    // Computed
    totalBoats,
    collidingBoats
  };
}
