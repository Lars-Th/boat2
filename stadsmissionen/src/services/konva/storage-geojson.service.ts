// /src/services/konva/storage-geojson.service.ts
// GeoJSON Parser & Storage Unit Renderer

import Konva from 'konva';
import { SVG_CONSTANTS } from './boat-svg.service';
import type {
  StorageUnit,
  ParsedGeoJSON,
  WarehouseData,
  DockData,
  RestrictionZone,
  WarehouseLevelData
} from '@/types/konva';

/**
 * Parsar GeoJSON från shape_geometry sträng
 */
export function parseGeoJSON(geoJsonString: string): ParsedGeoJSON | null {
  try {
    const geoJson = JSON.parse(geoJsonString);

    if (!geoJson || !geoJson.type || !geoJson.coordinates) {
      console.warn('Invalid GeoJSON structure:', geoJson);
      return null;
    }

    return {
      type: geoJson.type,
      coordinates: geoJson.coordinates
    };
  } catch (error) {
    console.error('Failed to parse GeoJSON:', error);
    return null;
  }
}

/**
 * Konverterar GeoJSON koordinater till Konva pixlar
 */
export function geoJSONToKonvaPoints(coordinates: number[][]): number[] {
  const points: number[] = [];

  coordinates.forEach(coord => {
    if (coord && coord.length >= 2) {
      // Konvertera från lat/lng till lokala koordinater
      // Antag att första koordinaten är referenspunkt (0,0)
      const x = coord[0] * SVG_CONSTANTS.PX_PER_M;
      const y = coord[1] * SVG_CONSTANTS.PX_PER_M;
      points.push(x, y);
    }
  });

  return points;
}

/**
 * Skapar Konva Shape från GeoJSON
 */
export function createKonvaShapeFromGeoJSON(
  geoJson: ParsedGeoJSON,
  style: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    dash?: number[];
  } = {}
): Konva.Shape | null {
  const defaultStyle = {
    fill: 'rgba(100, 149, 237, 0.2)',
    stroke: '#6495ED',
    strokeWidth: 2,
    dash: []
  };

  const finalStyle = { ...defaultStyle, ...style };

  switch (geoJson.type) {
    case 'Polygon':
      if (geoJson.coordinates && geoJson.coordinates.length > 0 && geoJson.coordinates[0]) {
        const outerRing = geoJson.coordinates[0] as number[][];
        const points = geoJSONToKonvaPoints(outerRing);

        return new Konva.Line({
          points,
          closed: true,
          fill: finalStyle.fill,
          stroke: finalStyle.stroke,
          strokeWidth: finalStyle.strokeWidth,
          dash: finalStyle.dash,
          listening: true
        });
      }
      break;

    case 'LineString':
      if (geoJson.coordinates && geoJson.coordinates.length > 0) {
        const points = geoJSONToKonvaPoints(geoJson.coordinates as number[][]);

        return new Konva.Line({
          points,
          closed: false,
          stroke: finalStyle.stroke,
          strokeWidth: finalStyle.strokeWidth,
          dash: finalStyle.dash,
          listening: true
        });
      }
      break;

    case 'Point':
      if (geoJson.coordinates && geoJson.coordinates.length >= 2) {
        const coord = geoJson.coordinates as number[];
        const x = coord[0] * SVG_CONSTANTS.PX_PER_M;
        const y = coord[1] * SVG_CONSTANTS.PX_PER_M;

        return new Konva.Circle({
          x,
          y,
          radius: 5,
          fill: finalStyle.fill,
          stroke: finalStyle.stroke,
          strokeWidth: finalStyle.strokeWidth,
          listening: true
        });
      }
      break;

    default:
      console.warn('Unsupported GeoJSON type:', geoJson.type);
      return null;
  }

  return null;
}

/**
 * Skapar Storage Unit Group med alla levels
 */
