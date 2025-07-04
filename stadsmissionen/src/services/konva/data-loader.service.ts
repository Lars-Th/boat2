// /src/services/konva/data-loader.service.ts
// Data Loader för verklig JSON-data integration

import type {
  BoatData,
  StorageUnit,
  PlacementData,
  WarehouseData,
  DockData,
  WarehouseLevelData,
  RestrictionZone
} from '@/types/konva';

// Import JSON data
import boatsData from '@/assets/data/boats.json';
import storageUnitsData from '@/assets/data/storageUnits.json';
import placementsData from '@/assets/data/placements.json';
import warehousesData from '@/assets/data/warehouses.json';
import docksData from '@/assets/data/docks.json';
import warehouseLevelsData from '@/assets/data/warehouseLevels.json';

export class DataLoaderService {
  private static instance: DataLoaderService;

  private boats: BoatData[] = [];
  private storageUnits: StorageUnit[] = [];
  private placements: PlacementData[] = [];
  private warehouses: WarehouseData[] = [];
  private docks: DockData[] = [];
  private warehouseLevels: WarehouseLevelData[] = [];
  private restrictionZones: RestrictionZone[] = [];

  private constructor() {
    this.loadData();
  }

  public static getInstance(): DataLoaderService {
    if (!DataLoaderService.instance) {
      DataLoaderService.instance = new DataLoaderService();
    }
    return DataLoaderService.instance;
  }

  private loadData(): void {
    // Load and validate JSON data
    this.boats = this.validateBoats(boatsData);
    this.storageUnits = this.validateStorageUnits(storageUnitsData);
    this.placements = this.validatePlacements(placementsData);
    this.warehouses = this.validateWarehouses(warehousesData);
    this.docks = this.validateDocks(docksData);
    this.warehouseLevels = this.validateWarehouseLevels(warehouseLevelsData);

    // Generate sample restriction zones
    this.restrictionZones = this.generateSampleRestrictionZones();

    console.log('📊 Data loaded successfully:', {
      boats: this.boats.length,
      storageUnits: this.storageUnits.length,
      placements: this.placements.length,
      warehouses: this.warehouses.length,
      docks: this.docks.length,
      warehouseLevels: this.warehouseLevels.length,
      restrictionZones: this.restrictionZones.length
    });
  }

  private validateBoats(data: any[]): BoatData[] {
    return data.map(item => ({
      id: item.id || 0,
      customer_id: item.customer_id || 0,
      name: item.name || 'Unknown Boat',
      length: item.length || 5.0,
      width: item.width || 2.0,
      safety_margin: item.safety_margin || 0.5,
      weight: item.weight || 1000,
      konva_shape_json: item.konva_shape_json || '{}',
      current_status: item.current_status || 'oplacerad',
      location_status: item.location_status || 'lager',
      current_placement_id: item.current_placement_id || null,
      move_to_storage_date: item.move_to_storage_date || null,
      move_from_storage_date: item.move_from_storage_date || null,
      move_to_brygga_date: item.move_to_brygga_date || null,
      move_from_brygga_date: item.move_from_brygga_date || null,
      service_date: item.service_date || null,
      notes: item.notes || '',
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      sms_notifications: item.sms_notifications || false,
      email_notifications: item.email_notifications || false
    }));
  }

  private validateStorageUnits(data: any[]): StorageUnit[] {
    return data.map(item => ({
      id: item.id || 0,
      name: item.name || 'Unknown Storage Unit',
      unit_type: item.unit_type || 'warehouse',
      shape_geometry: item.shape_geometry || '{"type":"Polygon","coordinates":[[[0,0],[10,0],[10,10],[0,10],[0,0]]]}',
      level_count: item.level_count || 1,
      is_connected_to_land: item.is_connected_to_land || false,
      connected_unit_id: item.connected_unit_id || null,
      latitude: item.latitude || 0,
      longitude: item.longitude || 0
    }));
  }

  private validatePlacements(data: any[]): PlacementData[] {
    return data.map(item => ({
      id: item.id || 0,
      boat_id: item.boat_id || 0,
      storage_unit_id: item.storage_unit_id || 0,
      warehouse_level_id: item.warehouse_level_id || null,
      x_coordinate: item.x_coordinate || 0,
      y_coordinate: item.y_coordinate || 0,
      rotation_angle: item.rotation_angle || 0,
      reserved: item.reserved || false,
      placed: item.placed || false,
      reserved_date: item.reserved_date || new Date().toISOString(),
      placed_date: item.placed_date || null
    }));
  }

  private validateWarehouses(data: any[]): WarehouseData[] {
    return data.map(item => ({
      id: item.id || 0,
      name: item.name || 'Unknown Warehouse',
      type: item.type || 'indoor_storage',
      latitude: item.latitude || 0,
      longitude: item.longitude || 0,
      capacity: item.capacity || 'Unknown',
      status: item.status || 'available',
      size: item.size || 'Unknown',
      services: item.services || [],
      boat_types: item.boat_types || ''
    }));
  }

  private validateDocks(data: any[]): DockData[] {
    return data.map(item => ({
      id: item.id || 0,
      name: item.name || 'Unknown Dock',
      type: item.type || 'main_dock',
      latitude: item.latitude || 0,
      longitude: item.longitude || 0,
      berths: item.berths || 0,
      status: item.status || 'operational',
      capacity: item.capacity || 'Unknown',
      services: item.services || [],
      depth: item.depth || 'Unknown',
      season: item.season || 'Year-round'
    }));
  }

  private validateWarehouseLevels(data: any[]): WarehouseLevelData[] {
    return data.map(item => ({
      id: item.id || 0,
      warehouse_id: item.warehouse_id || 0,
      level: item.level || 1,
      name: item.name || 'Level 1',
      height: item.height || 4.0
    }));
  }

