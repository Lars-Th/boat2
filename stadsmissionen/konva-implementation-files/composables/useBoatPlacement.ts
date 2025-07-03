import { ref, computed } from 'vue';
import { PlacementService } from '../services/placement.service';
import { BoatData, StorageUnit, PlacementData } from '../types/entities';
import { PlacementSuggestion, CollisionResult } from '../types/konva';

export function useBoatPlacement() {
  const placementService = new PlacementService();
  const currentPlacements = ref<PlacementData[]>([]);
  const draggedBoat = ref<BoatData | null>(null);
  const isDragging = ref(false);

  const findOptimalPlacements = async (
    boat: BoatData,
    storageUnit: StorageUnit
  ): Promise<PlacementSuggestion[]> => {
    return placementService.findOptimalPlacement(boat, storageUnit, {
      safetyMargin: boat.safety_margin,
      allowRotation: true,
      maxSuggestions: 5,
    });
  };

  const checkCollision = (
    boat: BoatData,
    placement: PlacementData,
    existingPlacements: PlacementData[]
  ): CollisionResult => {
    return placementService.detectCollisions(placement, existingPlacements);
  };

  const snapToGrid = (x: number, y: number, gridSize: number) => {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  };

  const validatePlacement = (
    boat: BoatData,
    placement: PlacementData,
    storageUnit: StorageUnit
  ): boolean => {
    // Check if boat fits within storage unit bounds
    const boatWidth = boat.width + boat.safety_margin * 2;
    const boatLength = boat.length + boat.safety_margin * 2;

    // Basic bounds checking (this would need proper geometry calculations)
    if (placement.x_coordinate < 0 || placement.y_coordinate < 0) {
      return false;
    }

    // Check collision with existing placements
    const collision = checkCollision(boat, placement, currentPlacements.value);

    return !collision.hasCollision;
  };

  const calculateBoatBounds = (boat: BoatData, placement: PlacementData) => {
    const width = boat.width + boat.safety_margin * 2;
    const length = boat.length + boat.safety_margin * 2;

    // Convert to canvas coordinates (simplified)
    const canvasWidth = width * 10; // Scale factor
    const canvasLength = length * 10; // Scale factor

    return {
      x: placement.x_coordinate,
      y: placement.y_coordinate,
      width: canvasWidth,
      height: canvasLength,
      rotation: placement.rotation_angle,
    };
  };

  const findAvailableSpaces = (storageUnit: StorageUnit): PlacementSuggestion[] => {
    const suggestions: PlacementSuggestion[] = [];

    // Simple grid-based space finding
    // This would be more sophisticated in a real implementation
    const gridSize = 50;
    const maxX = 500;
    const maxY = 500;

    for (let x = 0; x < maxX; x += gridSize) {
      for (let y = 0; y < maxY; y += gridSize) {
        suggestions.push({
          x,
          y,
          rotation: 0,
          score: Math.random() * 100,
          reasoning: `Grid position ${x},${y}`,
        });
      }
    }

    return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
  };

  return {
    currentPlacements,
    draggedBoat,
    isDragging,
    findOptimalPlacements,
    checkCollision,
    snapToGrid,
    validatePlacement,
    calculateBoatBounds,
    findAvailableSpaces,
  };
}
