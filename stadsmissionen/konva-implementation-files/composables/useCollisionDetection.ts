import { ref, computed } from 'vue';
import { KonvaBoatShape } from '../types/konva';

export function useCollisionDetection() {
  const collisionEnabled = ref(true);
  const collisionSeverity = ref<'none' | 'warning' | 'critical'>('none');

  const checkBoatCollision = (
    boat1: KonvaBoatShape,
    boat2: KonvaBoatShape
  ): boolean => {
    if (!collisionEnabled.value) return false;

    const rect1 = boat1.konvaObject.getClientRect();
    const rect2 = boat2.konvaObject.getClientRect();

    // Simple bounding box collision detection
    return !(
      rect1.x > rect2.x + rect2.width ||
      rect1.x + rect1.width < rect2.x ||
      rect1.y > rect2.y + rect2.height ||
      rect1.y + rect1.height < rect2.y
    );
  };

  const checkBoatCollisionWithSafetyMargin = (
    boat1: KonvaBoatShape,
    boat2: KonvaBoatShape
  ): { collision: boolean; severity: 'none' | 'warning' | 'critical' } => {
    const rect1 = boat1.konvaObject.getClientRect();
    const rect2 = boat2.konvaObject.getClientRect();

    const safetyMargin1 = boat1.safetyMargin * 10; // Scale to canvas
    const safetyMargin2 = boat2.safetyMargin * 10; // Scale to canvas

    // Check critical collision (boats overlapping)
    const criticalCollision = checkBoatCollision(boat1, boat2);

    // Check warning collision (within safety margin)
    const expandedRect1 = {
      x: rect1.x - safetyMargin1,
      y: rect1.y - safetyMargin1,
      width: rect1.width + safetyMargin1 * 2,
      height: rect1.height + safetyMargin1 * 2,
    };

    const warningCollision = !(
      expandedRect1.x > rect2.x + rect2.width ||
      expandedRect1.x + expandedRect1.width < rect2.x ||
      expandedRect1.y > rect2.y + rect2.height ||
      expandedRect1.y + expandedRect1.height < rect2.y
    );

    if (criticalCollision) {
      return { collision: true, severity: 'critical' };
    } else if (warningCollision) {
      return { collision: true, severity: 'warning' };
    } else {
      return { collision: false, severity: 'none' };
    }
  };

  const getCollisionColor = (severity: 'none' | 'warning' | 'critical'): string => {
    switch (severity) {
      case 'warning': return '#FF9800'; // Orange
      case 'critical': return '#F44336'; // Red
      default: return '#4CAF50'; // Green
    }
  };

  const updateCollisionStates = (boats: Map<string, KonvaBoatShape>) => {
    const boatsArray = Array.from(boats.values());

    // Reset all collision states
    boatsArray.forEach(boat => {
      boat.isColliding = false;
      boat.visualState = 'normal';
    });

    // Check collisions between all pairs
    for (let i = 0; i < boatsArray.length; i++) {
      for (let j = i + 1; j < boatsArray.length; j++) {
        const boat1 = boatsArray[i];
        const boat2 = boatsArray[j];

        const collision = checkBoatCollisionWithSafetyMargin(boat1, boat2);

        if (collision.collision) {
          boat1.isColliding = true;
          boat2.isColliding = true;

          if (collision.severity === 'critical') {
            boat1.visualState = 'collision';
            boat2.visualState = 'collision';
          } else if (collision.severity === 'warning' && boat1.visualState === 'normal') {
            boat1.visualState = 'normal'; // Keep normal but mark as colliding
            boat2.visualState = 'normal'; // Keep normal but mark as colliding
          }
        }
      }
    }

    // Update collision severity for the overall state
    const hasAnyCritical = boatsArray.some(boat => boat.visualState === 'collision');
    const hasAnyWarning = boatsArray.some(boat => boat.isColliding && boat.visualState !== 'collision');

    if (hasAnyCritical) {
      collisionSeverity.value = 'critical';
    } else if (hasAnyWarning) {
      collisionSeverity.value = 'warning';
    } else {
      collisionSeverity.value = 'none';
    }
  };

  const getCollisionReport = (boats: Map<string, KonvaBoatShape>) => {
    const report = {
      totalBoats: boats.size,
      collidingBoats: 0,
      criticalCollisions: 0,
      warningCollisions: 0,
      collisionPairs: [] as string[],
    };

    const boatsArray = Array.from(boats.values());

    for (let i = 0; i < boatsArray.length; i++) {
      for (let j = i + 1; j < boatsArray.length; j++) {
        const boat1 = boatsArray[i];
        const boat2 = boatsArray[j];

        const collision = checkBoatCollisionWithSafetyMargin(boat1, boat2);

        if (collision.collision) {
          const pairName = `${boat1.boatData.name} <-> ${boat2.boatData.name}`;
          report.collisionPairs.push(pairName);

          if (collision.severity === 'critical') {
            report.criticalCollisions++;
          } else {
            report.warningCollisions++;
          }
        }
      }
    }

    report.collidingBoats = boatsArray.filter(boat => boat.isColliding).length;

    return report;
  };

  return {
    collisionEnabled,
    collisionSeverity,
    checkBoatCollision,
    checkBoatCollisionWithSafetyMargin,
    getCollisionColor,
    updateCollisionStates,
    getCollisionReport,
  };
}
