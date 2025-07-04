// /src/services/konva/boat-svg.service.ts
// Båt SVG & Styling Service - Exakt från HTML-prototyp

import Konva from 'konva';
import type {
  StateStyles,
  SVGConstants,
  ParsedKonvaShape,
  BoatData
} from '@/types/konva';

// SVG paths och viewBox från HTML-prototyp
export const SVG_CONSTANTS: SVGConstants = {
  HULL_PATH: 'M2,8.373V63.627C2,67.147,5.76,70,10.4,70h113.58a9.823,9.823,0,0,0,6.128-2.015l34.122-27.627a5.317,5.317,0,0,0,0-8.715L130.106,4.015A9.823,9.823,0,0,0,123.978,2H10.4C5.76,2,2,4.853,2,8.373Z',
  MARGIN_PATH: 'M2,10.5V84.231c0,4.7,4.466,8.5,9.975,8.5h134.9a10.853,10.853,0,0,0,7.278-2.689l40.526-36.864a7.617,7.617,0,0,0,0-11.629L154.152,4.689A10.853,10.853,0,0,0,146.874,2H11.975C6.466,2,2,5.807,2,10.5Z',
  HULL_VB: { w: 166.498, h: 70 },
  MARGIN_VB: { w: 196.375, h: 91.734 },
  PX_PER_M: 10,
  areaM: { w: 145, h: 75 }
};

// State Styles från HTML-prototyp (exakt kopiera)
export const STATE_STYLES: StateStyles = {
  new: {
    hull: { stroke: '#27d07c', strokeWidth: 2, fill: '#fff' },
    margin: { stroke: '#27d07c', strokeWidth: 1, dash: [5, 5], fill: '#E9FBF3' }
  },
  placed: {
    hull: { stroke: '#A8A8A8', strokeWidth: 2, fill: '#fff' },
    margin: { stroke: '#A8A8A8', strokeWidth: 1, dash: [5, 5], fill: '#F5F5F8' }
  },
  marginCollision: {
    hull: { stroke: '#27d07c', strokeWidth: 2, fill: '#fff' },
    margin: { stroke: '#902C00', strokeWidth: 1, dash: [5, 5], fill: '#FAEDED' }
  },
  hullCollision: {
    hull: { stroke: '#902C00', strokeWidth: 2, fill: '#FAEDED' },
    margin: { stroke: '#902C00', strokeWidth: 1, dash: [5, 5], fill: '#FAEDED' }
  }
};

/**
 * Parsar konva_shape_json från befintlig datastruktur
 */
export function parseKonvaShapeJson(konvaShapeJson: string): ParsedKonvaShape {
  try {
    const parsed = JSON.parse(konvaShapeJson);
    return {
      x: parsed.x || 0,
      y: parsed.y || 0,
      width: parsed.width || 85,
      height: parsed.height || 28,
      fill: parsed.fill || '#ffffff',
      stroke: parsed.stroke || '#000000',
      strokeWidth: parsed.strokeWidth || 2,
      rotation: parsed.rotation || 0,
      scaleX: parsed.scaleX || 1,
      scaleY: parsed.scaleY || 1
    };
  } catch (error) {
    console.warn('Failed to parse konva_shape_json:', error);
    // Fallback till standard värden
    return {
      x: 0,
      y: 0,
      width: 85,
      height: 28,
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 2,
      rotation: 0,
      scaleX: 1,
      scaleY: 1
    };
  }
}

/**
 * Genererar konva_shape_json för att spara tillbaka till database
 */
export function generateKonvaShapeJson(shape: ParsedKonvaShape): string {
  const cleanShape = {
    x: Math.round(shape.x * 10) / 10,
    y: Math.round(shape.y * 10) / 10,
    width: Math.round(shape.width * 10) / 10,
    height: Math.round(shape.height * 10) / 10,
    fill: shape.fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    rotation: Math.round((shape.rotation || 0) * 10) / 10,
    scaleX: Math.round((shape.scaleX || 1) * 100) / 100,
    scaleY: Math.round((shape.scaleY || 1) * 100) / 100
  };

  return JSON.stringify(cleanShape);
}

/**
 * Beräknar Konva-skalning baserat på båtens verkliga dimensioner
 */
export function calculateBoatScaling(boat: BoatData): { scaleX: number; scaleY: number } {
  const lengthPx = boat.length * SVG_CONSTANTS.PX_PER_M;
  const widthPx = boat.width * SVG_CONSTANTS.PX_PER_M;

  return {
    scaleX: lengthPx / SVG_CONSTANTS.HULL_VB.w,
    scaleY: widthPx / SVG_CONSTANTS.HULL_VB.h
  };
}

/**
 * Beräknar marginal-skalning inkl. safety_margin
 */
export function calculateMarginScaling(boat: BoatData): { scaleX: number; scaleY: number } {
  const marginPx = boat.safety_margin * SVG_CONSTANTS.PX_PER_M;
  const lengthPxWithMargin = (boat.length * SVG_CONSTANTS.PX_PER_M) + (2 * marginPx);
  const widthPxWithMargin = (boat.width * SVG_CONSTANTS.PX_PER_M) + (2 * marginPx);

  return {
    scaleX: lengthPxWithMargin / SVG_CONSTANTS.MARGIN_VB.w,
    scaleY: widthPxWithMargin / SVG_CONSTANTS.MARGIN_VB.h
  };
}

/**
 * Applicerar styling på Konva Path baserat på state
 */