export function createStorageUnitGroup(
  storageUnit: StorageUnit,
  warehouseLevels: WarehouseLevelData[] = [],
  restrictionZones: RestrictionZone[] = []
): Konva.Group | null {
  const group = new Konva.Group({
    id: `storage-unit-${storageUnit.id}`,
    name: storageUnit.name
  });

  // Parsa huvudgeometri
  const geoJson = parseGeoJSON(storageUnit.shape_geometry);
  if (!geoJson) {
    console.warn('Failed to parse geometry for storage unit:', storageUnit.id);
    return null;
  }

  // Bestäm färg baserat på typ
  const unitStyles = {
    warehouse: {
      fill: 'rgba(75, 192, 192, 0.1)',
      stroke: '#4BC0C0',
      strokeWidth: 2
    },
    dock: {
      fill: 'rgba(54, 162, 235, 0.1)',
      stroke: '#36A2EB',
      strokeWidth: 2
    }
  };

  const style = unitStyles[storageUnit.unit_type] || unitStyles.warehouse;

  // Skapa huvudshape
  const mainShape = createKonvaShapeFromGeoJSON(geoJson, style);
  if (mainShape) {
    group.add(mainShape);
  }

  // Lägg till warehouse levels om det är ett lager
  if (storageUnit.unit_type === 'warehouse' && warehouseLevels.length > 0) {
    const relevantLevels = warehouseLevels.filter(level =>
      level.warehouse_id === storageUnit.id
    );

    relevantLevels.forEach((level, index) => {
      const levelShape = createKonvaShapeFromGeoJSON(geoJson, {
        fill: 'rgba(75, 192, 192, 0.05)',
        stroke: '#4BC0C0',
        strokeWidth: 1,
        dash: [5, 5]
      });

      if (levelShape) {
        // Offset för att visa levels
        levelShape.offsetX(-index * 3);
        levelShape.offsetY(-index * 3);
        group.add(levelShape);
      }
    });
  }

  // Lägg till restriction zones
  const unitRestrictions = restrictionZones.filter(zone =>
    zone.warehouse_id === storageUnit.id
  );

  unitRestrictions.forEach(zone => {
    const restrictionRect = new Konva.Rect({
      x: zone.x_coordinate * SVG_CONSTANTS.PX_PER_M,
      y: zone.y_coordinate * SVG_CONSTANTS.PX_PER_M,
      width: zone.width * SVG_CONSTANTS.PX_PER_M,
      height: zone.height * SVG_CONSTANTS.PX_PER_M,
      fill: 'rgba(255, 0, 0, 0.2)',
      stroke: '#ff0000',
      strokeWidth: 1,
      dash: [3, 3],
      listening: true
    });

    // Lägg till label
    const label = new Konva.Text({
      x: zone.x_coordinate * SVG_CONSTANTS.PX_PER_M + 5,
      y: zone.y_coordinate * SVG_CONSTANTS.PX_PER_M + 5,
      text: zone.name,
      fontSize: 10,
      fill: '#ff0000',
      listening: false
    });

    group.add(restrictionRect);
    group.add(label);
  });

  return group;
}

/**
 * Skapar ett enkelt warehouse shape för testing
 */
export function createTestWarehouse(
  x: number,
  y: number,
  width: number,
  height: number,
  name: string = 'Test Warehouse'
): Konva.Group {
  const group = new Konva.Group({
    x,
    y,
    name
  });

  const pixelWidth = width * SVG_CONSTANTS.PX_PER_M;
  const pixelHeight = height * SVG_CONSTANTS.PX_PER_M;

  // Warehouse rectangle with white interior
  const rect = new Konva.Rect({
    x: 0,
    y: 0,
    width: pixelWidth,
    height: pixelHeight,
    fill: '#FFFFFF', // White background
    stroke: '#6AA085', // Green outline as requested
    strokeWidth: 1, // 1px width as requested
    listening: true
  });

  group.add(rect);

  // Add grid pattern INSIDE the warehouse
  const gridSpacing = 25; // 2.5m grid spacing inside storage

  // Vertical grid lines
  for (let x = gridSpacing; x < pixelWidth; x += gridSpacing) {
    const line = new Konva.Line({
      points: [x, 0, x, pixelHeight],
      stroke: '#E0E0E0',
      strokeWidth: 1,
      opacity: 0.4,
      listening: false
    });
    group.add(line);
  }

  // Horizontal grid lines
  for (let y = gridSpacing; y < pixelHeight; y += gridSpacing) {
    const line = new Konva.Line({
      points: [0, y, pixelWidth, y],
      stroke: '#E0E0E0',
      strokeWidth: 1,
      opacity: 0.4,
      listening: false
    });
    group.add(line);
  }

  // Warehouse label
  const label = new Konva.Text({
    x: 5,
    y: 5,
    text: name,
    fontSize: 12,
    fill: '#000000', // Black text as requested
    fontFamily: 'Arial', // Constant font
    listening: false
  });

  group.add(label);

  return group;
}

