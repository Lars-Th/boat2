import { BoatData, StorageUnit, PlacementData } from '../types/entities';
import { PlacementSuggestion, CollisionResult } from '../types/konva';

interface PlacementConstraints {
  safetyMargin: number;
  allowRotation: boolean;
  maxSuggestions: number;
}

export class PlacementService {
  findOptimalPlacement(
    boat: BoatData,
    storageUnit: StorageUnit,
    constraints: PlacementConstraints
  ): PlacementSuggestion[] {
    const suggestions: PlacementSuggestion[] = [];

    // Simple grid-based placement algorithm
    const gridSize = 20;
    const maxX = 400;
    const maxY = 400;

    for (let x = 0; x < maxX; x += gridSize) {
      for (let y = 0; y < maxY; y += gridSize) {
        // Calculate score based on distance from center and available space
        const centerX = maxX / 2;
        const centerY = maxY / 2;
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );

        const score = 100 - (distanceFromCenter / Math.sqrt(centerX * centerX + centerY * centerY)) * 100;

        suggestions.push({
          x,
          y,
          rotation: 0,
          score,
          reasoning: `Grid position with distance score: ${score.toFixed(1)}`,
        });

        // Add rotated versions if allowed
        if (constraints.allowRotation) {
          suggestions.push({
            x,
            y,
            rotation: 90,
            score: score - 10, // Slight penalty for rotation
            reasoning: `90° rotated position`,
          });
        }
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, constraints.maxSuggestions);
  }

  detectCollisions(
    placement: PlacementData,
    existingPlacements: PlacementData[]
  ): CollisionResult {
    const result: CollisionResult = {
      hasCollision: false,
      collisionSeverity: 'none',
      collisionColor: '#4CAF50',
      overlappingBoats: [],
    };

    // Simple bounding box collision detection
    for (const existing of existingPlacements) {
      if (existing.id === placement.id) continue;

      const distance = Math.sqrt(
        Math.pow(placement.x_coordinate - existing.x_coordinate, 2) +
        Math.pow(placement.y_coordinate - existing.y_coordinate, 2)
      );

      const minDistance = 50; // Minimum distance between boats
      const warningDistance = 75; // Warning threshold

      if (distance < minDistance) {
        result.hasCollision = true;
        result.collisionSeverity = 'critical';
        result.collisionColor = '#F44336';
        result.overlappingBoats.push(existing.boat_id.toString());
      } else if (distance < warningDistance) {
        result.hasCollision = true;
        result.collisionSeverity = 'warning';
        result.collisionColor = '#FF9800';
      }
    }

    return result;
  }

  calculateOptimalRotation(boat: BoatData, availableSpace: { width: number; height: number }): number {
    const boatAspectRatio = boat.length / boat.width;
    const spaceAspectRatio = availableSpace.width / availableSpace.height;

    // If boat is longer than wide and space is wider than tall, rotate 90 degrees
    if (boatAspectRatio > 1 && spaceAspectRatio > 1) {
      return 0; // No rotation needed
    } else if (boatAspectRatio > 1 && spaceAspectRatio < 1) {
      return 90; // Rotate to fit better
    }

    return 0; // Default no rotation
  }

  validatePlacement(
    boat: BoatData,
    placement: PlacementData,
    storageUnit: StorageUnit,
    existingPlacements: PlacementData[]
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check bounds
    if (placement.x_coordinate < 0 || placement.y_coordinate < 0) {
      issues.push('Placement is outside storage unit bounds');
    }

    // Check collisions
    const collision = this.detectCollisions(placement, existingPlacements);
    if (collision.hasCollision) {
      issues.push(`Collision detected: ${collision.collisionSeverity} level`);
    }

    // Check safety margins
    const safetyBuffer = boat.safety_margin * 10; // Convert to canvas units
    if (placement.x_coordinate < safetyBuffer || placement.y_coordinate < safetyBuffer) {
      issues.push('Insufficient safety margin from storage unit edges');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
