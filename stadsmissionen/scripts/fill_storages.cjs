#!/usr/bin/env node
/*
  Fill selected storages with boats for testing.
  - Huvudlager A (id: 1) → grid placement inside bounds, from center, with spacing
  - Gästbrygga B (id: 2) → linear placement along both long sides, bow toward dock (0/180°)
  Coordinate system: decimeters (1m = 10dm). Positions are center-coordinates inside storage.
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const boatsPath = path.join(ROOT, 'src/assets/data/boats.json');
const placementsPath = path.join(ROOT, 'src/assets/data/boatPlacements.json');
const storagePath = path.join(ROOT, 'src/assets/data/combinedStorage.json');

const STORAGE_ID_WAREHOUSE = 1; // Huvudlager A
const STORAGE_ID_DOCK = 2; // Gästbrygga B

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
function writeJson(p, data) { fs.writeFileSync(p, JSON.stringify(data, null, 2)); }

function dm(m) { return Math.round(m * 10); }

function getStorageById(storages, id) { return storages.find(s => s.id === id); }

function computeEffectiveDims(boat) {
  const lenM = Number(boat.length || 0);
  const widM = Number(boat.width || 0);
  const marginM = Number(boat.safety_margin || 0);
  const effectiveLenDm = dm(lenM + 2 * marginM);
  const effectiveWidDm = dm(widM + 2 * marginM);
  return { effectiveLenDm, effectiveWidDm };
}

function rectsOverlap(a, b) {
  return !(a.x2 < b.x1 || b.x2 < a.x1 || a.y2 < b.y1 || b.y2 < a.y1);
}

function canPlaceRect(centerX, centerY, halfW, halfH, bounds, placedRects) {
  const rect = { x1: centerX - halfW, y1: centerY - halfH, x2: centerX + halfW, y2: centerY + halfH };
  // inside bounds
  if (rect.x1 < bounds.x1 || rect.y1 < bounds.y1 || rect.x2 > bounds.x2 || rect.y2 > bounds.y2) return false;
  // collision
  for (const r of placedRects) { if (rectsOverlap(rect, r)) return false; }
  return true;
}

function placeWarehouse(boats, storages, placements) {
  const storage = getStorageById(storages, STORAGE_ID_WAREHOUSE);
  if (!storage) return [];
  const lengthDm = dm(storage.Height); // x dimension
  const widthDm = dm(storage.width);   // y dimension
  const marginDm = 30; // boundary safety margin from walls
  const gapDm = 30;    // spacing between boats

  const bounds = { x1: marginDm, y1: marginDm, x2: lengthDm - marginDm, y2: widthDm - marginDm };
  const placedRects = [];
  const newPlacements = [];

  // choose candidate boats: lager or lager_brygga and not already placed in this storage
  const existingBoatIds = new Set(placements.filter(p => p.storage_unit_id === STORAGE_ID_WAREHOUSE).map(p => p.boat_id));
  const candidates = boats.filter(b => {
    const ls = String(b.location_status || '').toLowerCase();
    return (ls.includes('lager')) && !existingBoatIds.has(b.id);
  });

  // Sort by length descending for better packing
  candidates.sort((a, b) => (b.length || 0) - (a.length || 0));

  let cursorX = bounds.x1;
  let cursorY = bounds.y1;
  let rowMaxHalfH = 0;

  for (const boat of candidates) {
    const { effectiveLenDm, effectiveWidDm } = computeEffectiveDims(boat);
    // try rotation 0 or 90 to fit row
    const options = [
      { rot: 0, halfW: Math.floor(effectiveLenDm / 2), halfH: Math.floor(effectiveWidDm / 2) },
      { rot: 90, halfW: Math.floor(effectiveWidDm / 2), halfH: Math.floor(effectiveLenDm / 2) },
    ];

    let placed = false;
    for (const opt of options) {
      // compute centerX relative to current row
      let centerX = cursorX + opt.halfW;
      let centerY = cursorY + opt.halfH;

      // shift to avoid overlap with previous in same row
      if (placedRects.length > 0) {
        const last = placedRects[placedRects.length - 1];
        if (last && Math.abs(last.y1 + (last.y2 - last.y1)/2 - centerY) <= (rowMaxHalfH + opt.halfH + gapDm)) {
          centerX = last.x2 + opt.halfW + gapDm;
        }
      }

      // wrap row if exceeding width
      if (centerX + opt.halfW > bounds.x2) {
        // move to next row
        cursorY += rowMaxHalfH * 2 + gapDm;
        cursorX = bounds.x1;
        rowMaxHalfH = 0;
        centerX = cursorX + opt.halfW;
        centerY = cursorY + opt.halfH;
      }

      if (centerY + opt.halfH > bounds.y2) {
        // no more space
        break;
      }

      if (canPlaceRect(centerX, centerY, opt.halfW, opt.halfH, bounds, placedRects)) {
        placedRects.push({ x1: centerX - opt.halfW, y1: centerY - opt.halfH, x2: centerX + opt.halfW, y2: centerY + opt.halfH });
        rowMaxHalfH = Math.max(rowMaxHalfH, opt.halfH);
        cursorX = centerX + opt.halfW + gapDm;
        newPlacements.push({ boat, x: centerX, y: centerY, rotation: opt.rot });
        placed = true;
        break;
      }
    }
    if (!placed) continue;
  }

  return newPlacements.map(np => ({
    storage_unit_id: STORAGE_ID_WAREHOUSE,
    storage_unit_name: 'Huvudlager A',
    floor_number: 1,
    status: 'placerad',
    position: { x: Number(np.x.toFixed(1)), y: Number(np.y.toFixed(1)), rotation: np.rotation },
    boat_id: np.boat.id,
  }));
}

function placeDock(boats, storages, placements) {
  const storage = getStorageById(storages, STORAGE_ID_DOCK);
  if (!storage) return [];
  const lengthDm = dm(storage.Height);
  const widthDm = dm(storage.width);
  const marginX = 30; // start/end margin along length
  const sideOffset = Math.min(15, Math.floor(widthDm / 2)); // center Y near each long side

  const existingBoatIds = new Set(placements.filter(p => p.storage_unit_id === STORAGE_ID_DOCK).map(p => p.boat_id));
  const candidates = boats.filter(b => {
    const ls = String(b.location_status || '').toLowerCase();
    return (ls.includes('brygga')) && !existingBoatIds.has(b.id);
  });

  // Order by length to space evenly
  candidates.sort((a, b) => (b.length || 0) - (a.length || 0));

  const newPlacements = [];
  let cursorXTop = marginX;
  let cursorXBottom = marginX;
  let placeTop = true;

  for (const boat of candidates) {
    const { effectiveLenDm } = computeEffectiveDims(boat);
    const step = effectiveLenDm + 40; // spacing between boats along dock
    const rotation = placeTop ? 0 : 180; // bow towards dock sides per requirement
    const y = placeTop ? sideOffset : (widthDm - sideOffset);
    const x = (placeTop ? cursorXTop : cursorXBottom) + Math.floor(effectiveLenDm / 2);
    const rightEdge = x + Math.floor(effectiveLenDm / 2);
    if (rightEdge > lengthDm - marginX) break; // stop when dock is full

    newPlacements.push({
      storage_unit_id: STORAGE_ID_DOCK,
      storage_unit_name: 'Gästbrygga B',
      floor_number: 0,
      status: 'placerad',
      position: { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), rotation },
      boat_id: boat.id,
    });

    if (placeTop) cursorXTop += step; else cursorXBottom += step;
    placeTop = !placeTop;
  }

  return newPlacements;
}

function main() {
  const boats = readJson(boatsPath);
  const storages = readJson(storagePath);
  const placements = readJson(placementsPath);

  // generate new placements
  const wh = placeWarehouse(boats, storages, placements);
  const dock = placeDock(boats, storages, placements);

  if (wh.length === 0 && dock.length === 0) {
    console.log('No new placements generated (storages may already be full).');
    return;
  }

  // assign ids and fill metadata
  let nextId = (placements.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
  const nowIso = new Date().toISOString();
  const fullPlacements = [...wh, ...dock].map(p => ({
    id: nextId++,
    boat_id: p.boat_id,
    storage_unit_id: p.storage_unit_id,
    storage_unit_name: p.storage_unit_name,
    floor_number: p.floor_number,
    status: p.status,
    position: p.position,
    placed_by_user_id: 1,
    placed_date: nowIso,
    reservation_date: nowIso,
    physical_placement_date: p.status === 'placerad' ? nowIso : null,
    notes: `Auto placerad för test i ${p.storage_unit_name}`,
    created_at: nowIso,
    updated_at: nowIso,
  }));

  const updated = placements.concat(fullPlacements);
  writeJson(placementsPath, updated);

  console.log(`Added ${fullPlacements.length} placements (Warehouse: ${wh.length}, Dock: ${dock.length}).`);
}

main();