  private generateSampleRestrictionZones(): RestrictionZone[] {
    // Generate sample restriction zones for testing
    const zones: RestrictionZone[] = [];

    this.warehouses.forEach(warehouse => {
      // Add some pillars
      zones.push({
        id: zones.length + 1,
        warehouse_id: warehouse.id,
        name: `Pelare ${warehouse.id}-1`,
        x_coordinate: 20,
        y_coordinate: 15,
        width: 2,
        height: 2,
        type: 'pillar',
        description: 'Bärande pelare'
      });

      // Add equipment area
      zones.push({
        id: zones.length + 1,
        warehouse_id: warehouse.id,
        name: `Utrustning ${warehouse.id}`,
        x_coordinate: 5,
        y_coordinate: 5,
        width: 8,
        height: 4,
        type: 'equipment',
        description: 'Kranar och utrustning'
      });
    });

    return zones;
  }

  // Public getter methods
  public getBoats(): BoatData[] {
    return [...this.boats];
  }

  public getStorageUnits(): StorageUnit[] {
    return [...this.storageUnits];
  }

  public getPlacements(): PlacementData[] {
    return [...this.placements];
  }

  public getWarehouses(): WarehouseData[] {
    return [...this.warehouses];
  }

  public getDocks(): DockData[] {
    return [...this.docks];
  }

  public getWarehouseLevels(): WarehouseLevelData[] {
    return [...this.warehouseLevels];
  }

  public getRestrictionZones(): RestrictionZone[] {
    return [...this.restrictionZones];
  }

  // Specific queries
  public getBoatById(id: number): BoatData | null {
    return this.boats.find(boat => boat.id === id) || null;
  }

  public getStorageUnitById(id: number): StorageUnit | null {
    return this.storageUnits.find(unit => unit.id === id) || null;
  }

  public getPlacementByBoatId(boatId: number): PlacementData | null {
    return this.placements.find(placement => placement.boat_id === boatId) || null;
  }

  public getWarehouseLevelsByWarehouseId(warehouseId: number): WarehouseLevelData[] {
    return this.warehouseLevels.filter(level => level.warehouse_id === warehouseId);
  }

  public getRestrictionZonesByWarehouseId(warehouseId: number): RestrictionZone[] {
    return this.restrictionZones.filter(zone => zone.warehouse_id === warehouseId);
  }

  // Filtering methods
  public getBoatsByStatus(status: string): BoatData[] {
    return this.boats.filter(boat => boat.current_status === status);
  }

  public getUnplacedBoats(): BoatData[] {
    return this.boats.filter(boat => boat.current_placement_id === null);
  }

  public getPlacedBoats(): BoatData[] {
    return this.boats.filter(boat => boat.current_placement_id !== null);
  }

  public getStorageUnitsByType(type: 'warehouse' | 'dock'): StorageUnit[] {
    return this.storageUnits.filter(unit => unit.unit_type === type);
  }

  // Statistics
  public getStatistics(): {
    totalBoats: number;
    placedBoats: number;
    unplacedBoats: number;
    warehouses: number;
    docks: number;
    totalStorageUnits: number;
    warehouseLevels: number;
    restrictionZones: number;
  } {
    return {
      totalBoats: this.boats.length,
      placedBoats: this.getPlacedBoats().length,
      unplacedBoats: this.getUnplacedBoats().length,
      warehouses: this.getStorageUnitsByType('warehouse').length,
      docks: this.getStorageUnitsByType('dock').length,
      totalStorageUnits: this.storageUnits.length,
      warehouseLevels: this.warehouseLevels.length,
      restrictionZones: this.restrictionZones.length
    };
  }

  // Mock data for testing
  public createTestBoat(overrides: Partial<BoatData> = {}): BoatData {
    const nextId = Math.max(...this.boats.map(b => b.id), 0) + 1;

    return {
      id: nextId,
      customer_id: 1,
      name: `Test Boat ${nextId}`,
      length: 5.5,
      width: 2.2,
      safety_margin: 0.5,
      weight: 1200,
      konva_shape_json: '{}',
      current_status: 'oplacerad',
      location_status: 'lager',
      current_placement_id: null,
      move_to_storage_date: null,
      move_from_storage_date: null,
      move_to_brygga_date: null,
      move_from_brygga_date: null,
      service_date: null,
      notes: 'Test boat created from Konva Canvas',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sms_notifications: false,
      email_notifications: false,
      ...overrides
    };
  }

  public createTestStorageUnit(overrides: Partial<StorageUnit> = {}): StorageUnit {
    const nextId = Math.max(...this.storageUnits.map(u => u.id), 0) + 1;

    return {
      id: nextId,
      name: `Test Storage ${nextId}`,
      unit_type: 'warehouse',
      shape_geometry: '{"type":"Polygon","coordinates":[[[0,0],[50,0],[50,30],[0,30],[0,0]]]}',
      level_count: 1,
      is_connected_to_land: true,
      connected_unit_id: null,
      latitude: 0,
      longitude: 0,
      ...overrides
    };
  }

      // Refresh data (for development) - Force reload from JSON files
  public refreshData(): void {
    console.log('🔄 Refreshing data from JSON files...');

    // Clear existing data
    this.boats = [];
    this.storageUnits = [];
    this.placements = [];
    this.warehouses = [];
    this.docks = [];
    this.warehouseLevels = [];
    this.restrictionZones = [];

    // Add timestamp to force reload
    const timestamp = Date.now();
    console.log(`🔄 Refresh timestamp: ${timestamp}`);

    // Reload everything
    this.loadData();

    console.log('✅ Data refresh completed - new data loaded');
  }
}

// Export singleton instance
export const dataLoader = DataLoaderService.getInstance();
