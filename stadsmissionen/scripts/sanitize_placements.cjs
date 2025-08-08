/* eslint-disable */
const fs = require('fs');
const path = require('path');

const boatsPath = path.resolve('src/assets/data/boats.json');
const placementsPath = path.resolve('src/assets/data/boatPlacements.json');
const storagesPath = path.resolve('src/assets/data/combinedStorage.json');

const boats = JSON.parse(fs.readFileSync(boatsPath, 'utf8'));
const placements = JSON.parse(fs.readFileSync(placementsPath, 'utf8'));
const storages = JSON.parse(fs.readFileSync(storagesPath, 'utf8'));

const storageById = new Map(storages.map(s => [s.id, s]));

function storageType(storageId) {
  const s = storageById.get(storageId);
  const t = String((s && (s.Type || s.type)) || '').toLowerCase();
  if (!t) return 'unknown';
  if (t.includes('lager') || t.includes('hall') || t.includes('warehouse')) return 'warehouse';
  if (t.includes('brygga') || t.includes('dock') || t.includes('hamn')) return 'dock';
  return 'unknown';
}

function dateScore(p) {
  const candidates = [p.physical_placement_date, p.placed_date, p.reservation_date, p.updated_at, p.created_at];
  for (const d of candidates) {
    if (!d) continue;
    const ts = Date.parse(d);
    if (!isNaN(ts)) return ts;
  }
  return 0;
}

function statusScore(status) {
  if (status === 'placerad') return 2;
  if (status === 'reserverad') return 1;
  return 0; // oplacerad eller annat
}

function pickBest(list) {
  if (!list || list.length === 0) return null;
  return list.slice().sort((a, b) => {
    const sa = statusScore(b.status) - statusScore(a.status);
    if (sa !== 0) return sa;
    return dateScore(b) - dateScore(a);
  })[0];
}

const boatById = new Map(boats.map(b => [b.id, b]));
const byBoat = new Map();
for (const p of placements) {
  if (!byBoat.has(p.boat_id)) byBoat.set(p.boat_id, []);
  byBoat.get(p.boat_id).push(p);
}

const sanitized = [];
const removed = [];

for (const [boatId, list] of byBoat.entries()) {
  const boat = boatById.get(boatId);
  if (!boat) {
    // Unknown boat: keep placements as-is to avoid data loss
    for (const p of list) sanitized.push(p);
    continue;
  }

  const classified = { warehouse: [], dock: [], unknown: [] };
  for (const p of list) {
    const t = storageType(p.storage_unit_id);
    if (t === 'warehouse') classified.warehouse.push(p);
    else if (t === 'dock') classified.dock.push(p);
    else classified.unknown.push(p);
  }

  const loc = (boat.location_status || '').toLowerCase();
  const allowWarehouse = loc === 'lager' || loc === 'lager_brygga';
  const allowDock = loc === 'brygga' || loc === 'lager_brygga';

  // Select best per allowed category
  const keep = [];

  if (allowWarehouse) {
    // remove multi-floor in same storage by picking best overall
    const bestWh = pickBest(classified.warehouse);
    if (bestWh) keep.push(bestWh);
    for (const p of classified.warehouse) {
      if (!bestWh || p.id !== bestWh.id) removed.push(p);
    }
  } else {
    removed.push(...classified.warehouse);
  }

  if (allowDock) {
    const bestDk = pickBest(classified.dock);
    if (bestDk) keep.push(bestDk);
    for (const p of classified.dock) {
      if (!bestDk || p.id !== bestDk.id) removed.push(p);
    }
  } else {
    removed.push(...classified.dock);
  }

  // Unknown storages: keep as-is (conservative)
  for (const p of classified.unknown) keep.push(p);

  for (const p of keep) sanitized.push(p);
}

// Write backups and files
fs.writeFileSync(placementsPath + '.bak', JSON.stringify(placements, null, 2));
fs.writeFileSync(placementsPath, JSON.stringify(sanitized, null, 2));

// Update boats.json statuses from sanitized placements
const placementsByBoat = new Map();
for (const p of sanitized) {
  if (!placementsByBoat.has(p.boat_id)) placementsByBoat.set(p.boat_id, []);
  placementsByBoat.get(p.boat_id).push(p);
}

for (const b of boats) {
  const list = placementsByBoat.get(b.id) || [];
  const hasPlaced = list.some(p => p.status === 'placerad');
  const hasReserved = list.some(p => p.status === 'reserverad');
  b.current_status = hasPlaced ? 'placerad' : (hasReserved ? 'reserverad' : 'oplacerad');
}

fs.writeFileSync(boatsPath + '.bak', JSON.stringify(JSON.parse(fs.readFileSync(boatsPath,'utf8')), null, 2));
fs.writeFileSync(boatsPath, JSON.stringify(boats, null, 2));

console.log(`Sanitized placements: kept ${sanitized.length} of ${placements.length}. Removed ${removed.length}.`);
