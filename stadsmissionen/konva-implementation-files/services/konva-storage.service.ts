import { BoatData, StorageUnit, PlacementData } from '../types/entities';
import { KonvaBoatShape, KonvaStorageShape } from '../types/konva';
import Konva from 'konva';

export class KonvaStorageService {
  async loadBoatsFromJson(): Promise<BoatData[]> {
    try {
      const response = await fetch('/src/assets/data/boats.json');
      return await response.json();
    } catch (error) {
      console.error('Error loading boats:', error);
      return [];
    }
  }

  async loadStorageUnitsFromJson(): Promise<StorageUnit[]> {
    try {
      const response = await fetch('/src/assets/data/storageUnits.json');
      return await response.json();
    } catch (error) {
      console.error('Error loading storage units:', error);
      return [];
    }
  }

  async loadPlacementsFromJson(): Promise<PlacementData[]> {
    try {
      const response = await fetch('/src/assets/data/placements.json');
      return await response.json();
    } catch (error) {
      console.error('Error loading placements:', error);
      return [];
    }
  }

  async loadCombinedStorageFromJson(): Promise<any[]> {
    try {
      const response = await fetch('/src/assets/data/combinedStorage.json');
      return await response.json();
    } catch (error) {
      console.error('Error loading combined storage:', error);
      return [];
    }
  }

  createBoatShape(boatData: BoatData, placement: PlacementData): KonvaBoatShape {
    try {
      // Parse konva_shape_json from boatData
      const shapeConfig = JSON.parse(boatData.konva_shape_json);

      const boatGroup = new Konva.Group({
        x: placement.x_coordinate,
        y: placement.y_coordinate,
        rotation: placement.rotation_angle,
        draggable: true,
        id: `boat-${boatData.id}`,
      });

      // Main boat rectangle
      const boatRect = new Konva.Rect({
        ...shapeConfig,
        listening: true,
        name: 'boat-rect',
      });

      // Boat name label
      const boatLabel = new Konva.Text({
        text: boatData.name,
        fontSize: 10,
        fill: '#000',
        align: 'center',
        verticalAlign: 'middle',
        width: shapeConfig.width,
        height: shapeConfig.height,
        name: 'boat-label',
        listening: false,
      });

      // Safety margin indicator (optional, can be toggled)
      const safetyMarginRect = new Konva.Rect({
        x: -boatData.safety_margin * 10,
        y: -boatData.safety_margin * 10,
        width: shapeConfig.width + (boatData.safety_margin * 20),
        height: shapeConfig.height + (boatData.safety_margin * 20),
        fill: 'transparent',
        stroke: '#999',
        strokeWidth: 1,
        dash: [5, 5],
        name: 'safety-margin',
        listening: false,
        visible: false, // Hidden by default
      });

      boatGroup.add(safetyMarginRect);
      boatGroup.add(boatRect);
      boatGroup.add(boatLabel);

      return {
        id: boatData.id.toString(),
        konvaObject: boatGroup,
        boatData,
        placement,
        isColliding: false,
        visualState: 'normal',
        safetyMargin: boatData.safety_margin,
      };
    } catch (error) {
      console.error('Error creating boat shape:', error);
      throw error;
    }
  }