export function applyBoatStyle(
  hullPath: Konva.Path,
  marginPath: Konva.Path,
  state: keyof StateStyles
): void {
  const styles = STATE_STYLES[state];

  // Hull styling
  hullPath.stroke(styles.hull.stroke);
  hullPath.fill(styles.hull.fill);
  hullPath.strokeWidth(styles.hull.strokeWidth);

  // Margin styling
  marginPath.stroke(styles.margin.stroke);
  marginPath.fill(styles.margin.fill);
  marginPath.strokeWidth(styles.margin.strokeWidth);
  marginPath.dash(styles.margin.dash || []);
}

/**
 * Konverterar meter till pixlar
 */
export function metersToPixels(meters: number): number {
  return meters * SVG_CONSTANTS.PX_PER_M;
}

/**
 * Konverterar pixlar till meter
 */
export function pixelsToMeters(pixels: number): number {
  return pixels / SVG_CONSTANTS.PX_PER_M;
}

/**
 * Beräknar canvas bounds för boat placement
 */
export function calculateBounds(boat: BoatData): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const marginPx = boat.safety_margin * SVG_CONSTANTS.PX_PER_M;
  const lengthPx = boat.length * SVG_CONSTANTS.PX_PER_M + marginPx * 2;
  const widthPx = boat.width * SVG_CONSTANTS.PX_PER_M + marginPx * 2;

  const halfW = lengthPx / 2;
  const halfH = widthPx / 2;
  const canvasWidth = SVG_CONSTANTS.areaM.w * SVG_CONSTANTS.PX_PER_M;
  const canvasHeight = SVG_CONSTANTS.areaM.h * SVG_CONSTANTS.PX_PER_M;

  return {
    minX: halfW,
    minY: halfH,
    maxX: canvasWidth - halfW,
    maxY: canvasHeight - halfH
  };
}

/**
 * Skapar drag bound function för att hålla båtar inuti lager
 */
export function createDragBoundFunc(boat: BoatData, storageConfigs?: Array<{x: number, y: number, width: number, height: number, type: string}>) {
  const boatPixelLength = boat.length * SVG_CONSTANTS.PX_PER_M;
  const boatPixelWidth = boat.width * SVG_CONSTANTS.PX_PER_M;
  const halfLength = boatPixelLength / 2;
  const halfWidth = boatPixelWidth / 2;

  // Use provided storage configs or fallback to default
  const storageAreas = storageConfigs ? storageConfigs.map(area => ({
    x: area.x * SVG_CONSTANTS.PX_PER_M,
    y: area.y * SVG_CONSTANTS.PX_PER_M,
    width: area.width * SVG_CONSTANTS.PX_PER_M,
    height: area.height * SVG_CONSTANTS.PX_PER_M,
    type: area.type
  })) : [
    { x: 50, y: 50, width: 40, height: 25, type: 'warehouse' },
    { x: 120, y: 50, width: 35, height: 20, type: 'warehouse' },
    { x: 50, y: 100, width: 30, height: 15, type: 'warehouse' },
    { x: 170, y: 100, width: 50, height: 35, type: 'warehouse' }
  ].map(area => ({
    x: area.x * SVG_CONSTANTS.PX_PER_M,
    y: area.y * SVG_CONSTANTS.PX_PER_M,
    width: area.width * SVG_CONSTANTS.PX_PER_M,
    height: area.height * SVG_CONSTANTS.PX_PER_M,
    type: area.type
  }));

  return (pos: Konva.Vector2d): Konva.Vector2d => {
    // Find which storage area the boat belongs to
    let targetStorage = null;

    // First, check if boat is within any storage area
    for (const area of storageAreas) {
      const margin = 20; // 2m detection margin
      const areaLeft = area.x - margin;
      const areaRight = area.x + area.width + margin;
      const areaTop = area.y - margin;
      const areaBottom = area.y + area.height + margin;

      if (pos.x >= areaLeft && pos.x <= areaRight && pos.y >= areaTop && pos.y <= areaBottom) {
        targetStorage = area;
        break;
      }
    }

    // If no storage area found, find closest one
    if (!targetStorage) {
      let closestDistance = Infinity;
      for (const area of storageAreas) {
        const centerX = area.x + area.width / 2;
        const centerY = area.y + area.height / 2;
        const distance = Math.sqrt(Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2));

        if (distance < closestDistance) {
          closestDistance = distance;
          targetStorage = area;
        }
      }
    }

    // Constrain boat to stay inside the target storage area
    if (targetStorage) {
      const wallMargin = 15; // 1.5m margin from walls
      const constrainedX = Math.max(
        targetStorage.x + wallMargin + halfLength,
        Math.min(targetStorage.x + targetStorage.width - wallMargin - halfLength, pos.x)
      );
      const constrainedY = Math.max(
        targetStorage.y + wallMargin + halfWidth,
        Math.min(targetStorage.y + targetStorage.height - wallMargin - halfWidth, pos.y)
      );

      return { x: constrainedX, y: constrainedY };
    }

    // Fallback: use canvas bounds
    const bounds = calculateBounds(boat);
    const constrainedX = Math.min(Math.max(pos.x, bounds.minX), bounds.maxX);
    const constrainedY = Math.min(Math.max(pos.y, bounds.minY), bounds.maxY);

    return {
      x: constrainedX,
      y: constrainedY
    };
  };
}

/**
 * Validerar att båt kan placeras inom canvas bounds
 */
export function validatePlacementBounds(
  x: number,
  y: number,
  boat: BoatData
): boolean {
  const bounds = calculateBounds(boat);
  return x >= bounds.minX && x <= bounds.maxX &&
         y >= bounds.minY && y <= bounds.maxY;
}
