#!/usr/bin/env node
// Clamp boat centers inside Stockholm Centrallager (storage id 4),
// considering storage size, boat size, safety margin, and rotation.

const fs = require('fs');
const path = require('path');

const placementsPath = path.resolve(__dirname, '../src/assets/data/boatPlacements.json');
const boatsPath = path.resolve(__dirname, '../src/assets/data/boats.json');
const storagesPath = path.resolve(__dirname, '../src/assets/data/combinedStorage.json');

function loadJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function saveJson(p, data) { fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8'); }

function getStorage(storages, id) {
  return storages.find(s => Number(s.id) === Number(id));
}

function clamp(val, min, max) {
  if (isNaN(val)) return min;
  if (min > max) return (min + max) / 2; // degenerate -> center
  return Math.max(min, Math.min(max, val));
}

function main() {
  const placements = loadJson(placementsPath);
  const boats = loadJson(boatsPath);
  const storages = loadJson(storagesPath);

  const boatById = new Map(boats.map(b => [Number(b.id), b]));
  const stockholmId = 4; // Stockholm Centrallager
  const storage = getStorage(storages, stockholmId);
  if (!storage) {
    console.error('❌ Could not find storage id 4 (Stockholm Centrallager) in combinedStorage.json');
    process.exit(1);
  }

  // Storage dimensions in decimeters (1 m = 10 dm)
  const storageLenDm = Number(storage.Height) * 10; // x dimension
  const storageWidDm = Number(storage.width) * 10;  // y dimension

  let adjusted = 0;
  const nowIso = new Date().toISOString();

  for (const p of placements) {
    if (Number(p.storage_unit_id) !== stockholmId) continue;
    const boat = boatById.get(Number(p.boat_id));
    if (!boat) continue;

    // Boat dims in meters
    const L = Number(boat.length || 0);
    const W = Number(boat.width || 0);
    const M = Number(boat.safety_margin ?? 0.5);

    const rotationDeg = Number((p.position && p.position.rotation) || 0);
    const theta = rotationDeg * Math.PI / 180;

    // Max half-extent along x/y in meters, then convert to decimeters
    // Boundary check ska endast ta hänsyn till skrov, inte marginal
    const dx_m = Math.abs(Math.cos(theta)) * (L / 2) + Math.abs(Math.sin(theta)) * (W / 2);
    const dy_m = Math.abs(Math.sin(theta)) * (L / 2) + Math.abs(Math.cos(theta)) * (W / 2);
    const dx_dm = dx_m * 10;
    const dy_dm = dy_m * 10;

    if (!p.position) p.position = { x: 0, y: 0, rotation: rotationDeg };
    const oldX = Number(p.position.x || 0);
    const oldY = Number(p.position.y || 0);

    // Allowed center ranges in dm from top-left storage origin
    const minX = dx_dm;
    const maxX = storageLenDm - dx_dm;
    const minY = dy_dm;
    const maxY = storageWidDm - dy_dm;

    const newX = clamp(oldX, minX, maxX);
    const newY = clamp(oldY, minY, maxY);

    if (newX !== oldX || newY !== oldY) {
      p.position.x = Math.round(newX * 10) / 10;
      p.position.y = Math.round(newY * 10) / 10;
      if (p.updated_at) p.updated_at = nowIso;
      adjusted++;
    }
  }

  saveJson(placementsPath, placements);
  console.log(`✅ Clamped ${adjusted} placements inside Stockholm Centrallager (id 4)`);
}

main();