  createStorageShape(storageUnit: StorageUnit): KonvaStorageShape {
    try {
      const storageGroup = new Konva.Group({
        id: `storage-${storageUnit.id}`,
        name: 'storage-unit',
      });

      // Parse GeoJSON shape_geometry
      const geometry = JSON.parse(storageUnit.shape_geometry);

      let bounds: Konva.Rect;

      if (geometry.type === 'Polygon') {
        // Create polygon for warehouse
        const coords = geometry.coordinates[0];
        const points: number[] = [];

        // Convert GeoJSON coordinates to canvas coordinates
        coords.forEach((coord: [number, number]) => {
          // Scale and offset coordinates for canvas
          points.push((coord[0] - geometry.coordinates[0][0][0]) * 100000);
          points.push((coord[1] - geometry.coordinates[0][0][1]) * 100000);
        });

        const polygon = new Konva.Line({
          points,
          fill: 'rgba(200, 200, 200, 0.3)',
          stroke: '#666',
          strokeWidth: 2,
          closed: true,
          name: 'warehouse-polygon',
        });

        storageGroup.add(polygon);

        // Calculate bounds
        const minX = Math.min(...points.filter((_, i) => i % 2 === 0));
        const maxX = Math.max(...points.filter((_, i) => i % 2 === 0));
        const minY = Math.min(...points.filter((_, i) => i % 2 === 1));
        const maxY = Math.max(...points.filter((_, i) => i % 2 === 1));

        bounds = new Konva.Rect({
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          listening: false,
          visible: false,
        });

      } else if (geometry.type === 'LineString') {
        // Create line for dock
        const coords = geometry.coordinates;
        const points: number[] = [];

        // Convert GeoJSON coordinates to canvas coordinates
        coords.forEach((coord: [number, number]) => {
          points.push((coord[0] - coords[0][0]) * 100000);
          points.push((coord[1] - coords[0][1]) * 100000);
        });

        const line = new Konva.Line({
          points,
          stroke: '#0066cc',
          strokeWidth: 6,
          lineCap: 'round',
          name: 'dock-line',
        });

        storageGroup.add(line);

        // Calculate bounds for dock
        const minX = Math.min(...points.filter((_, i) => i % 2 === 0));
        const maxX = Math.max(...points.filter((_, i) => i % 2 === 0));
        const minY = Math.min(...points.filter((_, i) => i % 2 === 1));
        const maxY = Math.max(...points.filter((_, i) => i % 2 === 1));

        bounds = new Konva.Rect({
          x: minX - 20,
          y: minY - 20,
          width: (maxX - minX) + 40,
          height: (maxY - minY) + 40,
          listening: false,
          visible: false,
        });
      } else {
        // Fallback for unknown geometry types
        bounds = new Konva.Rect({
          x: 0,
          y: 0,
          width: 200,
          height: 200,
          listening: false,
          visible: false,
        });
      }

      // Add storage unit label
      const label = new Konva.Text({
        text: storageUnit.name,
        fontSize: 14,
        fill: '#333',
        fontStyle: 'bold',
        name: 'storage-label',
        listening: false,
      });

      storageGroup.add(label);

      return {
        id: storageUnit.id.toString(),
        konvaObject: storageGroup,
        storageUnit,
        bounds,
        restrictionZones: [],
        connectionPoints: [],
      };
    } catch (error) {
      console.error('Error creating storage shape:', error);
      throw error;
    }
  }

  createRestrictionZone(x: number, y: number, width: number, height: number, type: string): Konva.Shape {
    const colors = {
      pillar: '#ff6b6b',
      equipment: '#4ecdc4',
      maintenance: '#45b7d1',
      restricted: '#f9ca24',
    };

    return new Konva.Rect({
      x,
      y,
      width,
      height,
      fill: colors[type as keyof typeof colors] || '#ccc',
      opacity: 0.7,
      stroke: '#333',
      strokeWidth: 1,
      dash: [10, 5],
      name: `restriction-${type}`,
      listening: false,
    });
  }

  saveLayout(boats: Map<string, KonvaBoatShape>): PlacementData[] {
    const placements: PlacementData[] = [];

    boats.forEach((boat) => {
      const placement: PlacementData = {
        ...boat.placement,
        x_coordinate: boat.konvaObject.x(),
        y_coordinate: boat.konvaObject.y(),
        rotation_angle: boat.konvaObject.rotation(),
      };
      placements.push(placement);
    });

    return placements;
  }

  async saveLayoutToJson(placements: PlacementData[]): Promise<boolean> {
    try {
      // In a real implementation, this would save to a backend
      console.log('Saving layout:', placements);
      localStorage.setItem('boat-placements', JSON.stringify(placements));
      return true;
    } catch (error) {
      console.error('Error saving layout:', error);
      return false;
    }
  }

  async loadLayoutFromJson(): Promise<PlacementData[]> {
    try {
      const saved = localStorage.getItem('boat-placements');
      if (saved) {
        return JSON.parse(saved);
      }
      return [];
    } catch (error) {
      console.error('Error loading layout:', error);
      return [];
    }
  }

  exportCanvasAsImage(stage: Konva.Stage): string {
    return stage.toDataURL({
      mimeType: 'image/png',
      quality: 1,
      pixelRatio: 2,
    });
  }

  exportCanvasAsPDF(stage: Konva.Stage): Promise<Blob> {
    return new Promise((resolve) => {
      stage.toCanvas({
        callback: (canvas) => {
          canvas.toBlob((blob) => {
            resolve(blob!);
          });
        },
        mimeType: 'image/png',
        quality: 1,
      });
    });
  }
}
