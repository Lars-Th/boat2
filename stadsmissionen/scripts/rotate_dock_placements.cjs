#!/usr/bin/env node
// Rotate all dock placements by 180° and save back to boatPlacements.json

const fs = require('fs');
const path = require('path');

const placementsPath = path.resolve(__dirname, '../src/assets/data/boatPlacements.json');
const combinedStoragePath = path.resolve(__dirname, '../src/assets/data/combinedStorage.json');

/** Load JSON helper */
function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function saveJson(filePath, data) {
  const serialized = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(filePath, serialized, 'utf8');
}

function isDockName(name) {
  if (!name) return false;
  return String(name).toLowerCase().includes('brygga') || String(name).toLowerCase().includes('dock');
}

function main() {
  const placements = loadJson(placementsPath);

  /** Build a set of dock IDs from combinedStorage if available */
  let dockIds = new Set();
  if (fs.existsSync(combinedStoragePath)) {
    const storages = loadJson(combinedStoragePath);
    for (const s of storages) {
      const type = String(s.Type || s.type || '').toLowerCase();
      if (type.includes('brygga') || type.includes('dock')) {
        dockIds.add(Number(s.id));
      }
    }
  }

  let changed = 0;
  const nowIso = new Date().toISOString();

  for (const p of placements) {
    const isDock = dockIds.has(Number(p.storage_unit_id)) || isDockName(p.storage_unit_name);
    if (!isDock) continue;

    if (!p.position) continue;
    const current = Number(p.position.rotation || 0);
    const rotated = (current + 180) % 360;
    if (rotated !== current) {
      p.position.rotation = rotated;
      // Optionally touch updated_at if present
      if (p.updated_at) p.updated_at = nowIso;
      changed++;
    }
  }

  saveJson(placementsPath, placements);
  console.log(`Rotated ${changed} dock placements by 180° and saved -> ${placementsPath}`);
}

main();