/**
 * Skapar ett enkelt dock shape för testing
 */
export function createTestDock(
  x: number,
  y: number,
  width: number,
  height: number,
  name: string = 'Test Dock'
): Konva.Group {
  const group = new Konva.Group({
    x,
    y,
    name
  });

  const pixelWidth = width * SVG_CONSTANTS.PX_PER_M;
  const pixelHeight = height * SVG_CONSTANTS.PX_PER_M;

  // Dock rectangle (simple rectangle)
  const rect = new Konva.Rect({
    x: 0,
    y: 0,
    width: pixelWidth,
    height: pixelHeight,
    fill: '#FFFFFF', // White background
    stroke: '#6AA085', // Green outline as requested
    strokeWidth: 1, // 1px width as requested
    listening: true
  });

  group.add(rect);

  // Add grid pattern INSIDE the dock
  const gridSpacing = 25; // 2.5m grid spacing inside dock

  // Vertical grid lines
  for (let x = gridSpacing; x < pixelWidth; x += gridSpacing) {
    const line = new Konva.Line({
      points: [x, 0, x, pixelHeight],
      stroke: '#E0E0E0',
      strokeWidth: 1,
      opacity: 0.4,
      listening: false
    });
    group.add(line);
  }

  // Horizontal grid lines
  for (let y = gridSpacing; y < pixelHeight; y += gridSpacing) {
    const line = new Konva.Line({
      points: [0, y, pixelWidth, y],
      stroke: '#E0E0E0',
      strokeWidth: 1,
      opacity: 0.4,
      listening: false
    });
    group.add(line);
  }

  // Dock label
  const label = new Konva.Text({
    x: 5,
    y: 5,
    text: name,
    fontSize: 12,
    fill: '#000000', // Black text as requested
    fontFamily: 'Arial', // Constant font
    listening: false
  });

  group.add(label);

  return group;
}

/**
 * Beräknar storage capacity baserat på area
 */
export function calculateStorageCapacity(
  storageUnit: StorageUnit,
  averageBoatArea: number = 14 // m² (7m × 2m standard boat)
): number {
  const geoJson = parseGeoJSON(storageUnit.shape_geometry);
  if (!geoJson || geoJson.type !== 'Polygon') {
    return 0;
  }

  // Enkel area beräkning för polygon
  if (!geoJson.coordinates || !geoJson.coordinates[0]) {
    return 0;
  }
  const coordinates = geoJson.coordinates[0] as number[][];
  let area = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const current = coordinates[i];
    const next = coordinates[j];
    if (current && next && current.length >= 2 && next.length >= 2) {
      area += current[0] * next[1];
      area -= next[0] * current[1];
    }
  }

  area = Math.abs(area) / 2;

  // Applicera efficiency factor (70% av area kan användas)
  const usableArea = area * 0.7;

  return Math.floor(usableArea / averageBoatArea);
}

/**
 * Hittar närmaste storage unit till en punkt
 */
export function findNearestStorageUnit(
  x: number,
  y: number,
  storageUnits: StorageUnit[]
): StorageUnit | null {
  let nearestUnit: StorageUnit | null = null;
  let minDistance = Infinity;

  storageUnits.forEach(unit => {
    const distance = Math.sqrt(
      Math.pow((unit.latitude * SVG_CONSTANTS.PX_PER_M) - x, 2) +
      Math.pow((unit.longitude * SVG_CONSTANTS.PX_PER_M) - y, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestUnit = unit;
    }
  });

  return nearestUnit;
}
