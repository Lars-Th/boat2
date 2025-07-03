import { ref, onMounted, onUnmounted } from 'vue';
import Konva from 'konva';
import { KonvaCanvasConfig, KonvaBoatShape, KonvaStorageShape } from '../types/konva';
import { BoatData, PlacementData } from '../types/entities';

export function useKonvaCanvas(containerId: string, config: KonvaCanvasConfig) {
  const stage = ref<Konva.Stage | null>(null);
  const backgroundLayer = ref<Konva.Layer | null>(null);
  const gridLayer = ref<Konva.Layer | null>(null);
  const storageLayer = ref<Konva.Layer | null>(null);
  const boatLayer = ref<Konva.Layer | null>(null);
  const uiLayer = ref<Konva.Layer | null>(null);

  const boats = ref<Map<string, KonvaBoatShape>>(new Map());
  const storageShapes = ref<Map<string, KonvaStorageShape>>(new Map());
  const selectedBoat = ref<KonvaBoatShape | null>(null);

  const initializeCanvas = () => {
    stage.value = new Konva.Stage({
      container: containerId,
      width: config.width,
      height: config.height,
      draggable: true,
      scaleX: config.scale,
      scaleY: config.scale,
    });

    // Initialize layers
    backgroundLayer.value = new Konva.Layer();
    gridLayer.value = new Konva.Layer();
    storageLayer.value = new Konva.Layer();
    boatLayer.value = new Konva.Layer();
    uiLayer.value = new Konva.Layer();

    // Add layers to stage
    stage.value.add(backgroundLayer.value);
    stage.value.add(gridLayer.value);
    stage.value.add(storageLayer.value);
    stage.value.add(boatLayer.value);
    stage.value.add(uiLayer.value);

    setupEventHandlers();
    if (config.showGrid) drawGrid();
  };

  const setupEventHandlers = () => {
    if (!stage.value) return;

    // Zoom functionality
    stage.value.on('wheel', (e) => {
      e.evt.preventDefault();
      const scaleBy = 1.05;
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();

      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / stage.scaleX(),
        y: (pointer.y - stage.y()) / stage.scaleY(),
      };

      const newScale = e.evt.deltaY > 0 ? stage.scaleX() * scaleBy : stage.scaleX() / scaleBy;

      stage.scale({ x: newScale, y: newScale });
      stage.position({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    });

    // Selection handling
    stage.value.on('click tap', (e) => {
      if (e.target === stage.value) {
        selectedBoat.value = null;
        updateBoatVisualStates();
      }
    });
  };

  const drawGrid = () => {
    if (!gridLayer.value) return;

    gridLayer.value.destroyChildren();

    const gridSize = config.gridSize;
    const width = config.width;
    const height = config.height;

    // Vertical lines
    for (let i = 0; i <= width / gridSize; i++) {
      const line = new Konva.Line({
        points: [i * gridSize, 0, i * gridSize, height],
        stroke: '#ddd',
        strokeWidth: 1,
        listening: false,
      });
      gridLayer.value.add(line);
    }

    // Horizontal lines
    for (let i = 0; i <= height / gridSize; i++) {
      const line = new Konva.Line({
        points: [0, i * gridSize, width, i * gridSize],
        stroke: '#ddd',
        strokeWidth: 1,
        listening: false,
      });
      gridLayer.value.add(line);
    }
  };

  const addBoat = (boatData: BoatData, placement: PlacementData) => {
    try {
      // Parse konva_shape_json from boatData
      const shapeConfig = JSON.parse(boatData.konva_shape_json);

      const boatGroup = new Konva.Group({
        x: placement.x_coordinate,
        y: placement.y_coordinate,
        rotation: placement.rotation_angle,
        draggable: true,
      });

      const boatRect = new Konva.Rect({
        ...shapeConfig,
        listening: true,
      });

      const boatLabel = new Konva.Text({
        text: boatData.name,
        fontSize: 10,
        fill: 'black',
        align: 'center',
        verticalAlign: 'middle',
        width: shapeConfig.width,
        height: shapeConfig.height,
        offsetX: shapeConfig.width / 2,
        offsetY: shapeConfig.height / 2,
      });

      boatGroup.add(boatRect);
      boatGroup.add(boatLabel);

      // Setup drag events
      boatGroup.on('dragstart', () => {
        selectedBoat.value = boats.value.get(boatData.id.toString()) || null;
        updateBoatVisualStates();
      });

      boatGroup.on('dragend', () => {
        const boat = boats.value.get(boatData.id.toString());
        if (boat) {
          boat.placement.x_coordinate = boatGroup.x();
          boat.placement.y_coordinate = boatGroup.y();
          boat.placement.rotation_angle = boatGroup.rotation();
        }
      });

      boatGroup.on('click', () => {
        selectedBoat.value = boats.value.get(boatData.id.toString()) || null;
        updateBoatVisualStates();
      });

      const konvaBoatShape: KonvaBoatShape = {
        id: boatData.id.toString(),
        konvaObject: boatGroup,
        boatData,
        placement,
        isColliding: false,
        visualState: 'normal',
        safetyMargin: boatData.safety_margin,
      };

      boats.value.set(boatData.id.toString(), konvaBoatShape);
      boatLayer.value?.add(boatGroup);
      boatLayer.value?.draw();

    } catch (error) {
      console.error('Error adding boat:', error);
    }
  };

  const removeBoat = (boatId: string) => {
    const boat = boats.value.get(boatId);
    if (boat) {
      boat.konvaObject.destroy();
      boats.value.delete(boatId);
      boatLayer.value?.draw();
    }
  };

  const updateBoatPosition = (boatId: string, x: number, y: number, rotation: number) => {
    const boat = boats.value.get(boatId);
    if (boat) {
      boat.konvaObject.position({ x, y });
      boat.konvaObject.rotation(rotation);
      boat.placement.x_coordinate = x;
      boat.placement.y_coordinate = y;
      boat.placement.rotation_angle = rotation;
      boatLayer.value?.draw();
    }
  };

  const updateBoatVisualStates = () => {
    boats.value.forEach((boat) => {
      const isSelected = selectedBoat.value?.id === boat.id;
      const fill = isSelected ? '#4CAF50' :
                   boat.isColliding ? '#F44336' :
                   boat.visualState === 'dragging' ? '#FF9800' :
                   JSON.parse(boat.boatData.konva_shape_json).fill;

      // Update boat visual appearance
      const rect = boat.konvaObject.findOne('Rect');
      if (rect) {
        rect.fill(fill);
        rect.strokeWidth(isSelected ? 3 : 2);
      }
    });
    boatLayer.value?.draw();
  };

  const exportCanvas = () => {
    return stage.value?.toDataURL();
  };

  const fitToScreen = () => {
    if (!stage.value) return;

    const padding = 50;
    const containerWidth = config.width - padding;
    const containerHeight = config.height - padding;

    // Get bounding box of all objects
    const clientRect = stage.value.getClientRect();

    if (clientRect.width > 0 && clientRect.height > 0) {
      const scaleX = containerWidth / clientRect.width;
      const scaleY = containerHeight / clientRect.height;
      const scale = Math.min(scaleX, scaleY);

      stage.value.scale({ x: scale, y: scale });
      stage.value.position({
        x: (config.width - clientRect.width * scale) / 2,
        y: (config.height - clientRect.height * scale) / 2,
      });
    }
  };

  onMounted(() => {
    initializeCanvas();
  });

  onUnmounted(() => {
    stage.value?.destroy();
  });

  return {
    stage,
    boats,
    storageShapes,
    selectedBoat,
    addBoat,
    removeBoat,
    updateBoatPosition,
    updateBoatVisualStates,
    exportCanvas,
    fitToScreen,
  };
}
