#!/usr/bin/env node
// Remove all restriction zones named "Serviceingång" from storageRestrictions.json

const fs = require('fs');
const path = require('path');

const restrictionsPath = path.resolve(__dirname, '../src/assets/data/storageRestrictions.json');

function loadJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function saveJson(p, data) { fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8'); }

function main() {
  const data = loadJson(restrictionsPath);
  let removed = 0;

  for (const entry of data) {
    if (!Array.isArray(entry.restriction_zones)) continue;
    const before = entry.restriction_zones.length;
    entry.restriction_zones = entry.restriction_zones.filter(z => String(z.name).toLowerCase() !== 'serviceingång');
    removed += before - entry.restriction_zones.length;
  }

  saveJson(restrictionsPath, data);
  console.log(`✅ Removed ${removed} 'Serviceingång' restriction zone(s)`);
}

main();


