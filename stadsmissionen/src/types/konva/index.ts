// /src/types/konva/index.ts
// TypeScript interfaces för Konva Boat Storage System
// Exakt match med verklig JSON-datastruktur

import type Konva from 'konva';

// Boat Data Interface (exakt match med boats.json)
export interface BoatData {
  id: number;
  customer_id: number;
  name: string;
  registreringsnummer?: string; // Optional since some boats might not have it
  length: number;
  width: number;
  safety_margin: number;
  weight: number;
  konva_shape_json: string;
  current_status: 'i_lager' | 'vid_brygga' | 'oplacerad' | 'service';
  location_status: 'lager' | 'brygga' | 'lager_brygga';
  current_placement_id: number | null;
  move_to_storage_date: string | null;
  move_from_storage_date: string | null;
  move_to_brygga_date: string | null;
  move_from_brygga_date: string | null;
  service_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  sms_notifications: boolean;
  email_notifications: boolean;
}

// Storage Unit Interface (exakt match med storageUnits.json)
export interface StorageUnit {
  id: number;
  name: string;
  unit_type: 'warehouse' | 'dock';
  shape_geometry: string; // GeoJSON som sträng
  level_count: number;
  is_connected_to_land: boolean;
  connected_unit_id: number | null;
  latitude: number;
  longitude: number;
}

// Placement Interface (exakt match med placements.json)
export interface PlacementData {
  id: number;
  boat_id: number;
  storage_unit_id: number;
  warehouse_level_id: number | null;
  x_coordinate: number;
  y_coordinate: number;
  rotation_angle: number;
  reserved: boolean;
  placed: boolean;
  reserved_date: string;
  placed_date: string | null;
}

// Warehouse Interface (exakt match med warehouses.json)
export interface WarehouseData {
  id: number;
  name: string;
  type: 'indoor_storage' | 'outdoor_storage' | 'covered_storage' | 'trailer_storage';
  latitude: number;
  longitude: number;
  capacity: string;
  status: 'available' | 'full' | 'maintenance';
  size: string;
  services: string[];
  boat_types: string;
}

// Dock Interface (exakt match med docks.json)
export interface DockData {
  id: number;
  name: string;
  type: 'main_dock' | 'guest_dock' | 'small_boat_dock' | 'service_dock' | 'winter_dock';
  latitude: number;
  longitude: number;
  berths: number;
  status: 'operational' | 'maintenance' | 'seasonal';
  capacity: string;
  services: string[];
  depth: string;
  season: string;
}

// Warehouse Level Interface (från warehouseLevels.json)
export interface WarehouseLevelData {
  id: number;
  warehouse_id: number;
  level: number;
  name: string;
  height: number;
}

// Restriction Zone Interface (ny struktur för begränsningsområden)
export interface RestrictionZone {
  id: number;
  warehouse_id: number;
  name: string;
  x_coordinate: number;
  y_coordinate: number;
  width: number;
  height: number;
  type: 'pillar' | 'equipment' | 'walkway' | 'door' | 'other';
  description: string;
}

// Konva-specifika interfaces
export interface KonvaBoatConfig {
  id: number;
  boatData: BoatData;
  placementData: PlacementData | null;
  konvaGroup: Konva.Group;
  hullPath: Konva.Path;
  marginPath: Konva.Path;
  transformer: Konva.Transformer;
  isActive: boolean;
  isInvalid: boolean;
}

export interface KonvaStorageConfig {
  id: number;
  storageUnit: StorageUnit;
  konvaShape: Konva.Shape;
  konvaGroup: Konva.Group;
  restrictedZones: Konva.Shape[];
}

export interface CollisionResult {
  hullCollision: boolean;
  marginCollision: boolean;
  collidingBoats: number[];
  collidingZones: number[];
}

export interface KonvaCanvasConfig {
  width: number;
  height: number;
  scale: number;
  dragBoundFunc: (pos: Konva.Vector2d) => Konva.Vector2d;
  pixelsPerMeter: number;
  areaMeters: { width: number; height: number };
}

// Enum för båtstatus
export enum BoatStatus {
  I_LAGER = 'i_lager',
  VID_BRYGGA = 'vid_brygga',
  OPLACERAD = 'oplacerad',
  SERVICE = 'service'
}

export enum LocationStatus {
  LAGER = 'lager',
  BRYGGA = 'brygga',
  LAGER_BRYGGA = 'lager_brygga'
}

// Parsed Konva Shape (från konva_shape_json)
export interface ParsedKonvaShape {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

// GeoJSON Parser för shape_geometry
export interface ParsedGeoJSON {
  type: 'Polygon' | 'LineString' | 'Point';
  coordinates: number[][][] | number[][] | number[];
}

// Konva Layer Types
export interface KonvaLayers {
  background: Konva.Layer;
  storage: Konva.Layer;
  boats: Konva.Layer;
  ui: Konva.Layer;
}

// State Styles från HTML-prototyp
export interface BoatStateStyle {
  hull: {
    stroke: string;
    strokeWidth: number;
    fill: string;
  };
  margin: {
    stroke: string;
    strokeWidth: number;
    dash?: number[];
    fill: string;
  };
}

export interface StateStyles {
  new: BoatStateStyle;
  placed: BoatStateStyle;
  marginCollision: BoatStateStyle;
  hullCollision: BoatStateStyle;
}

// SVG Constants från HTML-prototyp
export interface SVGConstants {
  HULL_PATH: string;
  MARGIN_PATH: string;
  HULL_VB: { w: number; h: number };
  MARGIN_VB: { w: number; h: number };
  PX_PER_M: number;
  areaM: { w: number; h: number };
}

// Seasonal Migration Interface
export interface SeasonalMigration {
  id: number;
  boat_id: number;
  from_location: 'warehouse' | 'dock';
  to_location: 'warehouse' | 'dock';
  scheduled_date: string;
  completed_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

// Search Filter Interface
export interface BoatSearchFilter {
  name?: string;
  customer_id?: number;
  current_status?: BoatStatus[];
  location_status?: LocationStatus[];
  min_length?: number;
  max_length?: number;
  min_width?: number;
  max_width?: number;
  has_placement?: boolean;
}

// Alla interfaces exporteras redan direkt
// Inga ytterligare exports behövs
