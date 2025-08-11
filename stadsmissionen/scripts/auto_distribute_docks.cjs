#!/usr/bin/env node
// Apply the same column auto-distribution for all docks as in BoatLager2.vue

const fs = require('fs');
const path = require('path');

const placementsPath = path.resolve(__dirname, '../src/assets/data/boatPlacements.json');
const boatsPath = path.resolve(__dirname, '../src/assets/data/boats.json');
const storagesPath = path.resolve(__dirname, '../src/assets/data/combinedStorage.json');

function loadJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function saveJson(p, data) { fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8'); }

function isDock(storage) {
  const t = String(storage.Type || storage.type || '').toLowerCase();
  return t.includes('brygga') || t.includes('dock');
}

function main() {
  const placements = loadJson(placementsPath);
  const boats = loadJson(boatsPath);
  const storages = loadJson(storagesPath);

  const boatById = new Map(boats.map(b => [Number(b.id), b]));
  const storageById = new Map(storages.map(s => [Number(s.id), s]));

  const startX = 50; // same as app
  const alongStep = 80; // dm
  const sideGapDm = 5; // dm

  let changed = 0;

  for (const storage of storages) {
    if (!isDock(storage)) continue;

    const dockPlacements = placements.filter(p => Number(p.storage_unit_id) === Number(storage.id));

    // Sort boats by length (desc) for tighter packing
    dockPlacements.sort((a, b) => {
      const ba = boatById.get(Number(a.boat_id));
      const bb = boatById.get(Number(b.boat_id));
      const la = ba ? Number(ba.length || 0) : 0;
      const lb = bb ? Number(bb.length || 0) : 0;
      return lb - la;
    });

    let alongOffset = 40; // dm
    let topSide = true;
    const dockHeightDm = Number(storage.width || 2) * 10; // m -> dm

    for (const p of dockPlacements) {
      const boat = boatById.get(Number(p.boat_id));
      if (!boat) continue;

      const halfLenDm = (Number(boat.length || 0) * 10) / 2;
      const marginDm = Number((boat.safety_margin ?? 0.5) * 10);
      const widthDm = Number(boat.width || 0) * 10;

      const x = startX + alongOffset;
      const newX = (x - startX); // store relative to storage origin (dm)

      if (!p.position) p.position = { x: 0, y: 0, rotation: 0 };
      p.position.x = Math.round(newX * 10) / 10;

      if (topSide) {
        // Inverted orientation per latest UX: top side → 270°
        p.position.rotation = 270;
        p.position.y = - (halfLenDm + marginDm + sideGapDm);
      } else {
        // bottom side → 90°
        p.position.rotation = 90;
        p.position.y = dockHeightDm + halfLenDm + marginDm + sideGapDm;
      }

      alongOffset += Math.max(alongStep, widthDm + marginDm);
      topSide = !topSide;
      changed++;
    }
  }

  saveJson(placementsPath, placements);
  console.log(`Applied dock column auto-distribution to ${changed} placements -> ${placementsPath}`);
}

main();
